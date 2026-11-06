import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_pricing_excel():
    excel_path = "/Users/macbook/Desktop/E-Material/E-Material_SMS_va_Gemini_API_Narxlari.xlsx"
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # SHEET 1: YAGONA JADVAL (Faqat eng so'nggi Gemini 2.0 modeli bilan)
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "SMS va Gemini AI Narxlari"
    ws1.views.sheetView[0].showGridLines = True
    
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
    
    font_main_title = Font(name='Arial', size=13, bold=True, color='000000')
    font_sec_title = Font(name='Arial', size=10.5, bold=True, color='000000')
    font_subtitle = Font(name='Arial', size=9, italic=True, color='333333')
    font_header = Font(name='Arial', size=9.5, bold=True, color='000000')
    font_data = Font(name='Arial', size=9, color='000000')
    font_bold = Font(name='Arial', size=9, bold=True, color='000000')
    
    header_fill = PatternFill(start_color='F2F2F2', end_color='F2F2F2', fill_type='solid')
    total_fill = PatternFill(start_color='EBEBEB', end_color='EBEBEB', fill_type='solid')

    align_center = Alignment(horizontal='center', vertical='center')
    align_left = Alignment(horizontal='left', vertical='center')
    align_right = Alignment(horizontal='right', vertical='center')

    # Main Title
    ws1['A1'] = "«E-MATERIAL» TIZIMI: SMS XIZMATLARI VA GOOGLE GEMINI AI API NARXLARI SMETASI"
    ws1['A1'].font = font_main_title
    ws1['A2'] = "Toshkent shahri miqyosi (800+ foydalanuvchi va 40 000+ yillik aylanma) uchun rasmiy hisob-kitob (1 USD = 12 800 UZS)"
    ws1['A2'].font = font_subtitle
    ws1.row_dimensions[1].height = 24
    ws1.row_dimensions[2].height = 18

    # =============================================================
    # 1-JADVAL: SMS TARIFLARI VA 40 000 TA SMS HISOBLANISHI
    # =============================================================
    ws1['A4'] = "1. O'ZBEKISTON MOBIL OPERATORLARI BO'YICHA SMS TARIFLARI VA 40 000 TA SMS XARAJATI"
    ws1['A4'].font = font_sec_title
    ws1.row_dimensions[4].height = 22

    headers_sms = [
        "№",
        "Mobil operator nomi",
        "Servis (Xizmat) SMS narxi",
        "Reklama (Ommaviy) SMS narxi",
        "40 000 ta Servis SMS narxi (UZS)",
        "40 000 ta SMS (USD ekvivalenti)"
    ]

    for col_num, h_text in enumerate(headers_sms, 1):
        cell = ws1.cell(row=5, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[5].height = 26

    sms_operators = [
        (1, "Mobiuz (UMS)", 170, 370, 40000 * 170, "$531"),
        (2, "Beeline (Unitel)", 160, 350, 40000 * 160, "$500"),
        (3, "Ucell (COSCOM)", 160, 340, 40000 * 160, "$500"),
        (4, "Uzmobile (Uztelecom)", 145, 350, 40000 * 145, "$453"),
        (5, "Perfectum (RWC)", 110, 110, 40000 * 110, "$344"),
        (6, "Humans", 95, 95, 40000 * 95, "$297"),
    ]

    for row_idx, (num, op, s_price, a_price, tot_uzs, tot_usd) in enumerate(sms_operators, start=6):
        c1 = ws1.cell(row=row_idx, column=1, value=num)
        c1.alignment = align_center
        c1.font = font_data
        c1.border = thin_border

        c2 = ws1.cell(row=row_idx, column=2, value=op)
        c2.font = font_data
        c2.border = thin_border

        c3 = ws1.cell(row=row_idx, column=3, value=s_price)
        c3.font = font_data
        c3.alignment = align_right
        c3.number_format = '#,##0 "so\'m"'
        c3.border = thin_border

        c4 = ws1.cell(row=row_idx, column=4, value=a_price)
        c4.font = font_data
        c4.alignment = align_right
        c4.number_format = '#,##0 "so\'m"'
        c4.border = thin_border

        c5 = ws1.cell(row=row_idx, column=5, value=tot_uzs)
        c5.font = font_bold
        c5.alignment = align_right
        c5.number_format = '#,##0 "so\'m"'
        c5.border = thin_border

        c6 = ws1.cell(row=row_idx, column=6, value=tot_usd)
        c6.font = font_data
        c6.alignment = align_right
        c6.border = thin_border
        ws1.row_dimensions[row_idx].height = 19

    # SMS Summary Row
    row_sms_tot = 6 + len(sms_operators)
    ws1.cell(row=row_sms_tot, column=1, value="").border = double_bottom_border
    ws1.cell(row=row_sms_tot, column=1).fill = total_fill
    c_lbl = ws1.cell(row=row_sms_tot, column=2, value="O'RTACHA REJA NARXI (40 000 TA SMS):")
    c_lbl.font = font_bold
    c_lbl.border = double_bottom_border
    c_lbl.fill = total_fill

    c_avg_s = ws1.cell(row=row_sms_tot, column=3, value=140)
    c_avg_s.font = font_bold
    c_avg_s.alignment = align_right
    c_avg_s.number_format = '#,##0 "so\'m"'
    c_avg_s.border = double_bottom_border
    c_avg_s.fill = total_fill

    c_avg_a = ws1.cell(row=row_sms_tot, column=4, value=269)
    c_avg_a.font = font_bold
    c_avg_a.alignment = align_right
    c_avg_a.number_format = '#,##0 "so\'m"'
    c_avg_a.border = double_bottom_border
    c_avg_a.fill = total_fill

    c_tot_uzs = ws1.cell(row=row_sms_tot, column=5, value=40000 * 140)
    c_tot_uzs.font = font_bold
    c_tot_uzs.alignment = align_right
    c_tot_uzs.number_format = '#,##0 "so\'m"'
    c_tot_uzs.border = double_bottom_border
    c_tot_uzs.fill = total_fill

    c_tot_usd = ws1.cell(row=row_sms_tot, column=6, value="~$438 / oy")
    c_tot_usd.font = font_bold
    c_tot_usd.alignment = align_right
    c_tot_usd.border = double_bottom_border
    c_tot_usd.fill = total_fill
    ws1.row_dimensions[row_sms_tot].height = 22

    # =============================================================
    # 2-JADVAL: GOOGLE GEMINI 2.0 FLASH (FAQAT ENG SO'NGGI MODEL)
    # =============================================================
    row_ai_head = row_sms_tot + 2
    ws1.cell(row=row_ai_head, column=1, value="2. GOOGLE GEMINI AI API KEY TARIF REJASI (FAQAT ENG SO'NGGI MODEL: GEMINI 2.0 FLASH)").font = font_sec_title
    ws1.row_dimensions[row_ai_head].height = 22

    headers_ai = [
        "№",
        "Gemini modeli nomi",
        "So'rov turi (Token / Resurs)",
        "Narxi (USD / 1M token)",
        "Narxi (So'm / 1M token)",
        "Tizimdagi aniq vazifasi"
    ]

    for col_num, h_text in enumerate(headers_ai, 1):
        cell = ws1.cell(row=row_ai_head+1, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[row_ai_head+1].height = 26

    # ONLY LATEST GENERATION: GEMINI 2.0 FLASH
    gemini_details = [
        (1, "Gemini 2.0 Flash (Eng so'nggi avlod)", "Kiruvchi matn (Input Prompts)", "$0.100 / 1M", "1 280 so'm / 1M token", "Arizalar matnidan faktlarni ajratish, fabula tuzish, JK moddalarini aniqlash"),
        (2, "Gemini 2.0 Flash (Eng so'nggi avlod)", "Chiquvchi matn (Output Completion)", "$0.400 / 1M", "5 120 so'm / 1M token", "Tayyor qarorlar loyihasi, ekspert xulosalari va analitik ma'lumotnomalar"),
        (3, "Gemini 2.0 Flash (Multimodal)", "To'lov cheklari / Skrinshotlar (Rasm)", "$0.100 / 1M", "1 280 so'm / 1M token", "To'lov cheklari, bank kvitansiyalari va yozishmalar skrinshotlarini o'qish"),
        (4, "Gemini 2.0 Flash (Audio rejimi)", "Ovozli muloqot (Real vaqt)", "$0.700 / 1M", "8 960 so'm / 1M token", "Interaktiv AI-kiosk va raqamli avatar bilan jonli ovozli suhbat"),
    ]

    for row_idx, (num, m_name, req_type, p_usd, p_uzs, task_desc) in enumerate(gemini_details, start=row_ai_head+2):
        c1 = ws1.cell(row=row_idx, column=1, value=num)
        c1.alignment = align_center
        c1.font = font_data
        c1.border = thin_border

        c2 = ws1.cell(row=row_idx, column=2, value=m_name)
        c2.font = font_bold
        c2.border = thin_border

        c3 = ws1.cell(row=row_idx, column=3, value=req_type)
        c3.font = font_data
        c3.border = thin_border

        c4 = ws1.cell(row=row_idx, column=4, value=p_usd)
        c4.font = font_bold
        c4.alignment = align_right
        c4.border = thin_border

        c5 = ws1.cell(row=row_idx, column=5, value=p_uzs)
        c5.font = font_bold
        c5.alignment = align_right
        c5.border = thin_border

        c6 = ws1.cell(row=row_idx, column=6, value=task_desc)
        c6.font = font_data
        c6.border = thin_border
        ws1.row_dimensions[row_idx].height = 20

    # =============================================================
    # 3-JADVAL: 40 000 TA MATERIAL UCHUN YIG'MA OYLIK SMETA
    # =============================================================
    row_sum_head = row_ai_head + 2 + len(gemini_details) + 2
    ws1.cell(row=row_sum_head, column=1, value="3. 40 000 TA MATERIAL AYLANMASI UCHUN YIG'MA OYLIK XARAJATLAR REJASI").font = font_sec_title
    ws1.row_dimensions[row_sum_head].height = 22

    headers_tot = [
        "№",
        "Xizmat yo'nalishi",
        "Tizim / Provayder",
        "Oylik reja hajmi",
        "Oylik xarajat (UZS)",
        "Oylik xarajat (USD)"
    ]

    for col_num, h_text in enumerate(headers_tot, 1):
        cell = ws1.cell(row=row_sum_head+1, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[row_sum_head+1].height = 26

    grand_breakdown = [
        (1, "Rasmiy servis SMS xabarlari (UIN, chaqiruv, qaror)", "Mobiuz / Beeline / Ucell / Uzmobile", "40 000 ta SMS", 5600000, "$438"),
        (2, "Sun'iy intellekt tahlili, fabula va cheklar", "Google Gemini 2.0 Flash (Eng so'nggi)", "~30 000 000 token", 250000, "$20"),
        (3, "O'zbek tilidagi nutqni matnga aylantirish (STT)", "UzbekVoice.ai STT", "1 500 daqiqa", 600000, "$47"),
        (4, "O'zbek tilida ovozli javob qaytarish (TTS)", "UzbekVoice.ai TTS", "1 000 daqiqa", 420000, "$33"),
    ]

    for row_idx, (num, s_name, p_name, vol, u_uzs, u_usd) in enumerate(grand_breakdown, start=row_sum_head+2):
        c1 = ws1.cell(row=row_idx, column=1, value=num)
        c1.alignment = align_center
        c1.font = font_data
        c1.border = thin_border

        c2 = ws1.cell(row=row_idx, column=2, value=s_name)
        c2.font = font_data
        c2.border = thin_border

        c3 = ws1.cell(row=row_idx, column=3, value=p_name)
        c3.font = font_bold if "Gemini" in p_name else font_data
        c3.border = thin_border

        c4 = ws1.cell(row=row_idx, column=4, value=vol)
        c4.font = font_data
        c4.alignment = align_center
        c4.border = thin_border

        c5 = ws1.cell(row=row_idx, column=5, value=u_uzs)
        c5.font = font_bold
        c5.alignment = align_right
        c5.number_format = '#,##0 "so\'m"'
        c5.border = thin_border

        c6 = ws1.cell(row=row_idx, column=6, value=u_usd)
        c6.font = font_data
        c6.alignment = align_right
        c6.border = thin_border
        ws1.row_dimensions[row_idx].height = 20

    # Grand Total Row
    row_grand_tot = row_sum_head + 2 + len(grand_breakdown)
    ws1.cell(row=row_grand_tot, column=1, value="").border = double_bottom_border
    ws1.cell(row=row_grand_tot, column=1).fill = total_fill

    c_g_lbl = ws1.cell(row=row_grand_tot, column=2, value="JAMI OYLIK XARAJATLAR (40 000 SMS + GEMINI 2.0 + OVOZ):")
    c_g_lbl.font = font_bold
    c_g_lbl.border = double_bottom_border
    c_g_lbl.fill = total_fill

    for c in range(3, 5):
        ws1.cell(row=row_grand_tot, column=c, value="").border = double_bottom_border
        ws1.cell(row=row_grand_tot, column=c).fill = total_fill

    c_g_uzs = ws1.cell(row=row_grand_tot, column=5, value=f"=SUM(E{row_sum_head+2}:E{row_grand_tot-1})")
    c_g_uzs.font = font_bold
    c_g_uzs.alignment = align_right
    c_g_uzs.number_format = '#,##0 "so\'m"'
    c_g_uzs.border = double_bottom_border
    c_g_uzs.fill = total_fill

    c_g_usd = ws1.cell(row=row_grand_tot, column=6, value="~$537 / oy")
    c_g_usd.font = font_bold
    c_g_usd.alignment = align_right
    c_g_usd.border = double_bottom_border
    c_g_usd.fill = total_fill
    ws1.row_dimensions[row_grand_tot].height = 24

    # Column widths
    ws1.column_dimensions['A'].width = 6
    ws1.column_dimensions['B'].width = 40
    ws1.column_dimensions['C'].width = 34
    ws1.column_dimensions['D'].width = 28
    ws1.column_dimensions['E'].width = 30
    ws1.column_dimensions['F'].width = 48

    # Save
    wb.save(excel_path)
    print("Excel with ONLY latest Gemini 2.0 model created successfully at:", excel_path)

if __name__ == '__main__':
    create_pricing_excel()
