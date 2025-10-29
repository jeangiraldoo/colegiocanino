from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
	User,
	Client,
	Canine,
	EnrollmentPlan,
	TransportService,
	Enrollment,
	Attendance,
	InternalUser,
)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	fieldsets = DjangoUserAdmin.fieldsets + (
		(
			"Additional Info",
			{
				"fields": (
					"phone_number",
					"address",
					"status",
					"document_id",
					"registration_date",
				)
			},
		),
	)
	list_display = (
		"username",
		"email",
		"first_name",
		"last_name",
		"status",
		"document_id",
		"registration_date",
		"is_staff",
	)
	search_fields = ("username", "email", "first_name", "last_name", "document_id")


@admin.register(InternalUser)
class InternalUserAdmin(admin.ModelAdmin):
	list_display = ("user", "role", "date_joined")
	search_fields = ("user__username", "user__email", "role")
	list_filter = ("role",)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
	list_display = ("id", "user")
	search_fields = (
		"user__username",
		"user__email",
		"user__first_name",
		"user__last_name",
	)
	ordering = ("-user__registration_date",)


@admin.register(Canine)
class CanineAdmin(admin.ModelAdmin):
	list_display = ("name", "breed", "age", "size", "client", "status")
	search_fields = ("name", "breed", "client__user__username")
	list_filter = ("size", "status")


@admin.register(EnrollmentPlan)
class EnrollmentPlanAdmin(admin.ModelAdmin):
	list_display = ("name", "duration", "price", "active")
	list_filter = ("duration", "active")
	search_fields = ("name",)


@admin.register(TransportService)
class TransportServiceAdmin(admin.ModelAdmin):
	list_display = ("type",)
	list_filter = ("type",)
	search_fields = ("type",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
	list_display = (
		"canine",
		"plan",
		"transport_service",
		"enrollment_date",
		"expiration_date",
		"status",
	)
	list_filter = ("status", "enrollment_date", "expiration_date")
	search_fields = ("canine__name", "plan__name")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
	list_display = (
		"enrollment",
		"date",
		"status",
		"arrival_time",
		"departure_time",
	)
	list_filter = ("status", "date")
	search_fields = ("enrollment__canine__name",)
