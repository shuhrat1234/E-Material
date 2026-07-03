from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
import datetime
from django.db import transaction
from django.contrib.auth import authenticate

from .models import (
    Department, Officer, Material, AppealStep, ApprovalRequest, AuditLog, ActiveVisit, SMSTemplate
)
from .serializers import (
    DepartmentSerializer, OfficerSerializer, MaterialSerializer, AppealStepSerializer, 
    ApprovalRequestSerializer, AuditLogSerializer, ActiveVisitSerializer, SMSTemplateSerializer
)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class OfficerViewSet(viewsets.ModelViewSet):
    queryset = Officer.objects.all()
    serializer_class = OfficerSerializer

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        officer = self.get_object()
        is_like = request.data.get('isLike', True)
        
        if is_like:
            officer.likes += 1
            officer.index = min(100, officer.index + 2)
        else:
            officer.dislikes += 1
            officer.index = max(0, officer.index - 1)
            
        officer.save()
        
        # Log action
        rating_type = "Like" if is_like else "Dislike"
        AuditLog.objects.create(
            time=timezone.now(),
            user_name="Планшет",
            action_ru=f"Оценка качества работы сотрудника {officer.name_ru}: {rating_type}",
            action_uz=f"Xodim {officer.name_uz} ishini baholash: {rating_type}"
        )
        
        return Response(OfficerSerializer(officer).data)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Custom logic for start date and deadline
        days = int(request.data.get('deadline_days', 10))
        reg_date = timezone.now()
        deadline_date = reg_date + datetime.timedelta(days=days)
        
        officer_id = request.data.get('officer')
        officer = Officer.objects.filter(id=officer_id).first()
        dept_id = officer.department_id if officer else 'so'
        
        # Generate custom MAT code
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
            difficulty=int(request.data.get('difficulty', 3)),
            material_type=request.data.get('material_type', 'ariza'),
            source_from=request.data.get('source_from', 'tashrif'),
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
        
        # Auto-create status milestones after registration simulation (2 steps)
        AppealStep.objects.create(
            material=new_material,
            status="Анализ и решение",
            time=reg_date + datetime.timedelta(minutes=1)
        )
        AppealStep.objects.create(
            material=new_material,
            status="Оперативная отправка уведомления",
            time=reg_date + datetime.timedelta(minutes=2)
        )
        AppealStep.objects.create(
            material=new_material,
            status="Прием гражданином уведомления",
            time=reg_date + datetime.timedelta(minutes=5)
        )
        
        # Create automated audit logs for SMS notifications
        AuditLog.objects.create(
            time=reg_date + datetime.timedelta(minutes=2),
            user_name="Система информирования",
            action_ru=f"Отправлено SMS о начале доследственной проверки по делу {case_id} гражданину {new_material.citizen_name}",
            action_uz=f"Murojaatchi {new_material.citizen_name}ga {case_id}-sonli material bo'yicha tergov oldi tekshiruvi boshlangani haqida SMS yuborildi"
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
        
        # Approve process: Close case in db
        material.status = 'закрыт_в_срок'
        material.closed_at = timezone.now()
        
        # Generate SMS notification body
        tpl_code = 'tpl_reject'
        if app_req.type == 'возбуждено':
            tpl_code = 'tpl_initiate'
        elif app_req.type == 'перенаправлено':
            tpl_code = 'tpl_transfer'
            
        sms_tpl = SMSTemplate.objects.filter(template_id=tpl_code).first()
        notif_text_ru = ""
        notif_text_uz = ""
        if sms_tpl:
            # Replaces placeholders
            notif_text_ru = sms_tpl.content_ru.replace("{name}", material.citizen_name)\
                                              .replace("{id}", material.id)\
                                              .replace("{link}", f"e-material.gov.uz/docs/{material.id}")\
                                              .replace("{case_num}", app_req.case_num or "10/26-99")\
                                              .replace("{officer}", officer.name_ru if officer else "")\
                                              .replace("{phone}", "+998 90 123-45-67")\
                                              .replace("{org}", app_req.org_name or "РУВД")
            notif_text_uz = sms_tpl.content_uz.replace("{name}", material.citizen_name)\
                                              .replace("{id}", material.id)\
                                              .replace("{link}", f"e-material.gov.uz/docs/{material.id}")\
                                              .replace("{case_num}", app_req.case_num or "10/26-99")\
                                              .replace("{officer}", officer.name_uz if officer else "")\
                                              .replace("{phone}", "+998 90 123-45-67")\
                                              .replace("{org}", app_req.org_name or "IIO FMB")
                                              
        material.citizen_notification_text = notif_text_ru # Save main language copy
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
            action_ru=f"Согласовано процессуальное решение по делу {material.id} ({decision_label_ru}). Отправлено авто-уведомление гражданину.",
            action_uz=f"{material.id} material bo'yicha protsessual qaror tasdiqlandi ({decision_label_uz}). Fuqaroga xabarnoma yuborildi."
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
        
        ai_text = ""
        checklist = []
        draft = ""
        
        if not query:
            return Response({'error': 'No query provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        ql_matches = ['краж', 'мошен', 'разграничение', 'o\'g\'rilik', 'firibgarlik']
        chk_matches = ['план', 'действ', 'алгоритм', 'harakat', 'reja']
        rej_matches = ['отказ', 'постановл', 'возбужд', 'rad etish', 'qaror']
        
        is_qualification = any(x in query.lower() for x in ql_matches)
        is_checklist = any(x in query.lower() for x in chk_matches)
        is_draft = any(x in query.lower() for x in rej_matches)
        
        if is_qualification:
            if lang == 'ru':
                ai_text = "Анализ квалификации: Ключевое различие между кражей (ст. 169) и мошенничеством (ст. 168) заключается в способе изъятия. Если виновное лицо использовало чужие реквизиты банковской карты без ведома владельца (например, нашло карту) - это тайное хищение (кража, ст. 169). Если же владелец сам передал код доступа под воздействием обмана - это мошенничество (ст. 168). Коллизионность в судебной практике минимизируется разъяснением Пленума Верховного суда Республики Узбекистан."
                checklist = [
                    "Истребовать биллинг телефонных соединений и IP-адрес транзакции.",
                    "Провести допрос потерпевшего о характере передачи банковских данных.",
                    "Направить запрос в процессинговый центр банка о получателе средств."
                ]
                draft = "ПОСТАНОВЛЕНИЕ\nоб отказе в возбуждении уголовного дела\n\nг. Ташкент                               30 июня 2026 г.\n\nКапитан милиции Каримов С.Б., рассмотрев материалы дела MAT-2026-...\nУСТАНОВИЛ:\nИмели место признаки гражданско-правовых отношений...\nПОСТАНОВИЛ:\n1. В возбуждении дела по ст. 168 УК РУз отказать.\n2. Направить копию прокурору."
            else:
                ai_text = "Kvalifikatsiya tahlili: O'g'rilik (169-modda) va firibgarlik (168-modda) o'rtasidagi asosiy farq - bu mulkni qo'lga kiritish usuli. Agar shaxs egasining xabarisiz begona bank karta ma'lumotlaridan foydalansa (masalan, topib olingan karta) - bu yashirin talon-toroj (o'g'rilik, 169-modda). Agar karta egasining o'zi aldov ta'sirida kodni bergan bo'lsa - bu firibgarlik (168-modda)."
                checklist = [
                    "Telefon so'zlashuvlari billingi va tranzaksiya amalga oshirilgan IP-manzilni olish.",
                    "Jabrlanuvchini bank ma'lumotlarini qanday topshirganligi yuzasidan so'roq qilish.",
                    "Mablag' qabul qiluvchisi haqida bank protsessing markaziga so'rov yuborish."
                ]
                draft = "QAROR\nJinoyat ishi qo'zg'atishni rad etish to'g'risida\n\nToshkent sh.                            2026 yil 30 iyun\n\nTergovchi kapitan Karimov S.B. MAT-2026-... materialni o'rganib,\nANIQLADI:\nFuqarolar o'rtasida fuqarolik-huquqiy munosabatlar mavjud...\nQAROR QILDI:\n1. JKning 168-moddasi bilan jinoyat ishi qo'zg'atish rad etilsin.\n2. Nusxasi prokurorga yuborilsin."
        elif is_checklist:
            if lang == 'ru':
                ai_text = "Составлен алгоритм действий доследственной проверки по факту кражи имущества. Рекомендуется выполнить следующие процессуальные действия в течение 3-х суток:"
                checklist = [
                    "Осмотр места происшествия с участием криминалиста (снятие отпечатков пальцев).",
                    "Допрос заявителя и свидетелей, проживающих в непосредственной близости.",
                    "Направление запросов в ОВД соседних районов на выявление аналогичных преступлений.",
                    "Изъятие записей камер наружного видеонаблюдения по периметру."
                ]
                draft = "ПЛАН ПРОВЕРОЧНЫХ ДЕЙСТВИЙ\nпо материалу № MAT-2026-...\n\n1. Провести осмотр места происшествия.\n2. Установить свидетелей.\n3. Сделать запрос в архив судимостей.\n\nИсполнитель: Каримов С."
            else:
                ai_text = "Mulk o'g'irligi holati bo'yicha tergov oldi tekshiruv harakatlari algoritmi tuzildi. 3 kun ichida quyidagi protsessual harakatlarni bajarish tavsiya etiladi:"
                checklist = [
                    "Kriminalist ishtirokida voqea joyini ko'zdan kechirish (barmoq izlarini olish).",
                    "Murojaatchi va yaqin atrofda yashovchi guvohlarni so'roq qilish.",
                    "Qo'shni tumanlar IIObasiga shunga o'xshash jinoyatlarni aniqlash bo'yicha so'rovlar yuborish.",
                    "Atrofdagi tashqi videokuzatuv kameralari yozuvlarini olish."
                ]
                draft = "TEKSHIRUV HARAKATLARI REJASI\nMAT-2026-...-sonli material yuzasidan\n\n1. Voqea joyini ko'zdan kechirish.\n2. Guvohlarni aniqlash.\n3. Muqaddam sudlanganlar bazasiga so'rov yuborish.\n\nIjrochi: Karimov S."
        elif is_draft:
            if lang == 'ru':
                ai_text = "Шаблон постановления сформирован на основании типовых реквизитов Олмазорского РУВД. Вы можете скопировать его для дальнейшего редактирования в текстовом редакторе."
                checklist = [
                    "Проверить отсутствие ущерба (признание ущерба малозначительным).",
                    "Приобщить объяснительные сторон спора.",
                    "Зарегистрировать проект решения в АИС Е-Материал."
                ]
                draft = "ПОСТАНОВЛЕНИЕ\nоб отказе в возбуждении уголовного дела\n\nг. Ташкент                               30 июня 2026 г.\n\nСледователь СО УКД ОВД Олмазорского района капитан Каримов С.Б.,\nрассмотрев заявление гр-на Абдуллаева А.У. от 20.06.2026 г.,\nУСТАНОВИЛ:\nЗаявитель сообщил о краже, однако в ходе проверки установлено, что телефон был утерян по собственной неосторожности. Признаков состава преступления, предусмотренного ст. 169 УК РУз, не обнаружено.\nРуководствуясь ст. 83 п. 2 УПК РУз,\nПОСТАНОВИЛ:\n1. В возбуждении уголовного дела отказать за отсутствием состава преступления.\n2. Уведомить заявителя о принятом решении."
            else:
                ai_text = "Qaror andozasi Olmazor tumani IIO FMB rekvizitlari asosida yaratildi. Uni matn muharririga nusxalab olishingiz mumkin."
                checklist = [
                    "Zarar yetkazilmaganini tekshirish (kam ahamiyatli deb topish).",
                    "Nizo taraflarining tushuntirish xatlarini ilova qilish.",
                    "Qaror loyihasini E-Material tizimida ro'yxatdan o'tkazish."
                ]
                draft = "QAROR\nJinoyat ishi qo'zg'atishni rad etish to'g'risida\n\nToshkent sh.                            2026 yil 30 iyun\n\nOlmazor tumani IIO FMB Tergov bo'limi tergovchisi kapitan Karimov S.B.,\nfuqaro Abdullayev A.U.ning 20.06.2026 yildagi arizasini o'rganib,\nANIQLADI:\nMurojaatchi o'g'rilik haqida xabar bergan, biroq tekshiruv davomida telefon o'zining ehtiyotsizligi oqibatida yo'qolgani aniqlangan. O'g'rilik tarkibi aniqlanmadi.\nJinoyat-protsessual kodeksining 83-moddasi 2-bandiga asosan,\nQAROR QILDI:\n1. Jinoyat tarkibi bo'lmaganligi sababli jinoyat ishi qo'zg'atish rad etilsin.\n2. Murojaatchiga qaror nusxasi yuborilsin."
        else:
            if lang == 'ru':
                ai_text = "Я проанализировал ваш вопрос. В контексте доследственной проверки Олмазорского РУВД, для квалификации правонарушения требуется детальный разбор субъективной стороны деяния. Пожалуйста, уточните детали происшествия."
                checklist = ["Сбор дополнительных объяснений"]
                draft = "// AI Draft: Custom query response"
            else:
                ai_text = "Sizning savolingizni tahlil qildim. Tergovga qadar tekshiruv doirasida huquqbuzarlikni malakalash uchun qilmishning subyektiv tomonini batafsil o'rganish lozim. Iltimos, batafsilroq ma'lumot bering."
                checklist = ["Qo'shimcha tushuntirishlar olish"]
                draft = "// AI Qaror loyihasi"

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


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Please provide username and password'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Auto-migrate and seed if tables are missing or empty
    from django.contrib.auth.models import User
    try:
        if not User.objects.filter(username='karimov').exists() or not User.objects.filter(username='makhmudov').exists():
            from django.core.management import call_command
            call_command('makemigrations', 'api', interactive=False)
            call_command('migrate', interactive=False)
            call_command('seed_db')
    except Exception:
        try:
            from django.core.management import call_command
            call_command('makemigrations', 'api', interactive=False)
            call_command('migrate', interactive=False)
            call_command('seed_db')
        except Exception as e:
            return Response({'error': f'Database initialization failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                'photo': photo
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
