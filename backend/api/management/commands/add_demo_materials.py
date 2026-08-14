import random
import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import Department, Officer, Material, AppealStep

# Same 64 mahalla ids as frontend/src/data/olmazorMahallas.js, kept in sync manually
# since this command has no reason to depend on the frontend build.
ALL_MAHALLAS = [
    "84007_harbiy_qism", "abu_bakr_shoshiy_mahallasi", "achabod_mahallasi", "allon_mahallasi",
    "axil_maxallasi", "beruniy_1_dahasi", "beruniy_3_dahasi", "beruniy_mahallasi", "beshqorgon_1",
    "beshqorgon_2", "beshqorgon_3", "beshqorgon_4", "chigatoy_oqtepa_mahallasi",
    "chigatoy_darvoza_mahallasi", "chiltugon_mahallasi", "chimboy_dahasi", "chimboy_mahallasi",
    "chuqursoy", "chustiy_mahallasi", "eski_shahar_mahallasi", "gulzor_maxallasi",
    "guruch_ariq_mahallasi", "guzarboshi_mahallasi", "hazrati_imom_mahallasi", "hodjayev_dahasi",
    "hofiz_kuhakiy_mahallasi", "ibrohim_ota_mahallasi", "jiydali_mahallasi", "mirzo_golib_mahallasi",
    "miskin_mahallasi", "moyariq_mahallasi", "namuna_mahallasi", "nihol_mahallasi", "niyozov_dahasi",
    "olimpiya_dahasi", "orzu_turar_joy_mavzesi", "paxta_mahallasi", "qorakamish_1_1",
    "qorakamish_1_2", "qorakamish_1_3", "qorakamish_2_1", "qorakamish_2_4", "qorakamish_2_5",
    "qoraqamish_1_4", "qoraqamish_2_3_dahasi", "qorasaroy_mahallasi", "qushtut_mahallasi",
    "quyosh_mahallasi", "sebzor_c_17_c_18", "shifokorlar_shaharchasi", "shimoliy_olmazor",
    "talabalar_shaharchasi", "taraqqiyot_mahallasi", "tashgosmi_shifokorlar_dahasi", "umid_mahalla",
    "universitet_mahallasi", "xastimom_mahallasi", "xislat_mahallasi", "xonchorbog_mahallasi",
    "yangi_sebzor", "yangi_toshkent_mahallasi", "yuqori_beshkurgan_mahallasi", "yuqori_sebzor",
    "ziyo_mahallasi",
]

CITIZEN_FIRST = ['Алишер', 'Дилшод', 'Азиз', 'Шахзод', 'Фарход', 'Жасур', 'Botir', 'Rustam', 'Одил', 'Тимур',
                  'Гулноза', 'Зарина', 'Севара', 'Мадина', 'Нигора', 'Дилором', 'Sardor', 'Elyor', 'Кахрамон', 'Улугбек']
CITIZEN_LAST = ['Исмоилов', 'Рахимов', 'Юлдашев', 'Назаров', 'Абдуллаев', 'Тошматов', 'Каримов', 'Юсупов',
                 'Хамидов', 'Салимов', 'Эргашева', 'Норова', 'Собирова', 'Умаров', 'Turgunov']
CITIZEN_MID = ['Бахтиёрович', 'Шухратович', 'Рустамович', 'Улугбекович', 'Азизович', 'Бахтиёровна', 'Шухратовна', 'Рустамовна']

TITLES_RU = [
    'Заявление о краже мобильного телефона',
    'Обращение по факту кражи имущества из автомобиля',
    'Заявление о мошенничестве при купле-продаже',
    'Обращение по факту порчи имущества',
    'Заявление о нарушении общественного порядка',
    'Обращение по факту семейного конфликта',
    'Заявление о угрозе физической расправы',
    'Обращение по факту ДТП',
    'Заявление о незаконном проникновении в жилище',
    'Обращение по факту кражи велосипеда',
    'Заявление о вымогательстве',
    'Обращение по факту кражи со взломом',
    'Заявление о нанесении телесных повреждений',
    'Обращение по факту утери документов',
]
TITLES_UZ = [
    "Mobil telefon o'g'irlangani haqida ariza",
    "Avtomobildan mol-mulk o'g'irlangani haqida murojaat",
    "Oldi-sotdida firibgarlik haqida ariza",
    "Mol-mulk shikastlangani haqida murojaat",
    "Jamoat tartibini buzish haqida ariza",
    "Oilaviy nizo haqida murojaat",
    "Jismoniy tahdid haqida ariza",
    "YTH haqida murojaat",
    "Uyga noqonuniy kirish haqida ariza",
    "Velosiped o'g'irlangani haqida murojaat",
    "Tovlamachilik haqida ariza",
    "Uyga o'g'irlik yo'li bilan kirish haqida murojaat",
    "Tan jarohati yetkazilgani haqida ariza",
    "Hujjat yo'qolgani haqida murojaat",
]

