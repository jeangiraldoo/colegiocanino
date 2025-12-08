import contextlib
import datetime

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import (
	Attendance,
	Canine,
	Client,
	Enrollment,
	EnrollmentPlan,
	InternalUser,
	TransportService,
)

MIN_PASSWORD_LENGTH = 6


class SafeDateTimeField(serializers.Field):
	def __init__(self, *args, **kwargs):
		kwargs.setdefault("read_only", True)
		super().__init__(*args, **kwargs)

	def to_representation(self, value):
		if value is None:
			return None
		if isinstance(value, datetime.datetime):
			return value.isoformat()
		if isinstance(value, datetime.date):
			return value.isoformat()
		return str(value)


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
	"""User serializer for basic user information"""

	password = serializers.CharField(write_only=True, required=False)
	registration_date = SafeDateTimeField()

	class Meta:
		model = User
		fields = [
			"id",
			"username",
			"email",
			"first_name",
			"last_name",
			"phone_number",
			"address",
			"status",
			"document_id",
			"registration_date",
			"password",
			"date_joined",
		]
		read_only_fields = ["date_joined", "registration_date"]

	def create(self, validated_data):
		password = validated_data.pop("password", None)
		user = User.objects.create(**validated_data)
		if password:
			user.set_password(password)
			user.save()
		return user

	def update(self, instance, validated_data):
		password = validated_data.pop("password", None)
		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		if password:
			instance.set_password(password)
		instance.save()
		return instance


class FlexibleDateField(serializers.DateField):
	"""DateField that accepts both date and datetime ISO strings"""

	def to_internal_value(self, data):
		if data is None:
			return None
		if isinstance(data, datetime.date):
			return data
		if isinstance(data, datetime.datetime):
			return data.date()
		if isinstance(data, str):
			# Try to parse as datetime ISO first
			try:
				# Handle Z suffix (UTC)
				if data.endswith("Z"):
					data = data.replace("Z", "+00:00")
				# Try datetime ISO format
				dt = datetime.datetime.fromisoformat(data)
				return dt.date()
			except (ValueError, AttributeError):
				# Fall back to standard date parsing
				pass
		# Use parent class for standard date format (YYYY-MM-DD)
		return super().to_internal_value(data)


