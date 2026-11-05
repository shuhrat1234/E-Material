import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_tashkent_cyber_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.0 * cm,
        bottomMargin=0.8 * cm
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor('#0B192C')  # Cyber Dark Navy
    accent_blue = colors.HexColor('#1E3E62')
    cyan_accent = colors.HexColor('#008DDA')
    emerald_color = colors.HexColor('#007F73')
    dark_gray = colors.HexColor('#1E293B')
    muted_gray = colors.HexColor('#64748B')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceAfter=2,
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=muted_gray,
        spaceAfter=8,
        alignment=1
    )

    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=primary_color,
        spaceBefore=6,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_gray
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=table_cell_style,
        alignment=1
    )

    elements = []

    # Title & Subtitle
    elements.append(Paragraph('TOSHKENT SHAHAR IIBB KIBERXAVFSIZLIK BO\'LINMALARI', title_style))
    elements.append(Paragraph(
        "\"E-MATERIAL (KIBER)\" TIZIMI UCHUN MAKSIMAL SERVER VA AI SMETASI &bull; "
        "<i>Toshkent shahrining barcha 12 ta tumani, 80 000+ kiber-materiallar va bank zaproslari uchun</i>",
        subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=cyan_accent, spaceAfter=6))

    # Section 1: Kiberjinoyatchilik yuklamasi
    elements.append(Paragraph("1. Butun Toshkent Shahri Kiberjinoyatchilik Tizimi Yuklamasi", h2_style))
    spec_data = [
        [
            Paragraph("<b>vCPU:</b> 32 yadro (3.0+ GHz)<br/><font color='#64748B'>Bank/IP zaproslar, parallel tahlil</font>", table_cell_style),
            Paragraph("<b>RAM:</b> 64 – 128 GB ECC<br/><font color='#64748B'>Tranzaksiyalar va PostgreSQL buferi</font>", table_cell_style),
            Paragraph("<b>Disk:</b> 1 TB NVMe + 2 TB Arxiv<br/><font color='#64748B'>Bank ko'chirmalari, skanlar, dalillar</font>", table_cell_style),
            Paragraph("<b>Tarmoq:</b> 500 Mbps – 1 Gbps<br/><font color='#64748B'>IIV va banklar bilan tezkor integratsiya</font>", table_cell_style)
        ]
    ]
    t_spec = Table(spec_data, colWidths=[135, 135, 135, 135])
    t_spec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0F7FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93C5FD')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DBEAFE')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_spec)

    # Section 2: Server Konfiguratsiyalari
    elements.append(Paragraph("2. Toshkent Shahri Uchun Server Tanlovlari (UZTELECOM va Servercore)", h2_style))
    prov_data = [
        [
            Paragraph("Konfiguratsiya turi", table_header_style),
            Paragraph("Texnik parametrlar (CPU / RAM / Disk)", table_header_style),
            Paragraph("Oylik (UZS)", table_header_style),
            Paragraph("Oylik (USD)", table_header_style),
            Paragraph("Toshkent Kiber Tizimidagi Imkoniyati", table_header_style)
        ],
        [
            Paragraph("<b>UZTELECOM (UzCloud)<br/>Toshkent City Cyber</b><br/><font color='#007F73'><b>Tavsiya etiladi</b></font>", table_cell_style),
            Paragraph("<b>32 vCPU / 64 GB RAM</b><br/>1 TB NVMe SSD + 2 TB Arxiv HDD", table_cell_style),
            Paragraph("<b>7 800 000</b>", table_cell_center),
            Paragraph("~$610", table_cell_center),
            Paragraph("12 ta tuman IIB va IIBB boshqarmasi (800+ kiber-inspektor, yiliga 80 000+ material)", table_cell_style)
        ],
        [
            Paragraph("<b>Servercore Toshkent<br/>Ultra-High Performance</b>", table_cell_style),
            Paragraph("<b>32 vCPU / 128 GB RAM</b><br/>1.5 TB Ultra NVMe (High IOPS)", table_cell_style),
            Paragraph("<b>8 900 000</b>", table_cell_center),
            Paragraph("~$695", table_cell_center),
            Paragraph("Katta hajmdagi bank plastik karta tranzaksiyalarini soniyada saralash va qidirish", table_cell_style)
        ],
        [
            Paragraph("<b>Dedicated Bare-Metal<br/>(Jismoniy Temir Server)</b>", table_cell_style),
            Paragraph("<b>Dual Xeon Gold (64 Cores)<br/>256 GB RAM / 4 TB NVMe RAID-10</b>", table_cell_style),
            Paragraph("<b>18 500 000</b>", table_cell_center),
            Paragraph("~$1 445", table_cell_center),
            Paragraph("Maksimal Respublika darajasi: IIV Kiberxavfsizlik markazining butun tizimi uchun", table_cell_style)
        ]
    ]

    t_prov = Table(prov_data, colWidths=[120, 140, 85, 60, 135])
    t_prov.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (2,1), (3,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_prov)

    # Section 3: Kiberjinoyatda AI Imkoniyatlari
    elements.append(Paragraph("3. DeepSeek AI Kiber-Tahlil va Ovozli Xizmatlar", h2_style))
    ai_data = [
        [
            Paragraph("Xizmat turi", table_header_style),
            Paragraph("Kiber-vazifasi", table_header_style),
            Paragraph("Kutilayotgan oylik hajm", table_header_style),
            Paragraph("Oylik xarajat", table_header_style)
        ],
        [
            Paragraph("<b>DeepSeek AI Kiber-Tahlil</b><br/>(168-modda, fishing, karta)", table_cell_style),
            Paragraph("Karta raqamlari, IP loglar, firibgarlik sxemalarini solishtirish va bank zaproslarini shakllantirish", table_cell_style),
            Paragraph("Toshkent bo'yicha oyiga ~25 000 ta kiber-analitik operatsiyalar", table_cell_style),
            Paragraph("<b>~$75 / oy</b><br/>(~960 000 so'm)", table_cell_center)
        ],
        [
            Paragraph("<b>UzbekVoice AI</b><br/>(Avatar va Fuqaro qo'ng'iroqlari)", table_cell_style),
            Paragraph("Kiberfiribgarlik jabrlanuvchilaridan audio ariza olish va tezkor 102/kiber yordam berish", table_cell_style),
            Paragraph("Oyiga ~5 000 daqiqa ovozli muloqot va STT transkripsiya", table_cell_style),
            Paragraph("<b>~$40 / oy</b><br/>(~510 000 so'm)", table_cell_center)
        ]
    ]

    t_ai = Table(ai_data, colWidths=[120, 160, 150, 110])
    t_ai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_blue),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_ai)

    # Section 4: Yakuniy Byudjet
    elements.append(Paragraph("4. Toshkent Shahar IIBB Kiber Tizimi Yakuniy Byudjeti (Tavsiya)", h2_style))
    summary_data = [
        [
            Paragraph("Xarajat bandi", table_header_style),
            Paragraph("Tafsilot (Toshkent Kiber Markazi)", table_header_style),
            Paragraph("Oylik (UZS)", table_header_style),
            Paragraph("Yillik (UZS)", table_header_style)
        ],
        [
            Paragraph("<b>Toshkent City Kiber Server</b>", table_cell_style),
            Paragraph("UZTELECOM UzCloud: 32 vCPU / 64GB RAM / 1TB NVMe + 2TB Arxiv", table_cell_style),
            Paragraph("7 800 000 so'm", table_cell_center),
            Paragraph("93 600 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>DeepSeek Kiber-AI Tahlil</b>", table_cell_style),
            Paragraph("Firibgarlik sxemalari, karta tranzaksiyalari va qonuniy xulosalar", table_cell_style),
            Paragraph("~960 000 so'm ($75)", table_cell_center),
            Paragraph("~11 520 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>UzbekVoice Ovozli Tizim</b>", table_cell_style),
            Paragraph("Kiber-yordamchi ovozi (TTS) va arizalarni mikrofondan yozish (STT)", table_cell_style),
            Paragraph("~510 000 so'm ($40)", table_cell_center),
            Paragraph("~6 120 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>Kiberxavfsizlik va Zaxira</b>", table_cell_style),
            Paragraph("WAF himoyasi, avtomatik 24/7 zaxira nusxalash (Backup), SSL", table_cell_style),
            Paragraph("500 000 so'm", table_cell_center),
            Paragraph("6 000 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>JAMI TOSHKENT KIBER:</b>", table_cell_bold),
            Paragraph("<b>12 ta tuman va shahar boshqarmasi to'liq qamrovi</b>", table_cell_bold),
            Paragraph("<b>~9 770 000 so'm</b><br/><font color='#007F73'><b>(~$765 / oy)</b></font>", table_cell_center),
            Paragraph("<b>~117 240 000 so'm</b><br/><font color='#007F73'><b>(~$9 150 / yil)</b></font>", table_cell_center)
        ]
    ]

    t_sum = Table(summary_data, colWidths=[120, 190, 115, 115])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#ECFDF5')),
        ('BOX', (0,-1), (-1,-1), 1.2, emerald_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_sum)

    # Footer note
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(
        "<i>* Izoh: Ushbu smeta Toshkent shahrining barcha 12 ta tumani (Olmazor, Yunusobod, Mirzo Ulug'bek, Chilonzor, Uchtepa, Shayxontohur, Yakkasaroy, "
        "Mirobod, Sergeli, Yangihayot, Bektemir, Yashnobod) kiberjinoyatchilik bo'linmalarini yagona markazlashgan axborot tizimiga birlashtirishga hisoblangan.</i>",
        ParagraphStyle('NoteStyle', parent=styles['Normal'], fontSize=7, leading=9, textColor=muted_gray)
    ))

    doc.build(elements)
    print("Tashkent Cyber PDF generated successfully at:", output_path)

if __name__ == '__main__':
    target = '/Users/macbook/Desktop/E-Material/E-Material_Toshkent_Kiber_Server_Smetasi.pdf'
    generate_tashkent_cyber_pdf(target)
