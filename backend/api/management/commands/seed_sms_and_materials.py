import os
import sqlite3
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Fixes overdue count to exactly 27 and resets SMS templates to Slide 15 templates'

    def handle(self, *args, **options):
        base_dir = settings.BASE_DIR
        db_yashnobod = os.path.join(base_dir, 'db_yashnobod.sqlite3')
        db_olmazor = os.path.join(base_dir, 'db.sqlite3')

        # 1. Update Yashnobod overdue materials to exactly 27
        if os.path.exists(db_yashnobod):
            conn = sqlite3.connect(db_yashnobod)
            c = conn.cursor()
            c.execute("SELECT count(*) FROM api_material WHERE status = 'срок_нарушен';")
            current_overdue = c.fetchone()[0]
            self.stdout.write(f"Current Yashnobod overdue count: {current_overdue}")

            if current_overdue > 27:
                excess = current_overdue - 27
                c.execute(f"""
                    UPDATE api_material 
                    SET status = 'закрыт_в_срок', closed_at = deadline 
                    WHERE id IN (
                        SELECT id FROM api_material 
                        WHERE status = 'срок_нарушен' 
                        ORDER BY id DESC 
                        LIMIT {excess}
                    );
                """)
                conn.commit()
                self.stdout.write(self.style.SUCCESS(f"Updated {excess} materials from 'срок_нарушен' to 'закрыт_в_срок'."))
            
            c.execute("SELECT count(*) FROM api_material WHERE status = 'срок_нарушен';")
            new_overdue = c.fetchone()[0]
            self.stdout.write(self.style.SUCCESS(f"New Yashnobod overdue count: {new_overdue} (Target: 27)"))
            conn.close()

        # 2. Reset SMS templates for both databases
        dbs = [
            (db_yashnobod, "Yashnobod tumani IIO FMB", "Яшнабадского района"),
            (db_olmazor, "Olmazor tumani IIO FMB", "Алмазарского района")
        ]

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        for db_path, dept_name_uz, dept_name_ru in dbs:
            if not os.path.exists(db_path):
                continue

            self.stdout.write(f"Updating SMS templates in {db_path}...")
            conn = sqlite3.connect(db_path)
            c = conn.cursor()

            # Delete all existing junk templates
            c.execute("DELETE FROM api_smstemplate;")

            templates = [
                (
                    "tpl_chaqiruv_povestka",
                    "chaqiruv",
                    "Вызов (повестка)",
                    "Chaqiruv (povestka)",
                    f"Уважаемый гражданин! Просим вас прибыть 20 августа 2026 года в 10:00 в УКД ОВД {dept_name_ru}, каб. 204. Причина: дача показаний по делу МАТ-2026-0037. При себе иметь паспорт.",
                    f"Hurmatli fuqaro! Sizni 2026-yil 20-avgust kuni soat 10:00 da {dept_name_uz}, 204-xonaga tashrif buyurishingizni so'raymiz. Sabab: MAT-2026-0037 ishi bo'yicha ko'rsatma berish. O'zingiz bilan pasport olib keling.",
                    "одобрено",
                    "",
                    "Admin",
                    now_str
                ),
                (
                    "tpl_javob_ijobiy",
                    "javob_xati",
                    "Ответное письмо · Положительное",
                    "Javob xati · Ijobiy",
                    "Уважаемый гражданин! По вашему обращению № МАТ-2026-0037 возбуждено уголовное дело (ст. 169 УК). О результатах вам будет сообщено дополнительно по SMS.",
                    "Hurmatli fuqaro! Sizning MAT-2026-0037-sonli murojaatingiz yuzasidan jinoyat ishi qo'zg'atildi (JK 169-modda). Natija haqida qo'shimcha SMS orqali xabardor qilinasiz.",
                    "одобрено",
                    "",
                    "Admin",
                    now_str
                ),
                (
                    "tpl_javob_rad",
                    "javob_xati",
                    "Ответное письмо · Отказано",
                    "Javob xati · Rad etildi",
                    "Уважаемый гражданин! В возбуждении уголовного дела по вашему обращению № МАТ-2026-0037 отказано (основание: отсутствие состава). Для получения копии решения обратитесь в орган.",
                    "Hurmatli fuqaro! Sizning MAT-2026-0037-sonli murojaatingiz yuzasidan jinoyat ishini qo'zg'atishdan rad etildi (asos: tarkib yo'qligi). Qaror nusxasini olish uchun idoraga murojaat qiling.",
                    "одобрено",
                    "",
                    "Admin",
                    now_str
                ),
                (
                    "tpl_tekshiruv_muddat",
                    "xabarnoma",
                    "Срок проверки продлен",
                    "Tekshiruv muddati uzaytirildi",
                    "Уважаемый гражданин! В связи с необходимостью проведения дополнительных проверочных действий срок рассмотрения вашего обращения продлен на 10 суток.",
                    "Hurmatli fuqaro! Sizning murojaatingiz bo'yicha qo'shimcha tekshiruv harakatlari talab etilganligi sababli tekshiruv muddati 10 kunga uzaytirildi.",
                    "в_процессе",
                    "",
                    "Admin",
                    now_str
                ),
                (
                    "tpl_ekspertiza",
                    "xabarnoma",
                    "О назначении судебной экспертизы",
                    "Ekspertiza tayinlandi",
                    "Уважаемый гражданин! По вашему обращению назначена судебная экспертиза. О результатах будет сообщено дополнительно.",
                    "Hurmatli fuqaro! Sizning murojaatingiz yuzasidan sud-tibbiy / kriminalistika ekspertizasi tayinlandi. Natijasi bo'yicha qo'shimcha xabar beriladi.",
                    "на_модерации",
                    "",
                    "Admin",
                    now_str
                )
            ]

            c.executemany("""
                INSERT INTO api_smstemplate (
                    template_id, type, trigger_ru, trigger_uz,
                    content_ru, content_uz, status, rejection_reason,
                    created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, templates)

            conn.commit()
            conn.close()
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(templates)} clean templates into {db_path}."))