class InternalUserSerializer(serializers.ModelSerializer):
	"""Internal user profile serializer with nested user creation/update"""

	user = UserSerializer()
	user_id = serializers.IntegerField(source="user.id", read_only=True)
	photo = serializers.ImageField(allow_null=True, required=False)
	birthdate = FlexibleDateField(required=False, allow_null=True)
	date_joined = FlexibleDateField(required=False, allow_null=True)

	class Meta:
		model = InternalUser
		fields = [
			"user",
			"user_id",
			"role",
			"birthdate",
			"date_joined",
			"photo",
		]

	def validate(self, data):
		"""
		Validate nested user data:
		- On creation: validate uniqueness and require password >= MIN_PASSWORD_LENGTH.
		- On update: validate only fields present in payload (so PATCH-only-photo won't fail).
		"""
		user_data = data.get("user") or {}
		errors = {}

		def exists_unique(field, value):
			if not value:
				return False
			qs = User.objects.filter(**{field: value})
			if self.instance is not None:
				# exclude current user on updates without raising
				with contextlib.suppress(Exception):
					qs = qs.exclude(pk=self.instance.user.pk)
			return qs.exists()

		if self.instance is None:
			username = user_data.get("username")
			email = user_data.get("email")
			document_id = user_data.get("document_id")
			password = user_data.get("password")

			if exists_unique("username", username):
				errors.setdefault("user", {})["username"] = [
					"Este nombre de usuario ya está en uso."
				]
			if exists_unique("email", email):
				errors.setdefault("user", {})["email"] = [
					"Este correo electrónico ya está registrado."
				]
			if exists_unique("document_id", document_id):
				errors.setdefault("user", {})["document_id"] = ["Esta cédula ya está registrada."]
			if password is None or (
				isinstance(password, str) and len(password) < MIN_PASSWORD_LENGTH
			):
				errors.setdefault("user", {})["password"] = [
					f"Contraseña mínimo {MIN_PASSWORD_LENGTH} caracteres."
				]
		else:
			if "username" in user_data and exists_unique("username", user_data.get("username")):
				errors.setdefault("user", {})["username"] = [
					"Este nombre de usuario ya está en uso."
				]
			if "email" in user_data and exists_unique("email", user_data.get("email")):
				errors.setdefault("user", {})["email"] = [
					"Este correo electrónico ya está registrado."
				]
			if "document_id" in user_data and exists_unique(
				"document_id", user_data.get("document_id")
			):
				errors.setdefault("user", {})["document_id"] = ["Esta cédula ya está registrada."]
			if "password" in user_data:
				pwd = user_data.get("password")
				if pwd is None or (isinstance(pwd, str) and len(pwd) < MIN_PASSWORD_LENGTH):
					errors.setdefault("user", {})["password"] = [
						f"Contraseña mínimo {MIN_PASSWORD_LENGTH} caracteres."
					]

		if errors:
			raise serializers.ValidationError(errors)

		return data

	def _convert_to_date(self, value):
		"""Convert datetime to date if necessary"""
		if value is None:
			return None
		if isinstance(value, datetime.datetime):
			return value.date()
		if isinstance(value, str):
			# Try to parse as datetime first, then extract date
			try:
				dt = datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
				return dt.date()
			except (ValueError, AttributeError):
				pass
		return value

	def validate_birthdate(self, value):
		"""Ensure birthdate is a date object, not datetime"""
		return self._convert_to_date(value)

	def validate_date_joined(self, value):
		"""Ensure date_joined is a date object, not datetime"""
		return self._convert_to_date(value)

	def create(self, validated_data):
		user_data = validated_data.pop("user")
		photo = validated_data.pop("photo", None)
		password = user_data.pop("password", None)

		allowed = {f.name for f in User._meta.fields}
		user_kwargs = {k: v for k, v in user_data.items() if k in allowed}

		user = User.objects.create(**user_kwargs)

		if password:
			user.set_password(password)

		if validated_data.get("role") == InternalUser.Roles.ADMIN:
			user.is_staff = True

		user.save()

		if "birthdate" in validated_data:
			validated_data["birthdate"] = self._convert_to_date(validated_data["birthdate"])
		if "date_joined" in validated_data:
			validated_data["date_joined"] = self._convert_to_date(validated_data["date_joined"])

		internal_user = InternalUser.objects.create(user=user, **validated_data)

		if photo is not None:
			internal_user.photo = photo
			internal_user.save()

		return internal_user

	def update(self, instance, validated_data):
		user_data = validated_data.pop("user", None)
		photo = validated_data.pop("photo", None)

		if user_data:
			UserSerializer().update(instance.user, user_data)

		if "role" in validated_data:
			role = validated_data["role"]
			instance.user.is_staff = role == InternalUser.Roles.ADMIN
			instance.user.save()

		if "birthdate" in validated_data:
			validated_data["birthdate"] = self._convert_to_date(validated_data["birthdate"])
		if "date_joined" in validated_data:
			validated_data["date_joined"] = self._convert_to_date(validated_data["date_joined"])

		for attr, value in validated_data.items():
			setattr(instance, attr, value)

		if photo is not None:
			instance.photo = photo

		instance.save()
		return instance


class ClientSerializer(serializers.ModelSerializer):
	"""Client serializer with nested user information"""

	user = UserSerializer(read_only=True)
	user_id = serializers.PrimaryKeyRelatedField(
		queryset=User.objects.all(), write_only=True, source="user"
	)
	registration_date = SafeDateTimeField(source="user.registration_date", read_only=True)

	class Meta:
		model = Client
		fields = ["id", "user", "user_id", "registration_date"]


class CanineSerializer(serializers.ModelSerializer):
	"""Canine serializer"""

	client_name = serializers.CharField(source="client.user.get_full_name", read_only=True)

	class Meta:
		model = Canine
		fields = [
			"id",
			"client",
			"client_name",
			"name",
			"breed",
			"age",
			"size",
			"photo",
			"creation_date",
			"status",
		]
		read_only_fields = ["creation_date"]


class EnrollmentPlanSerializer(serializers.ModelSerializer):
	"""Enrollment plan serializer"""

	class Meta:
		model = EnrollmentPlan
		fields = ["id", "name", "duration", "price", "active"]


class TransportServiceSerializer(serializers.ModelSerializer):
	"""Transport service serializer"""

	class Meta:
		model = TransportService
		# TransportService model only has `type`
		fields = ["id", "type"]


