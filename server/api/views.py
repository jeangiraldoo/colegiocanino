from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from .models import User, Client, Canine, EnrollmentPlan, TransportService, Enrollment, Attendance
from .serializers import (
	UserSerializer,
	ClientSerializer,
	CanineSerializer,
	EnrollmentPlanSerializer,
	TransportServiceSerializer,
	EnrollmentSerializer,
	AttendanceSerializer,
	DashboardStatsSerializer,
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
	search_fields = ["username", "email", "first_name", "last_name"]
	ordering_fields = ["username", "date_joined"]
	ordering = ["-date_joined"]

	def get_queryset(self):
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


class ClientViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Client management.
	"""

	queryset = Client.objects.all()
	serializer_class = ClientSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["user__username", "user__email", "user__first_name", "user__last_name"]
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
			queryset = queryset.filter(status=str(status_param).lower() == "true")

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
		status_param = self.request.query_params.get("status", None)

		if canine_id:
			queryset = queryset.filter(canine_id=canine_id)
		if plan_id:
			queryset = queryset.filter(plan_id=plan_id)
		if size:
			queryset = queryset.filter(canine__size=size)
		if breed:
			queryset = queryset.filter(canine__breed__icontains=breed)
		if status_param is not None:
			queryset = queryset.filter(status=str(status_param).lower() == "true")

		return queryset

	@action(detail=False, methods=["get"])
	def report_by_plan(self, request):
		"""Report: Enrollments by plan"""
		enrollments = (
			Enrollment.objects.values("plan__name").annotate(count=Count("id")).order_by("-count")
		)
		return Response(list(enrollments))

	@action(detail=False, methods=["get"])
	def report_by_size(self, request):
		"""Report: Enrollments by canine size"""
		enrollments = (
			Enrollment.objects.values("canine__size").annotate(count=Count("id")).order_by("-count")
		)
		return Response(list(enrollments))

	@action(detail=False, methods=["get"])
	def report_by_breed(self, request):
		"""Report: Enrollments by breed (top 10)"""
		enrollments = (
			Enrollment.objects.values("canine__breed")
			.annotate(count=Count("id"))
			.order_by("-count")[:10]
		)
		return Response(list(enrollments))


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
		status_param = self.request.query_params.get("status", None)
		date_from = self.request.query_params.get("date_from", None)
		date_to = self.request.query_params.get("date_to", None)

		if enrollment_id:
			queryset = queryset.filter(enrollment_id=enrollment_id)
		if date:
			queryset = queryset.filter(date=date)
		if status_param:
			queryset = queryset.filter(status=status_param)
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
	def register_arrival(self, request):
		"""Register canine arrival"""
		enrollment_id = request.data.get("enrollment_id")

		try:
			enrollment = Enrollment.objects.get(pk=enrollment_id, status=True)
			today = timezone.now().date()

			attendance, created = Attendance.objects.get_or_create(
				enrollment=enrollment,
				date=today,
				defaults={
					"arrival_time": timezone.now().time(),
					"status": Attendance.Status.PRESENT,
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

	@action(detail=True, methods=["post"])
	def register_departure(self, request, pk=None):
		"""Register canine departure"""
		attendance = self.get_object()
		attendance.departure_time = timezone.now().time()
		attendance.status = Attendance.Status.DISPATCHED
		attendance.save()
		serializer = self.get_serializer(attendance)
		return Response(serializer.data)

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

		# Enrollments by plan
		enrollments_by_plan = dict(
			Enrollment.objects.values("plan__name")
			.annotate(count=Count("id"))
			.values_list("plan__name", "count")
		)

		# Attendance by size
		attendance_by_size = dict(
			Attendance.objects.values("enrollment__canine__size")
			.annotate(count=Count("id"))
			.values_list("enrollment__canine__size", "count")
		)

		# Attendance by status
		attendance_by_status = dict(
			Attendance.objects.values("status")
			.annotate(count=Count("id"))
			.values_list("status", "count")
		)

		# Upcoming expirations (next 30 days)
		thirty_days_from_now = today + timedelta(days=30)
		upcoming_expirations = Enrollment.objects.filter(
			status=True, expiration_date__lte=thirty_days_from_now, expiration_date__gte=today
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
