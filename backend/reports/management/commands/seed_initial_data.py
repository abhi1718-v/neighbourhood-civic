from django.core.management.base import BaseCommand
from reports.models import IssueCategory, MunicipalWard

class Command(BaseCommand):
    help = "Create starter issue categories and sample wards"
    def handle(self, *args, **kwargs):
        categories = [
            ("Pothole", "Road damage or potholes"),
            ("Streetlight", "Broken or non-working streetlights"),
            ("Garbage", "Garbage pileup or missed collection"),
            ("Drainage", "Blocked drains or waterlogging"),
            ("Water Supply", "Water leakage or supply issues"),
            ("Other", "Other public infrastructure issues"),
        ]
        for name, description in categories:
            IssueCategory.objects.get_or_create(name=name, defaults={"description": description})
        for i in range(1, 11):
            MunicipalWard.objects.get_or_create(name=f"Ward {i}", defaults={"code": f"W{i:02d}"})
        self.stdout.write(self.style.SUCCESS("Starter categories and 10 sample wards created. Replace sample wards with official ward data."))
