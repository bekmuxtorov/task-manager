from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Task, Programmer, TaskAttachment, User


class TaskAttachmentInline(admin.TabularInline):
    model = TaskAttachment
    extra = 1


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name',
                    'last_name', 'is_staff', 'is_programmer', 'is_tester', 'is_manager')
    list_filter = BaseUserAdmin.list_filter + \
        ('is_programmer', 'is_tester', 'is_manager')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Roles', {'fields': ('is_programmer', 'is_tester', 'is_manager')}),
        ('Programmer Info', {'fields': ('programmer',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Roles', {'fields': ('is_programmer', 'is_tester', 'is_manager')}),
        ('Programmer Info', {'fields': ('programmer',)}),
    )

    def get_phone(self, obj):
        return obj.programmer.phone_number if obj.programmer else ""
    get_phone.short_description = 'Telefon'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'assigned_to',
                    'status', 'attachment_count', 'created_at')
    list_filter = ('status', 'assigned_to', 'created_at')
    search_fields = ('title', 'description')
    list_editable = ('status',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    inlines = [TaskAttachmentInline]

    def attachment_count(self, obj):
        return obj.attachments.count()
    attachment_count.short_description = 'Fayllar soni'


@admin.register(Programmer)
class ProgrammerAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user_name', 'phone_number')

    def get_user_name(self, obj):
        try:
            return obj.user.get_full_name()
        except:
            return "No User"
    get_user_name.short_description = 'Foydalanuvchi'


admin.site.site_header = "Task Management Admin"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Boshqaruv paneliga xush kelibsiz"
