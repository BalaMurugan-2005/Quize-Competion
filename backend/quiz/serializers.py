from rest_framework import serializers
from .models import User, Round, Question, Submission, Result, Winner, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'register_no', 'department', 'email', 'is_staff']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'register_no', 'department', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            register_no=validated_data['register_no'],
            password=validated_data['password'],
            name=validated_data['name'],
            email=validated_data['email'],
            department=validated_data['department']
        )
        return user

class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ['id', 'name', 'status', 'start_time', 'end_time', 'results_published']

class QuestionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'round', 'question', 'option_a', 'option_b', 'option_c', 'option_d']

class QuestionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'round', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'user', 'question', 'selected_answer', 'submitted_at']
        read_only_fields = ['user', 'submitted_at']

class SubmissionDetailSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    question_details = QuestionAdminSerializer(source='question', read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'user', 'user_details', 'question', 'question_details', 'selected_answer', 'submitted_at']

class ResultSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    round_details = RoundSerializer(source='round', read_only=True)
    submitted_at = serializers.SerializerMethodField()
    questions_answered = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            'id', 'user', 'user_details', 'round', 'round_details', 
            'score', 'qualified', 'submitted_at', 'questions_answered', 'total_questions'
        ]

    def get_submitted_at(self, obj):
        # Find the latest submission time for this user and round
        latest_sub = Submission.objects.filter(
            user=obj.user, 
            question__round=obj.round
        ).order_by('-submitted_at').first()
        return latest_sub.submitted_at if latest_sub else None

    def get_questions_answered(self, obj):
        # Count submissions by the user for this round
        return Submission.objects.filter(
            user=obj.user,
            question__round=obj.round
        ).count()

    def get_total_questions(self, obj):
        # Count total questions in the round
        return Question.objects.filter(round=obj.round).count()

class WinnerSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Winner
        fields = ['id', 'position', 'user', 'user_details']

class NotificationSerializer(serializers.ModelSerializer):
    round_details = RoundSerializer(source='round', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at', 'round', 'round_details']
