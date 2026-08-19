from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, OfficerViewSet, MaterialViewSet, MaterialDocumentViewSet, ApprovalRequestViewSet,
    AuditLogViewSet, ActiveVisitViewSet, SMSTemplateViewSet, DbOperationsViewSet, AiAssistantViewSet,
    ChatMessageViewSet, CaseRequestViewSet, EkspertizaViewSet, TaqiqViewSet, login_view, check_material_status
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'officers', OfficerViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'material-documents', MaterialDocumentViewSet)
router.register(r'approvals', ApprovalRequestViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'visits', ActiveVisitViewSet)
router.register(r'templates', SMSTemplateViewSet)
router.register(r'chat/messages', ChatMessageViewSet)
router.register(r'case-requests', CaseRequestViewSet)
router.register(r'ekspertizas', EkspertizaViewSet)
router.register(r'taqiqlar', TaqiqViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('db/reset/', DbOperationsViewSet.as_view({'post': 'reset_db'})),
    path('ai/chat/', AiAssistantViewSet.as_view({'post': 'chat'})),
    path('ai/citizen-chat/', AiAssistantViewSet.as_view({'post': 'citizen_chat'})),
    path('ai/report/', AiAssistantViewSet.as_view({'post': 'report'})),
    path('auth/login/', login_view),
    path('public/check-status/', check_material_status),
]

