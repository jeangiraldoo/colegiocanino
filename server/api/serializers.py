from datetime import date as date_type
from datetime import datetime

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

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
	"""User serializer for basic user information"""

	password = serializers.CharField(write_only=True, required=False)

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
		if isinstance(data, date_type):
			return data
		if isinstance(data, datetime):
			return data.date()
		if isinstance(data, str):
			# Try to parse as datetime ISO first
			try:
				# Handle Z suffix (UTC)
				if data.endswith("Z"):
					data = data.replace("Z", "+00:00")
				# Try datetime ISO format
				dt = datetime.fromisoformat(data)
				return dt.date()
			except (ValueError, AttributeError):
				# Fall back to standard date parsing
				pass
		# Use parent class for standard date format (YYYY-MM-DD)
		return super().to_internal_value(data)


class InternalUserSerializer(serializers.ModelSerializer):
	"""Internal user profile serializer with nested user creation/update"""

	user = UserSerializer()
	birthdate = FlexibleDateField(required=False, allow_null=True)
	date_joined = FlexibleDateField(required=False, allow_null=True)

	class Meta:
		model = InternalUser
		fields = [
			"user",
			"role",
			"birthdate",
			"date_joined",
			"photo",
		]

	def _convert_to_date(self, value):
		"""Convert datetime to date if necessary"""
		if value is None:
			return None
		if isinstance(value, datetime):
			return value.date()
		if isinstance(value, str):
			# Try to parse as datetime first, then extract date
			try:
				dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
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
		# Create the underlying auth user
		user = UserSerializer().create(user_data)
		# Set user as staff for internal users
		user.is_staff = True
		user.save()

		# Convert date fields if they are datetime objects (extra safety)
		if "birthdate" in validated_data:
			validated_data["birthdate"] = self._convert_to_date(validated_data["birthdate"])
		if "date_joined" in validated_data:
			validated_data["date_joined"] = self._convert_to_date(validated_data["date_joined"])

		# Create internal profile
		internal_user = InternalUser.objects.create(user=user, **validated_data)
		return internal_user

	def update(self, instance, validated_data):
		user_data = validated_data.pop("user", None)
		# Update nested user if provided
		if user_data:
			UserSerializer().update(instance.user, user_data)
		# Convert date fields if they are datetime objects (extra safety)
		if "birthdate" in validated_data:
			validated_data["birthdate"] = self._convert_to_date(validated_data["birthdate"])
		if "date_joined" in validated_data:
			validated_data["date_joined"] = self._convert_to_date(validated_data["date_joined"])
		# Update internal user fields
		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		instance.save()
		return instance


class ClientSerializer(serializers.ModelSerializer):
	"""Client serializer with nested user information"""

	user = UserSerializer(read_only=True)
	user_id = serializers.PrimaryKeyRelatedField(
		queryset=User.objects.all(), write_only=True, source="user"
	)
	registration_date = serializers.DateField(source="user.registration_date", read_only=True)

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
	plan_name = serializers.CharField(source="plan.name", read_only=True)
	# Use display label for transport service type
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
	attendance_by_size = serializers.DictField()
	attendance_by_status = serializers.DictField()
	upcoming_expirations = serializers.IntegerField()
