import os
import random
from datetime import datetime, timedelta
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.db_router import set_current_branch
set_current_branch('yashnobod')

from django.utils import timezone
from api.models import (
    Material, Officer, Department, AppealStep,
    Ekspertiza, Taqiq, CaseRequest
)

YASHNOBOD_MAHALLAS = [
    "alimkent_mahallasi", "aviashahar_mahallasi", "bahor_mahallasi", "barkamol_mahallasi",
    "beshariq_mahallasi", "birlashgan_mahallasi", "botkina_mahallasi", "boyqongir_mahallasi",
    "boston_mahallasi", "bunyodkor_mahallasi", "cholpon_mahallasi", "dilbog_mahallasi",
    "donishmand_mahallasi", "dostlik_mahallasi", "fayzobod_mahallasi", "fargona_mahallasi",
    "fidokor_mahallasi", "gozal_mahallasi", "jarqorgon_mahallasi", "jorabek_mahallasi",
    "katta_qoyliq_mahallasi", "koksaroy_mahallasi", "mahmur_mahallasi", "mashinasozlar_mahallasi",
    "mirishkor_mahallasi", "moynoq_mahallasi", "mumtoz_mahallasi", "navrozobod_mahallasi",
    "nodirabegim_mahallasi", "obod_makon_mahallasi", "olmos_mahallasi", "oltinkol_mahallasi",
    "oydinkol_mahallasi", "parkent_mahallasi", "qoshchinor_mahallasi", "semurg_mahallasi",
    "shirinobod_mahallasi", "shohona_mahallasi", "shohimardon_mahallasi", "shohsanam_mahallasi",
    "sholikor_mahallasi", "tabassum_mahallasi", "tong_mahallasi", "toqimachi_mahallasi",
    "tuzel_mahallasi", "uysozlar_mahallasi", "vatan_mahallasi", "yangi_davr_mahallasi",
    "yangi_hayot_mahallasi", "yangi_zamon_mahallasi", "yanginur_mahallasi", "yangiobod_mahallasi",
    "yashil_makon_mahallasi", "yashnobod_mahallasi", "yorboshi_mahallasi", "zafar_mahallasi",
    "zilola_mahallasi", "ziyo_yashnobod_mahallasi"
]

FIRST_NAMES_M = [
    "Aziz", "Bobur", "Jasur", "Sardor", "Farhod", "Rustam", "Sherzod", "Ulug'bek",
    "Shoxruh", "Otabek", "Sanjar", "Javohir", "Eldor", "Diyor", "Muzaffar", "Akmal",
    "Jamshid", "Bekzod", "Umid", "Alisher", "Nodir", "Dilshod", "Ilhom", "Mansur"
]
LAST_NAMES_M = [
    "Karimov", "Rahimov", "Toshmatov", "Alimov", "Yusupov", "Ahmedov", "Sultonov",
    "Qosimov", "Nazarov", "Xolmatov", "Ismoilov", "Abdullayev", "Ergashev", "Saidov",
    "Xudoyberdiyev", "Mirzayev", "G'aniyev", "Sobirov", "Yoqubov", "Normatov"
]
FIRST_NAMES_F = [
    "Nilufar", "Dilnoza", "Shahnoza", "Madina", "Gulnora", "Zilola", "Kamola",
    "Feruza", "Nargiza", "Umida", "Mohira", "Sevara", "Dildora", "Nodira", "Lola"
]
LAST_NAMES_F = [
    "Karimova", "Rahimova", "Toshmatova", "Alimova", "Yusupova", "Ahmedova", "Sultonova",
    "Qosimova", "Nazarova", "Xolmatova", "Ismoilova", "Abdullayeva", "Ergasheva", "Saidova"
]

