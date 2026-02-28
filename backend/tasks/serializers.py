from rest_framework import serializers
from .models import Task, Programmer, TaskAttachment, User


class ProgrammerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Programmer
        fields = ('id', 'full_name', 'phone_number',
                  'address', 'experience', 'education', 'bio')

    def get_full_name(self, obj):
        try:
            return obj.user.get_full_name()
        except:
            return f"Programmer {obj.id}"


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True)
    address = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True)
    experience = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True)
    education = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True)
    bio = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'full_name',
                  'is_staff', 'password', 'phone_number', 'address',
                  'experience', 'education', 'bio',
                  'is_programmer', 'is_tester', 'is_manager')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'allow_blank': True},
            'username': {'required': False, 'allow_blank': True}
        }

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def create(self, validated_data):
        password = validated_data.pop('password')

        # Profile data
        profile_data = {
            'phone_number': validated_data.pop('phone_number', None),
            'address': validated_data.pop('address', None),
            'experience': validated_data.pop('experience', None),
            'education': validated_data.pop('education', None),
            'bio': validated_data.pop('bio', None),
        }

        # Roles (handled by DRF automatically if passed, but good to ensure defaults)
        is_programmer = validated_data.get('is_programmer', False)

        # Username as "firstname.lastname"
        first_name = validated_data.get('first_name', '').lower().strip()
        last_name = validated_data.get('last_name', '').lower().strip()
        username = f"{first_name}.{last_name}"

        if not first_name or not last_name:
            username = validated_data.get(
                'username', 'user_' + str(User.objects.count()))

        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        validated_data.pop('username', None)

        # Create Programmer profile only if is_programmer is True
        programmer = None
        if is_programmer:
            programmer = Programmer.objects.create(**profile_data)

        # Create User with link to programmer
        user = User.objects.create_user(
            username=username,
            password=password,
            programmer=programmer,
            **validated_data
        )
        return user

    def update(self, instance, validated_data):
        # Profile data
        profile_fields = ['phone_number', 'address',
                          'experience', 'education', 'bio']
        profile_data = {f: validated_data.pop(
            f) for f in profile_fields if f in validated_data}

        # Roles
        is_programmer = validated_data.get(
            'is_programmer', instance.is_programmer)

        # Update Programmer profile if exists
        if instance.programmer:
            for attr, value in profile_data.items():
                setattr(instance.programmer, attr, value)
            instance.programmer.save()
        elif is_programmer and profile_data:
            # Create programmer profile if it didn't exist but now is_programmer is True
            programmer = Programmer.objects.create(**profile_data)
            instance.programmer = programmer

        # Handle password if provided
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class TaskAttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ('id', 'file', 'file_type', 'created_at')

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    duration_info = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'

    def get_attachments(self, obj):
        request = self.context.get('request')
        serializer = TaskAttachmentSerializer(
            obj.attachments.all(), many=True, context={'request': request}
        )
        return serializer.data

    def get_assigned_to_name(self, obj):
        return str(obj.assigned_to)

    def get_duration_info(self, obj):
        data = {
            'pending_to_todo': None,
            'todo_to_done': None,
            'done_to_approved': None,
            'total_time': None
        }

        if obj.pending_at and obj.todo_at:
            diff = obj.todo_at - obj.pending_at
            data['pending_to_todo'] = self.format_duration(diff)

        if obj.todo_at and obj.done_at:
            diff = obj.done_at - obj.todo_at
            data['todo_to_done'] = self.format_duration(diff)

        if obj.done_at and obj.approved_at:
            diff = obj.approved_at - obj.done_at
            data['done_to_approved'] = self.format_duration(diff)

        if obj.todo_at and obj.approved_at:
            diff = obj.approved_at - obj.todo_at
            data['total_time'] = self.format_duration(diff)

        return data

    def format_duration(self, td):
        if not td:
            return None
        days = td.days
        hours, remainder = divmod(td.seconds, 3600)
        minutes, _ = divmod(remainder, 60)

        parts = []
        if days > 0:
            parts.append(f"{days} k")
        if hours > 0:
            parts.append(f"{hours} s")
        if minutes > 0:
            parts.append(f"{minutes} d")

        return " ".join(parts) if parts else "1 d.dan kam"
