from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
import datetime
import mimetypes
from django.db import transaction, IntegrityError
from django.db.models import Q, Count
from django.contrib.auth import authenticate
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    Department, Officer, Material, AppealStep, ApprovalRequest, AuditLog, ActiveVisit, SMSTemplate, ChatMessage, Rating,
    MaterialDocument, CaseRequest, Ekspertiza, Taqiq
)
from .serializers import (
    DepartmentSerializer, OfficerSerializer, MaterialSerializer, AppealStepSerializer,
    ApprovalRequestSerializer, AuditLogSerializer, ActiveVisitSerializer, SMSTemplateSerializer,
    ChatMessageSerializer, RatingSerializer, MaterialDocumentSerializer,
    CaseRequestSerializer, EkspertizaSerializer, TaqiqSerializer
)
from .deepseek import deepseek_json, deepseek_chat, DeepSeekError

def parse_difficulty(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return 3
    return parsed if 1 <= parsed <= 5 else 3


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class OfficerViewSet(viewsets.ModelViewSet):
    queryset = Officer.objects.all()
    serializer_class = OfficerSerializer

    def create(self, request, *args, **kwargs):
        password = (request.data.get('password') or '').strip()
        if password and len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = super().create(request, *args, **kwargs)
        except IntegrityError:
            # DRF's uniqueness check (a SELECT) and the actual INSERT aren't atomic,
            # so a double-submit (e.g. an impatient double-click) can slip both
            # requests past validation before either commits, and the second one
            # then hits the real DB constraint. Surface that as a clean 400 instead
            # of an uncaught 500.
            return Response({'id': ['officer with this id already exists.']}, status=status.HTTP_400_BAD_REQUEST)

        if password:
            officer = Officer.objects.filter(id=response.data.get('id')).first()
            if officer and officer.user:
                officer.user.set_password(password)
                officer.user.save()

        return response

    def partial_update(self, request, *args, **kwargs):
        password = (request.data.get('password') or '').strip()
        if password and len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        response = super().partial_update(request, *args, **kwargs)

        if password:
            officer = self.get_object()
            if officer.user:
                officer.user.set_password(password)
                officer.user.save()

        return response

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        officer = self.get_object()
        is_like = request.data.get('isLike', True)
        reason_ru = request.data.get('reasonRu', '')
        reason_uz = request.data.get('reasonUz', '')
        citizen_name = (request.data.get('citizenName') or '').strip()

        if not citizen_name:
            return Response({'detail': 'citizenName is required'}, status=status.HTTP_400_BAD_REQUEST)

        if is_like:
            officer.likes += 1
            officer.index = min(100, officer.index + 2)
        else:
            officer.dislikes += 1
            officer.index = max(0, officer.index - 1)

        officer.save()

        Rating.objects.create(
            officer=officer,
            citizen_name=citizen_name,
            is_like=is_like,
            reason_ru=reason_ru,
            reason_uz=reason_uz,
        )

        # Log action
        rating_type = "Like" if is_like else "Dislike"
        reason_suffix_ru = f" ({reason_ru})" if reason_ru else ""
        reason_suffix_uz = f" ({reason_uz})" if reason_uz else ""
        AuditLog.objects.create(
            time=timezone.now(),
            user_name=citizen_name,
            action_ru=f"Оценка качества работы сотрудника {officer.name_ru}: {rating_type}{reason_suffix_ru}",
            action_uz=f"Xodim {officer.name_uz} ishini baholash: {rating_type}{reason_suffix_uz}"
        )

        # Send real-time dislike alert to Chief via WebSocket
        if not is_like:
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    'chat_global',
                    {
                        'type': 'chat.message',
                        'data': {
                            'kind': 'dislike_alert',
                            'officer_name_ru': officer.name_ru,
                            'officer_name_uz': officer.name_uz,
                            'reason_ru': reason_ru,
                            'reason_uz': reason_uz,
                            'citizen_name': citizen_name,
                        }
                    }
                )
            except Exception as e:
                print("Failed to send WebSocket alert:", e)

        return Response(OfficerSerializer(officer).data)

    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        officer = self.get_object()
        ratings = officer.ratings.all()
        return Response(RatingSerializer(ratings, many=True).data)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Custom logic for start date and deadline
        try:
            days = int(request.data.get('deadline_days') or 10)
        except (TypeError, ValueError):
            days = 10
        reg_date = timezone.now()
        deadline_date = reg_date + datetime.timedelta(days=days)
        
        officer_id = request.data.get('officer')
        officer = Officer.objects.filter(id=officer_id).first()
        dept_id = officer.department_id if officer else 'so'

        # Use the manually entered ID if provided, otherwise auto-generate one
        custom_id = (request.data.get('id') or '').strip()
        if custom_id:
            if Material.objects.filter(id=custom_id).exists():
                return Response({'error': f'Material with ID "{custom_id}" already exists'}, status=status.HTTP_400_BAD_REQUEST)
            case_id = custom_id
        else:
            count = Material.objects.count() + 16
            case_id = f"MAT-2026-{str(count).zfill(4)}"

        new_material = Material.objects.create(
            id=case_id,
            citizen_name=request.data.get('citizen_name'),
            citizen_phone=request.data.get('citizen_phone'),
            title_ru=request.data.get('title_ru'),
            title_uz=request.data.get('title_uz'),
            registered_at=reg_date,
            deadline=deadline_date,
            status='изучаемый',
            officer=officer,
            department_id=dept_id,
            is_accepted=True,
            extension_count=0,
            difficulty=parse_difficulty(request.data.get('difficulty')),
            material_type=request.data.get('material_type', 'ariza'),
            source_from=request.data.get('source_from', 'tashrif'),
            iib=request.data.get('iib', ''),
            preliminary_article=request.data.get('preliminary_article', ''),
            mahalla=request.data.get('mahalla', ''),
        )
        
        # Create initial appeal step
        AppealStep.objects.create(
            material=new_material,
            status="Обращение гражданина",
            time=reg_date
        )
        
        # Log action
        off_name = officer.name_ru if officer else "Не назначен"
        AuditLog.objects.create(
            time=reg_date,
            user_name="Регистратор",
            action_ru=f"Зарегистрирован новый материал {case_id} для исполнителя {off_name}",
            action_uz=f"Yangi tekshiruv materiali {case_id} ijrochi {off_name}ga biriktirildi"
        )
        
        return Response(MaterialSerializer(new_material).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        material = self.get_object()
        new_officer_id = request.data.get('new_officer_id')
        new_officer = Officer.objects.filter(id=new_officer_id).first()
        
        if not new_officer:
            return Response({'error': 'Officer not found'}, status=status.HTTP_400_BAD_REQUEST)
            
        old_officer_name = material.officer.name_ru if material.officer else "Не назначен"
        material.officer = new_officer
        material.department = new_officer.department
        material.save()
        
        AuditLog.objects.create(
            time=timezone.now(),
            user_name="Начальник отделения",
            action_ru=f"Перераспределение материала {material.id} от {old_officer_name} к {new_officer.name_ru}",
            action_uz=f"Material {material.id} xodim {old_officer_name}dan {new_officer.name_uz}ga qayta biriktirildi"
        )
        
        return Response(MaterialSerializer(material).data)

    @action(detail=True, methods=['post'], url_path='add-step')
    def add_step(self, request, pk=None):
        material = self.get_object()
        status_text = request.data.get('status')
        if not status_text:
            return Response({'error': 'Status text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        step = AppealStep.objects.create(
            material=material,
            status=status_text,
            time=timezone.now()
        )
        
        # Log action in audit logs
        AuditLog.objects.create(
            time=timezone.now(),
            user_name=request.data.get('user_name', 'Следователь'),
            action_ru=f"Добавлен этап '{status_text}' в ход прохождения дела {material.id}",
            action_uz=f"Ish {material.id} o'tish bosqichlariga '{status_text}' bosqichi qo'shildi"
        )
        
        return Response(AppealStepSerializer(step).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='send-sms')
    def send_sms(self, request, pk=None):
        material = self.get_object()
        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'error': 'text is required'}, status=status.HTTP_400_BAD_REQUEST)

        material.citizen_notification_text = text
        material.save()

        AuditLog.objects.create(
            time=timezone.now(),
            user_name=request.data.get('user_name', 'Сотрудник'),
            action_ru=f"Отправлено SMS-уведомление заявителю по делу {material.id}: \"{text[:80]}\"",
            action_uz=f"{material.id} ishi bo'yicha murojaatchiga SMS-xabarnoma yuborildi: \"{text[:80]}\""
        )

        return Response(MaterialSerializer(material).data)

