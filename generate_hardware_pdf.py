import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def generate_hardware_server_pdf():
    pdf_filename = "/Users/macbook/Desktop/E-Material/E-Material_Fizicheskiy_Server_Smetasi.pdf"
    
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
        fontName=font_bold,
        fontSize=13,
        leading=16,
        textColor=colors.black,
        alignment=1, # Center
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=8.5,
        leading=11.5,
        textColor=colors.black,
        alignment=1,
        spaceAfter=6
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName=font_bold,
        fontSize=9.5,
        leading=12,
        textColor=colors.black,
        spaceBefore=5,
        spaceAfter=3
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=7.5,
        leading=10,
        textColor=colors.black
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName=font_bold
    )

    story = []
    
    # Header Title
    story.append(Paragraph("СМЕТА НА ПРИОБРЕТЕНИЕ СЕРВЕРНОГО ОБОРУДОВАНИЯ (ON-PREMISE)", title_style))
    story.append(Paragraph("Аппаратно-программный комплекс информационной системы «E-Material»<br/>ГУВД г. Ташкента и 12 районных подразделений кибербезопасности (800+ пользователей)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=5))
    
    # Summary Box
    summary_text = (
        "<b>Назначение:</b> Приобретение в собственность ведомства серверного оборудования промышленного класса (Rackmount 2U) "
        "для развертывания базы данных, хранения электронных материалов, банковских выписок, аудиозаписей и протоколов. "
        "Обеспечивает 100% локальное хранение данных в закрытом контуре и отсутствие регулярных платежей за аренду виртуальных серверов."
    )
    story.append(Table([[Paragraph(summary_text, body_style)]], 
                       colWidths=[doc.width], 
                       style=[
                           ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f8f8')),
                           ('BOX', (0,0), (-1,-1), 1, colors.black),
                           ('TOPPADDING', (0,0), (-1,-1), 4),
                           ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                           ('LEFTPADDING', (0,0), (-1,-1), 6),
                           ('RIGHTPADDING', (0,0), (-1,-1), 6),
                       ]))
    story.append(Spacer(1, 4))

    # SECTION 1: Hardware Specifications
    story.append(Paragraph("1. СПЕЦИФИКАЦИЯ СЕРВЕРА (Dell PowerEdge R750 / HPE ProLiant DL380 Gen10+)", section_title))
    
    hw_data = [
        [Paragraph("<b>Компонент</b>", body_bold), Paragraph("<b>Технические характеристики и назначение</b>", body_bold), Paragraph("<b>Кол-во</b>", body_bold), Paragraph("<b>Ориентир. цена (UZS)</b>", body_bold)],
        [
            Paragraph("<b>Процессоры (CPU)</b>", body_style),
            Paragraph("Intel Xeon Silver 4314 (16 ядер / 32 потока, 2.4 - 3.4 GHz, 24MB Cache)", body_style),
            Paragraph("2 шт (32C/64T)", body_style),
            Paragraph("28 000 000", body_style)
        ],
        [
            Paragraph("<b>Оперативная память</b>", body_style),
            Paragraph("64 GB (2x 32GB) DDR4-3200MHz ECC Registered (с возможностью расширения)", body_style),
            Paragraph("64 GB", body_style),
            Paragraph("8 500 000", body_style)
        ],
        [
            Paragraph("<b>Системный накопитель</b>", body_style),
            Paragraph("960 GB Enterprise NVMe SSD (PCIe 4.0, Hot-Plug, RAID 1 под БД и систему)", body_style),
            Paragraph("2 шт", body_style),
            Paragraph("12 000 000", body_style)
        ],
        [
            Paragraph("<b>Архивное хранилище</b>", body_style),
            Paragraph("4 TB Enterprise SAS 12Gb/s 7.2K RPM 3.5\" (RAID 10, 8 TB полезных под архивы)", body_style),
            Paragraph("4 шт", body_style),
            Paragraph("16 000 000", body_style)
        ],
        [
            Paragraph("<b>RAID-контроллер</b>", body_style),
            Paragraph("Аппаратный контроллер PERC H755 8GB NV Cache + модуль защиты питания (BBU)", body_style),
            Paragraph("1 шт", body_style),
            Paragraph("9 500 000", body_style)
        ],
        [
            Paragraph("<b>Питание и сеть</b>", body_style),
            Paragraph("2x 800W Titanium Hot-Plug с резервированием + 4x 1GbE + 2x 10GbE SFP+", body_style),
            Paragraph("Комплект", body_style),
            Paragraph("8 000 000", body_style)
        ],
        [
            Paragraph("<b>Шасси и управление</b>", body_style),
            Paragraph("Стоечный корпус 2U + модуль удаленного управления iDRAC9 Enterprise + рельсы", body_style),
            Paragraph("1 комплект", body_style),
            Paragraph("14 000 000", body_style)
        ],
        [
            Paragraph("<b>ИТОГО ЗА СЕРВЕР:</b>", body_bold),
            Paragraph("<b>Единоразовый платеж с НДС 12% (Официальная гарантия 36 месяцев)</b>", body_bold),
            Paragraph("<b>1 сервер</b>", body_bold),
            Paragraph("<b>~96 000 000 UZS (~$7 500)</b>", body_bold)
        ]
    ]

    t_hw = Table(hw_data, colWidths=[105, 255, 75, 110])
    t_hw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f0f0f0')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
    ]))
    story.append(t_hw)
    story.append(Spacer(1, 4))

    # SECTION 2: Placement & AI Options
    story.append(Paragraph("2. РАЗМЕЩЕНИЕ ОБОРУДОВАНИЯ И ВАРИАНТЫ ИСКУССТВЕННОГО ИНТЕЛЛЕКТА (AI)", section_title))

    options_data = [
        [Paragraph("<b>Направление</b>", body_bold), Paragraph("<b>Вариант 1 (В серверной ГУВД)</b>", body_bold), Paragraph("<b>Вариант 2 (Colocation в ЦОД UZTELECOM)</b>", body_bold)],
        [
            Paragraph("<b>Размещение стойки</b>", body_style),
            Paragraph("Серверная комната ГУВД / Кибер-центра (аренда: 0 сум)", body_style),
            Paragraph("2U в стойке ЦОД UZTELECOM Tier-III (~900 000 сум/мес)", body_style)
        ],
        [
            Paragraph("<b>Электропитание</b>", body_style),
            Paragraph("Требуется ИБП (APC Smart-UPS On-Line 3kVA ~18 000 000 сум)", body_style),
            Paragraph("Гарантировано 2 независимых ввода + ДГУ ЦОД (включено)", body_style)
        ],
        [
            Paragraph("<b>Модуль ИИ (AI)</b>", body_style),
            Paragraph("<b>Опция А (Локальный оффлайн ИИ):</b> Видеокарта NVIDIA RTX 4090 24GB (~26 000 000 сум) для 100% автономной работы нейросети без выхода в интернет.", body_style),
            Paragraph("<b>Опция Б (Гибридный, рекомендованный):</b> Защищенный API DeepSeek (~450 000 сум/мес). Сервер изолирован, AI подключается по защищенному каналу.", body_style)
        ]
    ]

    t_opt = Table(options_data, colWidths=[110, 215, 220])
    t_opt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_opt)
    story.append(Spacer(1, 4))

    # SECTION 3: Economic Comparison (TCO)
    story.append(Paragraph("3. ЭКОНОМИЧЕСКОЕ СРАВНЕНИЕ: ПОКУПКА СЕРВЕРА VS АРЕНДА ОБЛАКА НА 3 ГОДА", section_title))

    tco_data = [
        [Paragraph("<b>Статья затрат</b>", body_bold), Paragraph("<b>Покупка собственного сервера (On-Premise)</b>", body_bold), Paragraph("<b>Ежемесячная аренда облака (Cloud VPS)</b>", body_bold)],
        [
            Paragraph("<b>Разовые расходы (CapEx)</b>", body_style),
            Paragraph("<b>~96 000 000 UZS (~$7 500)</b> (оборудование на балансе)", body_style),
            Paragraph("0 UZS (оборудование не принадлежит ведомству)", body_style)
        ],
        [
            Paragraph("<b>Ежемесячные расходы (OpEx)</b>", body_style),
            Paragraph("~450 000 - 1 350 000 UZS (только AI или Colocation)", body_style),
            Paragraph("~7 800 000 - 9 700 000 UZS ежемесячно", body_style)
        ],
        [
            Paragraph("<b>Затраты за 1-й год</b>", body_style),
            Paragraph("~102 000 000 UZS", body_style),
            Paragraph("~116 400 000 UZS (Окупаемость наступает на 10-й месяц)", body_style)
        ],
        [
            Paragraph("<b>Затраты за 3 года (TCO)</b>", body_bold),
            Paragraph("<b>~115 000 000 UZS (~$9 000)</b>", body_bold),
            Paragraph("<b>~349 000 000 UZS (~$27 300)</b> (Переплата более 300%)", body_bold)
        ]
    ]

    t_tco = Table(tco_data, colWidths=[140, 205, 200])
    t_tco.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f0f0f0')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tco)
    story.append(Spacer(1, 7))

    # Signatures
    sig_data = [
        [
            Paragraph("<b>Составитель:</b> IT-архитектор проекта E-Material<br/>Дата: 05.11.2026 г.", body_style),
            Paragraph("<b>Согласовано:</b> ___________________________<br/>Руководство ведомства", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[270, 275])
    t_sig.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sig)

    doc.build(story)
    print("Physical server PDF regenerated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_hardware_server_pdf()
