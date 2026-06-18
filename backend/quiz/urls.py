from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, CurrentRoundView, QuestionsView,
    SubmitAnswersView, UserResultsView, AdminStartRoundView, AdminEndRoundView,
    AdminQuestionListCreateView, AdminQuestionDetailView, AdminSubmissionsListView,
    AdminPublishResultsView, LeaderboardView, WinnerView, AdminExportExcelView,
    AdminResetCompetitionView, NotificationsView, MarkNotificationReadView,
    MarkAllNotificationsReadView
)

urlpatterns = [
    # Auth endpoints
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    
    # Participant Endpoints
    path('current-round/', CurrentRoundView.as_view(), name='current-round'),
    path('questions/<int:round_id>/', QuestionsView.as_view(), name='round-questions'),
    path('submit-answers/', SubmitAnswersView.as_view(), name='submit-answers'),
    path('results/', UserResultsView.as_view(), name='user-results'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('winners/', WinnerView.as_view(), name='winners'),

    # Notification Endpoints
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('notifications/<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('notifications/read-all/', MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),

    # Admin Endpoints
    path('admin/start-round/', AdminStartRoundView.as_view(), name='admin-start-round'),
    path('admin/end-round/', AdminEndRoundView.as_view(), name='admin-end-round'),
    path('admin/questions/', AdminQuestionListCreateView.as_view(), name='admin-questions-list-create'),
    path('admin/questions/<int:pk>/', AdminQuestionDetailView.as_view(), name='admin-questions-detail'),
    path('admin/submissions/', AdminSubmissionsListView.as_view(), name='admin-submissions'),
    path('admin/publish-results/', AdminPublishResultsView.as_view(), name='admin-publish-results'),
    path('admin/export-excel/', AdminExportExcelView.as_view(), name='admin-export-excel'),
    path('admin/reset-competition/', AdminResetCompetitionView.as_view(), name='admin-reset-competition'),
]

