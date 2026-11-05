import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_cost_pdf(output_path):
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

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=dark_gray
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
    elements.append(Paragraph('"E-MATERIAL" AXBOROT TIZIMI', title_style))
    elements.append(Paragraph(
        "SERVER VA SUN'IY INTELLEKT (AI) XARAJATLARI SMETASI &bull; "
        "<i>500–600 nafar faol foydalanuvchi va katta hajmdagi hujjatlar uchun</i>",
        subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1.2, color=accent_blue, spaceAfter=6))

    # Section 1
    elements.append(Paragraph("1. Talab etiladigan Server Parametrlari (500–600 foydalanuvchi yuklamasi)", h2_style))
    spec_data = [
        [
            Paragraph("<b>vCPU:</b> 8 – 12 yadro<br/><font color='#64748B'>Parallel so'rovlar va hisobotlar</font>", table_cell_style),
            Paragraph("<b>RAM:</b> 16 – 32 GB<br/><font color='#64748B'>PostgreSQL va Redis keshlash</font>", table_cell_style),
            Paragraph("<b>Disk:</b> 150 – 250 GB NVMe<br/><font color='#64748B'>Tezkor hujjatlar va fayllar bazasi</font>", table_cell_style),
            Paragraph("<b>Tarmoq:</b> 100 Mbps TAS-IX<br/><font color='#64748B'>Ichki bepul tezkor magistral</font>", table_cell_style)
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

    # Section 2
    elements.append(Paragraph("2. O'zbekiston Mahalliy Provayderlari Taqqosiy Jadvali (Oylik)", h2_style))
    prov_data = [
        [
            Paragraph("Provayder", table_header_style),
            Paragraph("Konfiguratsiya", table_header_style),
            Paragraph("Oylik (UZS)", table_header_style),
            Paragraph("Oylik (USD)", table_header_style),
            Paragraph("Xususiyatlari va Afzalliklari", table_header_style)
        ],
        [
            Paragraph("<b>UZTELECOM<br/>(UzCloud)</b><br/><font color='#047857'><b>Tavsiya etiladi</b></font>", table_cell_style),
            Paragraph("8 vCPU / 16 GB RAM / 100 GB NVMe + IPv4", table_cell_style),
            Paragraph("<b>1 250 000</b>", table_cell_center),
            Paragraph("~$98", table_cell_center),
            Paragraph("Davlat ma'lumotlar markazi (Tier-III), qonuniy to'liq moslik, bepul TAS-IX", table_cell_style)
        ],
        [
            Paragraph("<b>UZTELECOM<br/>(UzCloud Maksimal)</b>", table_cell_style),
            Paragraph("12 vCPU / 32 GB RAM / 250 GB NVMe + IPv4", table_cell_style),
            Paragraph("<b>2 200 000</b>", table_cell_center),
            Paragraph("~$172", table_cell_center),
            Paragraph("Katta yuklamalar, 10 000+ hujjatlar va video/audio chatlar uchun zaxirali", table_cell_style)
        ],
        [
            Paragraph("<b>Servercore<br/>(Toshkent DC)</b>", table_cell_style),
            Paragraph("8 vCPU / 16 GB RAM / 100 GB NVMe", table_cell_style),
            Paragraph("<b>1 150 000</b>", table_cell_center),
            Paragraph("~$90", table_cell_center),
            Paragraph("Toshkentdagi yuqori tezlikdagi zamonaviy bulutli infratuzilma", table_cell_style)
        ],
        [
            Paragraph("<b>Cloud.uz / ActiveCloud</b>", table_cell_style),
            Paragraph("8 vCPU / 16 GB RAM / 120 GB SSD", table_cell_style),
            Paragraph("<b>1 400 000</b>", table_cell_center),
            Paragraph("~$110", table_cell_center),
            Paragraph("Korporativ mijozlar uchun TAS-IX ma'lumotlar markazi", table_cell_style)
        ]
    ]

    t_prov = Table(prov_data, colWidths=[105, 135, 90, 65, 145])
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

    # Section 3
    elements.append(Paragraph("3. Sun'iy Intellekt (DeepSeek AI) va Ovozli Xizmatlar (UzbekVoice)", h2_style))
    ai_data = [
        [
            Paragraph("Xizmat turi", table_header_style),
            Paragraph("Hisoblash mezoni", table_header_style),
            Paragraph("Kutilayotgan yuklama", table_header_style),
            Paragraph("Oylik xarajat", table_header_style)
        ],
        [
            Paragraph("<b>DeepSeek AI API</b><br/>(Tahlil va hisobot)", table_cell_style),
            Paragraph("$0.14 - $0.27 / 1M kirish<br/>$1.10 / 1M chiqish token", table_cell_style),
            Paragraph("Kuniga ~1 500 ta so'rov (Oyiga ~40 000 ta AI tahlil)", table_cell_style),
            Paragraph("<b>~$15 / oy</b><br/>(~190 000 so'm)", table_cell_center)
        ],
        [
            Paragraph("<b>UzbekVoice.ai API</b><br/>(TTS & STT)", table_cell_style),
            Paragraph("Nutq sintezi va audio matnga o'girish", table_cell_style),
            Paragraph("Mikrofondan arizalar va tergovchi ovozi", table_cell_style),
            Paragraph("<b>~$12 / oy</b><br/>(~150 000 so'm)", table_cell_center)
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

    # Section 4
    elements.append(Paragraph("4. Yakuniy Oylik va Yillik Byudjet (Tavsiya etilgan to'liq paket)", h2_style))
    summary_data = [
        [
            Paragraph("Xarajat bandi", table_header_style),
            Paragraph("Tafsilot", table_header_style),
            Paragraph("Oylik (UZS)", table_header_style),
            Paragraph("Yillik (UZS)", table_header_style)
        ],
        [
            Paragraph("<b>Asosiy Bulutli Server</b>", table_cell_style),
            Paragraph("UZTELECOM (UzCloud) - 8 vCPU / 16GB RAM / 100GB NVMe", table_cell_style),
            Paragraph("1 250 000 so'm", table_cell_center),
            Paragraph("15 000 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>DeepSeek AI API</b>", table_cell_style),
            Paragraph("Tahliliy hisobotlar va materiallar klassifikatsiyasi", table_cell_style),
            Paragraph("~200 000 so'm ($15)", table_cell_center),
            Paragraph("~2 400 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>UzbekVoice API (Ovoz)</b>", table_cell_style),
            Paragraph("O'zbekcha nutq sintezi (TTS) va tanish (STT)", table_cell_style),
            Paragraph("~150 000 so'm ($12)", table_cell_center),
            Paragraph("~1 800 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>Domen va Xavfsizlik</b>", table_cell_style),
            Paragraph(".UZ domen registratsiyasi va SSL sertifikatlari", table_cell_style),
            Paragraph("15 000 so'm", table_cell_center),
            Paragraph("180 000 so'm", table_cell_center)
        ],
        [
            Paragraph("<b>JAMI XARAJAT:</b>", table_cell_bold),
            Paragraph("<b>To'liq kafolatlangan va zaxiralangan tizim</b>", table_cell_bold),
            Paragraph("<b>~1 615 000 so'm</b><br/><font color='#047857'><b>(~$125 / oy)</b></font>", table_cell_center),
            Paragraph("<b>~19 380 000 so'm</b><br/><font color='#047857'><b>(~$1 500 / yil)</b></font>", table_cell_center)
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
        "<i>* Eslatma: UZTELECOM narxlari davlat organi va yuridik shaxslar uchun QQS bilan rasmiy tariflar asosida keltirilgan. "
        "DeepSeek API hisob-kitobi xalqaro tariflar bo'yicha haqiqiy ishlatilgan hajmga asoslangan.</i>",
        ParagraphStyle('NoteStyle', parent=styles['Normal'], fontSize=7, leading=9, textColor=muted_gray)
    ))

    doc.build(elements)
    print("1-page PDF generated successfully at:", output_path)

if __name__ == '__main__':
    target = '/Users/macbook/Desktop/E-Material/E-Material_Server_va_AI_Xarajatlari_Smetasi.pdf'
    generate_cost_pdf(target)
