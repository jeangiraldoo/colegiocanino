from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
	AttendanceViewSet,
	CanineViewSet,
	ClientViewSet,
	EnrollmentPlanViewSet,
	EnrollmentsByPlanReportView,
	EnrollmentViewSet,
	InternalUserViewSet,
	MonthlyIncomeReportView,
	ReportsViewSet,
	TransportServiceViewSet,
	UserViewSet,
	canine_attendance_view,
	profile_view,
	register_view,
	user_type_view,
	verify_password,
	EnrollmentsByPlanReportView,
	MonthlyIncomeReportView,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("clients", ClientViewSet, basename="client")
router.register("canines", CanineViewSet, basename="canine")
router.register("enrollment-plans", EnrollmentPlanViewSet, basename="enrollment-plan")
router.register("transport-services", TransportServiceViewSet, basename="transport-service")
router.register("enrollments", EnrollmentViewSet, basename="enrollment")
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register("internal-users", InternalUserViewSet, basename="internal-user")
router.register("reports", ReportsViewSet, basename="reports")

urlpatterns = [
	path("", include(router.urls)),
	path("reports/enrollments-by-plan-detailed/", EnrollmentsByPlanReportView.as_view(), name="enrollments-by-plan-detailed"),
	path("reports/monthly-income/", MonthlyIncomeReportView.as_view(), name="monthly-income"),
	path("register/", register_view, name="register"),
	path("profile/", profile_view, name="profile"),
	path("canines/<int:canine_id>/attendance/", canine_attendance_view, name="canine-attendance"),
	path("user-type/", user_type_view, name="user-type"),
	path(
		"reports/enrollments-by-plan/",
		EnrollmentsByPlanReportView.as_view(),
		name="enrollments-by-plan-report",
	),
	path(
		"reports/monthly-income/",
		MonthlyIncomeReportView.as_view(),
		name="monthly-income-report",
	),
	path("auth/verify-password/", verify_password, name="verify-password"),
]
