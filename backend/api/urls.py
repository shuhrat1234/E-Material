from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, OfficerViewSet, MaterialViewSet, ApprovalRequestViewSet,
    AuditLogViewSet, ActiveVisitViewSet, SMSTemplateViewSet, DbOperationsViewSet, AiAssistantViewSet,
    login_view
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'officers', OfficerViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'approvals', ApprovalRequestViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'visits', ActiveVisitViewSet)
router.register(r'templates', SMSTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('db/reset/', DbOperationsViewSet.as_view({'post': 'reset_db'})),
    path('ai/chat/', AiAssistantViewSet.as_view({'post': 'chat'})),
    path('auth/login/', login_view),
]