CASE_TEMPLATES = [
    (
        "Avtomashinani noqonuniy olib qochish va yo'l-transport hodisasi sodir etish",
        "Неправомерное завладение автотранспортным средством и совершение ДТП",
        "267-modda 1-qismi"
    ),
    (
        "Telegram messenjeri orqali fuqaroning bank kartasidagi mablag'larni o'zlashtirish (kiberfiribgarlik)",
        "Хищение денежных средств с банковской карты через Telegram (кибермошенничество)",
        "168-modda 3-qismi"
    ),
    (
        "Ko'p qavatli uy hovlisida jamoat tartibini buzish va fuqarolarga tan jarohati yetkazish",
        "Нарушение общественного порядка и причинение телесных повреждений во дворе жилого дома",
        "277-modda 2-qismi"
    ),
    (
        "Katta miqdordagi qarz mablag'larini qaytarmasdan boshqa shaxsga o'tkazib yuborish holati",
        "Факт невозврата крупной суммы долга и передачи средств третьему лицу",
        "168-modda 2-qismi"
    ),
    (
        "Savdo do'konidan umumiy qiymati 4.500.000 so'mlik tovar-moddiy boyliklarni o'g'irlash",
        "Кража товарно-материальных ценностей на общую сумму 4 500 000 сумов из магазина",
        "169-modda 1-qismi"
    ),
    (
        "O'zaro janjal oqibatida qasddan badanga yengil tan jarohati yetkazish",
        "Умышленное причинение легкого телесного повреждения в ходе конфликта",
        "109-modda"
    ),
    (
        "Avtoturargohda turgan avtomobil oynasini sindirib ichidagi buyumlarni talon-taroj qilish",
        "Кража вещей из салона автомобиля с повреждением стекла на парковке",
        "169-modda 2-qismi"
    ),
    (
        "Qo'shnilar o'rtasida yer chegarasi va umumiy foydalanish joylari bo'yicha janjal",
        "Бытовой конфликт между соседями по вопросу границ участка и мест общего пользования",
        "boshqa"
    ),
    (
        "Fuqarolik pasporti va boshqa muhim shaxsiy hujjatlarni yo'qotganlik holati yuzasidan murojaat",
        "Обращение по факту утери общегражданского паспорта и личных документов",
        "hujjat_yoqotish"
    ),
    (
        "Tungi vaqtda osoyishtalikni buzish va ko'p qavatli uyda shovqin ko'tarish",
        "Нарушение тишины и покоя граждан в ночное время в многоквартирном доме",
        "ma'muriy_192"
    ),
    (
        "Kvartirani ijaraga berish bahonasida fuqaroning pulini aldov yo'li bilan qo'lga kiritish",
        "Завладение деньгами гражданина путем обмана под предлогом аренды квартиры",
        "168-modda 1-qismi"
    ),
    (
        "Uyali aloqa vositasini vaqtinchalik foydalanishga olib qaytarmasdan sotib yuborish",
        "Присвоение и продажа чужого мобильного телефона, взятого во временное пользование",
        "168-modda 1-qismi"
    ),
    (
        "Umumiy ovqatlanish shoxobchasida janjal va mulkka shikast yetkazish",
        "Хулиганство и повреждение имущества в пункте общественного питания",
        "277-modda 1-qismi"
    ),
    (
        "Piyodalar o'tish joyida yo'l-transport hodisasi va sog'liqqa zarar yetkazish",
        "Дорожно-транспортное происшествие на пешеходном переходе с причинением вреда здоровью",
        "266-modda 1-qismi"
    ),
    (
        "Qurilish ob'ektida mehnatni muhofaza qilish qoidalariga rioya etmaslik holati",
        "Обращение по поводу нарушения правил охраны труда на строительном объекте",
        "257-modda"
    ),
    (
        "Voyaga yetmagan shaxslar o'rtasida kelib chiqqan nizo va tan jarohati yetkazilishi",
        "Конфликт между несовершеннолетними с нанесением телесных повреждений",
        "109-modda"
    )
]

