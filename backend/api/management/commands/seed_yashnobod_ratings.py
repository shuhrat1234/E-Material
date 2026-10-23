import os
import sqlite3
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings

CITIZEN_NAMES = [
    "Alimov Jasur Baxtiyorovich", "Karimov Sardor Rustamovich", "Rahmonov Bobur Alisherovich",
    "Yusupov Shaxzod Ilhom o'g'li", "Toshmatov Jamshidbek O'tkir o'g'li", "Nazarov Farrux Shavkatovich",
    "Saidov Dilshod Mirzayevich", "Qodirova Shahnoza Shuhrat qizi", "Ismoilova Nilufar Akmalovna",
    "Mirzayeva Gulnoza Botir qizi", "Sobirova Mohira Davronovna", "Abdullayev Ulug'bek Odilovich",
    "Xolmatov Sanjar Bekzod o'g'li", "Ergashev Sherzod Anvarovich", "Rustamov Elyor Faxriddinovich",
    "Xasanova Dildora Qobil qizi", "Bekmurodov Shavkat Omonovich", "G'aniyev Alisher Valijonovich",
    "Yo'ldoshev Otabek Tolib o'g'li", "Fayzullayev Javohir Murodovich", "Nurmatov Anvar Xasanovich",
    "Matyoqubov Davron Sheraliyevich", "Kenjayev Orol Erkinovich", "Axmedov Akmal Mansurovich",
    "Zokirov Botir Mahmudovich", "Sultonova Madina Jamshid qizi", "Ibragimov Eldor Baxtiyor o'g'li",
    "Normatov Umid Komilovich", "To'rayev Dilmurod Sayfullayevich", "Boqiyev Ilhom Zoir o'g'li",
    "Jumanov Murod Xudoyberdi o'g'li", "Ortiqov Baxtiyor G'ulomovich", "Murodov Farhod Asqarovich",
    "Qosimova Zarina Tohir qizi", "Salimov Doniyor Dilmurod o'g'li", "Xoliqov Temur Zokirovich",
    "Nematov Azizjon Ravshanovich", "Usmonov Nodirbek Shuxratovich", "Vohidov Mirabbos Shuhratovich",
    "Karimova Nargiza Baxtiyorovna", "Azimov Sunnatullo Dilshodovich", "Mamatqulov Sherali Hasanovich",
    "Polvonov Akbarali Tohirovich", "Yoqubov Sarvarjon Akramovich", "Bozorov Jasurbek Alimjon o'g'li",
    "Tursunov Bunyod Baxtiyor o'g'li", "Sodiqov Dilmurod Olimjonovich", "Mirahmedov Bobirxon Mirziyod o'g'li",
    "Sharipov Dostonbek Shuhrat o'g'li", "Hamroyev Bekzod Furqat o'g'li", "Olimov Abbos Ilhomovich"
]

LIKE_REASONS = [
    ("Xushmuomala va samimiy munosabat", "Вежливое и доброжелательное отношение"),
    ("Tezkor va adolatli ko'rib chiqildi", "Быстро и справедливо рассмотрено"),
    ("Qonun doirasida to'liq tushuntirish berildi", "Дано полное разъяснение в рамках закона"),
    ("Vaqtida va navbatsiz qabul qilindi", "Принят вовремя и без задержек"),
    ("Murojaatim ijobiy hal etildi", "Моё обращение было решено положительно"),
    ("Yuqori professionallik va xolislik", "Высокий профессионализм и объективность"),
    ("Hujjatlar to'liq va aniq rasmiylashtirildi", "Документы оформлены полно и грамотно"),
    ("E'tiborli va puxta yondashuv", "Внимательный и тщательный подход"),
    ("Qonuniy talablar aniq tushuntirildi", "Законные требования чётко разъяснены"),
    ("Rahmat, xizmatidan juda mamnunman", "Спасибо, очень доволен качеством работы"),
    ("Muammo mohiyatiga chuqur yetib bordi", "Вник в самую суть проблемы"),
    ("O'z vaqtida qonuniy qaror qabul qilindi", "Своевременно принято законное решение"),
]

DISLIKE_REASONS = [
    ("Qabulga kirishda kutish vaqti uzoq bo'ldi", "Долгое время ожидания приема"),
    ("Murojaat yetarlicha to'liq o'rganilmadi", "Обращение рассмотрено недостаточно подробно"),
    ("Qo'shimcha hujjatlar talab qilindi", "Потребовались дополнительные справки"),
    ("Javob berish muddati biroz cho'zildi", "Срок предоставления ответа немного затянулся"),
    ("Tushuntirish to'liq berilmadi", "Разъяснение было дано не в полном объёме"),
    ("Telefon orqali bog'lanish qiyin bo'ldi", "Было трудно дозвониться по телефону"),
]

