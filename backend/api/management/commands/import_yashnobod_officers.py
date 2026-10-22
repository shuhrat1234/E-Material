import os
import zipfile
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from api.models import Department, Officer

OFFICERS_DATA = [
    {
        "file": "1. Бекназаров Бекзод Салимович.docx",
        "username": "boshliq-yashnobod",
        "name_uz": "Beknazarov Bekzod Salimovich",
        "name_ru": "Бекназаров Бекзод Салимович",
        "rank_uz": "Mayor",
        "rank_ru": "Майор",
        "role": "chief",
        "phone": "+998 90 000-01-01",
        "photo_initials": "Б.Б.",
        "docx": True,
    },
    {
        "file": "Хазратов Асрор Бекташевич.docx",
        "username": "asror-xazratov",
        "name_uz": "Xazratov Asror Bektashevich",
        "name_ru": "Хазратов Асрор Бекташевич",
        "rank_uz": "Podpolkovnik",
        "rank_ru": "Подполковник",
        "role": "investigator",
        "phone": "+998 90 101-02-03",
        "photo_initials": "X.A.",
        "docx": True,
    },
    {
        "file": "Умаржонов Азизжон Қосимович.docx",
        "username": "azizjon-umarjonov",
        "name_uz": "Umarjonov Azizjon Qosimovich",
        "name_ru": "Умаржонов Азизжон Косимович",
        "rank_uz": "Mayor",
        "rank_ru": "Майор",
        "role": "investigator",
        "phone": "+998 90 202-03-04",
        "photo_initials": "У.А.",
        "docx": True,
    },
    {
        "file": "Қодиров Аслиддин Худойбердиевич.docx",
        "username": "asliddin-qodirov",
        "name_uz": "Qodirov Asliddin Xudoyberdiyevich",
        "name_ru": "Кодиров Аслиддин Худойбердиевич",
        "rank_uz": "Kapitan",
        "rank_ru": "Капитан",
        "role": "investigator",
        "phone": "+998 90 303-04-05",
        "photo_initials": "Қ.А.",
        "docx": True,
    },
    {
        "file": "Ашуров Музаффаржон Мухаматжонович.docx",
        "username": "muzaffarjon-ashurov",
        "name_uz": "Ashurov Muzaffarjon Muxamatjonovich",
        "name_ru": "Ашуров Музаффаржон Мухаматжонович",
        "rank_uz": "Kapitan",
        "rank_ru": "Капитан",
        "role": "investigator",
        "phone": "+998 90 404-05-06",
        "photo_initials": "А.М.",
        "docx": True,
    },
    {
        "file": "Алижонов Нодирбек Хасанбой ўғли+.docx",
        "username": "nodirbek-alijonov",
        "name_uz": "Alijonov Nodirbek Hasanboy o'g'li",
        "name_ru": "Алижонов Нодирбек Хасанбой угли",
        "rank_uz": "Katta leytenant",
        "rank_ru": "Катта лейтенант",
        "role": "investigator",
        "phone": "+998 94 998-30-38",
        "photo_initials": "А.Н.",
        "docx": True,
    },
    {
        "file": "Зиёбеков Элмурод Нурлан ўғли.docx",
        "username": "elmurod-ziyobekov",
        "name_uz": "Ziyobekov Elmurod Nurlan o'g'li",
        "name_ru": "Зиёбеков Элмурод Нурлан угли",
        "rank_uz": "Katta leytenant",
        "rank_ru": "Катта лейтенант",
        "role": "investigator",
        "phone": "+998 90 505-06-07",
        "photo_initials": "З.Э.",
        "docx": True,
    },
    {
        "file": "Иброхимов Оловиддин Шерали ўғли+.docx",
        "username": "olouddin-ibrohimov",
        "name_uz": "Ibrohimov Oloviddin Sherali o'g'li",
        "name_ru": "Иброхимов Оловиддин Шерали угли",
        "rank_uz": "Katta leytenant",
        "rank_ru": "Катта лейтенант",
        "role": "investigator",
        "phone": "+998 90 606-07-08",
        "photo_initials": "И.О.",
        "docx": True,
    },
    {
        "file": "Омонов Қиличбек Умаржон ўғли+.docx",
        "username": "qilichbek-omonov",
        "name_uz": "Omonov Qilichbek Umarjon o'g'li",
        "name_ru": "Омонов Киличбек Умаржон угли",
        "rank_uz": "Katta leytenant",
        "rank_ru": "Катта лейтенант",
        "role": "investigator",
        "phone": "+998 90 707-08-09",
        "photo_initials": "О.Қ.",
        "docx": True,
    },
    {
        "file": "Шайхов Шайхзод Бурғон ўғли.docx",
        "username": "shayxzod-shayxov",
        "name_uz": "Shayxov Shayxzod Burhon o'g'li",
        "name_ru": "Шайхов Шайхзод Бургон угли",
        "rank_uz": "Katta leytenant",
        "rank_ru": "Катта лейтенант",
        "role": "investigator",
        "phone": "+998 90 808-09-10",
        "photo_initials": "Ш.Ш.",
        "docx": True,
    },
    {
        "file": "Қаҳрамонов Дониёр Тўлқин ўғли.doc",
        "username": "doniyor-qahramonov",
        "name_uz": "Qahramonov Doniyor To'lqin o'g'li",
        "name_ru": "Кахрамонов Дониёр Тулкин угли",
        "rank_uz": "Katta leytenant",
        "rank_ru": "Катта лейтенант",
        "role": "investigator",
        "phone": "+998 90 909-10-11",
        "photo_initials": "Қ.Д.",
        "docx": False,
    },
    {
        "file": "Алимжонов Хожиакбар Ўткирбекович.doc",
        "username": "xojiakbar-alimjonov",
        "name_uz": "Alimjonov Xojiakbar O'tkirbekovich",
        "name_ru": "Алимжонов Хожиакбар Уткирбекович",
        "rank_uz": "Leytenant",
        "rank_ru": "Лейтенант",
        "role": "investigator",
        "phone": "+998 90 011-12-13",
        "photo_initials": "А.Х.",
        "docx": False,
    },
    {
        "file": "Кадеркаева Алина.docx",
        "username": "alina-kaderkayeva",
        "name_uz": "Kaderkayeva Alina Lenurovna",
        "name_ru": "Кадеркаева Алина Ленуровна",
        "rank_uz": "Leytenant",
        "rank_ru": "Лейтенант",
        "role": "investigator",
        "phone": "+998 90 122-13-14",
        "photo_initials": "К.А.",
        "docx": True,
    },
    {
        "file": "Мирзоқулов Жавоҳир Жаҳонгир ўғли+.doc",
        "username": "javohir-mirzoqulov",
        "name_uz": "Mirzoqulov Javohir Jahongir o'g'li",
        "name_ru": "Мирзокулов Жавохир Жахонгир угли",
        "rank_uz": "Leytenant",
        "rank_ru": "Лейтенант",
        "role": "investigator",
        "phone": "+998 93 804-10-05",
        "photo_initials": "М.Ж.",
        "docx": False,
    },
    {
        "file": "Худоёров Ойбек Бердиёр ўғли.doc",
        "username": "oybek-xudoyorov",
        "name_uz": "Xudoyorov Oybek Berdiyor o'g'li",
        "name_ru": "Худоёров Ойбек Бердиёр угли",
        "rank_uz": "Leytenant",
        "rank_ru": "Лейтенант",
        "role": "investigator",
        "phone": "+998 90 233-14-15",
        "photo_initials": "Х.О.",
        "docx": False,
    },
]

