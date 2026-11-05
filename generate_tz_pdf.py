import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def generate_tz_pdf():
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

    # Strict 1-page margins: 9mm (25.5 pt)
    margin = 9 * 2.83465
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
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
        spaceAfter=3
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName=font_bold,
        fontSize=8,
        leading=10,
        textColor=colors.black,
        spaceBefore=4,
        spaceAfter=2
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=6.5,
        leading=8.5,
        textColor=colors.black
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName=font_bold
    )

    story = []
    
    # Title
    story.append(Paragraph("ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ И ФУНКЦИОНАЛЬНАЯ СПЕЦИФИКАЦИЯ", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=4))
    
    # SECTION 1: Technical Stack & Architecture
    story.append(Paragraph("1. АРХИТЕКТУРА И ТЕХНИЧЕСКИЙ СТЕК СИСТЕМЫ", section_title))
    
    stack_data = [
        [
            Paragraph("<b>Уровень</b>", body_bold),
            Paragraph("<b>Технологический стек</b>", body_bold),
            Paragraph("<b>Техническое описание и назначение</b>", body_bold)
        ],
        [
            Paragraph("<b>Серверный стек (Backend)</b>", body_style),
            Paragraph("Python 3.11+, Django REST Framework, Daphne (ASGI), Channels, Celery, Redis", body_style),
            Paragraph("Асинхронный бэкенд, WebSocket для мгновенных уведомлений, фоновые воркеры для генерации документов и обработки очередей", body_style)
        ],
        [
            Paragraph("<b>Клиентский интерфейс (Frontend)</b>", body_style),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide Icons (Single Page Application)", body_style),
            Paragraph("Адаптивный интерфейс для десктопов и мобильных устройств, мгновенная фильтрация и рендеринг без перезагрузки страниц", body_style)
        ],
        [
            Paragraph("<b>База данных (Database)</b>", body_style),
            Paragraph("PostgreSQL 15+ Enterprise", body_style),
            Paragraph("Реляционная СУБД с оптимизированными B-Tree индексами, связями транзакций, партиционированием логов и контролем целостности данных", body_style)
        ],
        [
            Paragraph("<b>Аппаратный сервер (Hardware)</b>", body_style),
            Paragraph("Стоечный сервер 2U: 2x Intel Xeon Silver (32C/64T), 64GB DDR4 ECC, 2x 960GB NVMe + 4x 4TB SAS HDD (RAID 10)", body_style),
            Paragraph("Промышленная аппаратная база в серверной комнате (On-Premise), аппаратный RAID PERC H755 с защитой кэша BBU, двойной БП 800W", body_style)
        ],
        [
            Paragraph("<b>Модуль локального ИИ (GPU)</b>", body_style),
            Paragraph("Графический ускоритель 24 GB GDDR6X/ECC (NVIDIA RTX 4090 / A5000)", body_style),
            Paragraph("Аппаратный запуск локальных нейросетей обработки языка и распознавания без передачи данных во внешнюю сеть интернет", body_style)
        ]
    ]
    
    t_stack = Table(stack_data, colWidths=[120, 160, 265])
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

    # SECTION 2: Functional Modules
    story.append(Paragraph("2. ФУНКЦИОНАЛЬНЫЕ МОДУЛИ СИСТЕМЫ", section_title))
    
    func_data = [
        [
            Paragraph("<b>№</b>", body_bold),
            Paragraph("<b>Функциональный модуль</b>", body_bold),
            Paragraph("<b>Функциональные возможности и решаемые задачи</b>", body_bold)
        ],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Дежурная часть и регистрация</b>", body_style),
            Paragraph("Прием и первичная регистрация заявлений, присвоение сквозного уникального идентификационного номера (УИН), фиксация реквизитов (банковские карты, счета, номера телефонов, криптокошельки), автоматический поиск совпадений по ранее совершенным преступлениям, распределение материалов следователям.", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Электронное производство следователя</b>", body_style),
            Paragraph("Формирование электронного тома дела, ведение протоколов допросов и опросов, приобщение доказательств (банковские выписки, скриншоты переписок, аудио/видеофайлы), контроль поручений органам дознания, вынесение постановлений на стандартизированных бланках.", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Интеллектуальный анализ (Legal AI Engine)</b>", body_style),
            Paragraph("Автоматический семантический анализ текстов заявлений, извлечение ключевых фактов, классификация статей Уголовного кодекса РУз (ст. 168, 169, 278 и др.), автоматический парсинг транзакционных выписок банков и платежных систем для выявления цепочек дропперов.", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Биометрическая верификация (Face ID)</b>", body_style),
            Paragraph("Фотофиксация лица заявителя при обращении, алгоритм распознавания лиц и верификация подлинности с определением «живости» (Liveness Detection) для исключения подачи сфальсифицированных заявлений от имени посторонних лиц.", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Голосовой ассистент (AI Voice STT/TTS)</b>", body_style),
            Paragraph("Потоковое распознавание устной речи в текст (Speech-to-Text) на узбекском и русском языках при диктовке показаний, естественный синтез речи (Text-to-Speech) для озвучивания процессуальных статусов и ответов цифрового помощника.", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Контроль процессуальных сроков</b>", body_style),
            Paragraph("Автоматический обратный отсчет сроков доследственной проверки (3, 10 и 30 суток) в соответствии с нормами УПК РУз. Цветовая индикация критичности дедлайнов, автоматические уведомления следователю и руководству за 72, 48 и 24 часа.", body_style)
        ],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Генерация документов и QR-верификация</b>", body_style),
            Paragraph("Формирование защищенных процессуальных документов в формате PDF со специальным защитным QR-кодом. При сканировании QR-кода открывается публичный валидатор, подтверждающий подлинность документа без раскрытия тайны следствия.", body_style)
        ],
        [
            Paragraph("8", body_style),
            Paragraph("<b>Карта преступности (Crime Analytics Map)</b>", body_style),
            Paragraph("Геолокация киберпреступлений на интерактивной карте г. Ташкента, построение тепловых карт концентрации инцидентов по 12 районам и махаллям, аналитические дашборды по видам правонарушений, динамике ущерба и раскрываемости.", body_style)
        ]
    ]

    t_func = Table(func_data, colWidths=[15, 140, 390])
    t_func.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_func)
    story.append(Spacer(1, 4))

    # SECTION 3: Security & Reliability
    story.append(Paragraph("3. ИНФОРМАЦИОННАЯ БЕЗОПАСНОСТЬ И ОТКАЗОУСТОЙЧИВОСТЬ", section_title))
    
    sec_data = [
        [
            Paragraph("<b>Параметр</b>", body_bold),
            Paragraph("<b>Техническая реализация</b>", body_bold),
            Paragraph("<b>Гарантируемый результат</b>", body_bold)
        ],
        [
            Paragraph("<b>Разграничение доступа (RBAC)</b>", body_style),
            Paragraph("Многоуровневая ролевая модель: следователь, начальник отдела, руководство ГУВД, администратор", body_style),
            Paragraph("Каждый сотрудник видит исключительно разрешенные материалы в рамках своей юрисдикции", body_style)
        ],
        [
            Paragraph("<b>Аудит и логирование</b>", body_style),
            Paragraph("Нестираемый журнал аудита всех обращений к базе: фиксация ID пользователя, IP, времени и типа действия", body_style),
            Paragraph("100% защита от несанкционированного изменения, выгрузки или удаления данных", body_style)
        ],
        [
            Paragraph("<b>Надежность и резервирование</b>", body_style),
            Paragraph("Аппаратный RAID 10, ИБП On-Line 3000VA, ежедневный автоматический бэкап БД и медиафайлов", body_style),
            Paragraph("Отказоустойчивость 24/7 (Uptime не менее 99.9%), восстановление данных в случае аварии", body_style)
        ]
    ]

    t_sec = Table(sec_data, colWidths=[120, 195, 230])
    t_sec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_sec)

    doc.build(story)
    print("TZ PDF generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_tz_pdf()
