from django.core.management.base import BaseCommand
from api.models import Department, Officer, Material, AppealStep, ActiveVisit, SMSTemplate, AuditLog
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Seeds E-Material initial mock data into database'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Clear existing
        AppealStep.objects.all().delete()
        Material.objects.all().delete()
        Officer.objects.all().delete()
        Department.objects.all().delete()
        ActiveVisit.objects.all().delete()
        SMSTemplate.objects.all().delete()
        AuditLog.objects.all().delete()
        User.objects.all().delete()

        # Helper to parse datetime
        def dt(val):
            if not val:
                return None
            parsed = datetime.fromisoformat(val)
            if timezone.is_naive(parsed):
                return timezone.make_aware(parsed)
            return parsed

        # Create admin superuser
        User.objects.create_superuser('admin', 'admin@e-material.gov.uz', 'password123')
        self.stdout.write('Created superuser: admin (password: password123)')

        # Departments
        depts_data = [
            { "id": "so", "name_ru": "Следственный отдел", "name_uz": "Tergov bo'limi" },
            { "id": "od", "name_ru": "Отдел дознания", "name_uz": "Surishtiruv bo'limi" },
            { "id": "ur", "name_ru": "Уголовный розыск", "name_uz": "Jinoyat qidiruv" }
        ]
        
        depts = {}
        for d in depts_data:
            dept = Department.objects.create(
                id=d["id"],
                name_ru=d["name_ru"],
                name_uz=d["name_uz"]
            )
            depts[d["id"]] = dept
            
        self.stdout.write(f'Created {len(depts_data)} departments')

        # Officers
        officers_data = [
            {
              "id": "off_karimov",
              "name_ru": "Каримов Сардор Бекзодович",
              "name_uz": "Karimov Sardor Bekzodovich",
              "rank_ru": "Капитан",
              "rank_uz": "Kapitan",
              "role": "investigator",
              "dept_id": "so",
              "likes": 42, "dislikes": 3, "index": 92, "photo": "K.S."
            },
            {
              "id": "off_akhmedova",
              "name_ru": "Ахмедова Дильноза Рустамовна",
              "name_uz": "Axmedova Dilnoza Rustamovna",
              "rank_ru": "Старший лейтенант",
              "rank_uz": "Katta leytenant",
              "role": "investigator",
              "dept_id": "so",
              "likes": 28, "dislikes": 6, "index": 78, "photo": "A.D."
            },
            {
              "id": "off_makhmudov",
              "name_ru": "Махмудов Жасур Акромович",
              "name_uz": "Maxmudov Jasur Akromovich",
              "rank_ru": "Майор",
              "rank_uz": "Mayor",
              "role": "chief",
              "dept_id": "od",
              "likes": 56, "dislikes": 2, "index": 98, "photo": "M.J."
            },
            {
              "id": "off_tokhirov",
              "name_ru": "Тохиров Темур Шавкатович",
              "name_uz": "Toxirov Temur Shavkatovich",
              "rank_ru": "Лейтенант",
              "rank_uz": "Leytenant",
              "role": "investigator",
              "dept_id": "od",
              "likes": 15, "dislikes": 8, "index": 68, "photo": "T.T."
            },
            {
              "id": "off_saidov",
              "name_ru": "Саидов Бобур Комилович",
              "name_uz": "Saidov Bobur Komilovich",
              "rank_ru": "Старший лейтенант",
              "rank_uz": "Katta leytenant",
              "role": "investigator",
              "dept_id": "ur",
              "likes": 34, "dislikes": 4, "index": 88, "photo": "S.B."
            },
            {
              "id": "off_registrator",
              "name_ru": "Азимов Шавкат",
              "name_uz": "Azimov Shavkat",
              "rank_ru": "Капитан",
              "rank_uz": "Kapitan",
              "role": "registrator",
              "dept_id": "so",
              "likes": 0, "dislikes": 0, "index": 100, "photo": "А.Ш."
            }
        ]
        
        officers = {}
        for o in officers_data:
            off = Officer.objects.create(
                id=o["id"],
                name_ru=o["name_ru"],
                name_uz=o["name_uz"],
                rank_ru=o["rank_ru"],
                rank_uz=o["rank_uz"],
                role=o["role"],
                department=depts[o["dept_id"]],
                likes=o["likes"],
                dislikes=o["dislikes"],
                index=o["index"],
                photo=o["photo"]
            )
            officers[o["id"]] = off
            
        self.stdout.write(f'Created {len(officers_data)} officers (Users automatically created via signal)')


        # Materials (Cases)
        materials_data = [
            {
              "id": "MAT-2026-0001",
              "citizenName": "Абдуллаев Алишер Улугбекович",
              "citizenPhone": "+998 90 123-45-67",
              "titleRu": "Заявление о краже мобильного телефона в ТРЦ 'Ривьера'",
              "titleUz": "Rivyera KO'Mda mobil telefon o'g'irlangani haqida ariza",
              "registeredAt": "2026-06-10T10:00:00",
              "deadline": "2026-06-20T10:00:00",
              "status": "срок_нарушен",
              "officerId": "off_karimov",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 3,
              "materialType": "ariza",
              "sourceFrom": "portal",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-10T10:00:00" },
                { "status": "Анализ и решение", "time": "2026-06-10T11:30:00" },
                { "status": "Оперативная отправка уведомления", "time": "2026-06-10T11:32:00" }
              ]
            },
            {
              "id": "MAT-2026-0002",
              "citizenName": "Каримова Наргиза Фарходовна",
              "citizenPhone": "+998 93 456-78-90",
              "titleRu": "Жалоба на мошенничество при покупке авто через OLX",
              "titleUz": "OLX orqali avtomobil sotib olishdagi firibgarlik ustidan shikoyat",
              "registeredAt": "2026-06-05T09:15:00",
              "deadline": "2026-06-15T09:15:00",
              "status": "срок_нарушен",
              "officerId": "off_akhmedova",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 1,
              "difficulty": 4,
              "materialType": "ariza",
              "sourceFrom": "prakuratura",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-05T09:15:00" },
                { "status": "Анализ и решение", "time": "2026-06-05T10:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0003",
              "citizenName": "Рахимов Сарвар Илхомович",
              "citizenPhone": "+998 94 987-65-43",
              "titleRu": "Повреждение имущества (автомобиля) во дворе жилого дома",
              "titleUz": "Turar joy hovlisida avtomobilga shikast yetkazish",
              "registeredAt": "2026-06-22T14:30:00",
              "deadline": "2026-07-02T14:30:00",
              "status": "изучаемый",
              "officerId": "off_makhmudov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 2,
              "materialType": "bildirgi",
              "sourceFrom": "iio",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-22T14:30:00" }
              ]
            },
            {
              "id": "MAT-2026-0004",
              "citizenName": "Усманов Дониёр Рустамович",
              "citizenPhone": "+998 97 111-22-33",
              "titleRu": "Кража велосипеда из подъезда дома №12",
              "titleUz": "12-sonli uy yo'lagidan velosiped o'g'irlanishi",
              "registeredAt": "2026-06-29T11:00:00",
              "deadline": "2026-07-01T11:00:00",
              "status": "срок_приближается",
              "officerId": "off_tokhirov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 1,
              "materialType": "ariza",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-29T11:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0005",
              "citizenName": "Юсупов Тимур Маратович",
              "citizenPhone": "+998 99 888-77-66",
              "titleRu": "Потеря документов (паспорт, водительские права) при невыясненных обстоятельствах",
              "titleUz": "Noma'lum sharoitda hujjatlarni yo'qotish (pasport, guvohnoma)",
              "registeredAt": "2026-06-15T16:00:00",
              "deadline": "2026-06-25T16:00:00",
              "closedAt": "2026-06-24T15:30:00",
              "status": "закрыт_в_срок",
              "officerId": "off_saidov",
              "deptId": "ur",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 2,
              "materialType": "boshqa",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-15T16:00:00" },
                { "status": "Анализ и решение", "time": "2026-06-15T17:00:00" },
                { "status": "Оперативная отправка уведомления", "time": "2026-06-15T17:02:00" },
                { "status": "Прием гражданином уведомления", "time": "2026-06-15T17:10:00" }
              ]
            },
            {
              "id": "MAT-2026-0006",
              "citizenName": "Азимова Лола Бахтияровна",
              "citizenPhone": "+998 90 999-00-11",
              "titleRu": "Заявление об угрозах физической расправы со стороны соседа",
              "titleUz": "Qo'shni tomonidan jismoniy zo'ravonlik tahdidlari to'g'risida ariza",
              "registeredAt": "2026-06-28T15:00:00",
              "deadline": "2026-07-08T15:00:00",
              "status": "изучаемый",
              "officerId": "off_karimov",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 3,
              "materialType": "ariza",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-28T15:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0007",
              "citizenName": "Бакиров Эльёр Шухратович",
              "citizenPhone": "+998 91 777-55-44",
              "titleRu": "Мошеннические действия под предлогом трудоустройства за рубежом",
              "titleUz": "Chet elda ishga joylashtirish bahonasi bilan firibgarlik harakatlari",
              "registeredAt": "2026-06-18T10:00:00",
              "deadline": "2026-06-28T10:00:00",
              "status": "срок_нарушен",
              "officerId": "off_karimov",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 1,
              "difficulty": 5,
              "materialType": "ariza",
              "sourceFrom": "prezident_aparat",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-18T10:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0008",
              "citizenName": "Сулейманов Санжар Отабекович",
              "citizenPhone": "+998 95 333-22-11",
              "titleRu": "Заявление о пропаже несовершеннолетнего сына",
              "titleUz": "Voyaga yetmagan o'g'lining yo'qolishi haqida ariza",
              "registeredAt": "2026-06-26T18:20:00",
              "deadline": "2026-07-06T18:20:00",
              "status": "изучаемый",
              "officerId": "off_saidov",
              "deptId": "ur",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 5,
              "materialType": "ariza",
              "sourceFrom": "portal",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-26T18:20:00" }
              ]
            },
            {
              "id": "MAT-2026-0009",
              "citizenName": "Ахмедов Мансур Комил угли",
              "citizenPhone": "+998 90 444-55-66",
              "titleRu": "Незаконное проникновение в нежилое помещение (склад)",
              "titleUz": "Noshahar binoga (omborgacha) noqonuniy kirish",
              "registeredAt": "2026-06-20T11:00:00",
              "deadline": "2026-06-30T11:00:00",
              "status": "срок_приближается",
              "officerId": "off_makhmudov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 3,
              "materialType": "bildirgi",
              "sourceFrom": "iio",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-20T11:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0010",
              "citizenName": "Ибрагимова Рано Рустамовна",
              "citizenPhone": "+998 97 888-99-00",
              "titleRu": "Семейный конфликт, нанесение легких телесных повреждений",
              "titleUz": "Oilaviy mojaro, yengil tan jarohati yetkazish",
              "registeredAt": "2026-06-10T14:00:00",
              "deadline": "2026-06-20T14:00:00",
              "closedAt": "2026-06-19T12:00:00",
              "status": "закрыт_в_срок",
              "officerId": "off_tokhirov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 2,
              "materialType": "ariza",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-10T14:00:00" },
                { "status": "Анализ и решение", "time": "2026-06-19T11:00:00" },
                { "status": "Оперативная отправка уведомления", "time": "2026-06-19T11:05:00" },
                { "status": "Прием гражданином уведомления", "time": "2026-06-19T11:15:00" }
              ]
            },
            {
              "id": "MAT-2026-0011",
              "citizenName": "Назаров Отабек Хуршидович",
              "citizenPhone": "+998 93 222-33-44",
              "titleRu": "Вымогательство со стороны должностного лица",
              "titleUz": "Mansabdor shaxs tomonidan tovlamachilik",
              "registeredAt": "2026-06-23T09:00:00",
              "deadline": "2026-07-03T09:00:00",
              "status": "изучаемый",
              "officerId": "off_akhmedova",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 4,
              "materialType": "ariza",
              "sourceFrom": "prezident_aparat",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-23T09:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0012",
              "citizenName": "Хасанов Улугбек Мирзаевич",
              "citizenPhone": "+998 99 111-00-99",
              "titleRu": "Кража денежных средств с банковской карты путем фишинга",
              "titleUz": "Fishing yo'li bilan bank kartasidan pul o'g'irlash",
              "registeredAt": "2026-06-24T16:30:00",
              "deadline": "2026-07-04T16:30:00",
              "status": "изучаемый",
              "officerId": "off_karimov",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 3,
              "materialType": "ariza",
              "sourceFrom": "portal",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-24T16:30:00" }
              ]
            },
            {
              "id": "MAT-2026-0013",
              "citizenName": "Мирзаева Гулнора Алишеровна",
              "citizenPhone": "+998 94 666-77-88",
              "titleRu": "Незаконный выброс строительного мусора на придомовой территории",
              "titleUz": "Uy atrofidagi hududga qurilish chiqindilarini noqonuniy tashlash",
              "registeredAt": "2026-06-27T12:00:00",
              "deadline": "2026-07-07T12:00:00",
              "status": "изучаемый",
              "officerId": "off_saidov",
              "deptId": "ur",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 1,
              "materialType": "bildirgi",
              "sourceFrom": "iio",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-27T12:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0014",
              "citizenName": "Турсунов Бахтиёр Равшанович",
              "citizenPhone": "+998 90 777-66-55",
              "titleRu": "Кража ноутбука из офиса при неустановленных обстоятельствах",
              "titleUz": "Noma'lum sharoitda ofisdan noutbuk o'g'irlash",
              "registeredAt": "2026-06-12T08:30:00",
              "deadline": "2026-06-22T08:30:00",
              "closedAt": "2026-06-21T17:00:00",
              "status": "закрыт_в_срок",
              "officerId": "off_akhmedova",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 3,
              "materialType": "ariza",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-12T08:30:00" },
                { "status": "Анализ и решение", "time": "2026-06-21T16:00:00" },
                { "status": "Оперативная отправка уведомления", "time": "2026-06-21T16:05:00" },
                { "status": "Прием гражданином уведомления", "time": "2026-06-21T16:15:00" }
              ]
            },
            {
              "id": "MAT-2026-0015",
              "citizenName": "Рустамова Малика Шавкатовна",
              "citizenPhone": "+998 91 333-44-55",
              "titleRu": "Жалоба на незаконное увольнение и невыплату зарплаты",
              "titleUz": "Noqonuniy ishdan bo'shatish va maoshni to'lamaslik ustidan shikoyat",
              "registeredAt": "2026-06-29T10:00:00",
              "deadline": "2026-07-09T10:00:00",
              "status": "изучаемый",
              "officerId": "off_makhmudov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 4,
              "materialType": "ariza",
              "sourceFrom": "portal",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-29T10:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0016",
              "citizenName": "Исмоилов Шерзод Комилович",
              "citizenPhone": "+998 95 555-66-77",
              "titleRu": "Угон автотранспортного средства из охраняемой парковки",
              "titleUz": "Qo'riqlanadigan to'xtash joyidan transport vositasini o'g'irlash",
              "registeredAt": "2026-06-28T08:00:00",
              "deadline": "2026-07-08T08:00:00",
              "status": "изучаемый",
              "officerId": "off_saidov",
              "deptId": "ur",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 5,
              "materialType": "ariza",
              "sourceFrom": "iio",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-28T08:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0017",
              "citizenName": "Камолов Даврон Элмурзаевич",
              "citizenPhone": "+998 97 444-33-22",
              "titleRu": "Незаконная торговля в неустановленном месте, создание помех движению",
              "titleUz": "Belgilanmagan joyda noqonuniy savdo, harakatga to'sqinlik",
              "registeredAt": "2026-06-25T13:00:00",
              "deadline": "2026-07-05T13:00:00",
              "status": "изучаемый",
              "officerId": "off_tokhirov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 1,
              "materialType": "bildirgi",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-25T13:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0018",
              "citizenName": "Эргашева Шахло Бахромовна",
              "citizenPhone": "+998 90 222-11-00",
              "titleRu": "Мошенничество: предоплата за несуществующий товар через Telegram",
              "titleUz": "Telegram orqali mavjud bo'lmagan tovar uchun oldindan to'lov firibgarligi",
              "registeredAt": "2026-06-01T11:00:00",
              "deadline": "2026-06-11T11:00:00",
              "status": "срок_нарушен",
              "officerId": "off_akhmedova",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 3,
              "materialType": "ariza",
              "sourceFrom": "prakuratura",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-01T11:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0019",
              "citizenName": "Тошматов Сирожиддин Хасанович",
              "citizenPhone": "+998 93 888-77-55",
              "titleRu": "Хулиганство с причинением ущерба: разбитое окно магазина",
              "titleUz": "Zarar yetkazish bilan bezorilik: do'kon oynasini sindirib tashlash",
              "registeredAt": "2026-06-27T20:00:00",
              "deadline": "2026-07-07T20:00:00",
              "status": "изучаемый",
              "officerId": "off_makhmudov",
              "deptId": "od",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 2,
              "materialType": "bildirgi",
              "sourceFrom": "iio",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-27T20:00:00" }
              ]
            },
            {
              "id": "MAT-2026-0020",
              "citizenName": "Шамсиев Акбар Иброхимович",
              "citizenPhone": "+998 99 000-11-22",
              "titleRu": "Присвоение чужого имущества (найденная чужая карта)",
              "titleUz": "Topilgan begona karta orqali mol-mulkni o'zlashtirish",
              "registeredAt": "2026-06-08T14:00:00",
              "deadline": "2026-06-18T14:00:00",
              "closedAt": "2026-06-17T10:00:00",
              "status": "закрыт_в_срок",
              "officerId": "off_karimov",
              "deptId": "so",
              "isAccepted": True, "extensionCount": 0,
              "difficulty": 2,
              "materialType": "ariza",
              "sourceFrom": "tashrif",
              "appeals": [
                { "status": "Обращение гражданина", "time": "2026-06-08T14:00:00" },
                { "status": "Анализ и решение", "time": "2026-06-17T09:00:00" },
                { "status": "Оперативная отправка уведомления", "time": "2026-06-17T09:05:00" },
                { "status": "Прием гражданином уведомления", "time": "2026-06-17T09:20:00" }
              ]
            }
        ]
        
        for m in materials_data:
            mat = Material.objects.create(
                id=m["id"],
                citizen_name=m["citizenName"],
                citizen_phone=m["citizenPhone"],
                title_ru=m["titleRu"],
                title_uz=m["titleUz"],
                registered_at=dt(m["registeredAt"]),
                deadline=dt(m["deadline"]),
                closed_at=dt(m.get("closedAt")),
                status=m["status"],
                officer=officers[m["officerId"]],
                department=depts[m["deptId"]],
                is_accepted=m["isAccepted"],
                extension_count=m["extensionCount"],
                difficulty=m["difficulty"],
                material_type=m["materialType"],
                source_from=m["sourceFrom"]
            )
            
            # Appeals
            for a in m["appeals"]:
                AppealStep.objects.create(
                    material=mat,
                    status=a["status"],
                    time=dt(a["time"])
                )
                
        self.stdout.write(f'Created {len(materials_data)} materials and appeals')

        # Extra materials, dated relative to "now" so dashboards (30-day trend,
        # today/tomorrow deadline buckets) are populated regardless of seed date.
        rng = random.Random(7)

        first_names_ru = ["Алишер", "Дилноза", "Санжар", "Гулбахор", "Фаррух", "Севара", "Жасур",
                           "Малика", "Отабек", "Нигора", "Бекзод", "Зарина", "Улугбек", "Дилором"]
        last_names_ru = ["Юсупов", "Раджабова", "Эргашев", "Насриддинова", "Абдуллаев", "Тураева",
                         "Холматов", "Собирова", "Мирзаев", "Каримова", "Шарипов", "Юлдашева"]
        titles_by_type = {
            "ariza": [
                "Заявление о краже личных вещей",
                "Заявление о мошенничестве через интернет-магазин",
                "Заявление об угрозах со стороны соседа",
                "Заявление о повреждении имущества",
                "Заявление о пропаже документов",
            ],
            "bildirgi": [
                "Рапорт о нарушении общественного порядка",
                "Рапорт о незаконной торговле",
                "Рапорт об обнаружении бесхозного имущества",
            ],
            "sud_ajrimi": [
                "Определение суда о проведении дополнительной проверки",
                "Определение суда по гражданскому спору",
            ],
            "boshqa": [
                "Обращение по факту утери документов",
                "Обращение по вопросу утраты имущества",
            ],
        }
        titles_by_type_uz = {
            "ariza": [
                "Shaxsiy buyumlar o'g'irlangani haqida ariza",
                "Internet-do'kon orqali firibgarlik haqida ariza",
                "Qo'shni tomonidan tahdid haqida ariza",
                "Mol-mulkka zarar yetkazish haqida ariza",
                "Hujjatlar yo'qolgani haqida ariza",
            ],
            "bildirgi": [
                "Jamoat tartibini buzish haqida bildirgi",
                "Noqonuniy savdo haqida bildirgi",
                "Egasiz mol-mulk topilgani haqida bildirgi",
            ],
            "sud_ajrimi": [
                "Qo'shimcha tekshiruv o'tkazish haqida sud ajrimi",
                "Fuqarolik nizosi bo'yicha sud ajrimi",
            ],
            "boshqa": [
                "Hujjatlar yo'qotilgani bo'yicha murojaat",
                "Mol-mulk yo'qotilgani bo'yicha murojaat",
            ],
        }
        investigator_ids = [o["id"] for o in officers_data if o["role"] == "investigator"]
        material_types = ["ariza", "bildirgi", "sud_ajrimi", "boshqa"]
        source_choices = ["tashrif", "prakuratura", "prezident_aparat", "iio", "portal"]
        now = timezone.now()
        extra_count = 35

        for i in range(extra_count):
            case_num = 21 + i
            case_id = f"MAT-2026-{str(case_num).zfill(4)}"
            officer_id = rng.choice(investigator_ids)
            department_id = officers[officer_id].department_id
            m_type = rng.choices(material_types, weights=[55, 25, 8, 12])[0]
            source = rng.choice(source_choices)
            difficulty = rng.choices([1, 2, 3, 4, 5], weights=[15, 25, 30, 20, 10])[0]

            days_ago = rng.randint(0, 40)
            registered_at = now - timedelta(days=days_ago, hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
            deadline_days = rng.choice([7, 10, 10, 15, 20])
            deadline = registered_at + timedelta(days=deadline_days)

            is_overdue = deadline < now
            is_due_soon = not is_overdue and (deadline - now).days <= 2
            closed_at = None

            if is_overdue:
                status = rng.choices(["срок_нарушен", "закрыт_в_срок"], weights=[55, 45])[0]
                if status == "закрыт_в_срок":
                    closed_at = deadline - timedelta(hours=rng.randint(1, 48))
            elif is_due_soon:
                status = "срок_приближается"
            else:
                status = rng.choices(["изучаемый", "закрыт_в_срок"], weights=[85, 15])[0]
                if status == "закрыт_в_срок":
                    closed_at = registered_at + timedelta(days=rng.randint(1, max(1, deadline_days - 1)))

            citizen_name = f"{rng.choice(last_names_ru)} {rng.choice(first_names_ru)}"
            citizen_phone = f"+998 9{rng.randint(0,9)} {rng.randint(100,999)}-{rng.randint(10,99)}-{rng.randint(10,99)}"
            title_ru = rng.choice(titles_by_type[m_type])
            title_uz = rng.choice(titles_by_type_uz[m_type])

            mat = Material.objects.create(
                id=case_id,
                citizen_name=citizen_name,
                citizen_phone=citizen_phone,
                title_ru=title_ru,
                title_uz=title_uz,
                registered_at=registered_at,
                deadline=deadline,
                closed_at=closed_at,
                status=status,
                officer=officers[officer_id],
                department=depts[department_id] if department_id else None,
                is_accepted=True,
                extension_count=rng.choices([0, 1, 2], weights=[80, 15, 5])[0],
                difficulty=difficulty,
                material_type=m_type,
                source_from=source,
            )

            AppealStep.objects.create(material=mat, status="Обращение гражданина", time=registered_at)
            if status == "закрыт_в_срок" and closed_at:
                AppealStep.objects.create(material=mat, status="Анализ и решение", time=closed_at - timedelta(minutes=30))
                AppealStep.objects.create(material=mat, status="Оперативная отправка уведомления", time=closed_at)

        self.stdout.write(f'Created {extra_count} additional generated materials')

        # Active Visits
        visits_data = [
            {
              "id": "v_101",
              "citizenName": "Махкамов Шавкат",
              "citizenPhone": "+998 90 999-88-77",
              "officerId": "off_karimov",
              "startTime": "2026-06-30T17:45:00",
              "purposeRu": "Подать дополнительное заявление",
              "purposeUz": "Qo'shimcha ariza topshirish"
            },
            {
              "id": "v_102",
              "citizenName": "Муминова Феруза",
              "citizenPhone": "+998 93 111-22-33",
              "officerId": "off_makhmudov",
              "startTime": "2026-06-30T17:55:00",
              "purposeRu": "Узнать статус дела о заливе квартиры",
              "purposeUz": "Kvartirani suv bosishi bo'yicha ish holatini bilish"
            }
        ]
        
        for v in visits_data:
            ActiveVisit.objects.create(
                id=v["id"],
                citizen_name=v["citizenName"],
                citizen_phone=v["citizenPhone"],
                officer=officers[v["officerId"]],
                start_time=dt(v["startTime"]),
                purpose_ru=v["purposeRu"],
                purpose_uz=v["purposeUz"]
            )
            
        self.stdout.write(f'Created {len(visits_data)} visits')

        # SMS Templates
        templates_data = [
            {
              "id": "tpl_reject",
              "type": "SMS / Telegram",
              "triggerRu": "Отказ в возбуждении уголовного дела",
              "triggerUz": "Jinoyat ishini qo'zg'atishni rad etish",
              "contentRu": "Уважаемый(ая) {name}! Сообщаем, что по вашему обращению №{id} принято решение об отказе в возбуждении уголовного дела. Копия решения: {link}. С уважением, Олмазорский РУВД.",
              "contentUz": "Hurmatli {name}! Sizning {id}-sonli murojaatingiz yuzasidan jinoyat ishini qo'zg'atishni rad etish to'g'risida qaror qabul qilindi. Qaror nusxasi: {link}. Hurmat bilan, Olmazor tumani IIO FMB."
            },
            {
              "id": "tpl_initiate",
              "type": "SMS / Telegram",
              "triggerRu": "Возбуждение уголовного дела",
              "triggerUz": "Jinoyat ishi qo'zg'atish",
              "contentRu": "Уважаемый(ая) {name}! По вашему заявлению №{id} возбуждено уголовное дело №{case_num}. Следователь: {officer}, тел: {phone}. С уважением, Олмазорский РУВД.",
              "contentUz": "Hurmatli {name}! Sizning {id}-sonli arizangiz yuzasidan {case_num}-sonli jinoyat ishi qo'zg'atildi. Tergovchi: {officer}, tel: {phone}. Hurmat bilan, Olmazor tumani IIO FMB."
            },
            {
              "id": "tpl_transfer",
              "type": "SMS / Telegram",
              "triggerRu": "Направление по подследственности",
              "triggerUz": "Tergovga tegishliligi bo'yicha yuborish",
              "contentRu": "Уважаемый(ая) {name}! Ваше обращение №{id} направлено по территориальной подследственности в {org}. С уважением, Олмазорский РУВД.",
              "contentUz": "Hurmatli {name}! Sizning {id}-sonli murojaatingiz hududiy tergovga tegishliligi bo'yicha {org}ga yuborildi. Hurmat bilan, Olmazor tumani IIO FMB."
            }
        ]
        
        for t in templates_data:
            SMSTemplate.objects.create(
                template_id=t["id"],
                type=t["type"],
                trigger_ru=t["triggerRu"],
                trigger_uz=t["triggerUz"],
                content_ru=t["contentRu"],
                content_uz=t["contentUz"]
            )
            
        self.stdout.write(f'Created {len(templates_data)} SMS templates')

        # Audit Logs
        logs_data = [
            { "time": "2026-06-30T16:15:00", "user": "Махмудов Жасур (Начальник)", "actionRu": "Перераспределение материала MAT-2026-0003", "actionUz": "MAT-2026-0003 materialini qayta biriktirish" },
            { "time": "2026-06-30T15:30:00", "user": "Тохиров Темур", "actionRu": "Закрытие дела MAT-2026-0010 в связи с примирением сторон", "actionUz": "Tomonlar yarashganligi sababli MAT-2026-0010 ishini yopish" },
            { "time": "2026-06-30T14:22:00", "user": "Каримов Сардор", "actionRu": "Запрос к AI-ассистенту по квалификации кражи", "actionUz": "O'g'irlikni baholash bo'yicha AI-assistentga so'rov" },
            { "time": "2026-06-30T13:10:00", "user": "Администратор", "actionRu": "Инициализация системы и запуск баз данных", "actionUz": "Tizimni ishga tushirish va ma'lumotlar bazalarini yuklash" }
        ]
        
        for l in logs_data:
            AuditLog.objects.create(
                time=dt(l["time"]),
                user_name=l["user"],
                action_ru=l["actionRu"],
                action_uz=l["actionUz"]
            )
            
        self.stdout.write(f'Created {len(logs_data)} Audit logs')
        self.stdout.write(self.style.SUCCESS('Successfully seeded mock data!'))
