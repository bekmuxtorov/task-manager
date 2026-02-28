from django.db import models
from django.contrib.auth.models import AbstractUser


class Task(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Kutilmoqda'),
        ('TODO', 'Bugun uchun'),
        ('DONE', 'Bajarildi'),
        ('APPROVED', 'Tasdiqlandi'),
        ('REJECTED', 'Rad etildi'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_to = models.ForeignKey(
        'Programmer', on_delete=models.CASCADE, related_name='tasks')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='TODO')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Time tracking
    pending_at = models.DateTimeField(null=True, blank=True)
    todo_at = models.DateTimeField(null=True, blank=True)
    done_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.assigned_to}"


class Programmer(models.Model):
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    experience = models.CharField(
        max_length=100, null=True, blank=True)  # e.g., "3 yil"
    education = models.CharField(max_length=255, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    def __str__(self):
        # We'll use the reverse relation to get the name if available
        try:
            return f"{self.user.first_name} {self.user.last_name}"
        except:
            return f"Programmer {self.id}"


class User(AbstractUser):
    programmer = models.OneToOneField(
        Programmer, on_delete=models.SET_NULL, null=True, blank=True, related_name='user')

    # Roles
    is_programmer = models.BooleanField(default=False)
    is_tester = models.BooleanField(default=False)
    is_manager = models.BooleanField(default=False)

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.username


class TaskAttachment(models.Model):
    FILE_TYPES = [
        ('IMAGE', 'Rasm'),
        ('VIDEO', 'Video'),
        ('AUDIO', 'Audio'),
    ]
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='tasks/attachments/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_type} for {self.task.title}"
