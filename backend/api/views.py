from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
import datetime
import mimetypes
from django.db import transaction
from django.db.models import Q, Count
from django.contrib.auth import authenticate
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    Department, Officer, Material, AppealStep, ApprovalRequest, AuditLog, ActiveVisit, SMSTemplate, ChatMessage, Rating
)
from .serializers import (
    DepartmentSerializer, OfficerSerializer, MaterialSerializer, AppealStepSerializer,
    ApprovalRequestSerializer, AuditLogSerializer, ActiveVisitSerializer, SMSTemplateSerializer,
    ChatMessageSerializer, RatingSerializer
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

        response = super().create(request, *args, **kwargs)

        if password:
            officer = Officer.objects.filter(id=response.data.get('id')).first()
            if officer and officer.user:
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
