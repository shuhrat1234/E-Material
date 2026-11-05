import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_hardware_server_pdf():
    pdf_filename = "/Users/macbook/Desktop/E-Material/E-Material_Fizicheskiy_Server_Smetasi.pdf"
    
    # Strict 1-page geometry: 12mm margins
    margin = 12 * 2.83465
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
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=1, # Center
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=10
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=7,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0369a1')
    )

    story = []
    
    # Title
    story.append(Paragraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ: ЗАКУПКА ФИЗИЧЕСКОГО СЕРВЕРА", title_style))
    story.append(Paragraph("Смета на приобретение стоечного сервера (On-Premise) для системы «E-Material»<br/><b>ГУВД г. Ташкента и 12 районных отделов кибербезопасности (800+ пользователей)</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=8))
    
    # Executive Summary Box
    summary_text = (
        "<b>Назначение:</b> Приобретение собственного серверного оборудования промышленного класса (Rackmount 2U) "
        "для размещения закрытой ведомственной базы данных, процессинга банковских выписок, аудиозаписей и архива "
        "электронных материалов. Обеспечивает 100% суверенитет данных, отсутствие риска блокировок и окупаемость в течение 12 месяцев."
    )
    story.append(Table([[Paragraph(summary_text, body_style)]], 
                       colWidths=[doc.width], 
                       style=[
                           ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                           ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                           ('TOPPADDING', (0,0), (-1,-1), 5),
                           ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                           ('LEFTPADDING', (0,0), (-1,-1), 8),
                           ('RIGHTPADDING', (0,0), (-1,-1), 8),
                       ]))
    story.append(Spacer(1, 6))

    # SECTION 1: Hardware Specifications
    story.append(Paragraph("1. СПЕЦИФИКАЦИЯ СЕРВЕРНОГО ОБОРУДОВАНИЯ (Dell PowerEdge R750 / HPE DL380 Gen10+)", section_title))
    
    hw_data = [
        [Paragraph("<b>Компонент</b>", body_bold), Paragraph("<b>Конфигурация и назначение</b>", body_bold), Paragraph("<b>Кол-во</b>", body_bold), Paragraph("<b>Ориентир. цена (UZS)</b>", body_bold)],
        [
            Paragraph("<b>Процессоры (CPU)</b>", body_style),
            Paragraph("Intel Xeon Silver 4314 (16 ядер / 32 потока, 2.4-3.4 GHz, 24MB Cache)", body_style),
            Paragraph("2 шт (32C/64T)", body_style),
            Paragraph("28 000 000", body_style)
        ],
        [
            Paragraph("<b>Память (RAM)</b>", body_style),
            Paragraph("64 GB (2x 32GB) DDR4-3200MHz ECC Registered RDIMM (с расширением до 1TB)", body_style),
            Paragraph("64 GB", body_style),
            Paragraph("8 500 000", body_style)
        ],
        [
            Paragraph("<b>Системный диск (NVMe)</b>", body_style),
            Paragraph("960 GB Enterprise NVMe PCIe 4.0 SSD (Hot-Plug, RAID 1 под PostgreSQL & Redis)", body_style),
            Paragraph("2 шт", body_style),
            Paragraph("12 000 000", body_style)
        ],
        [
            Paragraph("<b>Архивное хранилище (HDD)</b>", body_style),
            Paragraph("4 TB Enterprise SAS 12Gb/s 7.2K RPM 3.5\" (RAID 10 под дампы, фото, аудио)", body_style),
            Paragraph("4 шт (8 TB полезн.)", body_style),
            Paragraph("16 000 000", body_style)
        ],
        [
            Paragraph("<b>RAID-контроллер</b>", body_style),
            Paragraph("Hardware RAID PERC H755 8GB NV Cache + Battery Backup Unit (BBU)", body_style),
            Paragraph("1 шт", body_style),
            Paragraph("9 500 000", body_style)
        ],
        [
            Paragraph("<b>Питание и Сеть</b>", body_style),
            Paragraph("Dual Redundant PSU 2x 800W Titanium Hot-Plug + 4x 1GbE + 2x 10GbE SFP+", body_style),
            Paragraph("Комплект", body_style),
            Paragraph("8 000 000", body_style)
        ],
        [
            Paragraph("<b>Шасси и управление</b>", body_style),
            Paragraph("Dell 2U Rack Chassis 8x 3.5\" + iDRAC9 Enterprise (удаленный KVM-доступ) + рельсы", body_style),
            Paragraph("1 комплект", body_style),
            Paragraph("14 000 000", body_style)
        ],
        [
            Paragraph("<b>ИТОГО ЗА СЕРВЕР:</b>", body_bold),
            Paragraph("<b>Единоразовый платеж с НДС 12% (Гарантия 36 месяцев на месте)</b>", body_bold),
            Paragraph("<b>1 шт</b>", body_bold),
            Paragraph("<b>~96 000 000 UZS (~$7 500)</b>", body_bold)
        ]
    ]

    t_hw = Table(hw_data, colWidths=[115, 235, 80, 115])
    t_hw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
    ]))
    story.append(t_hw)
    story.append(Spacer(1, 6))

    # SECTION 2: Placement & AI Options
    story.append(Paragraph("2. РАЗМЕЩЕНИЕ, ИБП И ОПЦИИ ИСКУССТВЕННОГО ИНТЕЛЛЕКТА (AI)", section_title))

    options_data = [
        [Paragraph("<b>Направление</b>", body_bold), Paragraph("<b>Вариант А (Автономный в ГУВД)</b>", body_bold), Paragraph("<b>Вариант Б (Colocation в UZTELECOM)</b>", body_bold)],
        [
            Paragraph("<b>Локация и стойка</b>", body_style),
            Paragraph("В собственной серверной ГУВД / Кибер-центра (0 сум аренда)", body_style),
            Paragraph("Colocation 2U в ЦОД UZTELECOM Tier-III (~900 000 сум/мес)", body_style)
        ],
        [
            Paragraph("<b>Электропитание</b>", body_style),
            Paragraph("Требуется ИБП (APC Smart-UPS On-Line 3kVA ~18 000 000 сум)", body_style),
            Paragraph("Гарантировано 2 независимых ввода + ДГУ в ЦОД (включено)", body_style)
        ],
        [
            Paragraph("<b>Искусственный интеллект (AI)</b>", body_style),
            Paragraph("<b>Опция 1:</b> Локальная GPU (NVIDIA RTX 4090 24GB +$2 200)<br/>для 100% оффлайн работы нейросети DeepSeek R1 локально.", body_style),
            Paragraph("<b>Опция 2 (Рекомендованная):</b> Использование защищенного DeepSeek API (~450 000 сум/мес). Сервер изолирован, AI по API.", body_style)
        ]
    ]

    t_opt = Table(options_data, colWidths=[120, 210, 215])
    t_opt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_opt)
    story.append(Spacer(1, 6))

    # SECTION 3: Economic Comparison (TCO)
    story.append(Paragraph("3. СРАВНЕНИЕ: ПОКУПКА В СОБСТВЕННОСТЬ VS АРЕНДА ОБЛАКА НА 3 ГОДА", section_title))

    tco_data = [
        [Paragraph("<b>Статья расходов</b>", body_bold), Paragraph("<b>Покупка своего сервера (On-Premise)</b>", body_bold), Paragraph("<b>Аренда облачного сервера (Cloud VPS)</b>", body_bold)],
        [
            Paragraph("<b>Единоразовые затраты (CapEx)</b>", body_style),
            Paragraph("<b>~96 000 000 UZS (~$7 500)</b> (сервер в собственность)", body_style),
            Paragraph("0 UZS (оборудование не принадлежит ведомству)", body_style)
        ],
        [
            Paragraph("<b>Ежемесячные затраты (OpEx)</b>", body_style),
            Paragraph("~450 000 – 1 350 000 UZS (только AI API или Colocation)", body_style),
            Paragraph("<b>~7 800 000 – 9 700 000 UZS</b> каждый месяц", body_style)
        ],
        [
            Paragraph("<b>Расходы за 1-й год</b>", body_style),
            Paragraph("~102 000 000 UZS", body_style),
            Paragraph("~116 400 000 UZS <i>(Покупка окупается на 10-й месяц)</i>", body_style)
        ],
        [
            Paragraph("<b>Расходы за 3 года (Total TCO)</b>", body_bold),
            Paragraph("<b>~115 000 000 UZS (~$9 000)</b>", body_bold),
            Paragraph("<b>~349 000 000 UZS (~$27 300)</b> <i>(Переплата в 3 раза!)</i>", body_bold)
        ]
    ]

    t_tco = Table(tco_data, colWidths=[150, 195, 200])
    t_tco.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#ecfdf5')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tco)
    story.append(Spacer(1, 8))

    # Signatures
    sig_data = [
        [
            Paragraph("<b>Смету составил:</b> IT-архитектор проекта E-Material<br/>Дата: 05.11.2026 г.", body_style),
            Paragraph("<b>Согласовано:</b> ___________________________<br/>Руководство подразделения", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[270, 275])
    t_sig.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)

    doc.build(story)
    print("Physical server PDF generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_hardware_server_pdf()
