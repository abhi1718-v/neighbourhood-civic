from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, WardViewSet, ReportViewSet, register, login, me

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("wards", WardViewSet)
router.register("reports", ReportViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", register),
    path("auth/login/", login),
    path("auth/me/", me),
]
