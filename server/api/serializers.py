from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Client, Canine, EnrollmentPlan, TransportService, Enrollment, Attendance, InternalUser

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


class InternalUserSerializer(serializers.ModelSerializer):
	"""Internal user profile serializer with nested user creation/update"""

	user = UserSerializer()

	class Meta:
		model = InternalUser
		fields = [
			"user",
			"role",
			"birthdate",
			"date_joined",
			"photo",
		]

	def create(self, validated_data):
		user_data = validated_data.pop("user")
		# Create the underlying auth user
		user = UserSerializer().create(user_data)
		# Create internal profile
		internal_user = InternalUser.objects.create(user=user, **validated_data)
		return internal_user

	def update(self, instance, validated_data):
		user_data = validated_data.pop("user", None)
		# Update nested user if provided
		if user_data:
			UserSerializer().update(instance.user, user_data)
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
		fields = ["id", "name", "type", "price"]


class EnrollmentSerializer(serializers.ModelSerializer):
	"""Enrollment serializer with nested relations"""

	canine_name = serializers.CharField(source="canine.name", read_only=True)
	plan_name = serializers.CharField(source="plan.name", read_only=True)
	transport_service_name = serializers.CharField(source="transport_service.name", read_only=True)

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
			"total_price",
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
			"observations",
		]


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
