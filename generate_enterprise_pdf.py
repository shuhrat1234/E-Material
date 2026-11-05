import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_enterprise_cost_pdf(output_path):
    # 1-page compact executive layout
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.0 * cm,
        bottomMargin=0.8 * cm
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor('#0F2942')  # Gov Navy
    accent_blue = colors.HexColor('#1D4ED8')
    emerald_color = colors.HexColor('#047857')
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
    elements.append(Paragraph('"E-MATERIAL" YUKLANISHI YUQORI (ENTERPRISE) TIZIMI', title_style))
    elements.append(Paragraph(
        "KATTA SERVER VA SUN'IY INTELLEKT (AI) SMETASI &bull; "
        "<i>Yiliga 40 000+ ta material, 500–600 nafar xodim va katta hajmdagi arxivlar uchun</i>",
        subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1.2, color=accent_blue, spaceAfter=6))

    # Section 1: Yuklama va Arxiv hisob-kitobi
    elements.append(Paragraph("1. Yillik 40 000 Material Oqimi Uchun Texnik Talablar", h2_style))
    spec_data = [
        [
            Paragraph("<b>vCPU:</b> 16 – 24 yadro<br/><font color='#64748B'>Parallel so'rovlar, QR/PDF generatsiya</font>", table_cell_style),
            Paragraph("<b>RAM:</b> 32 – 64 GB<br/><font color='#64748B'>PostgreSQL buferi va Redis keshlash</font>", table_cell_style),
            Paragraph("<b>Disk:</b> 500 GB NVMe + 1 TB Arxiv<br/><font color='#64748B'>Yillik ~500 GB hujjat va skanlar uchun</font>", table_cell_style),
            Paragraph("<b>Tarmoq:</b> 100 – 200 Mbps TAS-IX<br/><font color='#64748B'>Ichki bepul tezkor magistral</font>", table_cell_style)
        ]
    ]
    t_spec = Table(spec_data, colWidths=[135, 135, 135, 135])
    t_spec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_spec)

    # Section 2: Katta Server Paketlari (UzCloud & Servercore)
    elements.append(Paragraph("2. Katta Server Konfiguratsiyalari (40 000 material / yil uchun)", h2_style))
    prov_data = [
        [
            Paragraph("Provayder / Paket", table_header_style),
            Paragraph("Konfiguratsiya (vCPU / RAM / Disk)", table_header_style),
            Paragraph("Oylik (UZS)", table_header_style),
            Paragraph("Oylik (USD)", table_header_style),
            Paragraph("Afzalliklari va Arxiv Imkoniyati", table_header_style)
        ],
        [
            Paragraph("<b>UZTELECOM (UzCloud)<br/>Enterprise Pro</b><br/><font color='#047857'><b>Tavsiya etiladi</b></font>", table_cell_style),
            Paragraph("<b>16 vCPU / 32 GB RAM</b><br/>500 GB NVMe SSD + Oq IP", table_cell_style),
            Paragraph("<b>3 440 000</b>", table_cell_center),
            Paragraph("~$268", table_cell_center),
            Paragraph("Davlat Tier-III data-markazi, 40 000 ta material va hujjatlar bazasi uchun to'liq mos", table_cell_style)
        ],
        [
            Paragraph("<b>UZTELECOM (UzCloud)<br/>Enterprise Max (Gibrid)</b>", table_cell_style),
            Paragraph("<b>16 vCPU / 64 GB RAM</b><br/>300 GB NVMe + 1 TB HDD Arxiv", table_cell_style),
            Paragraph("<b>4 200 000</b>", table_cell_center),
            Paragraph("~$328", table_cell_center),
            Paragraph("Katta hajmdagi ko'p yillik qarorlar, ekspertiza skanlari va avtomatik zaxira (Backup)", table_cell_style)
        ],
        [
            Paragraph("<b>Servercore (Toshkent)<br/>High-Load Server</b>", table_cell_style),
            Paragraph("<b>16 vCPU / 32 GB RAM</b><br/>500 GB NVMe High IOPS", table_cell_style),
            Paragraph("<b>3 150 000</b>", table_cell_center),
            Paragraph("~$246", table_cell_center),
            Paragraph("Ultra-tezkor NVMe disklar, PostgreSQL yuqori unumdorligi va past kechikish", table_cell_style)
        ],
        [
            Paragraph("<b>Servercore (Toshkent)<br/>Maximum Storage</b>", table_cell_style),
            Paragraph("<b>24 vCPU / 64 GB RAM</b><br/>1 TB NVMe SSD", table_cell_style),
            Paragraph("<b>5 600 000</b>", table_cell_center),
            Paragraph("~$437", table_cell_center),
            Paragraph("Maksimal quvvat: butun shahar/viloyat bo'yicha markazlashtirilgan katta yuklama", table_cell_style)
        ]
    ]

    t_prov = Table(prov_data, colWidths=[110, 135, 85, 65, 145])
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

    # Section 3: DeepSeek AI va Ovoz (40 000 material yuklamasida)
    elements.append(Paragraph("3. Sun'iy Intellekt (DeepSeek AI) va Ovozli Xizmatlar (40 000 material/yil)", h2_style))
    ai_data = [
        [
            Paragraph("Xizmat turi", table_header_style),
            Paragraph("Hisoblash mezoni", table_header_style),
            Paragraph("Kutilayotgan yuklama (40 000 material)", table_header_style),
            Paragraph("Oylik xarajat", table_header_style)
        ],
        [
            Paragraph("<b>DeepSeek AI API</b><br/>(Avtomat tahlil, klassifikatsiya, muddat nazorati)", table_cell_style),
            Paragraph("$0.14 - $0.27 / 1M kirish<br/>$1.10 / 1M chiqish token", table_cell_style),
            Paragraph("Har bir material bo'yicha 2-3 marta tahlil<br/>(Oyiga ~10 000 ta keng qamrovli AI so'rov)", table_cell_style),
            Paragraph("<b>~$35 / oy</b><br/>(~450 000 so'm)", table_cell_center)
        ],
        [
            Paragraph("<b>UzbekVoice.ai API</b><br/>(TTS ovoz sintezi & STT mikrofon)", table_cell_style),
            Paragraph("O'zbekcha nutq sintezi va audio arizalarni tanish", table_cell_style),
            Paragraph("Ovozli arizalar, tergovchi dialogi va audio xabarlar (Oyiga ~3 000 daqiqa)", table_cell_style),
            Paragraph("<b>~$25 / oy</b><br/>(~320 000 so'm)", table_cell_center)
        ]
    ]

    t_ai = Table(ai_data, colWidths=[120, 130, 180, 110])
    t_ai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_ai)

    # Section 4: Yakuniy Byudjet (Enterprise)
    elements.append(Paragraph("4. Yakuniy Oylik va Yillik Byudjet (Yiliga 40 000 material uchun Tavsiya)", h2_style))
    summary_data = [
        [
            Paragraph("Xarajat bandi", table_header_style),
            Paragraph("Tafsilot (Enterprise Daraja)", table_header_style),
            Paragraph("Oylik (UZS)", table_header_style),
            Paragraph("Yillik (UZS)", table_header_style)
        ],
        [
            Paragraph("<b>Katta Bulutli Server</b>", table_cell_style),
            Paragraph("UZTELECOM (UzCloud) - 16 vCPU / 32GB RAM / 500GB NVMe", table_cell_style),
            Paragraph("3 440 000 so'm", table_cell_center),
            Paragraph("41 280 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>DeepSeek AI API</b>", table_cell_style),
            Paragraph("40 000 ta material avto-tahlili, xulosalar va hisobotlar", table_cell_style),
            Paragraph("~450 000 so'm ($35)", table_cell_center),
            Paragraph("~5 400 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>UzbekVoice API (Ovoz)</b>", table_cell_style),
            Paragraph("O'zbekcha ovozli kiritish (STT) va tergovchi ovozi (TTS)", table_cell_style),
            Paragraph("~320 000 so'm ($25)", table_cell_center),
            Paragraph("~3 840 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>Zaxira va Xavfsizlik</b>", table_cell_style),
            Paragraph("Kunlik avtomatik zaxira nusxa (Backup), SSL va .UZ domen", table_cell_style),
            Paragraph("200 000 so'm", table_cell_center),
            Paragraph("2 400 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>JAMI ENTERPRISE:</b>", table_cell_bold),
            Paragraph("<b>40 000 material va 600 foydalanuvchiga to'liq kafolatlangan</b>", table_cell_bold),
            Paragraph("<b>~4 410 000 so'm</b><br/><font color='#047857'><b>(~$345 / oy)</b></font>", table_cell_center),
            Paragraph("<b>~52 920 000 so'm</b><br/><font color='#047857'><b>(~$4 100 / yil)</b></font>", table_cell_center)
        ]
    ]

    t_sum = Table(summary_data, colWidths=[115, 195, 115, 115])
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
        "<i>* Hisob-kitob asoslari: 40 000 ta material yiliga o'rtacha ~400-500 GB Word, PDF qarorlar va ekspertiza skanlarini hosil qiladi. "
        "Server parametrlarida 16 vCPU va 32 GB RAM bir vaqtning o'zida yuzlab tergovchilar yuklamasini qotmasdan ko'tarishga mo'ljallangan.</i>",
        ParagraphStyle('NoteStyle', parent=styles['Normal'], fontSize=7, leading=9, textColor=muted_gray)
    ))

    doc.build(elements)
    print("Enterprise 1-page PDF generated successfully at:", output_path)

if __name__ == '__main__':
    target = '/Users/macbook/Desktop/E-Material/E-Material_Katta_Server_40000_Material_Smetasi.pdf'
    generate_enterprise_cost_pdf(target)
