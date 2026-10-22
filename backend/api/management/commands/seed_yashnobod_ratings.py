from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from api.models import Officer, Rating

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

class Command(BaseCommand):
    help = 'Seeds 1000+ realistic likes and dislikes ratings for Yashnobod officers across the last 3 days'

    def handle(self, *args, **options):
        officers = Officer.objects.filter(department_id='yashnobod', role='investigator')
        if not officers.exists():
            self.stdout.write(self.style.ERROR('No Yashnobod investigators found!'))
            return

        self.stdout.write(f'Found {officers.count()} Yashnobod investigators.')

        # Delete existing ratings for these officers to avoid duplicate accumulation
        Rating.objects.filter(officer__in=officers).delete()
        self.stdout.write('Cleared previous ratings for Yashnobod investigators.')

        now = timezone.now()
        total_created = 0
        likes_created = 0
        dislikes_created = 0

        # Distribution: 3 days breakdown
        # Day 0 (today): 370 ratings
        # Day 1 (yesterday): 360 ratings
        # Day 2 (2 days ago): 340 ratings
        # Total: 1,070 ratings (> 1,000!)
        day_buckets = [
            (0, 370),
            (1, 360),
            (2, 340),
        ]

        officers_list = list(officers)

        for day_offset, count_for_day in day_buckets:
            batch_ratings = []
            for _ in range(count_for_day):
                officer = random.choice(officers_list)
                is_like = random.random() < 0.918  # ~91.8% positive satisfaction

                citizen = random.choice(CITIZEN_NAMES)
                if is_like:
                    reason_uz, reason_ru = random.choice(LIKE_REASONS)
                    likes_created += 1
                else:
                    reason_uz, reason_ru = random.choice(DISLIKE_REASONS)
                    dislikes_created += 1

                hour = random.randint(9, 19)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                rating_time = (now - timedelta(days=day_offset)).replace(hour=hour, minute=minute, second=second)

                r = Rating.objects.create(
                    officer=officer,
                    citizen_name=citizen,
                    is_like=is_like,
                    reason_ru=reason_ru,
                    reason_uz=reason_uz,
                )
                Rating.objects.filter(id=r.id).update(created_at=rating_time)
                total_created += 1

            self.stdout.write(f'  Created {count_for_day} ratings for day offset {day_offset}')

        # Recalculate rating stats on all officers
        self.stdout.write('Recalculating officer ratings...')
        for officer in officers_list:
            officer.recalculate_ratings()
            self.stdout.write(
                f'  {officer.name_uz}: {officer.likes} likes, {officer.dislikes} dislikes, index: {officer.index}%'
            )

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded {total_created} ratings for Yashnobod! '
            f'Likes: {likes_created}, Dislikes: {dislikes_created} (1000+ total).'
        ))
