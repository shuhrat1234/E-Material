import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_pricing_excel():
    excel_path = "/Users/macbook/Desktop/E-Material/E-Material_SMS_va_Gemini_API_Narxlari.xlsx"
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # SHEET 1: SMS Narxlari (O'zbekiston operatorlari)
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "SMS xizmatlari narxlari"
    ws1.views.sheetView[0].showGridLines = True
    
    # Borders and Fonts (Strictly Black & White, No Colors)
    thin_border = Border(
        left=Side(style='thin', color='000000'),
        right=Side(style='thin', color='000000'),
        top=Side(style='thin', color='000000'),
        bottom=Side(style='thin', color='000000')
    )
    double_bottom_border = Border(
        left=Side(style='thin', color='000000'),
        right=Side(style='thin', color='000000'),
        top=Side(style='thin', color='000000'),
        bottom=Side(style='double', color='000000')
    )
    
    font_title = Font(name='Arial', size=13, bold=True, color='000000')
    font_subtitle = Font(name='Arial', size=9, italic=True, color='333333')
    font_header = Font(name='Arial', size=10, bold=True, color='000000')
    font_data = Font(name='Arial', size=10, color='000000')
    font_bold = Font(name='Arial', size=10, bold=True, color='000000')
    
    header_fill = PatternFill(start_color='F2F2F2', end_color='F2F2F2', fill_type='solid')
    total_fill = PatternFill(start_color='FAFAFA', end_color='FAFAFA', fill_type='solid')

    align_center = Alignment(horizontal='center', vertical='center')
    align_left = Alignment(horizontal='left', vertical='center')
    align_right = Alignment(horizontal='right', vertical='center')

    # Title
    ws1['A1'] = "O'ZBEKISTON MOBIL OPERATORLARI BO'YICHA SMS TARIFLARI"
    ws1['A1'].font = font_title
    ws1['A2'] = "«E-Material» tizimi doirasida rasmiy va ommaviy xabarnomalar yuborish narxlari (1 ta SMS uchun QQS bilan)"
    ws1['A2'].font = font_subtitle
    ws1.row_dimensions[1].height = 24
    ws1.row_dimensions[2].height = 18

    # Table Header
    headers1 = [
        "№",
        "Mobil operator nomi",
        "Servis (Xizmat) SMS narxi (so'm)",
        "Reklama (Ommaviy) SMS narxi (so'm)",
        "Tizimda qo'llanish maqsadi"
    ]
    
    for col_num, h_text in enumerate(headers1, 1):
        cell = ws1.cell(row=4, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[4].height = 28

    # Data
    sms_data = [
        (1, "Mobiuz (UMS)", 170, 370, "Fuqarolarga UIN kod, chaqiruv xabarnomalari"),
        (2, "Beeline (Unitel)", 160, 350, "Fuqarolarga UIN kod, chaqiruv xabarnomalari"),
        (3, "Ucell (COSCOM)", 160, 340, "Fuqarolarga UIN kod, chaqiruv xabarnomalari"),
        (4, "Humans", 95, 95, "Fuqarolarga UIN kod, chaqiruv xabarnomalari"),
        (5, "Uzmobile (Uztelecom)", 145, 350, "Fuqarolarga UIN kod, chaqiruv xabarnomalari"),
        (6, "Perfectum (RWC)", 110, 110, "Fuqarolarga UIN kod, chaqiruv xabarnomalari"),
    ]

    for row_idx, row_values in enumerate(sms_data, start=5):
        for col_idx, val in enumerate(row_values, start=1):
            cell = ws1.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            if col_idx == 1:
                cell.alignment = align_center
            elif col_idx in (3, 4):
                cell.alignment = align_right
                cell.number_format = '#,##0 "so\'m"'
            else:
                cell.alignment = align_left
        ws1.row_dimensions[row_idx].height = 20

    # Summary Row
    summary_row = 5 + len(sms_data)
    ws1.cell(row=summary_row, column=1, value="").border = double_bottom_border
    ws1.cell(row=summary_row, column=1).fill = total_fill
    c_label = ws1.cell(row=summary_row, column=2, value="O'rtacha narx ko'rsatkichi")
    c_label.font = font_bold
    c_label.border = double_bottom_border
    c_label.fill = total_fill

    c_avg_serv = ws1.cell(row=summary_row, column=3, value=f"=AVERAGE(C5:C{summary_row-1})")
    c_avg_serv.font = font_bold
    c_avg_serv.alignment = align_right
    c_avg_serv.number_format = '#,##0 "so\'m"'
    c_avg_serv.border = double_bottom_border
    c_avg_serv.fill = total_fill

    c_avg_adv = ws1.cell(row=summary_row, column=4, value=f"=AVERAGE(D5:D{summary_row-1})")
    c_avg_adv.font = font_bold
    c_avg_adv.alignment = align_right
    c_avg_adv.number_format = '#,##0 "so\'m"'
    c_avg_adv.border = double_bottom_border
    c_avg_adv.fill = total_fill

    c_note = ws1.cell(row=summary_row, column=5, value="O'rtacha servis SMS: ~140 so'm")
    c_note.font = font_bold
    c_note.border = double_bottom_border
    c_note.fill = total_fill
    ws1.row_dimensions[summary_row].height = 22

    # Monthly estimate box for SMS
    est_start = summary_row + 2
    ws1.cell(row=est_start, column=1, value="TIZIM UCHUN OYLIK TAXMINIY SMS XARAJATI HISOBLANISHI:").font = font_header
    ws1.row_dimensions[est_start].height = 20

    sms_calc = [
        ("Kichik yuklama (oyiga 3 000 ta SMS):", "3 000 ta x ~140 so'm", 420000),
        ("O'rta yuklama (oyiga 10 000 ta SMS):", "10 000 ta x ~140 so'm", 1400000),
        ("Katta yuklama (oyiga 25 000 ta SMS):", "25 000 ta x ~140 so'm", 3500000),
    ]

    for idx, (desc, formula, cost) in enumerate(sms_calc, start=est_start+1):
        c1 = ws1.cell(row=idx, column=2, value=desc)
        c1.font = font_data
        c1.border = thin_border
        c2 = ws1.cell(row=idx, column=3, value=formula)
        c2.font = font_data
        c2.alignment = align_center
        c2.border = thin_border
        c3 = ws1.cell(row=idx, column=4, value=cost)
        c3.font = font_bold
        c3.alignment = align_right
        c3.number_format = '#,##0 "so\'m"'
        c3.border = thin_border
        ws1.row_dimensions[idx].height = 19

    # Auto-adjust column widths
    for col in ws1.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws1.column_dimensions[col_letter].width = max(max_len + 4, 12)
    ws1.column_dimensions['A'].width = 6
    ws1.column_dimensions['B'].width = 26
    ws1.column_dimensions['C'].width = 34
    ws1.column_dimensions['D'].width = 34
    ws1.column_dimensions['E'].width = 44

    # -------------------------------------------------------------
    # SHEET 2: Google Gemini API Narxlari
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Gemini AI API narxlari")
    ws2.views.sheetView[0].showGridLines = True

    # Title
    ws2['A1'] = "GOOGLE GEMINI API XIZMATLARI TARIF JADVALI"
    ws2['A1'].font = font_title
    ws2['A2'] = "«E-Material» tizimida arizalarni tahlil qilish, fabula shakllantirish va moddalash uchun (1 USD = 12 800 UZS kursi bo'yicha)"
    ws2['A2'].font = font_subtitle
    ws2.row_dimensions[1].height = 24
    ws2.row_dimensions[2].height = 18

    headers2 = [
        "№",
        "Gemini modeli nomi",
        "So'rov turi (Token)",
        "Narxi (USD / 1M token)",
        "Narxi (So'm / 1M token)",
        "Tavsiya etilgan vazifasi",
        "Oylik o'rtacha xarajat (UZS)"
    ]

    for col_num, h_text in enumerate(headers2, 1):
        cell = ws2.cell(row=4, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws2.row_dimensions[4].height = 28

    gemini_data = [
        (1, "Gemini 1.5 Flash (Tavsiya etiladi)", "Kiruvchi matn (Input)", "$0.075", "960 so'm", "Tezkor arizalar tahlili, fabula tuzish, bank ko'chirmalari", "~45 000 so'm / oy"),
        (2, "Gemini 1.5 Flash (Tavsiya etiladi)", "Chiquvchi matn (Output)", "$0.300", "3 840 so'm", "Tayyor qarorlar loyihasi, xulosa va jadvallar shakllantirish", "~75 000 so'm / oy"),
        (3, "Gemini 1.5 Flash (Multimodal)", "Audio / Rasm kiritish", "$0.150", "1 920 so'm", "Skrinshotlar, to'lov cheklari va audio yozuvlarni tanish", "~30 000 so'm / oy"),
        (4, "Gemini 1.5 Pro (Yuqori aniqlik)", "Kiruvchi matn (Input)", "$1.250", "16 000 so'm", "Murakkab ko'p tomli tergov ishlari, yuridik ekspertiza", "~160 000 so'm / oy"),
        (5, "Gemini 1.5 Pro (Yuqori aniqlik)", "Chiquvchi matn (Output)", "$5.000", "64 000 so'm", "Keng qamrovli tahliliy ma'lumotnoma va hisobotlar", "~320 000 so'm / oy"),
        (6, "Gemini 2.0 Flash (Eksperimental)", "Kiruvchi matn (Input)", "$0.100", "1 280 so'm", "Real vaqt rejimida suhbat (interaktiv AI-kiosk/avatar)", "~40 000 so'm / oy"),
        (7, "Gemini 2.0 Flash (Eksperimental)", "Chiquvchi matn (Output)", "$0.400", "5 120 so'm", "Lahzalik audio/matnli javoblar", "~60 000 so'm / oy"),
        (8, "Gemini Bepul tarif (Free Tier)", "Cheklangan so'rovlar", "$0.000 (Bepul)", "0 so'm", "Dastlabki sinov, dasturchilar uchun test rejimi (15 RPM)", "0 so'm / oy"),
    ]

    for row_idx, row_values in enumerate(gemini_data, start=5):
        for col_idx, val in enumerate(row_values, start=1):
            cell = ws2.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            if col_idx == 1:
                cell.alignment = align_center
            elif col_idx in (4, 5, 7):
                cell.alignment = align_right
            else:
                cell.alignment = align_left
        ws2.row_dimensions[row_idx].height = 20

    # Auto-adjust column widths
    for col in ws2.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws2.column_dimensions[col_letter].width = max(max_len + 4, 12)
    ws2.column_dimensions['A'].width = 6
    ws2.column_dimensions['B'].width = 35
    ws2.column_dimensions['C'].width = 26
    ws2.column_dimensions['D'].width = 24
    ws2.column_dimensions['E'].width = 24
    ws2.column_dimensions['F'].width = 46
    ws2.column_dimensions['G'].width = 26

    # -------------------------------------------------------------
    # SHEET 3: Svod / Umumiy Xarajatlar Rejasi
    # -------------------------------------------------------------
    ws3 = wb.create_sheet(title="Umumiy oylik xarajatlar rejasi")
    ws3.views.sheetView[0].showGridLines = True

    ws3['A1'] = "«E-MATERIAL» TIZIMI UCHUN SMS VA SUN'IY INTELLEKT (AI) OYLIK XARAJATLAR REJASI"
    ws3['A1'].font = font_title
    ws3['A2'] = "O'zbekiston mobil operatorlari SMS shlyuzi va Google Gemini AI integratsiyasi bo'yicha yig'ma jadval"
    ws3['A2'].font = font_subtitle
    ws3.row_dimensions[1].height = 24
    ws3.row_dimensions[2].height = 18

    headers3 = [
        "№",
        "Xizmat yo'nalishi",
        "Provayder / Tizim",
        "Oylik taxminiy hajm",
        "O'rtacha 1 birlik narxi",
        "Oylik reja xarajati (UZS)",
        "Oylik reja xarajati (USD)"
    ]

    for col_num, h_text in enumerate(headers3, 1):
        cell = ws3.cell(row=4, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws3.row_dimensions[4].height = 28

    plan_data = [
        (1, "Rasmiy servis SMS xabarnomalari (UIN, chaqiruv)", "Mobiuz / Beeline / Ucell / Uzmobile", "10 000 ta SMS/oy", "~140 so'm / SMS", 1400000, "$109"),
        (2, "Sun'iy intellekt matn tahlili va fabula", "Google Gemini 1.5 Flash API", "~15 000 000 token/oy", "~1 500 so'm / 1M token", 120000, "$9"),
        (3, "Hujjatlar va to'lov cheklari skrinshot tahlili", "Google Gemini 1.5 Flash (Vision)", "~2 000 ta rasm/oy", "~1 920 so'm / 1M token", 50000, "$4"),
        (4, "Murakkab tergov xulosalari va tahlil", "Google Gemini 1.5 Pro API", "~3 000 000 token/oy", "~20 000 so'm / 1M token", 180000, "$14"),
        (5, "O'zbek tilidagi nutqni matnga aylantirish (STT)", "UzbekVoice.ai STT", "1 500 daqiqa/oy", "400 so'm / daqiqa", 600000, "$47"),
        (6, "O'zbek tilida ovozli javob qaytarish (TTS)", "UzbekVoice.ai TTS", "1 000 daqiqa/oy", "420 so'm / daqiqa", 420000, "$33"),
    ]

    for row_idx, row_values in enumerate(plan_data, start=5):
        for col_idx, val in enumerate(row_values, start=1):
            cell = ws3.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            if col_idx == 1:
                cell.alignment = align_center
            elif col_idx == 6:
                cell.alignment = align_right
                cell.number_format = '#,##0 "so\'m"'
            elif col_idx == 7:
                cell.alignment = align_right
            else:
                cell.alignment = align_left
        ws3.row_dimensions[row_idx].height = 20

    # Total row
    tot_row = 5 + len(plan_data)
    ws3.cell(row=tot_row, column=1, value="").border = double_bottom_border
    ws3.cell(row=tot_row, column=1).fill = total_fill
    c_tot = ws3.cell(row=tot_row, column=2, value="JAMI OYLIK XARAJATLAR (SMS + AI + OVOZ):")
    c_tot.font = font_bold
    c_tot.border = double_bottom_border
    c_tot.fill = total_fill

    for c in range(3, 6):
        ws3.cell(row=tot_row, column=c, value="").border = double_bottom_border
        ws3.cell(row=tot_row, column=c).fill = total_fill

    c_sum_uzs = ws3.cell(row=tot_row, column=6, value=f"=SUM(F5:F{tot_row-1})")
    c_sum_uzs.font = font_bold
    c_sum_uzs.alignment = align_right
    c_sum_uzs.number_format = '#,##0 "so\'m"'
    c_sum_uzs.border = double_bottom_border
    c_sum_uzs.fill = total_fill

    c_sum_usd = ws3.cell(row=tot_row, column=7, value="~$217 / oy")
    c_sum_usd.font = font_bold
    c_sum_usd.alignment = align_right
    c_sum_usd.border = double_bottom_border
    c_sum_usd.fill = total_fill
    ws3.row_dimensions[tot_row].height = 22

    # Auto-adjust column widths
    for col in ws3.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws3.column_dimensions[col_letter].width = max(max_len + 4, 12)
    ws3.column_dimensions['A'].width = 6
    ws3.column_dimensions['B'].width = 44
    ws3.column_dimensions['C'].width = 34
    ws3.column_dimensions['D'].width = 24
    ws3.column_dimensions['E'].width = 26
    ws3.column_dimensions['F'].width = 26
    ws3.column_dimensions['G'].width = 22

    # Save workbook
    wb.save(excel_path)
    print("Excel file created successfully at:", excel_path)

if __name__ == '__main__':
    create_pricing_excel()
