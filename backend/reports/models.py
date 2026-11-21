from django.conf import settings
from django.db import models

class IssueCategory(models.Model):
    name = models.CharField(max_length=80, unique=True)
    description = models.CharField(max_length=255, blank=True)
    def __str__(self): return self.name

class MunicipalWard(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, blank=True)
    def __str__(self): return self.name

class CivicReport(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        ACKNOWLEDGED = "acknowledged", "Acknowledged"
        IN_PROGRESS = "in_progress", "In Progress"
        RESOLVED = "resolved", "Resolved"
        REJECTED = "rejected", "Rejected"

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="civic_reports")
    title = models.CharField(max_length=140)
    description = models.TextField()
    category = models.ForeignKey(IssueCategory, on_delete=models.PROTECT, related_name="reports")
    ward = models.ForeignKey(MunicipalWard, on_delete=models.PROTECT, related_name="reports")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address_hint = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    is_escalated = models.BooleanField(default=False)
    escalation_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
    def __str__(self): return f"#{self.pk} {self.title}"

class MediaAttachment(models.Model):
    report = models.ForeignKey(CivicReport, on_delete=models.CASCADE, related_name="attachments")
    image = models.ImageField(upload_to="civic_reports/", blank=True, null=True)
    public_url = models.URLField(blank=True)
    original_name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class IssueUpdate(models.Model):
    report = models.ForeignKey(CivicReport, on_delete=models.CASCADE, related_name="updates")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=CivicReport.Status.choices)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self): return f"{self.report_id}: {self.get_status_display()}"
