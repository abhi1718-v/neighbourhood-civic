from django.contrib import admin
from .models import IssueCategory, MunicipalWard, CivicReport, IssueUpdate, MediaAttachment

@admin.register(CivicReport)
class CivicReportAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "ward", "status", "is_escalated", "created_at")
    list_filter = ("status", "is_escalated", "category", "ward")
    search_fields = ("title", "description", "reporter__username")
    readonly_fields = ("created_at", "updated_at")

@admin.register(IssueCategory)
class IssueCategoryAdmin(admin.ModelAdmin): list_display = ("name", "description")

@admin.register(MunicipalWard)
class MunicipalWardAdmin(admin.ModelAdmin): list_display = ("name", "code")

class IssueUpdateInline(admin.TabularInline):
    model = IssueUpdate
    extra = 0
    readonly_fields = ("updated_by", "created_at")

class MediaInline(admin.TabularInline):
    model = MediaAttachment
    extra = 0

# Add related history and media to report editing.
CivicReportAdmin.inlines = [IssueUpdateInline, MediaInline]
admin.site.register(IssueUpdate)
admin.site.register(MediaAttachment)
