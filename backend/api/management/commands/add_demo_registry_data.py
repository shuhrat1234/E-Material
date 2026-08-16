import random
import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import Officer, Material, CaseRequest, Ekspertiza, Taqiq

ZAPROS_SUBJECTS = {
    'gai': ['01 A 123 AA', '30 B 456 BB', '90 C 789 CC', '01 A 555 XY', '77 D 321 QW'],
    'notarius': ['Каримов Санжар Бахтиёрович', 'Юсупова Гулноза Рустамовна', 'Тошматов Одил Азизович'],
    'kadastr': ['Кадастр № 12:34:567890', 'Кадастр № 09:11:220034', 'Кадастр № 77:02:118800'],
    'soliq': ['ИНН 305123456', 'ИНН 301998877', 'ИНН 308445566'],
}
ZAPROS_DETAILS_RU = [
    'Установить собственника транспортного средства и историю перерегистраций.',
    'Проверить наличие обременений и ограничений на объект.',
    'Запросить сведения о доходах и уплаченных налогах за последние 3 года.',
    'Проверить подлинность доверенности и полномочия лица.',
]
ZAPROS_DETAILS_UZ = [
    "Transport vositasi egasi va qayta ro'yxatga olish tarixini aniqlash.",
    "Ob'ektga cheklovlar mavjudligini tekshirish.",
    "So'nggi 3 yildagi daromad va to'langan soliqlar bo'yicha ma'lumot so'rash.",
    "Ishonchnoma haqiqiyligi va shaxs vakolatlarini tekshirish.",
]
ZAPROS_RESPONSE_RU = 'Запрашиваемые сведения предоставлены в приложении к ответу.'
ZAPROS_RESPONSE_UZ = "So'ralgan ma'lumotlar javob ilovasida taqdim etildi."

EKSPERTIZA_SUBJECTS = [
    'Смыв с рук подозреваемого', 'Образец почерка в заявлении', 'Мобильный телефон потерпевшего',
    'Биологические следы на месте происшествия', 'Документ, представленный подозреваемым',
]
EKSPERTIZA_DETAILS_RU = [
    'Определить наличие следов пороховых газов.',
    'Установить принадлежность подписи заявленному лицу.',
    'Восстановить удалённые данные и определить время событий.',
    'Определить генетический профиль и сопоставить с базой данных.',
]
EKSPERTIZA_DETAILS_UZ = [
    "Porox gazlari izlari mavjudligini aniqlash.",
    "Imzoning tegishli shaxsga tegishliligini aniqlash.",
    "O'chirilgan ma'lumotlarni tiklash va voqealar vaqtini aniqlash.",
    "Genetik profilni aniqlash va ma'lumotlar bazasi bilan solishtirish.",
]
EKSPERTIZA_RESPONSE_RU = 'Экспертное заключение № {n} подготовлено, выводы приложены к материалу.'
EKSPERTIZA_RESPONSE_UZ = "{n}-sonli ekspert xulosasi tayyorlandi, xulosalar materialga ilova qilindi."
EXPERT_ORGS = ['Республиканский центр судебных экспертиз', 'Ташкентское бюро СМЭ', 'Центр криминалистики МВД']

TAQIQ_SUBJECTS = {
    'mashina': ['01 A 123 AA', '30 B 456 BB', '90 C 789 CC'],
    'mol_mulk': ['Торговое оборудование, 3 ед.', 'Строительная техника (экскаватор)', 'Банковский счёт № 2020xxxx'],
    'uy_joy': ['г. Ташкент, Олмазорский р-н, ул. Себзор, д. 12', 'г. Ташкент, Чиланзарский р-н, кв. 45'],
}
TAQIQ_DETAILS_RU = [
    'Постановление следователя № {n} от {d} о наложении ареста.',
    'Определение суда о принятии обеспечительных мер по делу.',
]
TAQIQ_DETAILS_UZ = [
    "{d} sanadagi tergovchining {n}-sonli mol-mulkka qamoq solish to'g'risidagi qarori.",
    "Ish bo'yicha ta'minlov choralarini qo'llash haqida sud ajrimi.",
]
TAQIQ_RESPONSE_RU = 'Ограничение снято на основании постановления об окончании производства.'
TAQIQ_RESPONSE_UZ = "Ta'qiq ishni yakunlash to'g'risidagi qaror asosida bekor qilindi."


def rand_date(days_back_max):
    return timezone.now() - datetime.timedelta(days=random.randint(0, days_back_max), hours=random.randint(0, 23))


