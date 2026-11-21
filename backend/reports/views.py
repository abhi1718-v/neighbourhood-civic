from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import IssueCategory, MunicipalWard, CivicReport, IssueUpdate
from .serializers import CategorySerializer, WardSerializer, CivicReportSerializer, IssueUpdateSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = IssueCategory.objects.all().order_by("name")
    serializer_class = CategorySerializer

class WardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MunicipalWard.objects.all().order_by("name")
    serializer_class = WardSerializer

class ReportViewSet(viewsets.ModelViewSet):
    queryset = CivicReport.objects.select_related("category", "ward", "reporter").prefetch_related("attachments", "updates")
    serializer_class = CivicReportSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create": return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        ward = self.request.query_params.get("ward")
        status_value = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        if category: qs = qs.filter(category_id=category)
        if ward: qs = qs.filter(ward_id=ward)
        if status_value: qs = qs.filter(status=status_value)
        if search: qs = qs.filter(title__icontains=search) | qs.filter(description__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=["get"])
    def updates(self, request, pk=None):
        report = self.get_object()
        return Response(IssueUpdateSerializer(report.updates.all(), many=True).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        report = self.get_object()
        new_status = request.data.get("status")
        allowed = [choice[0] for choice in CivicReport.Status.choices]
        if new_status not in allowed:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        report.status = new_status
        report.save()
        IssueUpdate.objects.create(report=report, updated_by=request.user, status=new_status,
                                   message=request.data.get("message", "Status updated by municipal staff"))
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def escalate(self, request, pk=None):
        report = self.get_object()
        report.is_escalated = True
        report.escalation_note = request.data.get("message", "Escalated for municipal review")
        report.save()
        IssueUpdate.objects.create(report=report, updated_by=request.user, status=report.status,
                                   message=f"Escalated: {report.escalation_note}")
        return Response(self.get_serializer(report).data)

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    if not username or len(password) < 8:
        return Response({"error": "Enter a username and a password of at least 8 characters."}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists."}, status=400)
    user = User.objects.create_user(username=username, password=password)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username}, status=201)

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(username=request.data.get("username", ""), password=request.data.get("password", ""))
    if not user:
        return Response({"error": "Invalid username or password."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({"username": request.user.username, "is_staff": request.user.is_staff})