# Exact target counts for each officer ensuring 60% - 70% satisfaction rating
# (likes, dislikes)
OFFICERS_TARGET = {
    'off_asror_xazratov': (50, 28),     # 64%
    'off_azizjon_umarjonov': (53, 25),  # 68%
    'off_asliddin_qodirov': (54, 23),   # 70%
    'off_muzaffarjon_ashurov': (48, 29),# 62%
    'off_nodirbek_alijonov': (55, 24),  # 70%
    'off_elmurod_ziyobekov': (51, 26),  # 66%
    'off_olouddin_ibrohimov': (49, 28), # 64%
    'off_qilichbek_omonov': (47, 30),   # 61%
    'off_shayxzod_shayxov': (50, 27),   # 65%
    'off_doniyor_qahramonov': (55, 24), # 70%
    'off_xojiakbar_alimjonov': (51, 27),# 65%
    'off_alina_kaderkayeva': (52, 26),  # 67%
    'off_javohir_mirzoqulov': (48, 29), # 62%
    'off_oybek_xudoyorov': (53, 25),    # 68%
}

class Command(BaseCommand):
    help = 'Seeds 1000+ realistic likes and dislikes ratings for Yashnobod officers with ratings strictly in 60-70% range'

    def handle(self, *args, **options):
        base_dir = settings.BASE_DIR
        db_paths = [
            os.path.join(base_dir, 'db_yashnobod.sqlite3'),
            os.path.join(base_dir, 'db.sqlite3')
        ]

        now = timezone.now()
        ratings_data = []
        total_likes = 0
        total_dislikes = 0

        # Generate individual items for each officer matching target counts
        for officer_id, (target_likes, target_dislikes) in OFFICERS_TARGET.items():
            total_likes += target_likes
            total_dislikes += target_dislikes

            items = [True] * target_likes + [False] * target_dislikes
            random.shuffle(items)

            for is_like in items:
                citizen = random.choice(CITIZEN_NAMES)
                if is_like:
                    reason_uz, reason_ru = random.choice(LIKE_REASONS)
                else:
                    reason_uz, reason_ru = random.choice(DISLIKE_REASONS)

                day_offset = random.choices([0, 1, 2], weights=[0.36, 0.34, 0.30])[0]
                hour = random.randint(9, 19)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                rating_time = (now - timedelta(days=day_offset)).replace(hour=hour, minute=minute, second=second)
                time_str = rating_time.strftime('%Y-%m-%d %H:%M:%S')

                ratings_data.append((
                    citizen,
                    1 if is_like else 0,
                    reason_ru,
                    reason_uz,
                    time_str,
                    officer_id
                ))

        total_created = len(ratings_data)
        self.stdout.write(f'Generated {total_created} ratings ({total_likes} likes, {total_dislikes} dislikes).')

        for db_path in db_paths:
            if not os.path.exists(db_path):
                continue

            self.stdout.write(f'Updating database: {db_path}...')
            conn = sqlite3.connect(db_path, timeout=30.0)
            cur = conn.cursor()

            try:
                cur.execute("PRAGMA journal_mode=WAL;")
                officer_ids = list(OFFICERS_TARGET.keys())
                placeholders = ','.join(['?'] * len(officer_ids))
                cur.execute(f"DELETE FROM api_rating WHERE officer_id IN ({placeholders});", officer_ids)

                cur.executemany(
                    """
                    INSERT INTO api_rating (citizen_name, is_like, reason_ru, reason_uz, created_at, officer_id)
                    VALUES (?, ?, ?, ?, ?, ?);
                    """,
                    ratings_data
                )

                for oid, (l, d) in OFFICERS_TARGET.items():
                    tot = l + d
                    idx = round((l / tot) * 100) if tot > 0 else 0
                    cur.execute(
                        "UPDATE api_officer SET likes = ?, dislikes = ?, \"index\" = ? WHERE id = ?;",
                        (l, d, idx, oid)
                    )

                conn.commit()
                self.stdout.write(self.style.SUCCESS(f'Successfully updated {db_path}!'))
            except Exception as e:
                conn.rollback()
                self.stdout.write(self.style.ERROR(f'Failed on {db_path}: {e}'))
            finally:
                conn.close()

        self.stdout.write(self.style.SUCCESS(
            f'All finished! Seeded {total_created} ratings with satisfaction ratings strictly in 60-70% range.'
        ))