class Command(BaseCommand):
    help = (
        'Adds demo Zapros/Ekspertiza/Taqiq registry entries linked to existing materials '
        'and officers, so the new sidebar pages have something to show. Purely additive '
        '— safe to run more than once.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--seed', type=int, default=None, help='Random seed for reproducible output.')
        parser.add_argument('--count', type=int, default=18, help='How many entries to create per registry (default 18).')

    def handle(self, *args, **options):
        if options['seed'] is not None:
            random.seed(options['seed'])
        count = options['count']

        officers = list(Officer.objects.filter(role='investigator'))
        materials = list(Material.objects.all())
        if not officers:
            self.stderr.write(self.style.ERROR('No investigator officers found — seed the base data first.'))
            return

        created = {'zapros': 0, 'ekspertiza': 0, 'taqiq': 0}

        # --- Zapros (CaseRequest) ---
        zapros_types = list(ZAPROS_SUBJECTS.keys())
        for i in range(count):
            ztype = random.choice(zapros_types)
            started = rand_date(30)
            status = random.choices(
                ['yuborilgan', 'javob_kelgan', 'rad_etilgan'], weights=[35, 50, 15]
            )[0]
            idx = random.randrange(len(ZAPROS_DETAILS_RU))
            obj = CaseRequest.objects.create(
                material=random.choice(materials) if materials and random.random() < 0.8 else None,
                type=ztype,
                subject=random.choice(ZAPROS_SUBJECTS[ztype]),
                details=f"{ZAPROS_DETAILS_RU[idx]} / {ZAPROS_DETAILS_UZ[idx]}",
                response_text=(ZAPROS_RESPONSE_RU + ' / ' + ZAPROS_RESPONSE_UZ) if status != 'yuborilgan' else '',
                status=status,
                officer=random.choice(officers),
                started_at=started,
                resolved_at=started + datetime.timedelta(days=random.randint(1, 10)) if status != 'yuborilgan' else None,
            )
            created['zapros'] += 1

        # --- Ekspertiza ---
        eksp_types = [t for t, _ in Ekspertiza.TYPE_CHOICES]
        for i in range(count):
            etype = random.choice(eksp_types)
            started = rand_date(40)
            status = random.choices(
                ['tayinlangan', 'jarayonda', 'yakunlangan'], weights=[25, 30, 45]
            )[0]
            idx = random.randrange(len(EKSPERTIZA_DETAILS_RU))
            n = random.randint(100, 999)
            obj = Ekspertiza.objects.create(
                material=random.choice(materials) if materials and random.random() < 0.8 else None,
                type=etype,
                subject=random.choice(EKSPERTIZA_SUBJECTS),
                details=f"{EKSPERTIZA_DETAILS_RU[idx]} / {EKSPERTIZA_DETAILS_UZ[idx]}",
                response_text=(EKSPERTIZA_RESPONSE_RU.format(n=n) + ' / ' + EKSPERTIZA_RESPONSE_UZ.format(n=n)) if status == 'yakunlangan' else '',
                status=status,
                officer=random.choice(officers),
                started_at=started,
                resolved_at=started + datetime.timedelta(days=random.randint(3, 21)) if status == 'yakunlangan' else None,
            )
            created['ekspertiza'] += 1

        # --- Taqiq ---
        taqiq_types = list(TAQIQ_SUBJECTS.keys())
        for i in range(count):
            ttype = random.choice(taqiq_types)
            started = rand_date(60)
            status = random.choices(['amalda', 'bekor_qilingan'], weights=[60, 40])[0]
            idx = random.randrange(len(TAQIQ_DETAILS_RU))
            n = random.randint(10, 99)
            d = started.strftime('%d.%m.%Y')
            obj = Taqiq.objects.create(
                material=random.choice(materials) if materials and random.random() < 0.8 else None,
                type=ttype,
                subject=random.choice(TAQIQ_SUBJECTS[ttype]),
                details=f"{TAQIQ_DETAILS_RU[idx].format(n=n, d=d)} / {TAQIQ_DETAILS_UZ[idx].format(n=n, d=d)}",
                response_text=(TAQIQ_RESPONSE_RU + ' / ' + TAQIQ_RESPONSE_UZ) if status == 'bekor_qilingan' else '',
                status=status,
                officer=random.choice(officers),
                started_at=started,
                resolved_at=started + datetime.timedelta(days=random.randint(5, 30)) if status == 'bekor_qilingan' else None,
            )
            created['taqiq'] += 1

        self.stdout.write(self.style.SUCCESS(
            f"Added {created['zapros']} zapros, {created['ekspertiza']} ekspertiza, {created['taqiq']} taqiq entries. "
            f"Totals now: {CaseRequest.objects.count()} / {Ekspertiza.objects.count()} / {Taqiq.objects.count()}."
        ))
