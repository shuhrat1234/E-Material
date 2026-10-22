from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
import sqlite3
import os
from django.conf import settings
from api.models import Officer, Rating
from backend.db_router import set_current_branch

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

YASHNOBOD_OFFICER_IDS = [
    'off_asror_xazratov', 'off_azizjon_umarjonov', 'off_asliddin_qodirov',
    'off_muzaffarjon_ashurov', 'off_nodirbek_alijonov', 'off_elmurod_ziyobekov',
    'off_olouddin_ibrohimov', 'off_qilichbek_omonov', 'off_shayxzod_shayxov',
    'off_doniyor_qahramonov', 'off_xojiakbar_alimjonov', 'off_alina_kaderkayeva',
    'off_javohir_mirzoqulov', 'off_oybek_xudoyorov'
]

class Command(BaseCommand):
    help = 'Seeds 1000+ realistic likes and dislikes ratings for Yashnobod officers across the last 3 days using atomic batch insert'

    def handle(self, *args, **options):
        base_dir = settings.BASE_DIR
        db_paths = [
            os.path.join(base_dir, 'db_yashnobod.sqlite3'),
            os.path.join(base_dir, 'db.sqlite3')
        ]

        now = timezone.now()

        # Distribution: 3 days breakdown (> 1,000 ratings total)
        # Day 0 (today): 380 ratings
        # Day 1 (yesterday): 360 ratings
        # Day 2 (2 days ago): 340 ratings
        # Total: 1,080 ratings
        day_buckets = [
            (0, 380),
            (1, 360),
            (2, 340),
        ]

        # Generate the dataset in memory
        ratings_data = []
        officer_stats = {oid: {'likes': 0, 'dislikes': 0} for oid in YASHNOBOD_OFFICER_IDS}
        total_likes = 0
        total_dislikes = 0

        for day_offset, count_for_day in day_buckets:
            for _ in range(count_for_day):
                officer_id = random.choice(YASHNOBOD_OFFICER_IDS)
                is_like = random.random() < 0.918  # ~91.8% positive

                citizen = random.choice(CITIZEN_NAMES)
                if is_like:
                    reason_uz, reason_ru = random.choice(LIKE_REASONS)
                    total_likes += 1
                    officer_stats[officer_id]['likes'] += 1
                else:
                    reason_uz, reason_ru = random.choice(DISLIKE_REASONS)
                    total_dislikes += 1
                    officer_stats[officer_id]['dislikes'] += 1

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
                # Enable WAL mode for concurrency
                cur.execute("PRAGMA journal_mode=WAL;")

                # Delete existing ratings for these officers
                placeholders = ','.join(['?'] * len(YASHNOBOD_OFFICER_IDS))
                cur.execute(f"DELETE FROM api_rating WHERE officer_id IN ({placeholders});", YASHNOBOD_OFFICER_IDS)

                # Batch insert all ratings in a single transaction
                cur.executemany(
                    """
                    INSERT INTO api_rating (citizen_name, is_like, reason_ru, reason_uz, created_at, officer_id)
                    VALUES (?, ?, ?, ?, ?, ?);
                    """,
                    ratings_data
                )

                # Update officer table stats
                for oid, stats in officer_stats.items():
                    l = stats['likes']
                    d = stats['dislikes']
                    tot = l + d
                    idx = round((l / tot) * 100) if tot > 0 else 0
                    cur.execute(
                        """
                        UPDATE api_officer
                        SET likes = ?, dislikes = ?, "index" = ?
                        WHERE id = ?;
                        """,
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
            f'All finished! Seeded {total_created} ratings across 14 Yashnobod investigators.'
        ))
