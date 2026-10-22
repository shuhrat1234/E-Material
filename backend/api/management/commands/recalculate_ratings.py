from django.core.management.base import BaseCommand
from api.models import Officer

class Command(BaseCommand):
    help = 'Recalculates likes, dislikes, and satisfaction index (Mamnunlik indeksi) for all officers based on actual ratings'

    def handle(self, *args, **options):
        officers = Officer.objects.all()
        self.stdout.write(f'Recalculating ratings for {officers.count()} officers...')
        for officer in officers:
            old_index = officer.index
            officer.recalculate_ratings()
            self.stdout.write(
                f'  {officer.id} ({officer.name_uz}): '
                f'likes={officer.likes}, dislikes={officer.dislikes}, '
                f'index {old_index}% -> {officer.index}%'
            )
        self.stdout.write(self.style.SUCCESS('Successfully recalculated all officer ratings!'))
