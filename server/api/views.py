import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
	Attendance,
	Canine,
	Client,
	Enrollment,
	EnrollmentPlan,
	InternalUser,
	TransportService,
	User,
)
from .serializers import (
	AttendanceSerializer,
	CanineSerializer,
	ClientSerializer,
	DashboardStatsSerializer,
	EnrollmentPlanSerializer,
	EnrollmentSerializer,
	InternalUserSerializer,
	RegisterSerializer,
	TransportServiceSerializer,
	UserSerializer,
)

UserModel = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for User management.
	Administrators and Directors can manage all users.
	"""

	queryset = User.objects.all()
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["username", "email", "first_name", "last_name", "user_type"]
	ordering_fields = ["username", "date_joined", "user_type"]
	ordering = ["-date_joined"]

	def get_queryset(self):
		# Filter users by type if query param provided
		user_type = self.request.query_params.get("user_type", None)
		if user_type:
			return User.objects.filter(user_type=user_type)
		return User.objects.all()

	@action(detail=True, methods=["get"])
	def profile(self, request, pk=None):
		"""Get user profile"""
		user = self.get_object()
		serializer = self.get_serializer(user)
		return Response(serializer.data)

	@action(detail=False, methods=["get"])
	def me(self, request):
		"""Get current user profile"""
		serializer = self.get_serializer(request.user)
		return Response(serializer.data)


class InternalUserViewSet(viewsets.ModelViewSet):
	"""Admin-only endpoints to create, list and update internal users"""

	queryset = InternalUser.objects.all()
	serializer_class = InternalUserSerializer
	permission_classes = [IsAdminUser]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["user__username", "user__email", "role"]
	ordering_fields = ["user__date_joined"]
	ordering = ["-user__date_joined"]
	parser_classes = [MultiPartParser, FormParser, JSONParser]

	def _coerce_user_field(self, data):
		"""
		Build a plain mutable dict from request.data without deep-copying file objects.
		If 'user' is a JSON string (common when sending FormData), parse it.
		"""
		plain = {}
		try:
			for key in getattr(data, "keys", lambda: [])():
				val = data.get(key)
				if key == "user" and isinstance(val, str):
					try:
						plain["user"] = json.loads(val)
						continue
					except Exception:
						pass
				plain[key] = val
		except Exception:
			try:
				plain = dict(data)
			except Exception:
				plain = {}
		return plain

	def create(self, request, *args, **kwargs):
		data = self._coerce_user_field(request.data)
		serializer = self.get_serializer(data=data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		headers = self.get_success_headers(serializer.data)
		return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

	def partial_update(self, request, *args, **kwargs):
		partial = True
		instance = self.get_object()
		data = self._coerce_user_field(request.data)
		serializer = self.get_serializer(instance, data=data, partial=partial)
		serializer.is_valid(raise_exception=True)
		self.perform_update(serializer)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		from django.db import transaction

		instance = self.get_object()
		user = instance.user
		with transaction.atomic():
			self.perform_destroy(instance)
			user.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class ClientViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Client management.
	"""

	queryset = Client.objects.all()
	serializer_class = ClientSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["user__username", "user__email", "user__first_name", "user__last_name"]
	ordering_fields = ["user__registration_date"]
	ordering = ["-user__registration_date"]

	@action(detail=True, methods=["get"])
	def canines(self, request, pk=None):
		"""Get client's canines"""
		client = self.get_object()
		canines = Canine.objects.filter(client=client)
		serializer = CanineSerializer(canines, many=True)
		return Response(serializer.data)


class CanineViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Canine management.
	"""

	queryset = Canine.objects.all()
	serializer_class = CanineSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["name", "breed"]
	ordering_fields = ["name", "creation_date"]
	ordering = ["name"]

	def get_queryset(self):
		queryset = Canine.objects.all()
		# Filters
		size = self.request.query_params.get("size", None)
		breed = self.request.query_params.get("breed", None)
		client_id = self.request.query_params.get("client_id", None)
		status_param = self.request.query_params.get("status", None)

		if size:
			queryset = queryset.filter(size=size)
		if breed:
			queryset = queryset.filter(breed__icontains=breed)
		if client_id:
			queryset = queryset.filter(client_id=client_id)
		if status_param is not None:
			queryset = queryset.filter(status=status_param.lower() == "true")

		return queryset


class EnrollmentPlanViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Enrollment Plan management.
	"""

	queryset = EnrollmentPlan.objects.filter(active=True)
	serializer_class = EnrollmentPlanSerializer
	permission_classes = [IsAuthenticated]


class TransportServiceViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Transport Service management.
	"""

	queryset = TransportService.objects.all()
	serializer_class = TransportServiceSerializer
	permission_classes = [IsAuthenticated]


class EnrollmentViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Enrollment management.
	"""

	queryset = Enrollment.objects.all()
	serializer_class = EnrollmentSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["canine__name", "plan__name"]
	ordering_fields = ["enrollment_date", "expiration_date", "creation_date"]
	ordering = ["-creation_date"]

	def get_queryset(self):
		queryset = Enrollment.objects.all()

		# Filters
		canine_id = self.request.query_params.get("canine_id", None)
		plan_id = self.request.query_params.get("plan_id", None)
		size = self.request.query_params.get("size", None)
		breed = self.request.query_params.get("breed", None)
		status = self.request.query_params.get("status", None)

		if canine_id:
			queryset = queryset.filter(canine_id=canine_id)
		if plan_id:
			queryset = queryset.filter(plan_id=plan_id)
		if size:
			queryset = queryset.filter(canine__size=size)
		if breed:
			queryset = queryset.filter(canine__breed__icontains=breed)
		if status is not None:
			queryset = queryset.filter(status=status.lower() == "true")

		return queryset

	@action(detail=False, methods=["get"])
	def report_by_plan(self, request):
		"""Report: Enrollments by plan"""
		enrollments = (
			Enrollment.objects.values("plan__name").annotate(count=Count("id")).order_by("-count")
		)
		return Response(enrollments.data if hasattr(enrollments, "data") else list(enrollments))

	@action(detail=False, methods=["get"])
	def report_by_size(self, request):
		"""Report: Enrollments by canine size"""
		enrollments = (
			Enrollment.objects.values("canine__size").annotate(count=Count("id")).order_by("-count")
		)
		return Response(enrollments.data if hasattr(enrollments, "data") else list(enrollments))

	@action(detail=False, methods=["get"])
	def report_by_transport(self, request):
		"""Report: Enrollments by transport service"""
		enrollments = (
			Enrollment.objects.values("transport_service__type")
			.annotate(count=Count("id"))
			.order_by("-count")
		)
		return Response(enrollments.data if hasattr(enrollments, "data") else list(enrollments))

	@action(detail=False, methods=["get"])
	def report_by_breed(self, request):
		"""Report: Enrollments by breed (top 10)"""
		enrollments = (
			Enrollment.objects.values("canine__breed")
			.annotate(count=Count("id"))
			.order_by("-count")[:10]
		)
		return Response(enrollments.data if hasattr(enrollments, "data") else list(enrollments))


class AttendanceViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Attendance management.
	"""

	queryset = Attendance.objects.all()
	serializer_class = AttendanceSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.OrderingFilter]
	ordering_fields = ["date", "arrival_time"]
	ordering = ["-date", "-arrival_time"]

	def get_queryset(self):
		queryset = Attendance.objects.all()

		# Filters
		enrollment_id = self.request.query_params.get("enrollment_id", None)
		date = self.request.query_params.get("date", None)
		status = self.request.query_params.get("status", None)
		date_from = self.request.query_params.get("date_from", None)
		date_to = self.request.query_params.get("date_to", None)

		if enrollment_id:
			queryset = queryset.filter(enrollment_id=enrollment_id)
		if date:
			queryset = queryset.filter(date=date)
		if status:
			queryset = queryset.filter(status=status)
		if date_from:
			queryset = queryset.filter(date__gte=date_from)
		if date_to:
			queryset = queryset.filter(date__lte=date_to)

		return queryset

	@action(detail=False, methods=["get"])
	def today(self, request):
		"""Get today's attendance"""
		today = timezone.now().date()
		attendances = Attendance.objects.filter(date=today)
		serializer = self.get_serializer(attendances, many=True)
		return Response(serializer.data)

	@action(detail=False, methods=["post"])
	def check_in(self, request):
		"""Register canine arrival"""
		enrollment_id = request.data.get("enrollment")
		arrival_status = request.data.get("status")

		try:
			enrollment = Enrollment.objects.get(pk=enrollment_id, status=True)

			attendance, created = Attendance.objects.get_or_create(
				enrollment=enrollment,
				date=timezone.now().date(),
				defaults={
					"arrival_time": timezone.now().time(),
					"status": arrival_status,
				},
			)

			if not created:
				attendance.arrival_time = timezone.now().time()
				attendance.save()

			serializer = self.get_serializer(attendance)
			return Response(
				serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
			)
		except Enrollment.DoesNotExist:
			return Response(
				{"error": "Enrollment not found or inactive"}, status=status.HTTP_404_NOT_FOUND
			)

	@action(detail=False, methods=["post"])
	def check_out(self, request, pk=None):
		"""Register canine departure"""
		enrollment_id = request.data.get("enrollment")
		withdrawal_reason = request.data.get("withdrawal_reason")
		departure_time = request.data.get("departure_time")
		attendance = Attendance.objects.filter(
			enrollment_id=enrollment_id, date=timezone.now().date()
		).first()
		attendance.departure_time = departure_time if departure_time else timezone.now().time()
		attendance.withdrawal_reason = withdrawal_reason
		attendance.save()
		serializer = self.get_serializer(attendance)
		return Response(serializer.data, status=status.HTTP_201_CREATED)

	@action(detail=False, methods=["get"])
	def report_by_date(self, request):
		"""Report: Attendance by date range"""
		date_from = request.query_params.get("date_from", None)
		date_to = request.query_params.get("date_to", None)

		attendances = Attendance.objects.all()

		if date_from:
			attendances = attendances.filter(date__gte=date_from)
		if date_to:
			attendances = attendances.filter(date__lte=date_to)

		data = attendances.values("date").annotate(count=Count("id")).order_by("date")

		return Response(list(data))

	@action(detail=False, methods=["get"])
	def report_by_status(self, request):
		"""Report: Attendance by status"""
		data = Attendance.objects.values("status").annotate(count=Count("id")).order_by("-count")
		return Response(list(data))


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
	"""
	API view for client registration.
	"""
	serializer = RegisterSerializer(data=request.data)
	if serializer.is_valid():
		client = serializer.save()
		return Response(
			{
				"message": "Registration successful. You can now sign in.",
				"user_id": client.user.id,
				"username": client.user.username,
			},
			status=status.HTTP_201_CREATED,
		)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
	"""
	API view for retrieving and updating client profile data.
	"""
	user = request.user
	try:
		client = Client.objects.get(user=user)

		# GET: Retrieve profile data
		if request.method == "GET":
			user_data = UserSerializer(user).data
			client_data = ClientSerializer(client).data

			profile_data = {
				"user": user_data,
				"client": client_data,
			}

			canines = Canine.objects.filter(client=client)
			canines_data = CanineSerializer(canines, many=True).data
			profile_data["canines"] = canines_data

			return Response(profile_data)

		# PUT/PATCH: Update profile data
		elif request.method in {"PUT", "PATCH"}:
			# Partial update is allowed for both PUT and PATCH in this case
			partial = True

			# Update user data
			user_data = request.data.get("user", {})
			user_serializer = UserSerializer(user, data=user_data, partial=partial)
			if user_serializer.is_valid():
				user_serializer.save()

				# Return updated profile
				updated_user_data = UserSerializer(user).data
				client_data = ClientSerializer(client).data

				profile_data = {
					"user": updated_user_data,
					"client": client_data,
					"message": "Profile updated successfully",
				}

				canines = Canine.objects.filter(client=client)
				canines_data = CanineSerializer(canines, many=True).data
				profile_data["canines"] = canines_data

				return Response(profile_data)
			else:
				return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	except Client.DoesNotExist:
		return Response({"error": "Client profile not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_type_view(request):
	"""
	API view for retrieving the type of user (client or internal) and role if applicable.
	"""
	user = request.user

	# Check if it's a client
	if hasattr(user, "client_profile"):
		return Response({"user_type": "client", "client_id": user.client_profile.id})

	# Check if it's an internal user
	if hasattr(user, "internal_profile"):
		return Response(
			{
				"user_type": "internal",
				"role": user.internal_profile.role,
				"role_display": user.internal_profile.get_role_display(),
			}
		)

		# If no profile is found
	return Response({"user_type": "unknown"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def canine_attendance_view(request, canine_id):
	"""
	API view for retrieving attendance history of a specific canine.
	Only the owner of the canine can access this information.
	"""
	user = request.user

	try:
		client = Client.objects.get(user=user)
		canine = get_object_or_404(Canine, id=canine_id)

		if canine.client.id != client.id:
			return Response(
				{"error": "You do not have permission to view attendance for this canine"},
				status=status.HTTP_403_FORBIDDEN,
			)

		enrollments = Enrollment.objects.filter(canine=canine)
		attendances = Attendance.objects.filter(enrollment__in=enrollments).order_by("-date")
		attendance_data = AttendanceSerializer(attendances, many=True).data

		return Response({"canine": CanineSerializer(canine).data, "attendances": attendance_data})

	except Client.DoesNotExist:
		return Response({"error": "Client profile not found"}, status=status.HTTP_404_NOT_FOUND)


class DashboardStatsView(APIView):
	"""
	Dashboard statistics endpoint.
	"""

	permission_classes = [IsAuthenticated]

	def get(self, request):
		"""Get dashboard statistics"""
		today = timezone.now().date()

		# Basic counts
		total_clients = Client.objects.count()
		total_canines = Canine.objects.filter(status=True).count()
		total_enrollments = Enrollment.objects.count()
		active_enrollments = Enrollment.objects.filter(status=True).count()
		total_attendance_today = Attendance.objects.filter(date=today).count()

		enrollments_by_plan = dict(
			Enrollment.objects.values("plan__name")
			.annotate(count=Count("id"))
			.values_list("plan__name", "count")
		)

		attendance_by_size = dict(
			Attendance.objects.values("enrollment__canine__size")
			.annotate(count=Count("id"))
			.values_list("enrollment__canine__size", "count")
		)

		attendance_by_status = dict(
			Attendance.objects.values("status")
			.annotate(count=Count("id"))
			.values_list("status", "count")
		)

		# Upcoming expirations (next 30 days)
		thirty_days_from_now = today + timedelta(days=30)
		upcoming_expirations = Enrollment.objects.filter(
			status=True,
			expiration_date__lte=thirty_days_from_now,
			expiration_date__gte=today,
		).count()

		stats = {
			"total_clients": total_clients,
			"total_canines": total_canines,
			"total_enrollments": total_enrollments,
			"active_enrollments": active_enrollments,
			"total_attendance_today": total_attendance_today,
			"enrollments_by_plan": enrollments_by_plan,
			"attendance_by_size": attendance_by_size,
			"attendance_by_status": attendance_by_status,
			"upcoming_expirations": upcoming_expirations,
		}

		serializer = DashboardStatsSerializer(stats)
		return Response(serializer.data)
