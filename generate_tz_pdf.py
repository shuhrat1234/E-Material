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
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.line(28, 815, 567, 815)
            self.drawString(28, 819, "АИС «E-Material» — Полная функционально-техническая спецификация")
        
        # Footer (all pages)
        self.line(28, 35, 567, 35)
        self.drawString(28, 25, "ГУВД г. Ташкента | Подразделения кибербезопасности")
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
    # PAGE 1: TITLE + ARCHITECTURE + PAGES (1 to 10)
    # =========================================================
    story.append(Paragraph("ТЕХНИЧЕСКОЕ ЗАДАНИЕ: ПОЛНАЯ СПЕЦИФИКАЦИЯ ВСЕХ ЭКРАННЫХ ФОРМ И ФУНКЦИЙ", title_style))
    story.append(Paragraph("Автоматизированная информационная система электронного производства «E-Material»<br/>ГУВД г. Ташкента и 12 районных подразделений кибербезопасности (800+ пользователей)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=5))
    
    # 1. Technical Stack Table
    story.append(Paragraph("1. АРХИТЕКТУРА И ТЕХНИЧЕСКИЙ СТЕК СИСТЕМЫ", sec_title))
    stack_data = [
        [Paragraph("<b>Компонент</b>", body_bold), Paragraph("<b>Используемый стек</b>", body_bold), Paragraph("<b>Техническое описание и назначение</b>", body_bold)],
        [
            Paragraph("<b>Сервер приложений (Backend)</b>", body_style),
            Paragraph("Python 3.11+, Django REST Framework, Daphne (ASGI), Django Channels, Celery, Redis", body_style),
            Paragraph("Асинхронная архитектура; протокол WebSocket для мгновенных push-уведомлений о дедлайнах; фоновые очереди Celery для пакетной генерации защищенных PDF и парсинга данных.", body_style)
        ],
        [
            Paragraph("<b>Пользовательский интерфейс (Frontend)</b>", body_style),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide React, PyAV / MediaRecorder Audio API", body_style),
            Paragraph("Одностраничное веб-приложение (SPA) с оптимизированным откликом без перезагрузки страниц, адаптивная верстка (десктоп, планшет, мобильный), прямой захват аудиопотока с микрофона.", body_style)
        ],
        [
            Paragraph("<b>База данных (Database)</b>", body_style),
            Paragraph("PostgreSQL 15+ Enterprise", body_style),
            Paragraph("Реляционная СУБД с транзакционной целостностью ACID, оптимизированными составными индексами B-Tree, связями дропперов и платежных реквизитов, партиционированием таблиц аудита.", body_style)
        ],
        [
            Paragraph("<b>Аппаратный сервер (Hardware On-Premise)</b>", body_style),
            Paragraph("Стоечный сервер Dell PowerEdge R750 / HPE DL380 2U (32 ядра / 64 потока, 64 GB ECC RAM)", body_style),
            Paragraph("Размещение в серверной комнате ГУВД (закрытый контур). 2x 960GB NVMe SSD (RAID 1 под ОС и БД) + 4x 4TB Enterprise SAS HDD (RAID 10, 8TB полезных под хранение вещдоков).", body_style)
        ],
        [
            Paragraph("<b>Аппаратный модуль ИИ (GPU)</b>", body_style),
            Paragraph("NVIDIA RTX 4090 / RTX A5000 24GB", body_style),
            Paragraph("Серверный графический ускоритель для 100% автономного запуска локальных моделей ИИ (LLM / STT) внутри закрытой сети без передачи служебных данных во внешний интернет.", body_style)
        ],
        [
            Paragraph("<b>Отказоустойчивость и безопасность</b>", body_style),
            Paragraph("Nginx Reverse Proxy, TLS 1.3, ИБП On-Line 3000VA, Dual PSU 800W, Cron Backups", body_style),
            Paragraph("Шифрование трафика по ГОСТ/TLS; аппаратное резервирование электропитания; ежедневное автоматическое создание полных дампов БД и зашифрованного архива медиафайлов.", body_style)
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

    # 2. Screens Part 1 (1 to 10)
    story.append(Paragraph("2. ПОЛНАЯ СПЕЦИФИКАЦИЯ ЭКРАННЫХ ФОРМ И СТРАНИЦ СИСТЕМЫ (ЧАСТЬ 1)", sec_title))
    pages_p1_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Страница / Экранная форма</b>", body_bold), Paragraph("<b>Интерфейс, элементы управления и сценарии использования</b>", body_bold)],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Экран авторизации и доступа</b><br/>(LoginScreen.jsx)", body_style),
            Paragraph("Форма безопасного входа по логину/паролю и роли сотрудника (registrator, investigator, chief, admin). Выбор подразделения (ГУВД, 12 районов), защита от перебора паролей (Brute-Force), сессионный токен JWT, автоматический логаут при неактивности.", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Панель дежурной части</b><br/>(RegistratorView.jsx)", body_style),
            Paragraph("Форма первичной регистрации материалов: ввод данных заявителя, автоматический расчет процессуальных сроков, фиксация суммы ущерба, номеров карт, криптокошельков и телефонов подозреваемых. Модальное окно привязки исполнителя, печать талона-уведомления.", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Кабинет следователя / дознавателя</b><br/>(InvestigatorView.jsx)", body_style),
            Paragraph("Персональный список материалов в производстве следователя с цветовыми индикаторами сроков (зеленый/желтый/красный). Вкладки фильтрации: «В производстве», «Продленные (10/30 дней)», «Решенные», «Архив». Кнопки продления сроков, отправки на согласование и приобщения протоколов.", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Кабинет руководства</b><br/>(ChiefView.jsx)", body_style),
            Paragraph("Аналитическая панель начальника отдела и руководства ГУВД: распределение нагрузки по следователям, воронка принятых решений (возбуждено, отказано, передано), список материалов, требующих согласования продления сроков или резолюций.", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Гражданский онлайн-портал</b><br/>(CitizenView.jsx)", body_style),
            Paragraph("Интерфейс для граждан: пошаговая подача заявления о киберпреступлении (фишинг, взлом, мошенничество). Ввод контактных данных, загрузка скриншотов чеков и переписок, моментальное получение Уникального Идентификационного Номера (УИН).", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Цифровой интерактивный аватар</b><br/>(CitizenAiChat.jsx / AvatarDemo.jsx)", body_style),
            Paragraph("Интерактивный голосовой киоск с цифровым видео-ассистентом: аудио-диалог с гражданином на узбекском/русском языках, консультация по правилам подачи заявлений, разъяснение прав потерпевших, первичный сбор фабулы с помощью голосового распознавания.", body_style)
        ],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Терминал самообслуживания / Киоск</b><br/>(AiKioskView.jsx / DidAgentWidget.jsx)", body_style),
            Paragraph("Специализированный полноэкранный режим информационного киоска для установки в фойе подразделений внутренних дел: крупный сенсорный интерфейс, голосовое сопровождение, сканирование документов, подача обращений без участия дежурного.", body_style)
        ],
        [
            Paragraph("8", body_style),
            Paragraph("<b>Портал верификации статуса и QR</b><br/>(MaterialStatusPage.jsx)", body_style),
            Paragraph("Публичная веб-страница валидации по QR-коду и УИН: защищенное отображение статуса рассмотрения («Зарегистрировано», «На экспертизе», «Принято решение») без раскрытия персональных данных и тайны следствия. Кнопка скачивания официального уведомления.", body_style)
        ],
        [
            Paragraph("9", body_style),
            Paragraph("<b>Интерактивная карта киберпреступлений</b><br/>(CrimeMapPanel.jsx / CrimeMapMini.jsx)", body_style),
            Paragraph("Геоинформационная система (GIS): отображение преступлений на карте Ташкента с детализацией до районов, секторов и махаллей. Фильтры по видам кибермошенничества, тепловая карта (Heatmap) концентрации инцидентов, аналитика суммы ущерба по секторам.", body_style)
        ],
        [
            Paragraph("10", body_style),
            Paragraph("<b>Единый сквозной реестр материалов</b><br/>(RegistryPanel.jsx)", body_style),
            Paragraph("Глобальная таблица всех материалов по 12 районам с полнотекстовым поиском по номеру карты, телефону, ФИО фигуранта, статье УК, дате и следователю. Экспорт выборки в Excel/PDF, сортировка по суммам и срокам.", body_style)
        ]
    ]
    t_pages_p1 = Table(pages_p1_data, colWidths=[15, 145, 378])
    t_pages_p1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_pages_p1)

    # PAGE BREAK TO PAGE 2
    story.append(PageBreak())

    # =========================================================
    # PAGE 2: SCREENS (11 to 20) + FUNCTIONS (1 to 6)
    # =========================================================
    story.append(Paragraph("2. ПОЛНАЯ СПЕЦИФИКАЦИЯ ЭКРАННЫХ ФОРМ И СТРАНИЦ СИСТЕМЫ (ЧАСТЬ 2)", sec_title))
    pages_p2_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Страница / Экранная форма</b>", body_bold), Paragraph("<b>Интерфейс, элементы управления и сценарии использования</b>", body_bold)],
        [
            Paragraph("11", body_style),
            Paragraph("<b>Карточка электронного тома дела</b><br/>(CaseDetailsModal.jsx)", body_style),
            Paragraph("Полноэкранное модальное окно дела: хронологическая лента (Timeline) процессуального движения, список изъятых вещдоков, реестр банковских счетов дропперов, дерево прикрепленных файлов (документы, аудио, видео), модуль генерации процессуальных актов.", body_style)
        ],
        [
            Paragraph("12", body_style),
            Paragraph("<b>Внутренний оперативный чат</b><br/>(ChatPanel.jsx)", body_style),
            Paragraph("Служебный защищенный мессенджер внутри дела: обмен мгновенными сообщениями и служебными пометками между следователем, дознавателем и дежурной частью в режиме реального времени через WebSocket.", body_style)
        ],
        [
            Paragraph("13", body_style),
            Paragraph("<b>Аналитическая панель ИИ</b><br/>(AiReportPanel.jsx)", body_style),
            Paragraph("Центр аналитики больших данных: автоматический расчет средних сумм ущерба, типичных способов обмана, наиболее уязвимых банковских направлений, выгрузка сводных статистических справок для руководства.", body_style)
        ],
        [
            Paragraph("14", body_style),
            Paragraph("<b>Просмотрщик документов</b><br/>(DocumentPreviewModal.jsx)", body_style),
            Paragraph("Встроенный безопасный просмотрщик процессуальных PDF-постановлений, протоколов и доказательств без необходимости скачивания на локальный компьютер сотрудника; масштабирование, постраничный просмотр и печать.", body_style)
        ],
        [
            Paragraph("15", body_style),
            Paragraph("<b>Мониторинг дедлайнов</b><br/>(DeadlineNotifications.jsx)", body_style),
            Paragraph("Выпадающий центр процессуальных уведомлений: динамический список дел, по которым истекают законные сроки проверки (менее 72ч, 48ч, 24ч), быстрый переход в карточку дела для принятия решения.", body_style)
        ],
        [
            Paragraph("16", body_style),
            Paragraph("<b>Алерты по жалобам граждан</b><br/>(DislikeAlertNotifications.jsx)", body_style),
            Paragraph("Система раннего оповещения о конфликтных ситуациях: фиксация негативных оценок или повторных жалоб заявителей на затягивание сроков, немедленное уведомление инспекции по личному составу и руководства.", body_style)
        ],
        [
            Paragraph("17", body_style),
            Paragraph("<b>Модуль рейтингов и KPI</b><br/>(RatingsModal.jsx)", body_style),
            Paragraph("Рейтинговая таблица эффективности сотрудников: процент раскрываемости, скорость принятия решений, средняя оценка заявителей, мотивационные показатели работы следователей подразделения.", body_style)
        ],
        [
            Paragraph("18", body_style),
            Paragraph("<b>Модуль SMS-оповещения</b><br/>(SmsModal.jsx)", body_style),
            Paragraph("Интерфейс отправки стандартизированных SMS-сообщений гражданам по шаблонам: уведомление о регистрации, вызов на допрос/опрос, информирование о принятом процессуальном решении.", body_style)
        ],
        [
            Paragraph("19", body_style),
            Paragraph("<b>Профиль сотрудника</b><br/>(ProfileModal.jsx)", body_style),
            Paragraph("Личный кабинет должностного лица: звание, должность, подразделение, служебный номер/жетон, персональная статистика рассмотренных дел, настройки уведомлений.", body_style)
        ],
        [
            Paragraph("20", body_style),
            Paragraph("<b>Системные настройки</b><br/>(SettingsModal.jsx)", body_style),
            Paragraph("Панель конфигурации системы: выбор языка интерфейса (узбекский/русский), смена пароля, переключение темного/светлого режима оформления, параметры безопасности сессии.", body_style)
        ]
    ]
    t_pages_p2 = Table(pages_p2_data, colWidths=[15, 145, 378])
    t_pages_p2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_pages_p2)
    story.append(Spacer(1, 4))

    # 3. Subsystems & Functions Part 1 (1 to 6)
    story.append(Paragraph("3. СПЕЦИФИКАЦИЯ ФУНКЦИОНАЛЬНЫХ ВОЗМОЖНОСТЕЙ И ПОДСИСТЕМ (ЧАСТЬ 1)", sec_title))
    funcs_p1_data = [
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
    t_funcs_p1 = Table(funcs_p1_data, colWidths=[15, 145, 378])
    t_funcs_p1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_funcs_p1)

    # PAGE BREAK TO PAGE 3
    story.append(PageBreak())

    # =========================================================
    # PAGE 3: FUNCTIONS (7 to 12) + SECURITY + RELIABILITY
    # =========================================================
    story.append(Paragraph("3. СПЕЦИФИКАЦИЯ ФУНКЦИОНАЛЬНЫХ ВОЗМОЖНОСТЕЙ И ПОДСИСТЕМ (ЧАСТЬ 2)", sec_title))
    funcs_p2_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Функциональная подсистема</b>", body_bold), Paragraph("<b>Детальное описание технической логики и возможностей</b>", body_bold)],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Модуль наложения арестов и запретов<br/>(Подсистема «Taqiq»)</b>", body_style),
            Paragraph("Формирование и учет электронных предписаний о блокировке сомнительных банковских счетов, электронных кошельков и абонентских номеров для предотвращения вывода похищенных денежных средств потерпевших.", body_style)
        ],
        [
            Paragraph("8", body_style),
            Paragraph("<b>Модуль судебных экспертиз<br/>(Подсистема «Ekspertiza»)</b>", body_style),
            Paragraph("Оформление постановлений о назначении компьютерно-технических, судебно-бухгалтерских и фоноскопических экспертиз, учет движения вещественных доказательств, фиксация заключения эксперта.", body_style)
        ],
        [
            Paragraph("9", body_style),
            Paragraph("<b>Служебные запросы в ведомства<br/>(Подсистема «CaseRequest»)</b>", body_style),
            Paragraph("Электронный реестр запросов в сотовые компании (детализация звонков, IMEI, геолокация базовых станций), интернет-провайдеры (IP-логи) и финансовые учреждения с фиксацией сроков ответа.", body_style)
        ],
        [
            Paragraph("10", body_style),
            Paragraph("<b>Многоуровневый аудит и безопасность<br/>(AuditLog & RBAC)</b>", body_style),
            Paragraph("Разграничение прав: следователь видит свои дела, начальник района — районную базу, руководство ГУВД — сводную базу. Нестираемый журнал аудита фиксирует каждое действие (просмотр, выгрузка, изменение) с фиксацией IP и точного времени.", body_style)
        ],
        [
            Paragraph("11", body_style),
            Paragraph("<b>Геоинформационная аналитика преступности<br/>(GIS Crime Map Engine)</b>", body_style),
            Paragraph("Автоматическая геокодировка адресов мест совершения преступлений, расчет плотности инцидентов по махаллям, секторная разбивка (1-4 секторы), выявление очагов активности злоумышленников и банкоматов снятия наличных.", body_style)
        ],
        [
            Paragraph("12", body_style),
            Paragraph("<b>Оценка удовлетворенности граждан<br/>(Citizen Rating & Feedback Loop)</b>", body_style),
            Paragraph("Автоматический сбор оценок граждан после завершения рассмотрения обращения через публичный портал по 5-балльной шкале, формирование индекса доверия к органам внутренних дел и мотивации сотрудников.", body_style)
        ]
    ]
    t_funcs_p2 = Table(funcs_p2_data, colWidths=[15, 145, 378])
    t_funcs_p2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_funcs_p2)
    story.append(Spacer(1, 5))

    # 4. Information Security & Compliance Table
    story.append(Paragraph("4. ТРЕБОВАНИЯ К ИНФОРМАЦИОННОЙ БЕЗОПАСНОСТИ И ЗАЩИТЕ ДАННЫХ", sec_title))
    sec_data = [
        [Paragraph("<b>Параметр</b>", body_bold), Paragraph("<b>Техническая реализация</b>", body_bold), Paragraph("<b>Гарантируемый результат</b>", body_bold)],
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
            Paragraph("<b>Защита сетевого периметра</b>", body_style),
            Paragraph("On-Premise контур, WAF-фильтрация (Nginx ModSecurity), TLS 1.3, изоляция портов.", body_style),
            Paragraph("Защита от DDoS-атак, SQL-инъекций, межсайтового скриптинга (XSS) и сетевого сканирования.", body_style)
        ],
        [
            Paragraph("<b>Резервирование и целостность</b>", body_style),
            Paragraph("RAID 10, онлайн-ИБП 3kVA с чистой синусоидой, инкрементальный Cron-бэкап каждые 24 часа.", body_style),
            Paragraph("Гарантированное восстановление работоспособности системы (RTO < 2ч, RPO < 24ч).", body_style)
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
    story.append(Spacer(1, 5))

    # 5. Technical Requirements Summary Table
    story.append(Paragraph("5. ПОКАЗАТЕЛИ НАДЕЖНОСТИ И ЭКСПЛУАТАЦИИ СИСТЕМЫ", sec_title))
    rel_data = [
        [Paragraph("<b>Показатель</b>", body_bold), Paragraph("<b>Нормативное значение</b>", body_bold), Paragraph("<b>Механизм обеспечения</b>", body_bold)],
        [
            Paragraph("<b>Коэффициент готовности (Uptime)</b>", body_style),
            Paragraph("Не менее 99.9% в режиме 24/7/365", body_style),
            Paragraph("Резервирование блоков питания, онлайн-ИБП, автоперезапуск сервисов через Systemd.", body_style)
        ],
        [
            Paragraph("<b>Пиковая одновременная нагрузка</b>", body_style),
            Paragraph("До 1 000 одновременных сессий", body_style),
            Paragraph("Асинхронные воркеры Daphne, пул соединений PostgreSQL PgBouncer, кэширование Redis.", body_style)
        ],
        [
            Paragraph("<b>Время отклика интерфейса</b>", body_style),
            Paragraph("Не более 0.5 секунды на операцию", body_style),
            Paragraph("Клиентский рендеринг React SPA, оптимизированные индексы БД, быстрые накопители NVMe.", body_style)
        ],
        [
            Paragraph("<b>Регламент резервного копирования</b>", body_style),
            Paragraph("RPO не более 24 часов, RTO не более 2 часов", body_style),
            Paragraph("Ежедневный дамп базы pg_dump, архивация медиафайлов, контрольные тесты развертывания.", body_style)
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
    print("Full exhaustive 3-page TZ PDF generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_full_tz_pdf()
