import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_pricing_excel():
    excel_path = "/Users/macbook/Desktop/E-Material/E-Material_SMS_va_Gemini_API_Narxlari.xlsx"
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # SHEET 1: YAGONA JADVAL (Server 650 mln + SMS 40k + Gemini 2.0)
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "Server va Oylik Xarajatlar"
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
    font_subtitle = Font(name='Arial', size=8.5, italic=True, color='333333')
    font_header = Font(name='Arial', size=9, bold=True, color='000000')
    font_data = Font(name='Arial', size=8.5, color='000000')
    font_bold = Font(name='Arial', size=8.5, bold=True, color='000000')
    
    header_fill = PatternFill(start_color='F2F2F2', end_color='F2F2F2', fill_type='solid')
    total_fill = PatternFill(start_color='EBEBEB', end_color='EBEBEB', fill_type='solid')

    align_center = Alignment(horizontal='center', vertical='center')
    align_left = Alignment(horizontal='left', vertical='center')
    align_right = Alignment(horizontal='right', vertical='center')

    # Main Title
    ws1['A1'] = "«E-MATERIAL» TIZIMI: SERVER USKUNASI VA OYLIK XIZMATLAR (SMS + GEMINI AI) SMETASI"
    ws1['A1'].font = font_main_title
    ws1['A2'] = "HPE ProLiant DL380 Gen11 Server xaridi va oylik ekspluatatsiya xarajatlari (1 USD = 12 800 UZS kursi bo'yicha)"
    ws1['A2'].font = font_subtitle
    ws1.row_dimensions[1].height = 24
    ws1.row_dimensions[2].height = 18

    # =============================================================
    # 1-JADVAL: HPE PROLIANT DL380 GEN11 SERVER USKUNASI (821 071 500 SO'M)
    # =============================================================
    ws1['A4'] = "1. ASOSIY SERVER USKUNASI SPETSIFIKATSIYASI (HPE PROLIANT DL380 GEN11 12 LFF + 2 SFF NVME — BIR MARTALIK XARID)"
    ws1['A4'].font = font_sec_title
    ws1.row_dimensions[4].height = 22

    headers_server = [
        "№",
        "Komponent nomi",
        "Aniq texnik spetsifikatsiyasi",
        "Soni",
        "Vazifasi va afzalligi"
    ]

    for col_num, h_text in enumerate(headers_server, 1):
        cell = ws1.cell(row=5, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[5].height = 24

    server_specs = [
        (1, "Server modeli va korpusi", "HPE ProLiant DL380 Gen11 12 LFF + 2 SFF SATA/SAS/NVMe 2U Rack Server", "1 dona", "2U sanoat darajasidagi korpus: 12 ta LFF (HDD) va 2 ta SFF (NVMe) uya"),
        (2, "Markaziy protsessor (CPU)", "2x Intel Xeon Gold 6542Y (48 yadro / 96 oqim, 2.9 - 4.1 GHz, 120MB Cache)", "2 dona", "5-avlod Xeon Scalable: parallel 1000+ so'rovlar, fon hisob-kitoblari va tahlil"),
        (3, "Tezkor xotira (RAM)", "512 GB: 16x 32GB DDR5-5200MHz ECC Registered RDIMM", "16 dona", "Yuqori tezlikdagi DDR5 xotira: PostgreSQL MB, Redis kesh va virtualizatsiya"),
        (4, "Tizim yuklash diski (OS Boot)", "HPE NS204i-u Gen11 NVMe Hot Plug Boot Device + 2x 480GB NVMe SSD (RAID 1)", "1 kompl.", "Proxmox VE gipervizori uchun ajratilgan alohida apparatli xavfsiz yuklovchi"),
        (5, "Virtual mashinalar diski (VMs)", "2x 1.92 TB NVMe U.3 Enterprise SSD (RAID 1 apparatli oyna)", "2 dona", "Yuqori tezlikdagi U.3 NVMe: o'ta tezkor DB tranzaksiyalari va virtual mashinalar"),
        (6, "Ma'lumotlar arxivi (Data Storage)", "10x 24 TB Enterprise SAS/SATA HDD, 7200 RPM (RAID 10, 120 TB foydali hajm)", "10 dona", "Kiber ashyoviy dalillar, to'lov ko'chirmalari, audio/video arxivlar ombori"),
        (7, "Apparatli RAID kontroller", "HPE SR932i-p Gen10 Plus x32 Lanes 8GB Wide Cache NVMe/SAS 24G PCIe4 x16", "1 dona", "Flagman Tri-Mode kontroller: 8GB kesh va 32 ta liniya bilan maksimal tezlik"),
        (8, "Kontroller zaxira batareyasi", "HPE 96W Smart Storage Lithium-ion Battery with 145mm Cable", "1 dona", "Elektr toki uzilganda 8GB keshdagi ma'lumotlarni to'liq saqlab qoluvchi BBU"),
        (9, "Tarmoq adapteri (Network)", "HPE Ethernet 10Gb 2-port SFP+ Adapter", "1 dona", "Optik tolali 10 Gbit/s o'tkazuvchanlikka ega yuqori tezlikdagi tarmoq portlari"),
        (10, "Elektr ta'minoti (PSU)", "2x 1600W HPE Flex Slot Platinum Hot-Plug Redundant Power Supply (1+1)", "2 dona", "Ikkita mustaqil 1600W quvvat bloki: biri ishdan chiqqanda uzluksiz ishlash"),
    ]

    for row_idx, (num, comp, spec, qty, desc) in enumerate(server_specs, start=6):
        c1 = ws1.cell(row=row_idx, column=1, value=num)
        c1.alignment = align_center
        c1.font = font_data
        c1.border = thin_border

        c2 = ws1.cell(row=row_idx, column=2, value=comp)
        c2.font = font_bold
        c2.border = thin_border

        c3 = ws1.cell(row=row_idx, column=3, value=spec)
        c3.font = font_data
        c3.border = thin_border

        c4 = ws1.cell(row=row_idx, column=4, value=qty)
        c4.alignment = align_center
        c4.font = font_data
        c4.border = thin_border

        c5 = ws1.cell(row=row_idx, column=5, value=desc)
        c5.font = font_data
        c5.border = thin_border
        ws1.row_dimensions[row_idx].height = 19

    # Server Total Row
    row_srv_tot = 6 + len(server_specs)
    ws1.cell(row=row_srv_tot, column=1, value="").border = double_bottom_border
    ws1.cell(row=row_srv_tot, column=1).fill = total_fill

    c_srv_lbl = ws1.cell(row=row_srv_tot, column=2, value="HPE PROLIANT DL380 GEN11 JAMI QIYMATI:")
    c_srv_lbl.font = font_bold
    c_srv_lbl.border = double_bottom_border
    c_srv_lbl.fill = total_fill

    c_srv_sub = ws1.cell(row=row_srv_tot, column=3, value="To'liq komplektatsiya (QQS 12% va 36 oy rasmiy kafolat bilan)")
    c_srv_sub.font = font_bold
    c_srv_sub.border = double_bottom_border
    c_srv_sub.fill = total_fill

    ws1.cell(row=row_srv_tot, column=4, value="1 komplekt").border = double_bottom_border
    ws1.cell(row=row_srv_tot, column=4).alignment = align_center
    ws1.cell(row=row_srv_tot, column=4).font = font_bold
    ws1.cell(row=row_srv_tot, column=4).fill = total_fill

    c_srv_price = ws1.cell(row=row_srv_tot, column=5, value="821 071 500 UZS (~$64 146)")
    c_srv_price.font = font_bold
    c_srv_price.alignment = align_right
    c_srv_price.border = double_bottom_border
    c_srv_price.fill = total_fill
    ws1.row_dimensions[row_srv_tot].height = 24

    # =============================================================
    # 2-JADVAL: SMS TARIFLARI VA 40 000 TA SMS HISOBLANISHI
    # =============================================================
    row_sms_head = row_srv_tot + 2
    ws1.cell(row=row_sms_head, column=1, value="2. O'ZBEKISTON MOBIL OPERATORLARI BO'YICHA 40 000 TA SERVIS SMS XARAJATLARI").font = font_sec_title
    ws1.row_dimensions[row_sms_head].height = 22

    headers_sms = [
        "№",
        "Mobil operator nomi",
        "1 ta Servis SMS narxi",
        "1 ta Reklama SMS narxi",
        "40 000 ta SMS narxi (UZS va USD ekvivalenti)"
    ]

    for col_num, h_text in enumerate(headers_sms, 1):
        cell = ws1.cell(row=row_sms_head+1, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[row_sms_head+1].height = 24

    sms_operators = [
        (1, "Mobiuz (UMS)", 170, 370, "6 800 000 so'm ($531)"),
        (2, "Beeline (Unitel)", 160, 350, "6 400 000 so'm ($500)"),
        (3, "Ucell (COSCOM)", 160, 340, "6 400 000 so'm ($500)"),
        (4, "Uzmobile (Uztelecom)", 145, 350, "5 800 000 so'm ($453)"),
        (5, "Perfectum (RWC)", 110, 110, "4 400 000 so'm ($344)"),
        (6, "Humans", 95, 95, "3 800 000 so'm ($297)"),
    ]

    for idx, (num, op, s_price, a_price, tot_str) in enumerate(sms_operators, start=row_sms_head+2):
        c1 = ws1.cell(row=idx, column=1, value=num)
        c1.alignment = align_center
        c1.font = font_data
        c1.border = thin_border

        c2 = ws1.cell(row=idx, column=2, value=op)
        c2.font = font_data
        c2.border = thin_border

        c3 = ws1.cell(row=idx, column=3, value=s_price)
        c3.font = font_data
        c3.alignment = align_right
        c3.number_format = '#,##0 "so\'m"'
        c3.border = thin_border

        c4 = ws1.cell(row=idx, column=4, value=a_price)
        c4.font = font_data
        c4.alignment = align_right
        c4.number_format = '#,##0 "so\'m"'
        c4.border = thin_border

        c5 = ws1.cell(row=idx, column=5, value=tot_str)
        c5.font = font_bold
        c5.alignment = align_right
        c5.border = thin_border
        ws1.row_dimensions[idx].height = 19

    # SMS Summary Row
    row_sms_tot = row_sms_head + 2 + len(sms_operators)
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

    c_tot_uzs = ws1.cell(row=row_sms_tot, column=5, value="5 600 000 so'm (~$438 / oy)")
    c_tot_uzs.font = font_bold
    c_tot_uzs.alignment = align_right
    c_tot_uzs.border = double_bottom_border
    c_tot_uzs.fill = total_fill
    ws1.row_dimensions[row_sms_tot].height = 22

    # =============================================================
    # 3-JADVAL: GOOGLE GEMINI 2.0 FLASH (ENG SO'NGGI MODEL)
    # =============================================================
    row_ai_head = row_sms_tot + 2
    ws1.cell(row=row_ai_head, column=1, value="3. GOOGLE GEMINI AI API KEY TARIF REJASI (ENG SO'NGGI MODEL: GEMINI 2.0 FLASH)").font = font_sec_title
    ws1.row_dimensions[row_ai_head].height = 22

    headers_ai = [
        "№",
        "Gemini modeli nomi",
        "So'rov turi (Token / Resurs)",
        "Narxi (USD / 1M token)",
        "Narxi (So'm / 1M token va vazifasi)"
    ]

    for col_num, h_text in enumerate(headers_ai, 1):
        cell = ws1.cell(row=row_ai_head+1, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[row_ai_head+1].height = 24

    gemini_details = [
        (1, "Gemini 2.0 Flash (Eng so'nggi avlod)", "Kiruvchi matn (Input Prompts)", "$0.100 / 1M", "1 280 so'm / 1M token — Arizalar matnidan faktlarni ajratish, fabula tuzish"),
        (2, "Gemini 2.0 Flash (Eng so'nggi avlod)", "Chiquvchi matn (Output Completion)", "$0.400 / 1M", "5 120 so'm / 1M token — Qaror loyihalari, xulosa va jadvallarni shakllantirish"),
        (3, "Gemini 2.0 Flash (Multimodal)", "To'lov cheklari / Skrinshotlar (Rasm)", "$0.100 / 1M", "1 280 so'm / 1M token — Cheklar, kvitansiyalar va skrinshotlarni tanish"),
        (4, "Gemini 2.0 Flash (Audio rejimi)", "Ovozli muloqot (Real vaqt)", "$0.700 / 1M", "8 960 so'm / 1M token — AI-kiosk va raqamli avatar bilan jonli ovozli suhbat"),
    ]

    for row_idx, (num, m_name, req_type, p_usd, desc_uzs) in enumerate(gemini_details, start=row_ai_head+2):
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

        c5 = ws1.cell(row=row_idx, column=5, value=desc_uzs)
        c5.font = font_data
        c5.border = thin_border
        ws1.row_dimensions[row_idx].height = 20

    # =============================================================
    # 4-JADVAL: YIG'MA SMETA (SERVER XARIDI + OYLIK XIZMATLAR)
    # =============================================================
    row_sum_head = row_ai_head + 2 + len(gemini_details) + 2
    ws1.cell(row=row_sum_head, column=1, value="4. YIG'MA SMETA: SERVER USKUNASI SOTIB OLISH VA OYLIK XIZMATLAR").font = font_sec_title
    ws1.row_dimensions[row_sum_head].height = 22

    headers_tot = [
        "№",
        "Xarajat moddasi / Xizmat turi",
        "Tizim / Qurilma",
        "To'lov tartibi va hajmi",
        "Umumiy qiymati (UZS va USD ekvivalenti)"
    ]

    for col_num, h_text in enumerate(headers_tot, 1):
        cell = ws1.cell(row=row_sum_head+1, column=col_num, value=h_text)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws1.row_dimensions[row_sum_head+1].height = 24

    grand_breakdown = [
        (1, "HPE ProLiant DL380 Gen11 Server xaridi", "2x 6542Y / 512GB RAM / 120TB RAID10 + NVMe", "Bir martalik to'lov (Mulkiy xarid)", "821 071 500 so'm (~$64 146)"),
        (2, "Rasmiy servis SMS xabarlari (UIN, chaqiruv)", "Mobiuz / Beeline / Ucell / Uzmobile", "Oylik xizmat (40 000 ta SMS)", "5 600 000 so'm / oy (~$438)"),
        (3, "Google Gemini 2.0 Flash AI tahlili va fabula", "Gemini 2.0 Flash API Key", "Oylik xizmat (~30M token)", "250 000 so'm / oy (~$20)"),
        (4, "Ovozni matnga aylantirish (STT)", "UzbekVoice.ai STT", "Oylik xizmat (1 500 daqiqa)", "600 000 so'm / oy (~$47)"),
        (5, "Ovozli javob qaytarish (TTS)", "UzbekVoice.ai TTS", "Oylik xizmat (1 000 daqiqa)", "420 000 so'm / oy (~$33)"),
    ]

    for row_idx, (num, s_name, p_name, vol, u_str) in enumerate(grand_breakdown, start=row_sum_head+2):
        c1 = ws1.cell(row=row_idx, column=1, value=num)
        c1.alignment = align_center
        c1.font = font_data
        c1.border = thin_border

        c2 = ws1.cell(row=row_idx, column=2, value=s_name)
        c2.font = font_bold if num == 1 else font_data
        c2.border = thin_border

        c3 = ws1.cell(row=row_idx, column=3, value=p_name)
        c3.font = font_data
        c3.border = thin_border

        c4 = ws1.cell(row=row_idx, column=4, value=vol)
        c4.font = font_bold if num == 1 else font_data
        c4.border = thin_border

        c5 = ws1.cell(row=row_idx, column=5, value=u_str)
        c5.font = font_bold
        c5.alignment = align_right
        c5.border = thin_border
        ws1.row_dimensions[row_idx].height = 20

    # Grand Total Box
    row_grand_tot = row_sum_head + 2 + len(grand_breakdown)
    ws1.cell(row=row_grand_tot, column=1, value="").border = double_bottom_border
    ws1.cell(row=row_grand_tot, column=1).fill = total_fill

    c_g_lbl = ws1.cell(row=row_grand_tot, column=2, value="XULOSA: BIR MARTALIK VA OYLIK XARAJATLAR:")
    c_g_lbl.font = font_bold
    c_g_lbl.border = double_bottom_border
    c_g_lbl.fill = total_fill

    c_g_cap = ws1.cell(row=row_grand_tot, column=3, value="SERVER USKUNASI: 821 071 500 UZS")
    c_g_cap.font = font_bold
    c_g_cap.border = double_bottom_border
    c_g_cap.fill = total_fill

    c_g_op = ws1.cell(row=row_grand_tot, column=4, value="OYLIK XIZMATLAR:")
    c_g_op.font = font_bold
    c_g_op.border = double_bottom_border
    c_g_op.fill = total_fill

    c_g_val = ws1.cell(row=row_grand_tot, column=5, value="6 870 000 UZS / oy (~$537 / oy)")
    c_g_val.font = font_bold
    c_g_val.alignment = align_right
    c_g_val.border = double_bottom_border
    c_g_val.fill = total_fill
    ws1.row_dimensions[row_grand_tot].height = 24

    # Column widths
    ws1.column_dimensions['A'].width = 6
    ws1.column_dimensions['B'].width = 36
    ws1.column_dimensions['C'].width = 46
    ws1.column_dimensions['D'].width = 24
    ws1.column_dimensions['E'].width = 46

    # Save
    wb.save(excel_path)
    print("Excel with 821M HPE Gen11 server created successfully at:", excel_path)

if __name__ == '__main__':
    create_pricing_excel()