class Command(BaseCommand):
    help = 'Imports all 15 Yashnobod TQTB officers, extracts photos, and creates user credentials'

    def handle(self, *args, **options):
        dept_yashnobod, _ = Department.objects.get_or_create(
            id='yashnobod',
            defaults={
                'name_ru': 'Следственный отдел при УКД ОВД Яшнабадского района Отделение доследственной проверки',
                'name_uz': "Yashnobod tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi"
            }
        )

        media_avatars_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(media_avatars_dir, exist_ok=True)

        docs_folder = '/Users/macbook/Downloads/Яшнобод ТҚТ'
        if not os.path.exists(docs_folder):
            docs_folder = '/home/ubuntu/e-material/yashnobod_docs'

        self.stdout.write(f'Setting up {len(OFFICERS_DATA)} Yashnobod officers...')

        for data in OFFICERS_DATA:
            username = data['username']
            password = username # password is identical to username
            officer_id = f"off_{username.replace('-', '_')}"

            # 1. User
            user, _ = User.objects.get_or_create(username=username)
            user.set_password(password)
            name_parts = data['name_uz'].split()
            user.last_name = name_parts[0] if len(name_parts) > 0 else ''
            user.first_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            user.save()

            # 2. Officer
            officer, _ = Officer.objects.get_or_create(id=officer_id)
            officer.user = user
            officer.name_uz = data['name_uz']
            officer.name_ru = data['name_ru']
            officer.rank_uz = data['rank_uz']
            officer.rank_ru = data['rank_ru']
            officer.role = data['role']
            officer.department = dept_yashnobod
            officer.phone = data['phone']
            officer.photo = data['photo_initials']

            # 3. Extract and attach avatar image if available
            doc_path = os.path.join(docs_folder, data['file']) if os.path.exists(docs_folder) else None
            avatar_filename = f"{officer_id}.jpg"
            avatar_dest = os.path.join(media_avatars_dir, avatar_filename)

            if doc_path and os.path.exists(doc_path):
                try:
                    if data['docx']:
                        with zipfile.ZipFile(doc_path) as z:
                            # Largest media file is the high-res portrait
                            media_files = [m for m in z.namelist() if m.startswith('word/media/')]
                            if media_files:
                                largest = max(media_files, key=lambda m: z.getinfo(m).file_size)
                                with open(avatar_dest, 'wb') as out_f:
                                    out_f.write(z.read(largest))
                                officer.avatar = f"avatars/{avatar_filename}"
                    else:
                        with open(doc_path, 'rb') as f:
                            raw = f.read()
                        start_jpg = raw.find(b'\xff\xd8\xff')
                        if start_jpg != -1:
                            end_jpg = raw.rfind(b'\xff\xd9')
                            if end_jpg > start_jpg:
                                with open(avatar_dest, 'wb') as out_f:
                                    out_f.write(raw[start_jpg:end_jpg + 2])
                                officer.avatar = f"avatars/{avatar_filename}"
                        else:
                            start_png = raw.find(b'\x89PNG')
                            if start_png != -1:
                                end_png = raw.rfind(b'IEND')
                                if end_png > start_png:
                                    avatar_filename = f"{officer_id}.png"
                                    avatar_dest = os.path.join(media_avatars_dir, avatar_filename)
                                    with open(avatar_dest, 'wb') as out_f:
                                        out_f.write(raw[start_png:end_png + 8])
                                    officer.avatar = f"avatars/{avatar_filename}"
                except Exception as e:
                    self.stdout.write(f"Warning: could not extract image for {username}: {e}")

            officer.save()
            self.stdout.write(
                f"✓ {username:22} | {data['name_uz']:35} | {data['rank_uz']:16} | {data['phone']}"
            )

        self.stdout.write(self.style.SUCCESS('All Yashnobod officers created successfully!'))
