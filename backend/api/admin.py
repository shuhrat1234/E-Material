from django.contrib import admin
from .models import Department, Officer, Material, AppealStep, ApprovalRequest, AuditLog, ActiveVisit, SMSTemplate

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_ru', 'name_uz')
    search_fields = ('id', 'name_ru', 'name_uz')

@admin.register(Officer)
class OfficerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name_ru', 'role', 'index', 'likes', 'dislikes')
    list_filter = ('role', 'department')
    search_fields = ('name_ru', 'name_uz')

class AppealStepInline(admin.TabularInline):
    model = AppealStep
    extra = 1

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'citizen_name', 'registered_at', 'deadline', 'status', 'officer')
    list_filter = ('status', 'material_type', 'source_from', 'department')
    search_fields = ('id', 'citizen_name', 'title_ru', 'title_uz')
    inlines = [AppealStepInline]

@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ('case', 'officer', 'type', 'requested_at')
    list_filter = ('type',)
    search_fields = ('case__id', 'officer__name_ru')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('time', 'user_name', 'action_ru')
    search_fields = ('user_name', 'action_ru', 'action_uz')

@admin.register(ActiveVisit)
class ActiveVisitAdmin(admin.ModelAdmin):
    list_display = ('id', 'citizen_name', 'officer', 'start_time')
    search_fields = ('citizen_name', 'officer__name_ru')

@admin.register(SMSTemplate)
class SMSTemplateAdmin(admin.ModelAdmin):
    list_display = ('template_id', 'type', 'trigger_ru')
    search_fields = ('template_id', 'trigger_ru', 'trigger_uz')