STATUS_WEIGHTS = [
    ('изучаемый', 45),
    ('закрыт_в_срок', 35),
    ('срок_приближается', 12),
    ('срок_нарушен', 8),
]
TYPE_WEIGHTS = [('e_material', 65), ('murojaat', 35)]
SOURCE_BY_TYPE = {
    'e_material': ['e_material'],
    'murojaat': ['prezident_portal', 'iiv_murojat', 'iibb_murojat', 'prakuratura', 'shaxsiy_qabul'],
}


def weighted_choice(pairs):
    total = sum(w for _, w in pairs)
    r = random.uniform(0, total)
    upto = 0
    for val, w in pairs:
        upto += w
        if upto >= r:
            return val
    return pairs[-1][0]


class Command(BaseCommand):
    help = (
        'Adds demo materials spread across all Olmazor mahallas, for populating the '
        'crime map / dashboards with realistic-looking data. Purely additive: does not '
        'delete or modify any existing officer, user, or material. Safe to run more '
        'than once (it keeps adding more on top).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--seed', type=int, default=None,
            help='Random seed for reproducible output (omit for different data each run).',
        )

    def handle(self, *args, **options):
        if options['seed'] is not None:
            random.seed(options['seed'])

        dept, _ = Department.objects.get_or_create(
            id='so', defaults={'name_ru': 'Следственный отдел', 'name_uz': 'Tergov bolimi'}
        )

        investigators = list(Officer.objects.filter(role='investigator'))
        if not investigators:
            self.stderr.write(self.style.ERROR(
                'No investigator officers found — create at least one investigator account first.'
            ))
            return

        now = timezone.now()
        existing_ids = set(Material.objects.values_list('id', flat=True))
        counter = 1
        created_count = 0

        for mahalla in ALL_MAHALLAS:
            n = random.choices(
                [1, 2, 3, 4, 5, 6, 8, 10, 14, 18],
                weights=[6, 12, 14, 15, 13, 11, 10, 8, 6, 5],
            )[0]
            for _ in range(n):
                days_ago = random.randint(0, 35)
                reg_date = now - datetime.timedelta(days=days_ago, hours=random.randint(0, 23))
                deadline_days = random.choice([7, 10, 15, 20])
                deadline = reg_date + datetime.timedelta(days=deadline_days)

                status = weighted_choice(STATUS_WEIGHTS)
                if status == 'изучаемый' and deadline < now:
                    status = random.choice(['срок_нарушен', 'закрыт_в_срок'])
                if status == 'срок_нарушен' and deadline > now:
                    deadline = now - datetime.timedelta(days=random.randint(1, 5))
                if status == 'срок_приближается':
                    deadline = now + datetime.timedelta(days=random.randint(1, 3))

                mtype = weighted_choice(TYPE_WEIGHTS)
                source = random.choice(SOURCE_BY_TYPE[mtype])
                title_idx = random.randint(0, len(TITLES_RU) - 1)
                officer = random.choice(investigators)

                first = random.choice(CITIZEN_FIRST)
                last = random.choice(CITIZEN_LAST)
                mid = random.choice(CITIZEN_MID)
                phone = f"+9989{random.randint(0,9)}{random.randint(1000000,9999999)}"

                while True:
                    mat_id = f"MAT-2026-{counter:04d}"
                    counter += 1
                    if mat_id not in existing_ids:
                        existing_ids.add(mat_id)
                        break

                mat = Material.objects.create(
                    id=mat_id,
                    citizen_name=f"{last} {first} {mid}",
                    citizen_phone=phone,
                    title_ru=TITLES_RU[title_idx],
                    title_uz=TITLES_UZ[title_idx],
                    registered_at=reg_date,
                    deadline=deadline,
                    closed_at=(reg_date + datetime.timedelta(days=random.randint(1, deadline_days))) if status == 'закрыт_в_срок' else None,
                    status=status,
                    officer=officer,
                    department=dept,
                    is_accepted=True,
                    extension_count=random.choice([0, 0, 0, 1, 2]),
                    difficulty=random.randint(1, 5),
                    material_type=mtype,
                    source_from=source,
                    iib=str(random.randint(1, 5)),
                    preliminary_article=random.choice(['', '169 УК', '104 УК', '190 УК', '169 УК']),
                    mahalla=mahalla,
                )
                AppealStep.objects.create(material=mat, status='Обращение гражданина', time=reg_date)
                if status == 'закрыт_в_срок':
                    AppealStep.objects.create(material=mat, status='Отказ в ВУД', time=mat.closed_at or deadline)
                created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Added {created_count} materials. Total materials now: {Material.objects.count()}.'
        ))
