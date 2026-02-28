from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Task, Programmer, TaskAttachment, User
from .serializers import TaskSerializer, UserSerializer, ProgrammerSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.parsers import MultiPartParser, FormParser


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow logging in with "Firstname Lastname" by normalizing to "firstname.lastname"
        if 'username' in attrs:
            attrs['username'] = attrs['username'].lower(
            ).strip().replace(' ', '.')
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['full_name'] = user.get_full_name() or user.username
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Task.objects.all().order_by('-created_at')
        return Task.objects.filter(assigned_to__user=user).order_by('-created_at')

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Faqat adminlar task yaratishi mumkin.")

        from django.utils import timezone
        status = self.request.data.get('status', 'TODO')

        extra_data = {}
        if status == 'PENDING':
            extra_data['pending_at'] = timezone.now()
        else:
            extra_data['todo_at'] = timezone.now()

        task = serializer.save(**extra_data)

        # Handle multiple images
        images = self.request.FILES.getlist('images')
        for img in images:
            TaskAttachment.objects.create(
                task=task, file=img, file_type='IMAGE')

        # Handle multiple videos
        videos = self.request.FILES.getlist('videos')
        for vid in videos:
            TaskAttachment.objects.create(
                task=task, file=vid, file_type='VIDEO')

        # Handle multiple audios
        audios = self.request.FILES.getlist('audios')
        for aud in audios:
            TaskAttachment.objects.create(
                task=task, file=aud, file_type='AUDIO')

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        from django.utils import timezone
        task = self.get_object()
        # Admin or assigned user can start
        if request.user.is_staff or (task.assigned_to and request.user == task.assigned_to.user):
            task.status = 'TODO'
            task.todo_at = timezone.now()
            task.save()
            return Response({'status': 'Task boshlandi deb belgilandi'})
        return Response({'error': 'Siz bu taskni boshlay olmaysiz'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        from django.utils import timezone
        task = self.get_object()
        if task.assigned_to and request.user == task.assigned_to.user:
            task.status = 'DONE'
            task.done_at = timezone.now()
            task.save()
            return Response({'status': 'Task bajardi deb belgilandi'})
        return Response({'error': 'Siz bu taskni bajara olmaysiz'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Faqat adminlar tasdiqlashi mumkin'}, status=status.HTTP_403_FORBIDDEN)
        from django.utils import timezone
        task = self.get_object()
        task.status = 'APPROVED'
        task.approved_at = timezone.now()
        task.save()
        return Response({'status': 'Task tasdiqlandi'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Faqat adminlar rad etishi mumkin'}, status=status.HTTP_403_FORBIDDEN)
        from django.utils import timezone
        task = self.get_object()
        task.status = 'REJECTED'
        task.rejected_at = timezone.now()
        task.save()
        return Response({'status': 'Task rad etildi'})


class ProgrammerViewSet(viewsets.ModelViewSet):
    queryset = Programmer.objects.all()
    serializer_class = ProgrammerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Faqat adminlar programmistni o\'chira oladi'}, status=status.HTTP_403_FORBIDDEN)

        instance = self.get_object()
        # Find the user associated with this programmer and delete them too
        user = User.objects.filter(programmer=instance).first()
        if user:
            user.delete()

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='create-user')
    def create_user(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Faqat adminlar programmist qo\'shishi mumkin.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'put'], url_path='update-user')
    def update_user(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Faqat adminlar programmistni tahrirlashi mumkin.'}, status=status.HTTP_403_FORBIDDEN)

        programmer = self.get_object()
        user = User.objects.filter(programmer=programmer).first()
        if not user:
            return Response({'error': 'Foydalanuvchi topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