def generate_bulk_materials():
    print("Starting bulk material generation for Yashnobod...")
    
    # 1. Update top 3 materials to have proper Yashnobod mahallas if not set
    top_3 = list(Material.objects.filter(id__in=["MAT-2026-0001", "MAT-2026-0002", "MAT-2026-0003"]).order_by("id"))
    top_mahallas = ["alimkent_mahallasi", "aviashahar_mahallasi", "bahor_mahallasi"]
    for idx, m in enumerate(top_3):
        m.department_id = "yashnobod"
        if not m.mahalla:
            m.mahalla = top_mahallas[idx % len(top_mahallas)]
            m.save(update_fields=["department_id", "mahalla"])
            print(f"Updated top material {m.id} with mahalla: {m.mahalla}")

    # 2. Delete any materials above MAT-2026-0003
    deleted_count, _ = Material.objects.filter(id__gt="MAT-2026-0003").delete()
    print(f"Deleted {deleted_count} previous mock materials (> MAT-2026-0003)")

    # 3. Get Yashnobod investigators
    officers = list(Officer.objects.filter(department_id="yashnobod", role="investigator"))
    if not officers:
        officers = list(Officer.objects.filter(role="investigator"))
    print(f"Distributing across {len(officers)} investigators")

    yashnobod_dept = Department.objects.filter(id="yashnobod").first()

    # 4. Target count: 682 materials from MAT-2026-0004 to MAT-2026-0685
    start_num = 4
    total_new = 682  # total will be 3 + 682 = 685
    
    now = timezone.now()
    
    murojaat_sources = [
        'prezident_portal', 'iiv_murojat', 'iibb_murojat',
        'prakuratura', 'shaxsiy_qabul'
    ]

    materials_to_create = []
    appeals_to_create = []
    
    random.seed(2026) # reproducible

    for i in range(total_new):
        mat_id = f"MAT-2026-{start_num + i:04d}"
        
        # Gender and name
        if random.random() < 0.6:
            c_name = f"{random.choice(LAST_NAMES_M)} {random.choice(FIRST_NAMES_M)} {random.choice(FIRST_NAMES_M)} o'g'li"
        else:
            c_name = f"{random.choice(LAST_NAMES_F)} {random.choice(FIRST_NAMES_F)} {random.choice(FIRST_NAMES_M)} qizi"
        
        c_phone = f"+998 {random.choice([90, 91, 93, 94, 95, 97, 98, 99])} {random.randint(100, 999):03d}-{random.randint(10, 99):02d}-{random.randint(10, 99):02d}"
        
        # Case template
        tpl = random.choice(CASE_TEMPLATES)
        title_uz = tpl[0]
        title_ru = tpl[1]
        preliminary_article = tpl[2]
        
        # Date: registered within the last 30 days
        days_ago = random.randint(1, 30)
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        registered_at = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
        
        # Duration: 10, 20, or 30 days
        term_days = random.choice([10, 10, 10, 20, 30])
        deadline = registered_at + timedelta(days=term_days)
        
        # Determine status realistically based on deadline
        time_left_days = (deadline - now).total_seconds() / 86400.0
        
        # Status distribution:
        # ~50% closed_in_time, ~35% studying, ~10% approaching deadline, ~5% overdue
        rnd = random.random()
        if rnd < 0.50:
            status = 'закрыт_в_срок'
            closed_offset_days = random.randint(1, min(term_days, max(1, days_ago)))
            closed_at = registered_at + timedelta(days=closed_offset_days, hours=random.randint(1, 10))
            if closed_at > now:
                closed_at = now - timedelta(hours=random.randint(1, 12))
        elif rnd < 0.85:
            status = 'изучаемый'
            closed_at = None
        elif rnd < 0.95:
            status = 'срок_приближается'
            closed_at = None
            # adjust deadline so it is within 2 days of now
            deadline = now + timedelta(hours=random.randint(6, 48))
        else:
            status = 'срок_нарушен'
            closed_at = None
            # adjust deadline so it is already in the past
            deadline = now - timedelta(hours=random.randint(4, 72))
            
        # Material type & source (Taxonomy compliant)
        # ~55% e_material, ~45% murojaat
        if random.random() < 0.55:
            mat_type = 'e_material'
            source_from = 'e_material'
        else:
            mat_type = 'murojaat'
            source_from = random.choice(murojaat_sources)
            
        officer = officers[(start_num + i) % len(officers)]
        mahalla = YASHNOBOD_MAHALLAS[(start_num + i) % len(YASHNOBOD_MAHALLAS)]
        
        mat = Material(
            id=mat_id,
            citizen_name=c_name,
            citizen_phone=c_phone,
            title_ru=title_ru,
            title_uz=title_uz,
            registered_at=registered_at,
            deadline=deadline,
            closed_at=closed_at,
            status=status,
            officer=officer,
            department=yashnobod_dept,
            is_accepted=True,
            extension_count=1 if term_days > 10 else 0,
            difficulty=random.choice([1, 2, 3, 4, 5]),
            material_type=mat_type,
            source_from=source_from,
            iib='Яшнабод ТИИБ',
            preliminary_article=preliminary_article,
            mahalla=mahalla
        )
        materials_to_create.append(mat)

    print(f"Bulk creating {len(materials_to_create)} Material records...")
    Material.objects.bulk_create(materials_to_create, batch_size=200)

    # 5. Create AppealStep history for each material
    print("Creating AppealStep history...")
    for mat in materials_to_create:
        # Step 1: Ro'yxatga olindi
        appeals_to_create.append(AppealStep(
            material=mat,
            status="Material ro‘yxatga olindi",
            time=mat.registered_at
        ))
        # Step 2: Ijrochiga biriktirildi
        appeals_to_create.append(AppealStep(
            material=mat,
            status=f"Ijrochiga biriktirildi: {mat.officer.name_uz if mat.officer else 'Surishtiruvchi'}",
            time=mat.registered_at + timedelta(minutes=random.randint(15, 90))
        ))
        # Step 3: if closed
        if mat.closed_at:
            appeals_to_create.append(AppealStep(
                material=mat,
                status="Material yopildi (yakuniy qaror qabul qilindi)",
                time=mat.closed_at
            ))

    AppealStep.objects.bulk_create(appeals_to_create, batch_size=500)
    print(f"Created {len(appeals_to_create)} AppealStep entries.")

    # 6. Add some sample Ekspertizas, Taqiqlars, and CaseRequests
    sample_materials = materials_to_create[:80]
    ekspertizas = []
    taqiqs = []
    requests = []

    for idx, mat in enumerate(sample_materials):
        if idx % 3 == 0:
            ekspertizas.append(Ekspertiza(
                material=mat,
                type=random.choice(['sud_tibbiy', 'sud_biologik', 'sud_xatshunoslik', 'sud_texnik', 'sud_dnk']),
                subject=f"{mat.id} bo‘yicha sud ekspertizasi tayinlash",
                details="Tergovga qadar tekshiruv doirasida tayinlangan",
                status=random.choice(['tayinlangan', 'jarayonda', 'yakunlangan']),
                officer=mat.officer,
                started_at=mat.registered_at + timedelta(hours=3)
            ))
        if idx % 4 == 0:
            taqiqs.append(Taqiq(
                material=mat,
                type=random.choice(['mashina', 'mol_mulk', 'uy_joy']),
                subject=f"{mat.id} bo‘yicha mulkni xatlash / taqiq qo‘yish",
                details="Zararni qoplash maqsadida qo‘yilgan taqiq",
                status='amalda',
                officer=mat.officer,
                started_at=mat.registered_at + timedelta(hours=5)
            ))
        if idx % 2 == 0:
            requests.append(CaseRequest(
                material=mat,
                type=random.choice(['gai', 'notarius', 'kadastr', 'soliq']),
                subject=f"{mat.id} bo‘yicha idoralararo so‘rovnoma yuborildi",
                details="Tegishli ma'lumotlarni taqdim etish so'ralgan",
                status=random.choice(['yuborilgan', 'javob_kelgan']),
                officer=mat.officer,
                started_at=mat.registered_at + timedelta(hours=2)
            ))

    Ekspertiza.objects.bulk_create(ekspertizas)
    Taqiq.objects.bulk_create(taqiqs)
    CaseRequest.objects.bulk_create(requests)
    print(f"Created {len(ekspertizas)} Ekspertiza, {len(taqiqs)} Taqiq, {len(requests)} CaseRequest records.")

    # Verification
    final_count = Material.objects.count()
    top_5 = list(Material.objects.order_by('id')[:5])
    print(f"SUCCESS: Total materials in Yashnobod branch: {final_count}")
    print("Top 5 materials:")
    for m in top_5:
        docs = list(m.documents.values_list('original_name', flat=True))
        print(f"  {m.id} | {m.citizen_name} | {m.material_type} | {m.source_from} | {m.status} | docs: {docs}")

if __name__ == '__main__':
    generate_bulk_materials()