class EnrollmentSerializer(serializers.ModelSerializer):
	"""Enrollment serializer with nested relations"""

	canine_name = serializers.CharField(source="canine.name", read_only=True)
	# Use display label for transport service type
	plan_name = serializers.CharField(source="plan.name", read_only=True)
	transport_service_name = serializers.CharField(
		source="transport_service.get_type_display", read_only=True
	)

	class Meta:
		model = Enrollment
		fields = [
			"id",
			"canine",
			"canine_name",
			"plan",
			"plan_name",
			"transport_service",
			"transport_service_name",
			"enrollment_date",
			"expiration_date",
			"status",
			"creation_date",
		]
		read_only_fields = ["creation_date"]

	def validate(self, data):
		"""
		Validate enrollment data:
		- expiration_date must be after enrollment_date
		- plan must be active
		"""
		enrollment_date = data.get("enrollment_date")
		expiration_date = data.get("expiration_date")
		plan = data.get("plan")

		# Get existing values if updating
		if self.instance:
			enrollment_date = (
				enrollment_date if enrollment_date is not None else self.instance.enrollment_date
			)
			expiration_date = (
				expiration_date if expiration_date is not None else self.instance.expiration_date
			)
			plan = plan if plan is not None else self.instance.plan

		# Validate dates
		if enrollment_date and expiration_date and expiration_date <= enrollment_date:
			raise serializers.ValidationError(
				{
					"expiration_date": (
						"La fecha de expiración debe ser posterior a la fecha de inscripción."
					)
				}
			)

		# Validate plan is active
		if plan and not plan.active:
			raise serializers.ValidationError({"plan": "El plan seleccionado no está activo."})

		return data

	def validate_canine(self, value):
		"""
		Validate that the canine is active.
		"""
		if not value.status:
			raise serializers.ValidationError("No se puede inscribir un canino inactivo.")
		return value



class AttendanceSerializer(serializers.ModelSerializer):
	"""Attendance serializer"""

	canine_name = serializers.CharField(source="enrollment.canine.name", read_only=True)
	client_name = serializers.CharField(
		source="enrollment.canine.client.user.get_full_name", read_only=True
	)

	class Meta:
		model = Attendance
		fields = [
			"id",
			"enrollment",
			"canine_name",
			"client_name",
			"date",
			"arrival_time",
			"status",
			"departure_time",
			"withdrawal_reason",
		]


# Registration serializer
class RegisterSerializer(serializers.Serializer):
	"""Serializer for user registration"""

	username = serializers.CharField(max_length=150)
	email = serializers.EmailField()
	password = serializers.CharField(write_only=True, style={"input_type": "password"})
	first_name = serializers.CharField(max_length=150)
	last_name = serializers.CharField(max_length=150)
	phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
	address = serializers.CharField(required=False, allow_blank=True)
	document_id = serializers.CharField(max_length=50, required=False, allow_blank=True)

	def validate_username(self, value):
		if User.objects.filter(username=value).exists():
			raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
		return value

	def validate_email(self, value):
		if User.objects.filter(email=value).exists():
			raise serializers.ValidationError("Este correo electrónico ya está registrado.")
		return value

	def validate_document_id(self, value):
		if value and User.objects.filter(document_id=value).exists():
			raise serializers.ValidationError("Este documento de identidad ya está registrado.")
		return value

	@transaction.atomic
	def create(self, validated_data):
		user = User.objects.create(
			username=validated_data["username"],
			email=validated_data["email"],
			first_name=validated_data["first_name"],
			last_name=validated_data["last_name"],
			phone_number=validated_data.get("phone_number", ""),
			address=validated_data.get("address", ""),
			document_id=validated_data.get("document_id", ""),
		)
		user.set_password(validated_data["password"])
		user.save()

		# Create client profile
		client = Client.objects.create(user=user)

		return client


# Dashboard serializers
class DashboardStatsSerializer(serializers.Serializer):
	"""Dashboard statistics serializer"""

	total_clients = serializers.IntegerField()
	total_canines = serializers.IntegerField()
	total_enrollments = serializers.IntegerField()
	active_enrollments = serializers.IntegerField()
	total_attendance_today = serializers.IntegerField()
	enrollments_by_plan = serializers.DictField()
	revenue_by_plan = serializers.DictField()
	total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
	attendance_by_size = serializers.DictField()
	attendance_by_status = serializers.DictField()
	upcoming_expirations = serializers.IntegerField()
	revenue_over_time = serializers.DictField()
	filtered_status = serializers.DictField()
