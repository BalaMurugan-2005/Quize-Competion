from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Round, Question, Submission, Result, Winner, Notification

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('register_no', 'name', 'department', 'email', 'is_staff', 'is_superuser')
    search_fields = ('register_no', 'name', 'email', 'department')
    ordering = ('register_no',)
    fieldsets = (
        (None, {'fields': ('register_no', 'password')}),
        ('Personal Info', {'fields': ('name', 'email', 'department')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'round', 'question', 'correct_answer')
    list_filter = ('round',)
    search_fields = ('question',)

class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'question', 'selected_answer', 'submitted_at')
    list_filter = ('question__round', 'selected_answer')
    search_fields = ('user__name', 'user__register_no', 'question__question')

class ResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'round', 'score', 'finalized', 'qualified')
    list_filter = ('round', 'finalized', 'qualified')
    search_fields = ('user__name', 'user__register_no')

class WinnerAdmin(admin.ModelAdmin):
    list_display = ('position', 'user')
    ordering = ('position',)

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'round')
    search_fields = ('user__name', 'user__register_no', 'title')

admin.site.register(User, CustomUserAdmin)
admin.site.register(Round, admin.ModelAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Submission, SubmissionAdmin)
admin.site.register(Result, ResultAdmin)
admin.site.register(Winner, WinnerAdmin)
admin.site.register(Notification, NotificationAdmin)
