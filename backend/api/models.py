from django.db import models
from django.contrib.auth.models import User

class Department(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name_ru = models.CharField(max_length=255)
    name_uz = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.id} - {self.name_ru}"

class Officer(models.Model):
    ROLE_CHOICES = [
        ('registrator',     'Регистратор'),
        ('investigator',    'Следователь'),
        ('inquiry_officer', 'Дознаватель'),
        ('chief',           'Начальник'),
    ]

    id = models.CharField(max_length=50, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='officer', null=True, blank=True)
    name_ru = models.CharField(max_length=255)
    name_uz = models.CharField(max_length=255)
    rank_ru = models.CharField(max_length=100)
    rank_uz = models.CharField(max_length=100)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)

    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='officers', null=True, blank=True)
    likes = models.IntegerField(default=0)
    dislikes = models.IntegerField(default=0)
    index = models.IntegerField(default=100)
    photo = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return self.name_ru

class Material(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    citizen_name = models.CharField(max_length=255)
    citizen_phone = models.CharField(max_length=50)
    title_ru = models.TextField()
    title_uz = models.TextField()
    registered_at = models.DateTimeField()
    deadline = models.DateTimeField()
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50) # изучаемый, закрыт_в_срок, срок_приближается, срок_нарушен
    officer = models.ForeignKey(Officer, on_delete=models.SET_NULL, related_name='materials', null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, related_name='materials', null=True, blank=True)
    is_accepted = models.BooleanField(default=True)
    extension_count = models.IntegerField(default=0)
    difficulty = models.IntegerField(default=3)
    material_type = models.CharField(max_length=50, default='ariza') # ariza, bildirgi, sud_ajrimi, boshqa
    source_from = models.CharField(max_length=50, default='tashrif') # tashrif, prakuratura, prezident_aparat, iio, portal
    citizen_notification_text = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.id

class AppealStep(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='appeals')
    status = models.CharField(max_length=255)
    time = models.DateTimeField()

    class Meta:
        ordering = ['time']

class ApprovalRequest(models.Model):
    case = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='approvals')
    officer = models.ForeignKey(Officer, on_delete=models.CASCADE, related_name='approvals')
    type = models.CharField(max_length=50) # закрыт_в_срок, возбуждено, перенаправлено
    reason = models.TextField()
    case_num = models.CharField(max_length=100, null=True, blank=True)
    org_name = models.CharField(max_length=255, null=True, blank=True)
    requested_at = models.DateTimeField()

    def __str__(self):
        return f"{self.case_id} - {self.type}"

class AuditLog(models.Model):
    time = models.DateTimeField()
    user_name = models.CharField(max_length=255)
    action_ru = models.TextField()
    action_uz = models.TextField()

    class Meta:
        ordering = ['-time']

class ActiveVisit(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    citizen_name = models.CharField(max_length=255)
    citizen_phone = models.CharField(max_length=50)
    officer = models.ForeignKey(Officer, on_delete=models.CASCADE, related_name='visits')
    start_time = models.DateTimeField()
    purpose_ru = models.TextField()
    purpose_uz = models.TextField()

    def __str__(self):
        return self.citizen_name

class SMSTemplate(models.Model):
    template_id = models.CharField(max_length=50, primary_key=True)
    type = models.CharField(max_length=50)
    trigger_ru = models.CharField(max_length=255)
    trigger_uz = models.CharField(max_length=255)
    content_ru = models.TextField()
    content_uz = models.TextField()

    def __str__(self):
        return self.template_id


# Signals to automatically create linked User model when creating Officer
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Officer)
def create_user_for_officer(sender, instance, created, **kwargs):
    if created and not instance.user:
        username = instance.id.replace('off_', '') if instance.id.startswith('off_') else instance.id
        if User.objects.filter(username=username).exists():
            username = f"{username}_{instance.id}"
        # Create standard Django user
        user = User.objects.create_user(username=username, password='password123')
        # Also give staff status to log into Django admin panel!
        user.is_staff = True
        user.save()
        instance.user = user
        # Avoid recursion by updating only user field
        Officer.objects.filter(pk=instance.pk).update(user=user)

