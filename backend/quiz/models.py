from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, register_no, password=None, **extra_fields):
        if not register_no:
            raise ValueError('The Register Number field must be set')
        user = self.model(register_no=register_no, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, register_no, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(register_no, password, **extra_fields)

class User(AbstractUser):
    username = None  # Remove username field
    name = models.CharField(max_length=150)
    register_no = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'register_no'
    REQUIRED_FIELDS = ['name', 'email', 'department']

    objects = UserManager()

    def __str__(self):
        return f"{self.name} ({self.register_no})"

class Round(models.Model):
    STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    )
    name = models.CharField(max_length=100)  # e.g. "Round 1", "Round 2", "Final Round"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    results_published = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.status}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('RESULT', 'Result Published'),
        ('QUALIFIED', 'Qualified for Next Round'),
        ('NOT_QUALIFIED', 'Not Qualified'),
        ('WINNER', 'Winner Announcement'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='RESULT')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    round = models.ForeignKey(Round, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} - {self.title} ({self.notification_type})"

class Question(models.Model):
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    
    ANSWER_CHOICES = (
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    )
    correct_answer = models.CharField(max_length=1, choices=ANSWER_CHOICES)

    def __str__(self):
        return f"Q: {self.question[:50]}... ({self.round.name})"

class Submission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='submissions')
    selected_answer = models.CharField(max_length=1, choices=Question.ANSWER_CHOICES)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'question')

    def __str__(self):
        return f"{self.user.register_no} -> Qid:{self.question.id} (Ans: {self.selected_answer})"

class Result(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='results')
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='results')
    score = models.IntegerField(default=0)
    qualified = models.BooleanField(default=False)
    finalized = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'round')

    def __str__(self):
        return f"{self.user.name} - {self.round.name} - Score: {self.score} (Qual: {self.qualified})"

class Winner(models.Model):
    POSITION_CHOICES = (
        (1, 'First Prize'),
        (2, 'Second Prize'),
        (3, 'Third Prize'),
    )
    position = models.IntegerField(choices=POSITION_CHOICES, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='winners')

    def __str__(self):
        return f"Position {self.position}: {self.user.name}"