class MaterialDocumentViewSet(viewsets.ModelViewSet):
    queryset = MaterialDocument.objects.all()
    serializer_class = MaterialDocumentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = MaterialDocument.objects.all()
        material_id = self.request.query_params.get('material')
        if material_id:
            qs = qs.filter(material_id=material_id)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        original_name = uploaded_file.name if uploaded_file else ''
        material = serializer.save(original_name=original_name)

        AuditLog.objects.create(
            time=timezone.now(),
            user_name=self.request.data.get('uploaded_by', 'Сотрудник'),
            action_ru=f"Загружен документ \"{original_name}\" к материалу {material.material_id}",
            action_uz=f"{material.material_id} materialiga \"{original_name}\" hujjati yuklandi"
        )

class RegistryViewSetMixin:
    """Shared list/create/resolve behavior for the Zapros/Ekspertiza/Taqiq registries:
    each is a small log of items optionally linked to a Material, opened by an
    officer, and later resolved (a reply arrives / an expertise concludes / a
    restriction is lifted)."""
    resolved_status = None  # set on subclass
    audit_open_ru = audit_open_uz = audit_resolve_ru = audit_resolve_uz = ''

    def get_queryset(self):
        qs = self.queryset.model.objects.all()
        material_id = self.request.query_params.get('material')
        if material_id:
            qs = qs.filter(material_id=material_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        officer = Officer.objects.filter(id=request.data.get('officer')).first()
        instance = serializer.save(officer=officer, started_at=timezone.now())

        AuditLog.objects.create(
            time=timezone.now(),
            user_name=officer.name_ru if officer else 'Следователь',
            action_ru=self.audit_open_ru.format(instance=instance, type_display=instance.get_type_display()),
            action_uz=self.audit_open_uz.format(instance=instance, type_display=instance.get_type_display()),
        )
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        instance = self.get_object()
        instance.response_text = request.data.get('response_text', instance.response_text)
        instance.status = request.data.get('status') or self.resolved_status
        instance.resolved_at = timezone.now()
        instance.save()

        AuditLog.objects.create(
            time=timezone.now(),
            user_name=request.data.get('user_name', 'Следователь'),
            action_ru=self.audit_resolve_ru.format(instance=instance),
            action_uz=self.audit_resolve_uz.format(instance=instance),
        )
        return Response(self.get_serializer(instance).data)

class CaseRequestViewSet(RegistryViewSetMixin, viewsets.ModelViewSet):
    queryset = CaseRequest.objects.all()
    serializer_class = CaseRequestSerializer
    resolved_status = 'javob_kelgan'
    audit_open_ru = "Направлен запрос ({type_display}) по материалу {instance.material_id}"
    audit_open_uz = "{instance.material_id} materiali bo'yicha so'rov yuborildi ({instance.type})"
    audit_resolve_ru = "Получен ответ на запрос по материалу {instance.material_id}"
    audit_resolve_uz = "{instance.material_id} materiali bo'yicha so'rovga javob olindi"

class EkspertizaViewSet(RegistryViewSetMixin, viewsets.ModelViewSet):
    queryset = Ekspertiza.objects.all()
    serializer_class = EkspertizaSerializer
    resolved_status = 'yakunlangan'
    audit_open_ru = "Назначена экспертиза ({type_display}) по материалу {instance.material_id}"
    audit_open_uz = "{instance.material_id} materiali bo'yicha ekspertiza tayinlandi ({instance.type})"
    audit_resolve_ru = "Завершена экспертиза по материалу {instance.material_id}"
    audit_resolve_uz = "{instance.material_id} materiali bo'yicha ekspertiza yakunlandi"

class TaqiqViewSet(RegistryViewSetMixin, viewsets.ModelViewSet):
    queryset = Taqiq.objects.all()
    serializer_class = TaqiqSerializer
    resolved_status = 'bekor_qilingan'
    audit_open_ru = "Наложен та'кик ({type_display}) по материалу {instance.material_id}"
    audit_open_uz = "{instance.material_id} materiali bo'yicha ta'qiq qo'yildi ({instance.type})"
    audit_resolve_ru = "Снят та'кик по материалу {instance.material_id}"
    audit_resolve_uz = "{instance.material_id} materiali bo'yicha ta'qiq bekor qilindi"

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer

    @action(detail=False, methods=['post'], url_path='submit')
    def submit_approval(self, request):
        case_id = request.data.get('caseId')
        officer_id = request.data.get('officerId')
        req_type = request.data.get('type') # закрыт_в_срок, возбуждено, перенаправлено
        reason = request.data.get('reason')
        case_num = request.data.get('caseNum')
        org_name = request.data.get('orgName')
        
        material = Material.objects.filter(id=case_id).first()
        officer = Officer.objects.filter(id=officer_id).first()

        if not material or not officer:
            return Response({'error': 'Material or Officer not found'}, status=status.HTTP_400_BAD_REQUEST)

        if ApprovalRequest.objects.filter(case_id=case_id).exists():
            return Response({'error': 'A decision for this case is already pending approval'}, status=status.HTTP_400_BAD_REQUEST)

        # Create approval request
        app_req = ApprovalRequest.objects.create(
            case=material,
            officer=officer,
            type=req_type,
            reason=reason,
            case_num=case_num,
            org_name=org_name,
            requested_at=timezone.now()
        )
        
        # Update case temporarily
        material.status = 'изучаемый' # remains active until approved
        material.save()
        
        AuditLog.objects.create(
            time=timezone.now(),
            user_name=f"{officer.name_ru} ({officer.rank_ru})",
            action_ru=f"Направлен проект решения по делу {case_id} на согласование руководству",
            action_uz=f"{case_id} material bo'yicha qaror loyihasi tasdiqlash uchun rahbariyatga yuborildi"
        )
        
        return Response(ApprovalRequestSerializer(app_req).data)

    @action(detail=False, methods=['post'], url_path='(?P<case_id>[^/.]+)/approve')
    def approve(self, request, case_id=None):
        app_req = ApprovalRequest.objects.filter(case_id=case_id).first()
        if not app_req:
            return Response({'error': 'Approval request not found'}, status=status.HTTP_404_NOT_FOUND)
            
        material = app_req.case
        officer = material.officer

        # Approve process: close the case, marking it on-time or overdue based on the deadline
        now = timezone.now()
        material.status = 'закрыт_в_срок' if now <= material.deadline else 'срок_нарушен'
        material.closed_at = now
        material.save()

        # Add a timeline step for decision
        decision_label_ru = "Отказ в ВУД" if app_req.type == 'закрыт_в_срок' else "Возбуждение ВУД" if app_req.type == 'возбуждено' else "Передача по территориальности"
        decision_label_uz = "JIQni rad etish" if app_req.type == 'закрыт_в_срок' else "JIQ qo'zg'atish" if app_req.type == 'возбуждено' else "Tergovga yuborish"
        
        AppealStep.objects.create(
            material=material,
            status=decision_label_ru,
            time=timezone.now()
        )
        
        # Log approval audit
        AuditLog.objects.create(
            time=timezone.now(),
            user_name="Начальник отделения",
            action_ru=f"Согласовано процессуальное решение по делу {material.id} ({decision_label_ru}).",
            action_uz=f"{material.id} material bo'yicha protsessual qaror tasdiqlandi ({decision_label_uz})."
        )
        
        # Clean up request
        app_req.delete()
        
        return Response({'status': 'Approved successfully'})

    @action(detail=False, methods=['post'], url_path='(?P<case_id>[^/.]+)/reject')
    def reject(self, request, case_id=None):
        app_req = ApprovalRequest.objects.filter(case_id=case_id).first()
        if not app_req:
            return Response({'error': 'Approval request not found'}, status=status.HTTP_404_NOT_FOUND)
            
        material = app_req.case
        material.status = 'изучаемый' # Reset back to active study
        material.save()
        
        # Add audit
        AuditLog.objects.create(
            time=timezone.now(),
            user_name="Начальник отделения",
            action_ru=f"Отклонен проект процессуального решения по делу {material.id}. Отправлено на доработку.",
            action_uz=f"{material.id} bo'yicha qaror loyihasi rad etildi va qayta ishlashga qaytarildi."
        )
        
        # Clean up request
        app_req.delete()
        
        return Response({'status': 'Rejected successfully'})

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer

class ActiveVisitViewSet(viewsets.ModelViewSet):
    queryset = ActiveVisit.objects.all()
    serializer_class = ActiveVisitSerializer

class SMSTemplateViewSet(viewsets.ModelViewSet):
    queryset = SMSTemplate.objects.all()
    serializer_class = SMSTemplateSerializer

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = ChatMessage.objects.all()
        user_id = self.request.query_params.get('user_id')
        peer_id = self.request.query_params.get('peer_id')

        if peer_id and user_id:
            return qs.filter(
                Q(sender_id=user_id, recipient_id=peer_id) | Q(sender_id=peer_id, recipient_id=user_id)
            )
        return qs.filter(recipient_id__isnull=True)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'count': 0, 'by_sender': {}})
        qs = ChatMessage.objects.filter(recipient_id=user_id, is_read=False)
        by_sender = {row['sender_id']: row['n'] for row in qs.values('sender_id').annotate(n=Count('id'))}
        return Response({'count': sum(by_sender.values()), 'by_sender': by_sender})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        user_id = request.query_params.get('user_id')
        peer_id = request.query_params.get('peer_id')

        if user_id and peer_id:
            unread = ChatMessage.objects.filter(sender_id=peer_id, recipient_id=user_id, is_read=False)
            if unread.exists():
                unread.update(is_read=True)
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user_{peer_id}',
                    {'type': 'chat.message', 'data': {'kind': 'read', 'reader_id': user_id}}
                )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        is_image = False
        if uploaded_file:
            content_type = uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0] or ''
            is_image = content_type.startswith('image/')
        message = serializer.save(is_image=is_image)
        data = ChatMessageSerializer(message, context=self.get_serializer_context()).data
        data['kind'] = 'message'

        channel_layer = get_channel_layer()
        if message.recipient_id:
            for participant in {message.sender_id, message.recipient_id}:
                async_to_sync(channel_layer.group_send)(
                    f'user_{participant}',
                    {'type': 'chat.message', 'data': data}
                )
        else:
            async_to_sync(channel_layer.group_send)(
                'chat_global',
                {'type': 'chat.message', 'data': data}
            )

    def perform_destroy(self, instance):
        message_id = instance.id
        sender_id = instance.sender_id
        recipient_id = instance.recipient_id
        instance.delete()

        channel_layer = get_channel_layer()
        data = {'kind': 'delete', 'id': message_id}
        if recipient_id:
            for participant in {sender_id, recipient_id}:
                async_to_sync(channel_layer.group_send)(
                    f'user_{participant}',
                    {'type': 'chat.message', 'data': data}
                )
        else:
            async_to_sync(channel_layer.group_send)(
                'chat_global',
                {'type': 'chat.message', 'data': data}
            )

class DbOperationsViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=['post'], url_path='reset')
    def reset_db(self, request):
        from django.core.management import call_command
        try:
            with transaction.atomic():
                # Delete all existing data
                AppealStep.objects.all().delete()
                ApprovalRequest.objects.all().delete()
                Material.objects.all().delete()
                Officer.objects.all().delete()
                Department.objects.all().delete()
                ActiveVisit.objects.all().delete()
                AuditLog.objects.all().delete()
                SMSTemplate.objects.all().delete()
                
                # Run seeder
                call_command('seed_db')
                
            return Response({'status': 'Database reset completed successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AiAssistantViewSet(viewsets.ViewSet):
    
    @action(detail=False, methods=['post'], url_path='chat')
    def chat(self, request):
        query = request.data.get('query', '').strip()
        lang = request.data.get('lang', 'ru')
        case_context = request.data.get('case_context') or None

        if not query:
            return Response({'error': 'No query provided'}, status=status.HTTP_400_BAD_REQUEST)

        lang_name = 'русском языке' if lang == 'ru' else "o'zbek tilida"
        system_prompt = (
            "Ты — юридический AI-ассистент для следователей отдела внутренних дел "
            "Олмазорского района (Узбекистан), встроенный в систему учёта дел «Е-Материал». "
            "Следователи задают тебе вопросы по квалификации правонарушений, просят алгоритм "
            "проверочных действий или черновик процессуального документа (постановление, план и т.п.).\n\n"
            "Если в сообщении пользователя указан контекст конкретного дела (Контекст дела: ...), "
            "используй его данные (ID, фабула, ИИБ, статья, тип материала и т.п.) как основу для анализа "
            "и черновика, а не общие рассуждения.\n\n"
            f"Отвечай строго в формате JSON с тремя полями, весь текст — на {lang_name}:\n"
            '- "aiText": краткий профессиональный анализ/ответ со ссылками на статьи УК РУз или УПК РУз, если applicable.\n'
            '- "checklist": массив из 2-5 коротких пунктов конкретных действий следователя (пустой массив, если не applicable).\n'
            '- "draftText": если вопрос подразумевает необходимость черновика документа — дай оформленный черновик '
            "(с условным номером материала вида MAT-2026-...), иначе пустая строка."
        )

        user_content = query
        if case_context:
            context_lines = "\n".join(
                f"{key}: {value}" for key, value in case_context.items() if value not in (None, '')
            )
            user_content = f"Контекст дела:\n{context_lines}\n\nВопрос следователя: {query}"

        try:
            result = deepseek_json([
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_content},
            ])
            ai_text = str(result.get('aiText', ''))
            checklist = result.get('checklist') or []
            draft = str(result.get('draftText', ''))
        except DeepSeekError as e:
            ai_text = (
                'AI-ассистент временно недоступен (нет интернета или сервис перегружен). Попробуйте позже.'
                if lang == 'ru' else
                "AI-yordamchi vaqtincha mavjud emas (internet yo'q yoki xizmat band). Keyinroq urinib ko'ring."
            )
            checklist = []
            draft = ''

        AuditLog.objects.create(
            time=timezone.now(),
            user_name="Каримов С. (Следователь)",
            action_ru=f"AI-чатбот: Запрос: \"{query[:50]}...\"",
            action_uz=f"AI-chatbot: So'rov: \"{query[:50]}...\""
        )

        return Response({
            'aiText': ai_text,
            'checklist': checklist,
            'draftText': draft
        })

    @action(detail=False, methods=['post'], url_path='citizen-chat')
    def citizen_chat(self, request):
        query = (request.data.get('query') or '').strip()
        lang = request.data.get('lang', 'ru')
        history = request.data.get('history') or []  # [{role: 'user'|'assistant', text: '...'}, ...]

        if not query:
            return Response({'error': 'No query provided'}, status=status.HTTP_400_BAD_REQUEST)

        lang_name = 'русском языке' if lang == 'ru' else "o'zbek tilida"
        system_prompt = (
            "Ты — вежливый AI-помощник у входа в Олмазорский районный отдел внутренних дел (Узбекистан). "
            "К тебе обращаются обычные граждане (не юристы) с вопросами вроде «у меня украли телефон», "
            "«потерял паспорт», «сосед шумит» и т.п.\n\n"
            "Правила:\n"
            "- Объясняй простым языком, без юридического жаргона, 3-6 предложений.\n"
            "- Не давай юридических консультаций как адвокат — только практические шаги: куда обратиться, "
            "какие документы взять с собой, к кому подойти в отделе.\n"
            "- Если ситуация экстренная (угроза жизни, происшествие прямо сейчас) — сразу скажи звонить 102.\n"
            "- Всегда заверши напоминанием обратиться к регистратору отдела для подачи официального заявления.\n"
            f"- Отвечай только на {lang_name}, обычным текстом (не JSON, без Markdown-разметки)."
        )

        messages = [{'role': 'system', 'content': system_prompt}]
        for turn in history[-10:]:
            role = 'assistant' if turn.get('role') == 'assistant' else 'user'
            text = str(turn.get('text', ''))
            if text:
                messages.append({'role': role, 'content': text})
        messages.append({'role': 'user', 'content': query})

        try:
            reply = deepseek_chat(messages, json_mode=False, temperature=0.4)
        except DeepSeekError:
            reply = (
                'AI-помощник временно недоступен (нет интернета). Пожалуйста, обратитесь к регистратору отдела.'
                if lang == 'ru' else
                "AI-yordamchi vaqtincha mavjud emas (internet yo'q). Iltimos, bo'lim registratoriga murojaat qiling."
            )

        return Response({'reply': reply})

    @action(detail=False, methods=['post'], url_path='report')
    def report(self, request):
        query = (request.data.get('query') or '').strip()
        lang = request.data.get('lang', 'ru')

        if not query:
            return Response({'error': 'No query provided'}, status=status.HTTP_400_BAD_REQUEST)

        officers = list(Officer.objects.filter(role='investigator').values('id', 'name_ru', 'name_uz'))
        officer_lines = "\n".join(f"{o['id']}: {o['name_ru']} / {o['name_uz']}" for o in officers)
        today = timezone.localdate().isoformat()

        parse_system_prompt = (
            "Ты — модуль-парсер вопросов для аналитической системы «Е-Материал» (учёт дел следователей "
            "Олмазорского района). Начальник отдела задаёт вопрос о статистике материалов (дел). Тебе дан "
            "список следователей и сегодняшняя дата. Разбери вопрос в JSON со следующими полями:\n"
            '- "officer_ids": массив id сотрудников из списка (пусто, если вопрос про всех сотрудников сразу '
            'или конкретный сотрудник не указан)\n'
            '- "date_from": дата "YYYY-MM-DD" или null\n'
            '- "date_to": дата "YYYY-MM-DD" или null\n'
            '- "status_filter": один из "изучаемый", "закрыт_в_срок", "срок_приближается", "срок_нарушен", либо null\n'
            '- "type_filter": один из "ariza", "bildirgi", "sud_ajrimi", "boshqa", либо null\n'
            '- "group_by": "officer" (сравнение/разбивка по сотрудникам), "status", "type", "mahalla" или "none"\n'
            '- "unrecognized": true, если вопрос вообще не относится к статистике материалов/сотрудников этой системы\n\n'
            "Относительные периоды (текущий месяц, прошлая неделя, август и т.п.) считай от сегодняшней даты. "
            "Если сотрудник назван частично, с опечаткой или в другой транслитерации — найди наиболее похожего "
            "по списку. Если явно спрашивают сравнение или про всех сотрудников — group_by = \"officer\", "
            "officer_ids оставь пустым. Отвечай только JSON, без пояснений и без markdown."
        )
        parse_user_content = (
            f"Сегодняшняя дата: {today}\n\nСписок сотрудников (id: ФИО рус / ФИО узб):\n{officer_lines}\n\n"
            f"Вопрос начальника: {query}"
        )

        try:
            parsed = deepseek_json([
                {'role': 'system', 'content': parse_system_prompt},
                {'role': 'user', 'content': parse_user_content},
            ])
        except DeepSeekError:
            return Response({'answer': (
                "AI-hisobot vaqtincha mavjud emas (internet yo'q yoki xizmat band). Keyinroq urinib ko'ring."
                if lang == 'uz' else
                'AI-отчёт временно недоступен (нет интернета или сервис перегружен). Попробуйте позже.'
            )})

        if parsed.get('unrecognized'):
            return Response({'answer': (
                "Bu savolni tushunolmadim. Hodim ismi va davrni (masalan, \"avgust\") ko'rsatib qayta so'rang."
                if lang == 'uz' else
                'Не удалось понять вопрос. Уточните имя сотрудника и период (например, «август»).'
            )})

        officer_ids = [oid for oid in (parsed.get('officer_ids') or []) if oid]
        date_from = parsed.get('date_from') or None
        date_to = parsed.get('date_to') or None
        status_filter = parsed.get('status_filter') or None
        type_filter = parsed.get('type_filter') or None
        group_by = parsed.get('group_by') or 'none'

        qs = Material.objects.all()
        if officer_ids:
            qs = qs.filter(officer_id__in=officer_ids)
        if date_from:
            qs = qs.filter(registered_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(registered_at__date__lte=date_to)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if type_filter:
            qs = qs.filter(material_type=type_filter)

        total = qs.count()
        rows = []
        officer_map = {o['id']: o for o in officers}
        if group_by == 'officer':
            counts = qs.values('officer_id').annotate(n=Count('id')).order_by('-n')
            for c in counts:
                o = officer_map.get(c['officer_id'])
                label = o['name_ru'] if o else (c['officer_id'] or 'Без исполнителя')
                rows.append({'label': label, 'count': c['n']})
        elif group_by == 'status':
            counts = qs.values('status').annotate(n=Count('id')).order_by('-n')
            rows = [{'label': c['status'], 'count': c['n']} for c in counts]
        elif group_by == 'type':
            counts = qs.values('material_type').annotate(n=Count('id')).order_by('-n')
            rows = [{'label': c['material_type'], 'count': c['n']} for c in counts]
        elif group_by == 'mahalla':
            counts = qs.values('mahalla').annotate(n=Count('id')).order_by('-n')
            rows = [{'label': c['mahalla'] or 'Без маҳалла', 'count': c['n']} for c in counts]

        data_lines = [f"Итого: {total}"]
        for r in rows[:30]:
            data_lines.append(f"{r['label']}: {r['count']}")
        data_summary = "\n".join(data_lines)

        period_desc = f"{date_from or '...'} — {date_to or today}" if (date_from or date_to) else "за всё время"

        lang_name = 'русском языке' if lang == 'ru' else "o'zbek tilida"
        phrase_system_prompt = (
            "Ты — аналитический AI-помощник начальника отдела в системе «Е-Материал». Тебе дан вопрос "
            "начальника и уже точно посчитанные данные из базы. Сформулируй краткий деловой ответ "
            "(2-5 предложений), используя ТОЛЬКО переданные цифры — ничего не придумывай и не меняй числа. "
            "Если данных нет (итого = 0), так и скажи. "
            f"Отвечай на {lang_name}, обычным текстом без markdown."
        )
        phrase_user_content = f"Вопрос начальника: {query}\n\nПериод: {period_desc}\n\nДанные:\n{data_summary}"

        try:
            answer = deepseek_chat([
                {'role': 'system', 'content': phrase_system_prompt},
                {'role': 'user', 'content': phrase_user_content},
            ], temperature=0.2)
        except DeepSeekError:
            answer = data_summary

        return Response({
            'answer': answer,
            'total': total,
            'rows': rows,
            'period': period_desc,
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Please provide username and password'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    
    if user is not None:
        officer = Officer.objects.filter(user=user).first()
        
        if officer:
            photo = officer.photo
            if not photo:
                parts = [p for p in officer.name_ru.split(' ') if p]
                if parts:
                    photo = parts[0][0]
                    if len(parts) > 1:
                        photo += parts[1][0]
                else:
                    photo = "О"

            avatar_url = None
            if officer.avatar:
                avatar_url = request.build_absolute_uri(officer.avatar.url)

            return Response({
                'id': officer.id,
                'username': user.username,
                'role': officer.role,
                'name': officer.name_ru,
                'name_ru': officer.name_ru,
                'name_uz': officer.name_uz,
                'rank_ru': officer.rank_ru,
                'rank_uz': officer.rank_uz,
                'roleLabel': officer.rank_ru,
                'photo': photo,
                'avatar': avatar_url
            })
        else:
            if user.is_superuser:
                return Response({
                    'id': 'off_admin',
                    'username': user.username,
                    'role': 'chief',
                    'name': 'Администратор системы',
                    'name_ru': 'Администратор системы',
                    'name_uz': 'Tizim administratori',
                    'rank_ru': 'Суперпользователь',
                    'rank_uz': 'Super foydalanuvchi',
                    'roleLabel': 'Админ',
                    'photo': 'АД'
                })
            return Response({'error': 'No officer profile associated with this account'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_material_status(request):
    """Public lookup for a citizen tracking their own case: material ID + the phone
    number they registered with. Deliberately returns only status/dates/officer —
    never the citizen's name, the case description, or documents — since this
    endpoint requires no login and the material ID isn't a secret."""
    material_id = (request.data.get('material_id') or '').strip()
    phone = (request.data.get('phone') or '').strip()

    if not material_id or not phone:
        return Response({'error': 'material_id and phone are required'}, status=status.HTTP_400_BAD_REQUEST)

    phone_digits = ''.join(ch for ch in phone if ch.isdigit())
    material = Material.objects.filter(id__iexact=material_id).first()

    if not material or ''.join(ch for ch in material.citizen_phone if ch.isdigit()) != phone_digits:
        return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)

    officer = material.officer
    return Response({
        'id': material.id,
        'status': material.status,
        'registered_at': material.registered_at,
        'deadline': material.deadline,
        'closed_at': material.closed_at,
        'officer_name_ru': officer.name_ru if officer else None,
        'officer_name_uz': officer.name_uz if officer else None,
        'officer_rank_ru': officer.rank_ru if officer else None,
        'officer_rank_uz': officer.rank_uz if officer else None,
        'officer_phone': officer.phone if officer else None,
    })
