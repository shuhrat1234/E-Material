from django.core.management.base import BaseCommand
from api.models import Department, Officer, Material
from django.contrib.auth.models import User
from django.db import transaction

class Command(BaseCommand):
    help = 'Ensures Olmazor and Yashnobod departments exist, migrates legacy records to Olmazor, and initializes Yashnobod users.'

    def handle(self, *args, **options):
        self.stdout.write('Setting up districts (Olmazor & Yashnobod)...')

        with transaction.atomic():
            # 1. Olmazor Department
            dept_olmazor, created = Department.objects.get_or_create(
                id='olmazor',
                defaults={
                    'name_uz': "Olmazor tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi",
                    'name_ru': "Следственный отдел при УКД ОВД Алмазарского района Отделение доследственной проверки",
                }
            )
            if not created:
                dept_olmazor.name_uz = "Olmazor tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi"
                dept_olmazor.name_ru = "Следственный отдел при УКД ОВД Алмазарского района Отделение доследственной проверки"
                dept_olmazor.save()
            self.stdout.write(f'✓ Department: {dept_olmazor}')

            # 2. Yashnobod Department
            dept_yashnobod, created = Department.objects.get_or_create(
                id='yashnobod',
                defaults={
                    'name_uz': "Yashnobod tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi",
                    'name_ru': "Следственный отдел при УКД ОВД Яшнабадского района Отделение доследственной проверки",
                }
            )
            if not created:
                dept_yashnobod.name_uz = "Yashnobod tumani bo'yicha IIO FMB huzuridagi Tergov bo'limi Tergovga qadar tekshiruv bo'linmasi"
                dept_yashnobod.name_ru = "Следственный отдел при УКД ОВД Яшнабадского района Отделение доследственной проверки"
                dept_yashnobod.save()
            self.stdout.write(f'✓ Department: {dept_yashnobod}')

            # 3. Associate legacy officers (without department or with dummy depts) with Olmazor
            updated_officers = Officer.objects.filter(
                department__isnull=True
            ).update(department=dept_olmazor)
            legacy_depts_officers = Officer.objects.filter(
                department_id__in=['so', '1', 'ZAP', 'od', 'ur']
            ).update(department=dept_olmazor)
            self.stdout.write(f'✓ Assigned {updated_officers + legacy_depts_officers} existing officers to Olmazor')

            # 4. Associate legacy materials with Olmazor
            updated_materials = Material.objects.filter(
                department__isnull=True
            ).update(department=dept_olmazor)
            legacy_depts_materials = Material.objects.filter(
                department_id__in=['so', '1', 'ZAP', 'od', 'ur']
            ).update(department=dept_olmazor)
            self.stdout.write(f'✓ Assigned {updated_materials + legacy_depts_materials} existing materials to Olmazor')

            # 5. Create Yashnobod Chief: boshliq-yashnobod
            u_boshliq, u_created = User.objects.get_or_create(
                username='boshliq-yashnobod',
                defaults={'first_name': 'Boshliq', 'last_name': 'Yashnobod'}
            )
            u_boshliq.set_password('boshliq-yashnobod')
            u_boshliq.save()

            off_boshliq, o_created = Officer.objects.get_or_create(
                id='off_boshliq_yashnobod',
                defaults={
                    'user': u_boshliq,
                    'name_uz': "Yashnobod bo'lim boshlig'i",
                    'name_ru': "Начальник отделения Яшнабад",
                    'rank_uz': "",
                    'rank_ru': "",
                    'role': 'chief',
                    'department': dept_yashnobod,
                    'photo': 'Б'
                }
            )
            if not o_created:
                off_boshliq.user = u_boshliq
                off_boshliq.department = dept_yashnobod
                off_boshliq.role = 'chief'
                off_boshliq.rank_uz = ""
                off_boshliq.rank_ru = ""
                off_boshliq.save()
            self.stdout.write('✓ Yashnobod Chief: boshliq-yashnobod / boshliq-yashnobod')

            # 6. Create Yashnobod Registrator: registrator-yashnabod (and alias registrator-yashnobod)
            for reg_uname in ['registrator-yashnabod', 'registrator-yashnobod']:
                u_reg, _ = User.objects.get_or_create(
                    username=reg_uname,
                    defaults={'first_name': 'Registrator', 'last_name': 'Yashnobod'}
                )
                u_reg.set_password(reg_uname)
                u_reg.save()

            u_primary_reg = User.objects.get(username='registrator-yashnabod')
            off_reg, o_reg_created = Officer.objects.get_or_create(
                id='off_registrator_yashnobod',
                defaults={
                    'user': u_primary_reg,
                    'name_uz': "Registrator (Yashnobod)",
                    'name_ru': "Регистратор (Яшнабад)",
                    'rank_uz': "Materiallar registratori",
                    'rank_ru': "Регистратор",
                    'role': 'registrator',
                    'department': dept_yashnobod,
                    'photo': 'Р'
                }
            )
            if not o_reg_created:
                off_reg.user = u_primary_reg
                off_reg.department = dept_yashnobod
                off_reg.role = 'registrator'
                off_reg.save()
            self.stdout.write('✓ Yashnobod Registrator: registrator-yashnabod (and registrator-yashnobod) / [same as username]')

        self.stdout.write(self.style.SUCCESS('District setup completed successfully!'))
