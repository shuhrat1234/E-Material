import os, django, sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.management import call_command
from django.contrib.auth.models import User

print("Running migrations...")
call_command('migrate', '--noinput')

print("Creating admin superuser...")
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(username='admin', password='admin123', email='admin@admin.com')
    print("✓ Admin created: username=admin  password=admin123")
else:
    u = User.objects.get(username='admin')
    u.set_password('admin123')
    u.is_superuser = True
    u.is_staff = True
    u.save()
    print("✓ Admin updated: username=admin  password=admin123")

print("Done! Login at http://127.0.0.1:8000/admin/")
