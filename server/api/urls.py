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
router.register(r"users", UserViewSet, basename="user")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"canines", CanineViewSet, basename="canine")
router.register(r"enrollment-plans", EnrollmentPlanViewSet, basename="enrollment-plan")
router.register(r"transport-services", TransportServiceViewSet, basename="transport-service")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")
router.register(r"attendances", AttendanceViewSet, basename="attendance")
router.register(r"internal-users", InternalUserViewSet, basename="internal-user")

urlpatterns = [
	path("", include(router.urls)),
	path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]