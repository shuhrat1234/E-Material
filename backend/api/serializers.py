from rest_framework import serializers
from .models import (
    Department, Officer, Material, AppealStep, ApprovalRequest, AuditLog, ActiveVisit, SMSTemplate
)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class OfficerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Officer
        fields = '__all__'

class AppealStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealStep
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    appeals = AppealStepSerializer(many=True, read_only=True)
    
    class Meta:
        model = Material
        fields = '__all__'
        read_only_fields = ['id', 'registered_at', 'deadline', 'department']

class ApprovalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class ActiveVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActiveVisit
        fields = '__all__'

class SMSTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSTemplate
        fields = '__all__'
