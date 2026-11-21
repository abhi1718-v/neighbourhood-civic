from rest_framework import serializers
from .models import IssueCategory, MunicipalWard, CivicReport, IssueUpdate, MediaAttachment

class CategorySerializer(serializers.ModelSerializer):
    class Meta: model = IssueCategory; fields = ["id", "name", "description"]

class WardSerializer(serializers.ModelSerializer):
    class Meta: model = MunicipalWard; fields = ["id", "name", "code"]

class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    class Meta: model = MediaAttachment; fields = ["id", "url", "original_name"]
    def get_url(self, obj):
        if obj.public_url: return obj.public_url
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if obj.image and request else (obj.image.url if obj.image else "")

class IssueUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source="updated_by.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    class Meta:
        model = IssueUpdate
        fields = ["id", "status", "status_label", "message", "updated_by_name", "created_at"]

class CivicReportSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    ward_name = serializers.CharField(source="ward.name", read_only=True)
    reporter_name = serializers.CharField(source="reporter.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    image = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = CivicReport
        fields = [
            "id", "title", "description", "category", "category_name", "ward", "ward_name",
            "latitude", "longitude", "address_hint", "status", "status_label", "is_escalated",
            "escalation_note", "reporter", "reporter_name", "attachments", "image",
            "created_at", "updated_at",
        ]
        read_only_fields = ["status", "is_escalated", "escalation_note", "reporter", "created_at", "updated_at"]
    def create(self, validated_data):
        image = validated_data.pop("image", None)
        report = CivicReport.objects.create(**validated_data)
        if image:
            from .storage import upload_to_supabase
            try:
                public_url = upload_to_supabase(image)
            except Exception:
                public_url = None
            if public_url:
                MediaAttachment.objects.create(report=report, public_url=public_url, original_name=image.name)
            else:
                MediaAttachment.objects.create(report=report, image=image, original_name=image.name)
        IssueUpdate.objects.create(report=report, updated_by=report.reporter, status=report.status, message="Report submitted")
        return report
