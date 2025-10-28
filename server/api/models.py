from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
	"""Custom User model extending Django's AbstractUser"""

	phone_number = models.CharField(max_length=15, blank=True)
	address = models.TextField(blank=True)
	status = models.BooleanField(default=True)  # Active/Inactive
	document_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
	registration_date = models.DateField(default=timezone.now)

	class Meta:
		verbose_name = _("user")
		verbose_name_plural = _("users")

	def __str__(self):
		return self.username


class InternalUser(models.Model):
	"""
	Internal user profile for staff members with specific roles.
	"""

	class Roles(models.TextChoices):
		ADMIN = "ADMIN", "Administrator"
		DIRECTOR = "DIRECTOR", "Director"
		ADVISOR = "ADVISOR", "Advisor"
		COACH = "COACH", "Coach"

	user = models.OneToOneField(
		User, on_delete=models.CASCADE, primary_key=True, related_name="internal_profile"
	)

	role = models.CharField(
		max_length=10,
		choices=Roles.choices,
		default=Roles.COACH,
	)

	birthdate = models.DateField(blank=True, null=True)

	date_joined = models.DateField(blank=True, null=True)

	photo = models.ImageField(upload_to="internal_profile_photos/", blank=True, null=True)

	def __str__(self):
		return f"{self.user.username} ({self.get_role_display()})"

	class Meta:
		verbose_name = "Internal User"
		verbose_name_plural = "Internal Users"


class Client(models.Model):
	"""Client/Owner model"""

	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")

	class Meta:
		verbose_name = _("client")
		verbose_name_plural = _("clients")
		ordering = ["-user__registration_date"]

	def __str__(self):
		return f"{self.user.get_full_name() or self.user.username}"


class Canine(models.Model):
	"""Canine/Pet model"""

	class Size(models.TextChoices):
		MINI = "mini", _("Mini")
		SMALL = "small", _("Small")
		MEDIUM = "medium", _("Medium")
		BIG = "big", _("Big")

	client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="canines")
	name = models.CharField(max_length=100)
	breed = models.CharField(max_length=100)
	age = models.IntegerField()
	size = models.CharField(max_length=20, choices=Size.choices)
	photo = models.ImageField(upload_to="canines/", blank=True, null=True)
	creation_date = models.DateTimeField(auto_now_add=True)
	status = models.BooleanField(default=True)

	class Meta:
		verbose_name = _("canine")
		verbose_name_plural = _("canines")
		ordering = ["name"]

	def __str__(self):
		return f"{self.name} ({self.breed})"


class EnrollmentPlan(models.Model):
	"""Enrollment plan model"""

	class Duration(models.TextChoices):
		ONE_MONTH = "1_mes", _("1 Mes")
		ONE_BIMESTER = "1_bimestre", _("1 Bimestre")
		ONE_TRIMESTER = "1_trimestre", _("1 Trimestre")
		SIX_MONTHS = "6_meses", _("6 Meses")
		ONE_YEAR = "1_año", _("1 Año")

	name = models.CharField(max_length=100)
	duration = models.CharField(max_length=20, choices=Duration.choices)
	price = models.DecimalField(max_digits=10, decimal_places=2)
	active = models.BooleanField(default=True)

	class Meta:
		verbose_name = _("enrollment plan")
		verbose_name_plural = _("enrollment plans")

	def __str__(self):
		return f"{self.name} - {self.get_duration_display()}"


class TransportService(models.Model):
	"""Transport service model"""

	class Type(models.TextChoices):
		FULL = "full", _("full service")
		MEDIUM = "medium", _("medium service (Only morning or afternoon)")
		NO_SERVICE = "no_service", _("no service")

	type = models.CharField(max_length=20, choices=Type.choices)

	class Meta:
		verbose_name = _("transport service")
		verbose_name_plural = _("transport services")

	def __str__(self):
		return self.get_type_display()


class Enrollment(models.Model):
	"""Canine enrollment model"""

	canine = models.ForeignKey(Canine, on_delete=models.CASCADE, related_name="enrollments")
	plan = models.ForeignKey(EnrollmentPlan, on_delete=models.PROTECT, related_name="enrollments")
	transport_service = models.ForeignKey(
		TransportService, on_delete=models.PROTECT, related_name="enrollments"
	)
	enrollment_date = models.DateField()
	expiration_date = models.DateField()
	status = models.BooleanField(default=True)  # Active/Inactive
	creation_date = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = _("enrollment")
		verbose_name_plural = _("enrollments")
		ordering = ["-creation_date"]

	def __str__(self):
		return f"Enrollment of {self.canine.name} - {self.plan.name}"


class Attendance(models.Model):
	"""Attendance tracking model"""

	class Status(models.TextChoices):
		PRESENT = "present", _("Present")
		ADVANCE_WITHDRAWAL = "advance_withdrawal", _("Advance withdrawal")
		DISPATCHED = "dispatched", _("Dispatched")
		ABSENT = "absent", _("Absent")

	enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="attendances")
	date = models.DateField()
	arrival_time = models.TimeField(blank=True, null=True)
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
	departure_time = models.TimeField(blank=True, null=True)
	withdrawal_reason = models.TextField(blank=True)

	class Meta:
		verbose_name = _("attendance")
		verbose_name_plural = _("attendances")
		ordering = ["-date", "-arrival_time"]
		unique_together = ["enrollment", "date"]

	def __str__(self):
		return f"Attendance - {self.enrollment.canine.name} - {self.date}"
