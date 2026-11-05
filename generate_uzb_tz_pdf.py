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

class NumberedCanvasUzb(canvas.Canvas):
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
        
        # Footer (all pages) - ONLY clean page number in Uzbek
        self.line(28, 35, 567, 35)
        page_text = f"Sahifa {self._pageNumber} / {page_count}"
        self.drawRightString(567, 25, page_text)
        self.restoreState()

def generate_uzb_tz_pdf():
    pdf_filename = "/Users/macbook/Desktop/E-Material/E-Material_Texnik_Topshiriq.pdf"
    
    # Register TrueType fonts
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
    # PAGE 1: TITLE + SOFTWARE ARCHITECTURE + BO'LIMLAR
    # =========================================================
    story.append(Paragraph("TEXNIK TOPSHIRIQ: DASTURIY MAJMUA FUNKSIONAL SPETSIFIKATSIYASI", title_style))
    story.append(Paragraph("«E-Material» elektron tergovga qadar tekshiruv axborot tizimi", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=5))
    
    # 1. Dasturiy arxitektura va stek
    story.append(Paragraph("1. DASTURIY TA'MINOT ARXITEKTURASI VA TEXNOLOGIK STEKI", sec_title))
    stack_data = [
        [Paragraph("<b>Arxitektura pog'onasi</b>", body_bold), Paragraph("<b>Dasturiy vositalar steki</b>", body_bold), Paragraph("<b>Texnik tavsifi va bajaradigan vazifalari</b>", body_bold)],
        [
            Paragraph("<b>Server qismi (Backend API)</b>", body_style),
            Paragraph("Python 3.11+, Django REST Framework, Daphne (ASGI), Django Channels", body_style),
            Paragraph("Mikroservisli modulli arxitektura; muddatlar haqida tezkor xabarlar uchun asinxron WebSocket protokoli; mijozlar uchun REST API interfeysi.", body_style)
        ],
        [
            Paragraph("<b>Fon jarayonlari va navbatlar</b>", body_style),
            Paragraph("Celery Distributed Task Queue, Redis In-Memory Store", body_style),
            Paragraph("Asinxron fon vazifalari navbati: protsessual hujjatlarni (PDF) avtomatik generatsiya qilish, muddatlar taymerini hisoblash, SMS va bank ko'chirmalari navbatlari.", body_style)
        ],
        [
            Paragraph("<b>Foydalanuvchi interfeysi (Frontend)</b>", body_style),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide React, Web Audio API", body_style),
            Paragraph("Bir sahifali veb-ilova (SPA); sahifani qayta yuklamasdan lahzalik tezkor javob berish; moslashuvchan dizayn (kompyuter, planshet, mobil va axborot kioski).", body_style)
        ],
        [
            Paragraph("<b>Ma'lumotlar bazasi (Database)</b>", body_style),
            Paragraph("PostgreSQL 15+ Enterprise", body_style),
            Paragraph("ACID tranzaksion yaxlitlikka ega relyatsion relyatsion MB; B-Tree indekslar, dropperlar va rekvizitlar aloqalari, audit jadvallarini partitsiyalash va qator darajasidagi himoya (RLS).", body_style)
        ],
        [
            Paragraph("<b>Intellektual yadro (AI Core)</b>", body_style),
            Paragraph("DeepSeek LLM / UzbekVoice AI (STT va TTS) / Face ID Engine", body_style),
            Paragraph("Arizalar matnini va JK moddalarini semantik tahlil qilish; o'zbek/rus tillaridagi nutqni matnga aylantirish; Liveness Detection bilan fuqarolar yuzini biometrik verifikatsiya qilish.", body_style)
        ],
        [
            Paragraph("<b>Tarmoq va veb-server</b>", body_style),
            Paragraph("Nginx Reverse Proxy, TLS 1.3, SSL-terminatsiya, Gzip", body_style),
            Paragraph("Yuklamani muvozanatlash, statik resurslarni keshlashtirish, HTTPS/TLS 1.3 protokoli orqali shifrlash, zararli HTTP so'rovlarini filtrlash.", body_style)
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

    # 2. Asosiy bo'limlar (BO'LIMLAR)
    story.append(Paragraph("2. TIZIMNING ASOSIY BO'LIMLARI SPETSIFIKATSIYASI (MENYU: BO'LIMLAR)", sec_title))
    bolimlar_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Menyu bo'limi (Interfeys)</b>", body_bold), Paragraph("<b>Vazifasi, boshqaruv elementlari va qo'llanish ssenariysi</b>", body_bold)],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Boshqaruv paneli</b><br/>(Boshqaruv paneli)", body_style),
            Paragraph("Rahbar va tergovchining asosiy boshqaruv paneli: umumiy KPI ko'rsatkichlari, ish yurituvidagi materiallar soni, muddati o'tayotgan ishlar, zararni qoplash dinamikasi, kunlik va haftalik ochilgan jinoyatlar statistikasi.", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Barcha materiallar</b><br/>(Barcha materiallar)", body_style),
            Paragraph("Tergovga qadar tekshiruv materiallarining yagona markaziy reyestri: holatlar, UIN raqamlari, arizachilar va zarar miqdori ko'rsatilgan ro'yxat. Bosqichlar (3 kungacha, 10/30 kunga uzaytirilgan, yakunlangan) bo'yicha filtrlar.", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Jinoyatlar xaritasi</b><br/>(Jinoyatlar xaritasi)", body_style),
            Paragraph("Geografik axborot tizimi (GIS): kiberjinoyatlarni xaritada aniq joylashuvi bo'yicha ko'rsatish, tumanlar, sektorlar va mahallalar kesimida issiqlik xaritasi (Heatmap), jinoyat turlari va zarar summasi bo'yicha filtrlar.", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Aqlli hisobot</b><br/>(Aqlli hisobot)", body_style),
            Paragraph("Sun'iy intellekt tahliliy moduli: statistikani avtomatlashtirilgan umumlashtirish, firibgarlikning tipik sxemalarini aniqlash, bank kartalari va dropperlar zanjirini tahlil qilish, rahbariyat uchun tahliliy ma'lumotnomalar shakllantirish.", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Xodimlar reytingi</b><br/>(Xodimlar reytingi)", body_style),
            Paragraph("Shaxsiy tarkib faoliyati samaradorligi monitoringi (KPI): ochilgan ishlar soni, qonuniy muddatlarga rioya etilishi, qoplangan zarar miqdori va fuqarolar qanoatlanish darajasi asosida xodimlarning reytingini hisoblash.", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Tasdiqlash</b><br/>(Tasdiqlash)", body_style),
            Paragraph("Rahbariyat tomonidan protsessual qarorlarni elektron tasdiqlash moduli: tasdiqlash uchun kelib tushgan qarorlar navbati (muddatni 10/30 kunga uzaytirish, jinoyat ishi qo'zg'atish, rad etish), tasdiqlash yoki kamchiliklarni to'g'rilashga qaytarish.", body_style)
        ],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Foydalanuvchilar</b><br/>(Foydalanuvchilar)", body_style),
            Paragraph("Xodimlar hisob yozuvlarini tizimli ma'muriyatlash moduli: yangi xodimlarni qo'shish, rollarni taqsimlash (registrator, tergovchi, boshliq, ekspert), bo'linmalarga biriktirish, faollik holatini boshqarish va kirishni sozlash.", body_style)
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
    # PAGE 2: REYESTRLAR + ISHCHI SAHIFALAR VA PORTALLAR
    # =========================================================
    story.append(Paragraph("3. XIZMAT REYESTRLARI SPETSIFIKATSIYASI (MENYU: REYESTRLAR)", sec_title))
    reyestrlar_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Reyestr nomi (Interfeys)</b>", body_bold), Paragraph("<b>Vazifasi, boshqaruv elementlari va qo'llanish ssenariysi</b>", body_bold)],
        [
            Paragraph("8", body_style),
            Paragraph("<b>So'rovnoma</b><br/>(So'rovnoma)", body_style),
            Paragraph("Tashqi tashkilotlarga yuborilgan so'rovnomalarning elektron reyestri: tijorat banklariga (hisob ko'chirmalari), to'lov tizimlariga (Click, Payme, Uzum), mobil operatorlarga (qo'ng'iroqlar, IMEI, baza stansiyalari) va provayderlarga so'rovlar yuborish va hisobini yuritish.", body_style)
        ],
        [
            Paragraph("9", body_style),
            Paragraph("<b>Ekspertiza</b><br/>(Ekspertiza)", body_style),
            Paragraph("Sud-kriminalistika va kompyuter-texnikaviy ekspertizalar reyestri: elektron tashuvchilar, smartfonlar va dasturiy ta'minotlarni tekshirish to'g'risida qarorlar chiqarish, ashyoviy dalillar harakatini qayd etish, ekspert xulosalarini kiritish.", body_style)
        ],
        [
            Paragraph("10", body_style),
            Paragraph("<b>Ta'qiq</b><br/>(Ta'qiq)", body_style),
            Paragraph("Ta'minlash choralari reyestri: fuqarolardan o'g'irlangan mablag'larni yechib olinishini to'xtatish maqsadida gumonlanuvchilarning bank kartalari, dropperlar hisoblari, elektron hamyonlari va telefon raqamlariga ta'qiq/blokirovka qo'yish.", body_style)
        ],
        [
            Paragraph("11", body_style),
            Paragraph("<b>Chat</b><br/>(Chat)", body_style),
            Paragraph("Tezkor xizmat yozishmalari messendjeri: tergovchilar, navbatchilik qismi va rahbariyat o'rtasida WebSocket orqali real vaqt rejimida himoyalangan aloqa kanali, tezkor ma'lumotlar va fayllar almashish.", body_style)
        ],
        [
            Paragraph("12", body_style),
            Paragraph("<b>SMS shablonlar</b><br/>(SMS shablonlar)", body_style),
            Paragraph("Avtomatik SMS-xabarnomalarni boshqarish moduli: xabar shablonlarini sozlash (UIN bilan ro'yxatga olinganligi haqida, tergovchiga chaqiruv, qabul qilingan protsessual qaror haqida), SMS yetkazilganlik holatini nazorat qilish.", body_style)
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

    # 4. Ishchi sahifalar va portallar
    story.append(Paragraph("4. ISHCHI SAHIFALAR VA TASHQI PORTALLAR SPETSIFIKATSIYASI", sec_title))
    portals_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Ekran / Portal nomi</b>", body_bold), Paragraph("<b>Interfeys, boshqaruv elementlari va qo'llanish ssenariysi</b>", body_bold)],
        [
            Paragraph("13", body_style),
            Paragraph("<b>Navbatchilik qismi / Ro'yxatga olish</b><br/>(RegistratorView.jsx)", body_style),
            Paragraph("Kelib tushgan arizalarni qabul qilish formasi: arizachini ro'yxatga olish, o'g'irlik usulini belgilash, qonuniy muddatlarni avtomatik hisoblash, mas'ul tergovchiga biriktirish, elektron talon berish.", body_style)
        ],
        [
            Paragraph("14", body_style),
            Paragraph("<b>Tergovchi ish stoli</b><br/>(InvestigatorView.jsx)", body_style),
            Paragraph("Tergovchining shaxsiy ish maydoni: ish yurituvidagi materiallar ro'yxati, qolgan kunlarning svetofor indikatori, muddatlarni uzaytirish, so'roq bayonnomalarini biriktirish, qarorlar chiqarish.", body_style)
        ],
        [
            Paragraph("15", body_style),
            Paragraph("<b>Materialning elektron tomi</b><br/>(CaseDetailsModal.jsx)", body_style),
            Paragraph("Materialning to'liq elektron kartasi: ishning xronologik harakat tasmasi (Timeline), olingan ashyoviy dalillar, dropperlar hisoblari, fayllar daraxti (hujjatlar, audio, video), qarorlar generatori.", body_style)
        ],
        [
            Paragraph("16", body_style),
            Paragraph("<b>Fuqaro onlayn portali</b><br/>(CitizenView.jsx)", body_style),
            Paragraph("Fuqarolar uchun veb-interfeys: internet orqali arizani bosqichma-bosqich yuborish, to'lov cheklari va yozishmalar skrinshotlarini yuklash, shaxsiy Yagona Identifikatsiya Raqamini (UIN) olish.", body_style)
        ],
        [
            Paragraph("17", body_style),
            Paragraph("<b>Interaktiv AI-kiosk va avatar</b><br/>(AiKioskView / AvatarDemo)", body_style),
            Paragraph("Bo'linma binosida o'rnatiladigan o'z-o'ziga xizmat ko'rsatish kioski: o'zbek/rus tillarida video-yordamchi bilan ovozli muloqot, ariza berish tartibini tushuntirish, ovoz orqali murojaatni qabul qilish.", body_style)
        ],
        [
            Paragraph("18", body_style),
            Paragraph("<b>QR-kod orqali holatni tekshirish</b><br/>(MaterialStatusPage.jsx)", body_style),
            Paragraph("Protsessual holatni tekshirish ommaviy sahifasi: rasmiy qarordagi QR-kod orqali ochiladi, tergov siri va shaxsiy ma'lumotlarni oshkor qilmagan holda hujjatning haqiqiyligini tasdiqlaydi.", body_style)
        ],
        [
            Paragraph("19", body_style),
            Paragraph("<b>Hujjatlarni ko'rish va chop etish</b><br/>(DocumentPreviewModal.jsx)", body_style),
            Paragraph("Protsessual PDF-qarorlar, bayonnomalar va dalillarni xodimning kompyuteriga yuklab olmasdan to'g'ridan-to'g'ri brauzerda xavfsiz ko'rish, masshtablash va chop etish moduli.", body_style)
        ],
        [
            Paragraph("20", body_style),
            Paragraph("<b>Muddatlar va xabarnomalar markazi</b><br/>(DeadlineNotifications.jsx)", body_style),
            Paragraph("Tezkor xabarlar markazi: tekshiruv muddatlari tugayotgan (72, 48 va 24 soatdan kam qolgan) materiallar ro'yxati va fuqarolarning shikoyatlari bo'yicha tezkor ogohlantirishlar.", body_style)
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
    # PAGE 3: INTELLEKTUAL FUNKSIYALAR + XAVFSIZLIK + KO'RSATKICHLAR
    # =========================================================
    story.append(Paragraph("5. ASOSIY INTELLEKTUAL FUNKSIYALAR VA QISM-TIZIMLAR", sec_title))
    funcs_data = [
        [Paragraph("<b>№</b>", body_bold), Paragraph("<b>Funksional qism-tizim</b>", body_bold), Paragraph("<b>Texnik mantiq va bajaradigan imkoniyatlari</b>", body_bold)],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Protsessual muddatlar nazorati<br/>(JPK bo'yicha 3, 10, 30 kun)</b>", body_style),
            Paragraph("Ro'yxatga olingan paytdan boshlab avtomatik taymer (JPK 329-modda): boshlang'ich muddat — 3 kun; tergov bo'linmasi boshlig'i tomonidan — 10 kungacha; prokuror tomonidan — 30 kungacha uzaytirish. Vizual rangli indikatsiya va shoshilinch ogohlantirishlar.", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Yuridik tahlil sun'iy intellekti<br/>(DeepSeek Legal AI Engine)</b>", body_style),
            Paragraph("Arizalar matnini tahlil qiluvchi neyrotizim: zarar summasini, hisob raqamlarni, aloqa ma'lumotlarini ajratib olish; jinoyat tarkibini (JK 168-modda «Firibgarlik», 169-modda «O'g'rilik», 278-moddalar «Kiberjinoyatlar») avtomatik aniqlash va fabula loyihasini tuzish.", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Ovozli yordamchi va transkripsiya<br/>(UzbekVoice STT / TTS)</b>", body_style),
            Paragraph("O'zbek va rus tillaridagi nutqni real vaqt rejimida >95% aniqlikda matnga aylantirish (Speech-to-Text); shovqinlarni filtrlash; o'z-o'ziga xizmat ko'rsatish zonasida fuqarolar uchun tabiiy ovozda javob berish (Text-to-Speech).", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Biometrik verifikatsiya<br/>(Face ID & Liveness Detection)</b>", body_style),
            Paragraph("Ariza beruvchining yuzini kamera orqali rasmga olish; tiriklikni tekshirish algoritmi (ekrandan yoki qog'ozdan rasm ko'rsatishni cheklash); soxta arizalarning oldini olish uchun raqamli biometrik izni materialga biriktirish.", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Bank ko'chirmalari tahlili<br/>(Financial Link Analysis)</b>", body_style),
            Paragraph("Tijorat banklari va to'lov tizimlarining (Click, Payme, Uzum) PDF/Excel ko'chirmalarini avtomatlashtirilgan qayta ishlash; barcha bo'linmalar bazasi bo'yicha pul qabul qilgan kartalarni qidirish, ketma-ket dropperlar zanjirini fosh etish.", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>QR-kodli protsessual qarorlar<br/>generatori</b>", body_style),
            Paragraph("Kriptografik himoyalangan dinamik QR-kodga ega protsessual qarorlarni (qo'zg'atish, rad etish, ekspertiza tayinlash) PDF formatida generatsiya qilish. QR-kod skanerlanganda davlat tekshiruv sahifasi ochiladi.", body_style)
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

    # 6. Axborot xavfsizligi
    story.append(Paragraph("6. AXBOROT XAVFSIZLIGI VA MA'LUMOTLARNI HIMOYA QILISH TALABLARI", sec_title))
    sec_data = [
        [Paragraph("<b>Xavfsizlik parametri</b>", body_bold), Paragraph("<b>Dasturiy ta'minotdagi texnik yechimi</b>", body_bold), Paragraph("<b>Kafolatlangan himoya natijasi</b>", body_bold)],
        [
            Paragraph("<b>Ruxsatlarni chegaralash (RBAC)</b>", body_style),
            Paragraph("MB ob'ektlari darajasida rolli kirish nazorati (Django Permissions + PostgreSQL RLS).", body_style),
            Paragraph("Begona shaxslarning tergov siri va boshqa hudud materiallariga kirishi butunlay cheklanadi.", body_style)
        ],
        [
            Paragraph("<b>Audit va nazorat jurnali</b>", body_style),
            Paragraph("`AuditLog` jadvaliga asinxron qayd etish: foydalanuvchi, IP, vaqt tamg'asi, amal turi, JSON-diff.", body_style),
            Paragraph("Mansabdor shaxslar tomonidan materiallarni yashirin o'chirish yoki o'zgartirish imkonsizligi.", body_style)
        ],
        [
            Paragraph("<b>Veb-trafikni himoyalash</b>", body_style),
            Paragraph("TLS 1.3 protokoli orqali shifrlash, CSRF-hujumlaridan himoya, XSS filtrlash, API-tokenlar izolyatsiyasi.", body_style),
            Paragraph("Xizmat trafigini tutib olish, tashqi in'yeksiyalar va soxta so'rovlardan to'liq himoya.", body_style)
        ],
        [
            Paragraph("<b>Ma'lumotlar yaxlitligi va zaxira</b>", body_style),
            Paragraph("PostgreSQL ACID tranzaksion yaxlitligi, MB va mediafayllarning har kunlik avtomatik zaxira nusxalari.", body_style),
            Paragraph("Favqulodda holatlarda protsessual ma'lumotlarni yo'qotmasdan tizimni kafolatli qayta tiklash.", body_style)
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

    # 7. Unumdorlik ko'rsatkichlari
    story.append(Paragraph("7. DASTURIY MAJMUANING UNUMDORLIGI VA ISHONCHLILIK KO'RSATKICHLARI", sec_title))
    rel_data = [
        [Paragraph("<b>Ko'rsatkich nomi</b>", body_bold), Paragraph("<b>Belgilangan me'yor</b>", body_bold), Paragraph("<b>Dasturiy ta'minot mexanizmi</b>", body_bold)],
        [
            Paragraph("<b>Tizimning uzluksiz ishlashi</b>", body_style),
            Paragraph("24/7/365 rejimida kamida 99.9% (Uptime)", body_style),
            Paragraph("Systemd jarayonlar boshqaruvchisi, asinxron ishchilar, nosozlikdan so'ng avtomatik tiklanish.", body_style)
        ],
        [
            Paragraph("<b>Bir vaqtdagi yuklama</b>", body_style),
            Paragraph("1 000 tagacha faol foydalanuvchi sessiyasi", body_style),
            Paragraph("Daphne ASGI bloklanmaydigan serveri, PgBouncer MB ulanishlari puli, Redis kesh tizimi.", body_style)
        ],
        [
            Paragraph("<b>Interfeysning javob tezligi</b>", body_style),
            Paragraph("Asosiy amallar uchun 0.5 soniyadan oshmaydi", body_style),
            Paragraph("React SPA mijoz renderi, Gzip siqish, PostgreSQL optimallashtirilgan indekslari.", body_style)
        ],
        [
            Paragraph("<b>Tizimni qayta tiklash reglamenti</b>", body_style),
            Paragraph("RPO 24 soatdan kam, RTO 2 soatdan kam", body_style),
            Paragraph("pg_restore zaxiradan tiklash va mediafayllar arxivini yuklashning avtomatlashtirilgan skriptlari.", body_style)
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

    doc.build(story, canvasmaker=NumberedCanvasUzb)
    print("Uzbek full TZ PDF generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_uzb_tz_pdf()
