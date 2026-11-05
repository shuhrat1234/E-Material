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

    # Margins: 10mm
    margin = 10 * 2.83465
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
        alignment=1,
        spaceAfter=3
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
        fontSize=9,
        leading=11,
        textColor=colors.black,
        spaceBefore=6,
        spaceAfter=3
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=7.5,
        leading=9.5,
        textColor=colors.black
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName=font_bold
    )

    story = []
    
    # Header Title
    story.append(Paragraph("СМЕТА НА ПОЛНУЮ ЗАКУПКУ СЕРВЕРНОГО ОБОРУДОВАНИЯ «ПОД КЛЮЧ»", title_style))
    story.append(Paragraph("Комплексное оснащение серверной комнаты: информационная система «E-Material»<br/>ГУВД г. Ташкента и 12 районных подразделений кибербезопасности (800+ пользователей)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=5))
    
    # Summary Box
    summary_text = (
        "<b>Условия поставки:</b> 100% закупка оборудования в собственность ведомства для размещения в серверной комнате. "
        "Включает полный аппаратно-программный комплекс: стоечный сервер, модуль локального искусственного интеллекта (GPU), "
        "систему бесперебойного питания (ИБП), телекоммуникационный шкаф, коммутатор и пусконаладочные работы. "
        "Ежемесячные арендные платежи отсутствуют. Система работает полностью автономно в закрытом контуре."
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

    # Single Consolidated Specification Table
    story.append(Paragraph("СПЕЦИФИКАЦИЯ ОБОРУДОВАНИЯ И МАТЕРИАЛОВ", section_title))
    
    hw_data = [
        [
            Paragraph("<b>№</b>", body_bold),
            Paragraph("<b>Наименование оборудования</b>", body_bold),
            Paragraph("<b>Подробные технические характеристики</b>", body_bold),
            Paragraph("<b>Кол-во</b>", body_bold),
            Paragraph("<b>Сумма (UZS)</b>", body_bold)
        ],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Стоечный сервер 2U</b><br/>Dell PowerEdge R750 / HPE DL380 Gen10+", body_style),
            Paragraph("2x Intel Xeon Silver 4314 (32 ядра / 64 потока, до 3.4 GHz), 64 GB DDR4-3200 ECC Reg, 2x 960GB NVMe SSD (RAID 1), 4x 4TB Enterprise SAS HDD (RAID 10, 8 TB полезных), аппаратный RAID PERC H755 8GB NV Cache + BBU, 2x 800W PSU Redundant, iDRAC9 Enterprise, рельсы в стойку", body_style),
            Paragraph("1 компл.", body_style),
            Paragraph("96 000 000", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Ускоритель ИИ (GPU)</b><br/>NVIDIA RTX 4090 / RTX A5000 24GB", body_style),
            Paragraph("24 GB GDDR6X/ECC, тензорные ядра 4-го поколения. Предназначен для локального развертывания нейросетей DeepSeek / Qwen для автономного анализа материалов без интернета", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("26 000 000", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Источник бесперебойного питания (ИБП)</b><br/>APC Smart-UPS On-Line 3000VA", body_style),
            Paragraph("Мощность 3000 ВА / 2700 Вт, топология двойного преобразования (On-Line, чистая синусоида), монтаж в стойку 2U, защита оборудования от скачков напряжения и автономная работа", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("19 000 000", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Серверный шкаф 19\"</b><br/>Напольный телекоммуникационный 24U", body_style),
            Paragraph("Размер 19\" 24U (глубина 1000 мм), перфорированные двери с замками, съемные боковые панели, встроенный блок принудительной вентиляции (4 вентилятора), регулируемые ножки и колеса", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("7 500 000", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Сетевой коммутатор</b><br/>Managed Switch 24x 1GbE + 4x 10G SFP+", body_style),
            Paragraph("Управляемый коммутатор 2-го уровня (L2+), 24 гигабитных порта RJ-45, 4 порта 10G SFP+ для высокоскоростного подключения сервера и сетевой инфраструктуры подразделения", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("5 500 000", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Блок розеток (PDU) и кабельная обвязка</b>", body_style),
            Paragraph("Блок распределения питания 19\" PDU на 8 розеток Schuko с выключателем и защитой, патч-панель Cat.6 24 порта, комплект патч-кордов, органайзеры кабелей и крепеж", body_style),
            Paragraph("1 компл.", body_style),
            Paragraph("2 000 000", body_style)
        ],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Монтаж и пусконаладочные работы</b>", body_style),
            Paragraph("Сборка и установка серверного шкафа, монтаж оборудования, настройка аппаратного RAID, установка ОС Linux, СУБД PostgreSQL, серверного окружения, локальной модели ИИ и ПО «E-Material»", body_style),
            Paragraph("1 услуга", body_style),
            Paragraph("8 000 000", body_style)
        ],
        [
            Paragraph("", body_bold),
            Paragraph("<b>ИТОГО К ОПЛАТЕ:</b>", body_bold),
            Paragraph("<b>Полная комплектация «под ключ» с учетом НДС 12% и официальной гарантией 36 мес.</b>", body_bold),
            Paragraph("<b>ВСЕГО:</b>", body_bold),
            Paragraph("<b>164 000 000 UZS<br/>(~$12 800)</b>", body_bold)
        ]
    ]

    t_hw = Table(hw_data, colWidths=[20, 125, 255, 45, 105])
    t_hw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f0f0f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (4,-1), 'RIGHT'),
    ]))
    story.append(t_hw)
    story.append(Spacer(1, 6))

    # Payment terms only
    story.append(Paragraph("УСЛОВИЯ ОПЛАТЫ", section_title))
    notes_data = [
        [
            Paragraph("• <b>Форма оплаты:</b> Безналичный расчет перечислением (с учетом НДС 12%).", body_style)
        ]
    ]
    t_notes = Table(notes_data, colWidths=[doc.width], style=[
        ('BOX', (0,0), (-1,-1), 0.5, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ])
    story.append(t_notes)

    doc.build(story)
    print("Turnkey hardware PDF generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_hardware_server_pdf()
