
from django.contrib.auth import get_user_model
from tasks.models import Task, Programmer
import random

User = get_user_model()

# Clean up existing test data if needed (optional, but good for repeatability)
# Task.objects.all().delete()
# Programmer.objects.all().delete()
# User.objects.filter(username__startswith='prog').delete()

# 1. Create 10 programmers
programmers = []
for i in range(1, 11):
    username = f"prog{i}"
    if not User.objects.filter(username=username).exists():
        p_profile = Programmer.objects.create(
            phone_number=f"+9989012345{i:02d}",
            address=f"Manzil {i}",
            experience=f"{i} yil",
            education="Oliy",
            bio=f"Men {i}-programmistman"
        )
        user = User.objects.create_user(
            username=username,
            password="password123",
            first_name=f"Programmist",
            last_name=str(i),
            is_programmer=True,
            programmer=p_profile
        )
        programmers.append(user)
    else:
        programmers.append(User.objects.get(username=username))

# 2. Create 50 tasks
# 5 APPROVED
# 6 DONE
# 10 TODO
# 11 PENDING
# 18 others (mix)

task_configs = [
    ('APPROVED', 5),
    ('DONE', 6),
    ('TODO', 10),
    ('PENDING', 11),
    ('REJECTED', 9),
    ('TODO', 9),
]

task_count = 0
for status, count in task_configs:
    for _ in range(count):
        task_count += 1
        Task.objects.create(
            title=f"Test Task {task_count}",
            description=f"Bu {task_count}-chi test vazifasi. Status: {status}",
            assigned_to=random.choice(programmers).programmer,
            status=status
        )

print(f"Successfully created 10 programmers and {task_count} tasks.")
