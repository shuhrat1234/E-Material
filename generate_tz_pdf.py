import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Arial", 7)
        self.setStrokeColor(colors.black)
        self.setLineWidth(0.5)
        
        # Footer (all pages) - ONLY clean page number, NO departmental text
        self.line(28, 35, 567, 35)
        page_text = f"Страница {self._pageNumber} из {page_count}"
        self.drawRightString(567, 25, page_text)
        self.restoreState()

def generate_full_tz_pdf():
    pdf_filename = "/Users/macbook/Desktop/E-Material/E-Material_Tehnicheskoye_Zadaniye.pdf"
    
    # Register TrueType fonts with full Cyrillic support
    arial_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
    arial_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    
    if os.path.exists(arial_path) and os.path.exists(arial_bold_path):
        pdfmetrics.registerFont(TTFont('Arial', arial_path))
        pdfmetrics.registerFont(TTFont('Arial-Bold', arial_bold_path))
        font_regular = 'Arial'
        font_bold = 'Arial-Bold'
    else:
        font_regular = 'Helvetica'
        font_bold = 'Helvetica-Bold'

    # Margins: 10mm (28.35 pt)
    margin = 10 * 2.83465
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin + 8,
        bottomMargin=margin + 12
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName=font_bold,
        fontSize=12,
        leading=15,
        textColor=colors.black,
        alignment=1,
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=8,
        leading=11,
        textColor=colors.black,
        alignment=1,
        spaceAfter=5
    )
    
    sec_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName=font_bold,
        fontSize=8.5,
        leading=11,
        textColor=colors.black,
        spaceBefore=5,
        spaceAfter=3
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=6.8,
        leading=8.8,
        textColor=colors.black
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName=font_bold
    )

    story = []
    
    # =========================================================
    # PAGE 1: TITLE + SOFTWARE ARCHITECTURE + MAIN SECTIONS (BO'LIMLAR)
    # =========================================================
    story.append(Paragraph("ТЕХНИЧЕСКОЕ ЗАДАНИЕ: ПРОГРАММНЫЙ КОМПЛЕКС СИСТЕМЫ", title_style))
    story.append(Paragraph("Автоматизированная информационная система электронного производства «E-Material»", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=5))
    
    # 1. Software Architecture & Technology Stack (NO PHYSICAL HARDWARE)
    story.append(Paragraph("1. ПРОГРАММНАЯ АРХИТЕКТУРА И СТЕК ТЕХНОЛОГИЙ", sec_title))
    stack_data = [
        [Paragraph("<b>Уровень архитектуры</b>", body_bold), Paragraph("<b>Используемый стек ПО</b>", body_bold), Paragraph("<b>Техническое описание и реализуемые функции</b>", body_bold)],
        [
            Paragraph("<b>Серверная часть (Backend API)</b>", body_style),
            Paragraph("Python 3.11+, Django REST Framework, Daphne (ASGI), Django Channels", body_style),
            Paragraph("Микросервисная модульная архитектура; асинхронный сетевой протокол WebSocket для доставки оперативных уведомлений в реальном времени; REST API для взаимодействия с клиентами.", body_style)
        ],
        [
            Paragraph("<b>Фоновая обработка и очереди</b>", body_style),
            Paragraph("Celery Distributed Task Queue, Redis In-Memory Store", body_style),
            Paragraph("Асинхронные очереди фоновых задач: пакетная генерация процессуальных документов в PDF, расчет таймеров процессуальных сроков, обработка очередей SMS и банковских выписок.", body_style)
        ],
        [
            Paragraph("<b>Клиентский веб-интерфейс (Frontend)</b>", body_style),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide React, Web Audio API", body_style),
            Paragraph("Одностраничное приложение (Single Page Application, SPA); мгновенный отклик интерфейса без перезагрузки страниц; адаптивная верстка (десктоп, планшет, мобильный, киоск).", body_style)
        ],
        [
            Paragraph("<b>Система управления базами данных</b>", body_style),
            Paragraph("PostgreSQL 15+ Enterprise", body_style),
            Paragraph("Реляционная СУБД с транзакционной целостностью ACID, B-Tree индексами, связями транзакций и фигурантов, партиционированием таблиц аудита и защитой на уровне строк (RLS).", body_style)
        ],
        [
            Paragraph("<b>Интеллектуальное ядро (AI Core)</b>", body_style),
            Paragraph("DeepSeek LLM / UzbekVoice AI (STT & TTS) / Face ID Engine", body_style),
            Paragraph("Модуль семантического анализа фабул и статей УК; потоковое преобразование речи в текст на узбекском/русском языках; биометрическая верификация лиц с Liveness Detection.", body_style)
        ],
        [
            Paragraph("<b>Сетевой уровень и веб-сервер</b>", body_style),
            Paragraph("Nginx Reverse Proxy, TLS 1.3, SSL-терминация, Gzip", body_style),
            Paragraph("Балансировка нагрузки, кэширование статических ресурсов, шифрование трафика по защищенному протоколу HTTPS/TLS 1.3, фильтрация вредоносных HTTP-запросов.", body_style)
        ]
    ]
    t_stack = Table(stack_data, colWidths=[120, 155, 263])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 4))

    # 2. Main Menu Sections (BO'LIMLAR)
    story.append(Paragraph("2. СПЕЦИФИКАЦИЯ ОСНОВНЫХ РАЗДЕЛОВ МЕНЮ СИСТЕМЫ (РАЗДЕЛЫ / BO'LIMLAR)", sec_title))
    bolimlar_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Раздел меню (Интерфейс)</b>", body_bold), Paragraph("<b>Назначение, элементы управления и сценарии использования</b>", body_bold)],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Панель управления</b><br/>(Boshqaruv paneli)", body_style),
            Paragraph("Главный дашборд руководителя и следователя: сводные KPI-показатели, количество дел в производстве, просроченные материалы, сумма предотвращенного и возмещенного ущерба, динамика раскрываемости по дням и неделям, быстрый доступ к срочным задачам.", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Все материалы</b><br/>(Barcha materiallar)", body_style),
            Paragraph("Центральный реестр всех материалов доследственной проверки: сквозной список дел со статусами, номерами УИН, заявителями, суммами ущерба. Фильтры по стадиям (до 3 дней, продленные 10/30 дней, завершенные), быстрый переход в электронный том дела.", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Карта преступлений</b><br/>(Jinoyatlar xaritasi)", body_style),
            Paragraph("Геоинформационная интерактивная карта (GIS): отображение киберпреступлений с точной геолокацией на карте, тепловая карта (Heatmap) концентрации мошенничеств по районам, секторам и махаллям, фильтрация по видам преступлений и суммам ущерба.", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Умный отчет (ИИ-аналитика)</b><br/>(Aqlli hisobot)", body_style),
            Paragraph("Аналитический модуль искусственного интеллекта: автоматическое агрегирование статистики, выявление типовых схем мошенничества, анализ динамики использования определенных банковских карт и дропперских сетей, формирование аналитических справок для руководства.", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Рейтинг сотрудников</b><br/>(Xodimlar reytingi)", body_style),
            Paragraph("Мониторинг эффективности личного состава (KPI): расчет персонального рейтинга следователей и дознавателей на основе количества раскрытых дел, соблюдения процессуальных сроков, сумм возмещенного ущерба и оценок удовлетворенности граждан.", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Подтверждение и согласование</b><br/>(Tasdiqlash)", body_style),
            Paragraph("Рабочий модуль визирования процессуальных решений руководством: электронная очередь постановлений на согласование (о продлении сроков до 10/30 суток, о возбуждении уголовного дела, об отказе в возбуждении), утверждение или возврат на доработку.", body_style)
        ],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Пользователи и доступ</b><br/>(Foydalanuvchilar)", body_style),
            Paragraph("Модуль системного администрирования учетных записей: добавление и редактирование сотрудников, назначение ролей (регистратор, следователь, начальник, эксперт), распределение по подразделениям, управление статусом активности и сброс доступа.", body_style)
        ]
    ]
    t_bolimlar = Table(bolimlar_data, colWidths=[15, 145, 378])
    t_bolimlar.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_bolimlar)

    # PAGE BREAK TO PAGE 2
    story.append(PageBreak())

    # =========================================================
    # PAGE 2: REGISTRIES (REYESTRLAR) + WORKSPACES & PORTALS
    # =========================================================
    story.append(Paragraph("3. СПЕЦИФИКАЦИЯ СЛУЖЕБНЫХ РЕЕСТРОВ (РЕЕСТРЫ / REYESTRLAR)", sec_title))
    reyestrlar_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Реестр (Интерфейс)</b>", body_bold), Paragraph("<b>Назначение, элементы управления и сценарии использования</b>", body_bold)],
        [
            Paragraph("8", body_style),
            Paragraph("<b>Служебные запросы</b><br/>(So'rovnoma)", body_style),
            Paragraph("Электронный реестр запросов в сторонние организации: формирование и отслеживание официальных запросов в коммерческие банки (выписки), платежные системы (Click, Payme, Uzum), сотовые операторы (детализация, IMEI, базовые станции) и интернет-провайдеры.", body_style)
        ],
        [
            Paragraph("9", body_style),
            Paragraph("<b>Судебные экспертизы</b><br/>(Ekspertiza)", body_style),
            Paragraph("Реестр криминалистических и компьютерно-технических экспертиз: вынесение постановлений о назначении экспертиз цифровых носителей, телефонов, программного кода, учет передачи вещественных доказательств, фиксация входящих экспертных заключений.", body_style)
        ],
        [
            Paragraph("10", body_style),
            Paragraph("<b>Аресты и запреты</b><br/>(Ta'qiq)", body_style),
            Paragraph("Реестр обеспечительных мер: формирование электронных предписаний на блокировку сомнительных банковских карт, счетов дропперов, электронных кошельков и телефонных номеров злоумышленников для блокирования вывода похищенных средств граждан.", body_style)
        ],
        [
            Paragraph("11", body_style),
            Paragraph("<b>Внутренний чат</b><br/>(Chat)", body_style),
            Paragraph("Служебный защищенный мессенджер оперативного взаимодействия: защищенные каналы связи между следователями, дежурной частью и руководством в режиме реального времени через WebSocket для передачи оперативных ориентировок и файлов.", body_style)
        ],
        [
            Paragraph("12", body_style),
            Paragraph("<b>SMS шаблоны и рассылка</b><br/>(SMS shablonlar)", body_style),
            Paragraph("Модуль управления автоматическими SMS-оповещениями: создание и настройка шаблонов сообщений (о регистрации заявления с УИН, о вызове к следователю, о принятом процессуальном решении), мониторинг статусов доставки SMS заявителям.", body_style)
        ]
    ]
    t_reyestr = Table(reyestrlar_data, colWidths=[15, 145, 378])
    t_reyestr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_reyestr)
    story.append(Spacer(1, 4))

    # 4. Workspaces & Portals
    story.append(Paragraph("4. СПЕЦИФИКАЦИЯ РАБОЧИХ ЭКРАНОВ И ВНЕШНИХ ПОРТАЛОВ", sec_title))
    portals_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Экран / Портал</b>", body_bold), Paragraph("<b>Интерфейс, элементы управления и сценарии использования</b>", body_bold)],
        [
            Paragraph("13", body_style),
            Paragraph("<b>Дежурная часть / Регистрация</b><br/>(RegistratorView.jsx)", body_style),
            Paragraph("Форма приема входящих заявлений: регистрация заявителя, фиксация способа хищения, автоматический расчет процессуальных сроков, привязка следователя, выдача электронного талона-уведомления.", body_style)
        ],
        [
            Paragraph("14", body_style),
            Paragraph("<b>Кабинет следователя</b><br/>(InvestigatorView.jsx)", body_style),
            Paragraph("Индивидуальный рабочий стол следователя: список материалов на исполнении с цветовой индикацией остатка дней, продление сроков, приобщение протоколов допроса, вынесение процессуальных решений.", body_style)
        ],
        [
            Paragraph("15", body_style),
            Paragraph("<b>Электронный том дела</b><br/>(CaseDetailsModal.jsx)", body_style),
            Paragraph("Полноэкранная карточка материала: таймлайн движения дела, реестр изъятых вещдоков, дерево прикрепленных файлов (документы, аудио, видео), модуль генерации процессуальных постановлений.", body_style)
        ],
        [
            Paragraph("16", body_style),
            Paragraph("<b>Гражданский онлайн-портал</b><br/>(CitizenView.jsx)", body_style),
            Paragraph("Веб-интерфейс для граждан: пошаговая подача заявления о преступлении через интернет, загрузка чеков и скриншотов, получение персонального Уникального Идентификационного Номера (УИН).", body_style)
        ],
        [
            Paragraph("17", body_style),
            Paragraph("<b>Интерактивный AI-киоск и аватар</b><br/>(AiKioskView / AvatarDemo)", body_style),
            Paragraph("Инфокиоск самообслуживания в фойе с видео-ассистентом: голосовой диалог на узбекском/русском языках, разъяснение порядка подачи заявлений, опрос потерпевшего с автотранскрибацией речи.", body_style)
        ],
        [
            Paragraph("18", body_style),
            Paragraph("<b>Портал валидации по QR-коду</b><br/>(MaterialStatusPage.jsx)", body_style),
            Paragraph("Публичная страница проверки процессуального статуса: открытие по защищенному QR-коду с официального постановления, подтверждение подлинности документа без раскрытия тайны следствия.", body_style)
        ],
        [
            Paragraph("19", body_style),
            Paragraph("<b>Просмотр и печать документов</b><br/>(DocumentPreviewModal.jsx)", body_style),
            Paragraph("Встроенный безопасный просмотрщик процессуальных PDF-постановлений, протоколов и доказательств без скачивания на локальный ПК сотрудника, защищенная печать и экспорт.", body_style)
        ],
        [
            Paragraph("20", body_style),
            Paragraph("<b>Центр дедлайнов и алертов</b><br/>(DeadlineNotifications.jsx)", body_style),
            Paragraph("Выпадающий центр оперативных уведомлений: перечень дел с истекающими сроками проверки (менее 72ч, 48ч, 24ч) и алерты по повторным жалобам граждан для немедленного реагирования.", body_style)
        ]
    ]
    t_portals = Table(portals_data, colWidths=[15, 145, 378])
    t_portals.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_portals)

    # PAGE BREAK TO PAGE 3
    story.append(PageBreak())

    # =========================================================
    # PAGE 3: CORE FUNCTIONS + SECURITY + SOFTWARE METRICS
    # =========================================================
    story.append(Paragraph("5. СПЕЦИФИКАЦИЯ СКВОЗНЫХ ИНТЕЛЛЕКТУАЛЬНЫХ ФУНКЦИЙ И ПОДСИСТЕМ", sec_title))
    funcs_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Функциональная подсистема</b>", body_bold), Paragraph("<b>Детальное описание технической логики и возможностей</b>", body_bold)],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Контроль процессуальных сроков<br/>(3, 10, 30 суток по УПК РУз)</b>", body_style),
            Paragraph("Автоматический таймер с момента регистрации (ст. 329 УПК РУз): первичный срок — 3 дня; продление руководителем следственного органа — до 10 суток; продление прокурором — до 30 суток. Визуальная светофорная подсветка; отправка срочных алертов следователю и начальнику подразделения.", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Интеллектуальный юридический движок<br/>(DeepSeek Legal AI Engine)</b>", body_style),
            Paragraph("Нейросетевая модель анализа текста заявлений: автоматическое извлечение суммы ущерба, номеров счетов, контактных данных злоумышленников; автоопределение состава преступления (ст. 168 «Мошенничество», ст. 169 «Кража», ст. 278 «Киберпреступления»); синтез фабулы для постановления.", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Голосовой ассистент и транскрибация<br/>(UzbekVoice STT / TTS)</b>", body_style),
            Paragraph("Потоковое распознавание узбекской и русской речи (Speech-to-Text) в текстовые протоколы с точностью >95%; фильтрация шумов; генерация аудио-ответов интерактивного ассистента естественным голосом (Text-to-Speech) для граждан в зоне самообслуживания.", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Биометрическая верификация<br/>(Face ID & Liveness Detection)</b>", body_style),
            Paragraph("Сверка лица гражданина с камер видеофиксации или смартфона; алгоритм проверки живости (исключение фото с экранов и распечаток); привязка цифрового биометрического слепка к материалу для гарантированного подтверждения авторства обращения.", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Парсинг выписок и выявление дропперов<br/>(Financial Link Analysis)</b>", body_style),
            Paragraph("Автоматическая обработка выписок в форматах PDF/Excel от коммерческих банков и платежных систем (Click, Payme, Uzum); кросс-поиск карт-получателей по всей базе 12 районов; выявление серийных дропперов и организаторов преступных схем.", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Генератор защищенных процессуальных актов<br/>с QR-валидацией</b>", body_style),
            Paragraph("Автоматическое формирование PDF-постановлений (о возбуждении, об отказе, о назначении экспертизы) с динамическим криптостойким QR-кодом. При сканировании QR-кода открывается государственная страница валидации документа.", body_style)
        ]
    ]
    t_funcs = Table(funcs_data, colWidths=[15, 145, 378])
    t_funcs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_funcs)
    story.append(Spacer(1, 4))

    # 6. Information Security
    story.append(Paragraph("6. ТРЕБОВАНИЯ К ИНФОРМАЦИОННОЙ БЕЗОПАСНОСТИ И ЗАЩИТЕ ДАННЫХ", sec_title))
    sec_data = [
        [Paragraph("<b>Параметр безопасности</b>", body_bold), Paragraph("<b>Техническая реализация в ПО</b>", body_bold), Paragraph("<b>Гарантируемый результат защиты</b>", body_bold)],
        [
            Paragraph("<b>Разграничение доступа (RBAC)</b>", body_style),
            Paragraph("Ролевой доступ на уровне сущностей БД (Django Permissions + PostgreSQL RLS).", body_style),
            Paragraph("Исключен доступ посторонних лиц к тайне следствия и материалам других районов.", body_style)
        ],
        [
            Paragraph("<b>Журнал аудита (Audit Trail)</b>", body_style),
            Paragraph("Асинхронная фиксация в таблице `AuditLog`: пользователь, IP, timestamp, тип операции, JSON-diff.", body_style),
            Paragraph("Невозможность скрытого удаления или изменения материалов должностными лицами.", body_style)
        ],
        [
            Paragraph("<b>Защита веб-трафика</b>", body_style),
            Paragraph("Шифрование каналов связи TLS 1.3, защита от CSRF-атак, XSS-фильтрация, изоляция API-токенов.", body_style),
            Paragraph("Защита от перехвата служебного трафика, инъекций и подделки пользовательских запросов.", body_style)
        ],
        [
            Paragraph("<b>Целостность данных и бэкапы</b>", body_style),
            Paragraph("Транзакционная целостность PostgreSQL ACID, ежедневные автоматические дампы базы и медиафайлов.", body_style),
            Paragraph("Гарантированное восстановление работоспособности системы без потери процессуальных данных.", body_style)
        ]
    ]
    t_sec = Table(sec_data, colWidths=[120, 185, 233])
    t_sec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_sec)
    story.append(Spacer(1, 4))

    # 7. Software Performance Metrics
    story.append(Paragraph("7. ПОКАЗАТЕЛИ ПРОИЗВОДИТЕЛЬНОСТИ И НАДЕЖНОСТИ ПРОГРАММНОГО КОМПЛЕКСА", sec_title))
    rel_data = [
        [Paragraph("<b>Показатель</b>", body_bold), Paragraph("<b>Нормативное значение</b>", body_bold), Paragraph("<b>Механизм программного обеспечения</b>", body_bold)],
        [
            Paragraph("<b>Коэффициент доступности ПО</b>", body_style),
            Paragraph("Не менее 99.9% в режиме 24/7/365", body_style),
            Paragraph("Менеджер процессов Systemd, асинхронные воркеры, автовосстановление после сбоев.", body_style)
        ],
        [
            Paragraph("<b>Одновременная нагрузка</b>", body_style),
            Paragraph("До 1 000 одновременных активных сессий", body_style),
            Paragraph("Неблокирующий сервер Daphne ASGI, пул подключений PgBouncer, кэш сессий Redis.", body_style)
        ],
        [
            Paragraph("<b>Скорость отклика интерфейса</b>", body_style),
            Paragraph("Не более 0.5 секунды на ключевые операции", body_style),
            Paragraph("Клиентский SPA-рендеринг React, сжатие Gzip, оптимизированные индексы PostgreSQL.", body_style)
        ],
        [
            Paragraph("<b>Регламент восстановления БД</b>", body_style),
            Paragraph("RPO не более 24 часов, RTO не более 2 часов", body_style),
            Paragraph("Автоматизированные скрипты восстановления из дампов pg_restore и архивов медиа.", body_style)
        ]
    ]
    t_rel = Table(rel_data, colWidths=[120, 155, 263])
    t_rel.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_rel)

    doc.build(story, canvasmaker=NumberedCanvas)
    print("Software-only TZ PDF generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_full_tz_pdf()
