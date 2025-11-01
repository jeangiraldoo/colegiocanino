from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
	UserViewSet,
	ClientViewSet,
	CanineViewSet,
	EnrollmentPlanViewSet,
	TransportServiceViewSet,
	EnrollmentViewSet,
	AttendanceViewSet,
	DashboardStatsView,
	InternalUserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("clients", ClientViewSet, basename="client")
router.register("canines", CanineViewSet, basename="canine")
router.register("enrollment-plans", EnrollmentPlanViewSet, basename="enrollment-plan")
router.register("transport-services", TransportServiceViewSet, basename="transport-service")
router.register("enrollments", EnrollmentViewSet, basename="enrollment")
router.register("attendances", AttendanceViewSet, basename="attendance")
router.register("internal-users", InternalUserViewSet, basename="internal-user")

urlpatterns = [
	path("", include(router.urls)),
	path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]