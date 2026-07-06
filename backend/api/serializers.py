from rest_framework import serializers
from .models import (
    Department, Officer, Material, AppealStep, ApprovalRequest, AuditLog, ActiveVisit, SMSTemplate, ChatMessage, Rating
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
        extra_kwargs = {
            'status': {'required': False}
        }

class ApprovalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = '__all__'

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
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

class ChatMessageSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_id', 'sender_name', 'recipient_id', 'text', 'file', 'file_url', 'is_image', 'is_read', 'time']
        extra_kwargs = {
            'file': {'write_only': True}
        }

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            url = obj.file.url
            return request.build_absolute_uri(url) if request else url
        return None
