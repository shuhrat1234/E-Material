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

    # Margins: 10mm (28.35 pt)
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
        fontSize=12,
        leading=15,
        textColor=colors.black,
        alignment=1,
        spaceAfter=4
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName=font_bold,
        fontSize=8.5,
        leading=11,
        textColor=colors.black,
        spaceBefore=4,
        spaceAfter=2
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=7,
        leading=9,
        textColor=colors.black
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName=font_bold
    )

    story = []
    
    # Title
    story.append(Paragraph("СПЕЦИФИКАЦИЯ ОБОРУДОВАНИЯ И ЕЖЕМЕСЯЧНЫХ РАСХОДОВ", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=4))
    
    # SECTION 1: Hardware Table
    story.append(Paragraph("1. ЕДИНОРАЗОВАЯ ЗАКУПКА ОБОРУДОВАНИЯ «ПОД КЛЮЧ»", section_title))
    
    hw_data = [
        [
            Paragraph("<b>№</b>", body_bold),
            Paragraph("<b>Наименование оборудования</b>", body_bold),
            Paragraph("<b>Технические характеристики и состав</b>", body_bold),
            Paragraph("<b>Кол-во</b>", body_bold),
            Paragraph("<b>Сумма (UZS)</b>", body_bold)
        ],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Стоечный сервер 2U</b><br/>Dell PowerEdge R750 / HPE DL380", body_style),
            Paragraph("2x Intel Xeon Silver 4314 (32 ядра / 64 потока, 2.4-3.4 GHz), 64 GB DDR4-3200 ECC Reg, 2x 960GB NVMe SSD (RAID 1), 4x 4TB Enterprise SAS HDD (RAID 10, 8 TB полезных), RAID PERC H755 8GB NV Cache + BBU, 2x 800W PSU, iDRAC9, рельсы", body_style),
            Paragraph("1 компл.", body_style),
            Paragraph("96 000 000", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Ускоритель ИИ (GPU)</b><br/>NVIDIA RTX 4090 / RTX A5000 24GB", body_style),
            Paragraph("24 GB GDDR6X/ECC, тензорные ядра 4-го поколения. Предназначен для локальной обработки и автономного анализа данных нейросетями", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("26 000 000", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Источник бесперебойного питания</b><br/>APC Smart-UPS On-Line 3000VA", body_style),
            Paragraph("3000 ВА / 2700 Вт, чистая синусоида, онлайн-топология двойного преобразования, стоечное исполнение 2U, защита оборудования от скачков напряжения", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("19 000 000", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Серверный шкаф 19\"</b><br/>Напольный телекоммуникационный 24U", body_style),
            Paragraph("Размер 19\" 24U (глубина 1000 мм), перфорированные двери с замками, съемные панели, блок принудительной вентиляции (4 вентилятора), ножки/колеса", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("7 500 000", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Сетевой коммутатор</b><br/>Managed Switch 24x 1GbE + 4x 10G", body_style),
            Paragraph("Управляемый L2+ коммутатор, 24 порта 1GbE RJ-45, 4 порта 10G SFP+ для высокоскоростного подключения сетевой инфраструктуры", body_style),
            Paragraph("1 шт.", body_style),
            Paragraph("5 500 000", body_style)
        ],
        [
            Paragraph("6", body_style),
            Paragraph("<b>Блок розеток (PDU) и кабельная обвязка</b>", body_style),
            Paragraph("Блок распределения питания 19\" PDU 8 розеток Schuko с защитой, патч-панель Cat.6 24 порта, патч-корды, органайзеры кабелей и крепеж", body_style),
            Paragraph("1 компл.", body_style),
            Paragraph("2 000 000", body_style)
        ],
        [
            Paragraph("7", body_style),
            Paragraph("<b>Монтаж и пусконаладочные работы</b>", body_style),
            Paragraph("Сборка шкафа, монтаж оборудования, настройка аппаратного RAID, установка серверной ОС, СУБД PostgreSQL, системного окружения и ПО", body_style),
            Paragraph("1 услуга", body_style),
            Paragraph("8 000 000", body_style)
        ],
        [
            Paragraph("", body_bold),
            Paragraph("<b>ИТОГО ЗА ОБОРУДОВАНИЕ:</b>", body_bold),
            Paragraph("<b>Единоразовый платеж с учетом НДС 12% и официальной гарантией</b>", body_bold),
            Paragraph("<b>ВСЕГО:</b>", body_bold),
            Paragraph("<b>164 000 000 UZS<br/>(~$12 800)</b>", body_bold)
        ]
    ]

    t_hw = Table(hw_data, colWidths=[18, 127, 260, 40, 100])
    t_hw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f0f0f0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (4,-1), 'RIGHT'),
    ]))
    story.append(t_hw)
    story.append(Spacer(1, 4))

    # SECTION 2: Monthly Operational Expenses (AI + AI Voice + Face ID + Maintenance)
    story.append(Paragraph("2. ЕЖЕМЕСЯЧНЫЕ ЭКСПЛУАТАЦИОННЫЕ И СЕРВИСНЫЕ РАСХОДЫ", section_title))
    
    monthly_data = [
        [
            Paragraph("<b>№</b>", body_bold),
            Paragraph("<b>Сервис / Статья расхода</b>", body_bold),
            Paragraph("<b>Объем и функциональное назначение</b>", body_bold),
            Paragraph("<b>Период</b>", body_bold),
            Paragraph("<b>Сумма (UZS / мес)</b>", body_bold)
        ],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Искусственный интеллект (AI)</b><br/>DeepSeek V3 / R1", body_style),
            Paragraph("~15 000 000 токенов/мес. Юридический анализ материалов, формулирование фабул, извлечение ключевых фактов, подготовка проектов постановлений", body_style),
            Paragraph("Ежемесячно", body_style),
            Paragraph("450 000", body_style)
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Голосовой ИИ: Распознавание речи</b><br/>AI Voice STT (UzbekVoice.ai)", body_style),
            Paragraph("~1 500 минут/мес. Распознавание голосовых обращений граждан и голосового ввода сотрудников на узбекском и русском языках в реальном времени", body_style),
            Paragraph("Ежемесячно", body_style),
            Paragraph("600 000", body_style)
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Голосовой ИИ: Синтез речи</b><br/>AI Voice TTS (UzbekVoice.ai)", body_style),
            Paragraph("~1 000 минут/мес. Естественное озвучивание ответов интерактивного ассистента, зачитывание справок и процессуальных статусов материалов", body_style),
            Paragraph("Ежемесячно", body_style),
            Paragraph("420 000", body_style)
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Биометрическая подписка (Face ID)</b><br/>Подписка распознавания лиц", body_style),
            Paragraph("До 10 000 проверок/мес. Модуль биометрической верификации и идентификации личности по лицу (Face Recognition / Liveness Detection)", body_style),
            Paragraph("Ежемесячно", body_style),
            Paragraph("1 500 000", body_style)
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Техническое обслуживание сервера</b><br/>Регламентное администрирование", body_style),
            Paragraph("Ежемесячное администрирование серверной инфраструктуры, круглосуточный мониторинг 24/7, создание резервных копий (Backup), обновление ПО и безопасность", body_style),
            Paragraph("Ежемесячно", body_style),
            Paragraph("2 500 000", body_style)
        ],
        [
            Paragraph("", body_bold),
            Paragraph("<b>ИТОГО ЕЖЕМЕСЯЧНО:</b>", body_bold),
            Paragraph("<b>Сервисные подписки (AI, Voice, Face ID) и регламентное обслуживание сервера</b>", body_bold),
            Paragraph("<b>В МЕСЯЦ:</b>", body_bold),
            Paragraph("<b>5 470 000 UZS<br/>(~$427 / мес)</b>", body_bold)
        ]
    ]

    t_mo = Table(monthly_data, colWidths=[18, 127, 260, 40, 100])
    t_mo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ebebeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f0f0f0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (4,-1), 'RIGHT'),
    ]))
    story.append(t_mo)
    story.append(Spacer(1, 4))

    # Consolidated Grand Total Box
    grand_data = [
        [
            Paragraph("<b>СВОДНЫЙ ИТОГ:</b>", body_bold),
            Paragraph("<b>Единоразовая закупка оборудования («под ключ»): 164 000 000 UZS (~$12 800)</b><br/>"
                      "<b>Ежемесячные сервисные и эксплуатационные расходы: 5 470 000 UZS/мес (~$427/мес)</b>", body_style)
        ]
    ]
    t_grand = Table(grand_data, colWidths=[100, doc.width - 100], style=[
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f8f8')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ])
    story.append(t_grand)

    doc.build(story)
    print("PDF with hardware + monthly Face ID/Maintenance generated successfully at:", pdf_filename)

if __name__ == '__main__':
    generate_hardware_server_pdf()
