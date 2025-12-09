import json
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

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
	EnrollmentPlanSerializer,
	EnrollmentSerializer,
	InternalUserSerializer,
	RegisterSerializer,
	TransportServiceSerializer,
	UserSerializer,
)

UserModel = get_user_model()

# logger removed; keep file without debug logging


class IsDirectorOrAdmin(BasePermission):
	"""
	Permission class to allow only Directors and Admins to perform actions.
	"""

	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False

		# Check if user is admin (staff)
		if request.user.is_staff:
			return True

		# Check if user has internal profile with Director or Admin role
		if hasattr(request.user, "internal_profile"):
			role = request.user.internal_profile.role
			return role in {InternalUser.Roles.DIRECTOR, InternalUser.Roles.ADMIN}

		return False


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
		plan_name = self.request.query_params.get("plan")

		if plan_name:
			queryset = queryset.filter(enrollments__plan__name__icontains=plan_name)

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
	Directors and Admins can update enrollments.
	"""

	queryset = Enrollment.objects.all()
	serializer_class = EnrollmentSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["canine__name", "plan__name"]
	ordering_fields = ["enrollment_date", "expiration_date", "creation_date"]
	ordering = ["-creation_date"]

	def get_permissions(self):
		"""
		Override to require Director or Admin permissions for update/partial_update/destroy.
		"""
		if self.action in {"update", "partial_update", "destroy"}:
			return [IsDirectorOrAdmin()]
		return [IsAuthenticated()]

	def get_queryset(self):
		queryset = Enrollment.objects.select_related("canine", "plan", "transport_service").all()

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


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_recaptcha_view(request):
	"""
	Verify reCAPTCHA token sent from the frontend.

	Expects JSON body: { "token": "..." }
	Returns the Google verification payload.
	"""
	# try to get token from JSON body or POST form
	token = None
	try:
		token = request.data.get("token")
	except Exception:
		token = request.POST.get("token") if hasattr(request, "POST") else None

	# Allow test bypass via header when DEBUG or explicit env var set
	# This enables E2E test runs (Cypress) to bypass real reCAPTCHA verification.
	import os

	bypass_header = None
	try:
		bypass_header = request.headers.get("x-skip-recaptcha")
	except Exception:
		# WSGI servers may provide META instead
		bypass_header = request.META.get("HTTP_X_SKIP_RECAPTCHA")

	disable_globally = os.environ.get("DISABLE_RECAPTCHA", "0") == "1"
	if bypass_header == "1" and (getattr(settings, "DEBUG", False) or disable_globally):
		return Response({"success": True, "score": 1.0})

	if not token:
		return Response(
			{"success": False, "error": "missing token"}, status=status.HTTP_400_BAD_REQUEST
		)

	# read secret from environment

	try:
		import requests
	except Exception:
		return Response(
			{"success": False, "error": "requests lib not available on server"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR,
		)

	secret = os.environ.get("RECAPTCHA_SECRET") or os.environ.get("RECAPTCHA_SECRET_KEY")
	if not secret:
		return Response(
			{"success": False, "error": "recaptcha secret not configured on server"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR,
		)

	try:
		resp = requests.post(
			"https://www.google.com/recaptcha/api/siteverify",
			data={"secret": secret, "response": token},
			timeout=5,
		)
		try:
			resp_text = resp.text
		except Exception:
			resp_text = None
		if resp.status_code == status.HTTP_200_OK:
			data = resp.json()
		else:
			data = {
				"success": False,
				"error": "verify request failed",
				"status_code": resp.status_code,
				"body": resp_text,
			}
	except Exception as e:
		return Response(
			{"success": False, "error": "verify request exception", "detail": str(e)},
			status=status.HTTP_502_BAD_GATEWAY,
		)

	return Response(data)


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


class EnrollmentsByPlanReportView(APIView):
	"""
	Report endpoint for enrollments grouped by plan type.
	Only Directors and Admins can access this report.
	"""

	permission_classes = [IsDirectorOrAdmin]

	def get(self, request):
		# Get query parameters for filtering
		status_filter = request.query_params.get("status", None)
		active_only = request.query_params.get("active_only", None)
		include_empty = request.query_params.get("include_empty", None)

		plans = EnrollmentPlan.objects.filter(active=True).annotate(
			total_enrollments=Count("enrollments"),
			active_enrollments=Count("enrollments", filter=Q(enrollments__status=True)),
			inactive_enrollments=Count("enrollments", filter=Q(enrollments__status=False)),
		)

		if status_filter is not None:
			status_bool = status_filter.lower() == "true"
			# If status is filtered, we only count enrollments with that status
			plans = EnrollmentPlan.objects.filter(active=True).annotate(
				total_enrollments=Count("enrollments", filter=Q(enrollments__status=status_bool)),
				active_enrollments=Count(
					"enrollments",
					filter=Q(enrollments__status=True) & Q(enrollments__status=status_bool),
				),
				inactive_enrollments=Count(
					"enrollments",
					filter=Q(enrollments__status=False) & Q(enrollments__status=status_bool),
				),
			)

		# Order by total enrollments
		plans = plans.order_by("-total_enrollments")

		report_data = []

		for plan in plans:
			# Filter logic
			if active_only and active_only.lower() == "true":
				if plan.active_enrollments == 0:
					continue
			elif plan.total_enrollments == 0 and not include_empty:
				continue

			plan_data = {
				"plan_id": plan.id,
				"plan_name": plan.name,
				"duration": plan.duration,
				"duration_display": plan.get_duration_display(),
				"price": str(plan.price),
				"total_enrollments": plan.total_enrollments,
				"active_enrollments": plan.active_enrollments,
				"inactive_enrollments": plan.inactive_enrollments,
			}
			report_data.append(plan_data)

		# Calculate summary statistics
		total_all_enrollments = sum(item["total_enrollments"] for item in report_data)
		total_active = sum(item["active_enrollments"] for item in report_data)
		total_inactive = sum(item["inactive_enrollments"] for item in report_data)

		response_data = {
			"summary": {
				"total_plans": len(report_data),
				"total_enrollments": total_all_enrollments,
				"total_active_enrollments": total_active,
				"total_inactive_enrollments": total_inactive,
			},
			"plans": report_data,
		}

		return Response(response_data)


class MonthlyIncomeReportView(APIView):
	"""
	Report endpoint for monthly income from enrollments.
	Only Directors and Admins can access this report.
	"""

	permission_classes = [IsDirectorOrAdmin]

	def get(self, request):
		# Get query parameters for filtering
		year = request.query_params.get("year", None)
		year_from = request.query_params.get("year_from", None)
		year_to = request.query_params.get("year_to", None)
		status_filter = request.query_params.get("status", None)

		# Base queryset - get enrollments with plan price
		enrollments = Enrollment.objects.select_related("plan").all()

		# Apply status filter if provided
		if status_filter is not None:
			status_bool = status_filter.lower() == "true"
			enrollments = enrollments.filter(status=status_bool)

		# Apply year filters
		try:
			if year:
				# Filter by specific year
				enrollments = enrollments.filter(enrollment_date__year=int(year))
			elif year_from or year_to:
				# Filter by year range
				if year_from:
					enrollments = enrollments.filter(enrollment_date__year__gte=int(year_from))
				if year_to:
					enrollments = enrollments.filter(enrollment_date__year__lte=int(year_to))
		except (ValueError, TypeError):
			return Response(
				{"error": "Year parameters must be valid integers"},
				status=status.HTTP_400_BAD_REQUEST,
			)

		# Group by year and month, and sum the plan prices
		monthly_data = (
			enrollments.annotate(month=TruncMonth("enrollment_date"))
			.values("month")
			.annotate(total_income=Sum("plan__price"), enrollment_count=Count("id"))
			.order_by("month")
		)

		# Build response data
		monthly_income = []

		for entry in monthly_data:
			monthly_income.append(
				{
					"year": entry["month"].year,
					"month": entry["month"].month,
					"month_name": entry["month"].strftime("%B"),
					"month_short": entry["month"].strftime("%b"),
					"date": entry["month"].strftime("%Y-%m"),
					"income": str(entry["total_income"] or Decimal("0")),
					"enrollment_count": entry["enrollment_count"],
				}
			)

		total_income = (
			sum(Decimal(item["income"]) for item in monthly_income)
			if monthly_income
			else Decimal("0")
		)
		total_enrollments = sum(item["enrollment_count"] for item in monthly_income)
		avg_monthly_income = (
			(total_income / len(monthly_income)) if monthly_income else Decimal("0")
		)

		response_data = {
			"summary": {
				"total_income": str(total_income),
				"total_enrollments": total_enrollments,
				"average_monthly_income": str(avg_monthly_income),
				"months_count": len(monthly_income),
				"max_month": (
					max(monthly_income, key=lambda x: Decimal(x["income"]))
					if monthly_income
					else None
				),
				"min_month": (
					min(monthly_income, key=lambda x: Decimal(x["income"]))
					if monthly_income
					else None
				),
			},
			"monthly_data": monthly_income,
		}

		return Response(response_data)


class ReportsViewSet(ViewSet):
	permission_classes = [IsAuthenticated]

	@action(detail=False, methods=["get"], url_path="enrollments-by-plan")
	def enrollments_by_plan(self, request):
		now = timezone.now().date()

		try:
			limit = int(request.query_params.get("limit", 1))
			if limit <= 0:
				limit = 1
		except ValueError:
			limit = 1

		plan_id = request.query_params.get("plan")

		if plan_id:
			plans = EnrollmentPlan.objects.filter(id=plan_id)
		else:
			plans = EnrollmentPlan.objects.all()

		if plan_id and not plans.exists():
			return Response({"error": f"Enrollment plan with id={plan_id} not found"}, status=404)

		ranges = {
			"last_month": now - timedelta(days=30),
			"last_2_months": now - timedelta(days=60),
			"last_3_months": now - timedelta(days=90),
			"last_6_months": now - timedelta(days=180),
			"last_12_months": now - timedelta(days=365),
		}

		result = {}

		for plan in plans:
			plan_data = {}

			for label, date_from in ranges.items():
				qs = (
					Enrollment.objects.filter(plan=plan, enrollment_date__gte=date_from)
					.values("canine__breed")
					.annotate(count=Count("id"))
					.order_by("-count")[:limit]
				)

				plan_data[label] = [
					{"breed": row["canine__breed"], "count": row["count"]} for row in qs
				]

			result[plan.name] = plan_data

		return Response(result)

	@action(detail=False, methods=["get"], url_path="enrollments-by-transport")
	def enrollments_by_transport(self, request):
		limit = int(request.query_params.get("limit", 1))
		transport_id = request.query_params.get("transport")

		now = timezone.now().date()
		ranges = {
			"last_month": now - timedelta(days=30),
			"last_2_months": now - timedelta(days=60),
			"last_3_months": now - timedelta(days=90),
			"last_6_months": now - timedelta(days=180),
			"last_12_months": now - timedelta(days=365),
		}

		transports = TransportService.objects.all()
		if transport_id:
			transports = transports.filter(pk=transport_id)

		result = {}

		for service in transports:
			transport_data = {}

			for label, date_from in ranges.items():
				qs = (
					Enrollment.objects.filter(
						transport_service=service, enrollment_date__gte=date_from
					)
					.values("canine__breed")
					.annotate(count=Count("id"))
					.order_by("-count")[:limit]
				)

				transport_data[label] = [
					{"breed": row["canine__breed"], "count": row["count"]} for row in qs
				]

			result[service.get_type_display()] = transport_data

		return Response(result)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_password(request):
	user = request.user
	password = request.data.get("password")

	if user.check_password(password):
		return Response({"valid": True})
	return Response({"valid": False})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
	email = request.data.get("email")
	if not email:
		return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

	try:
		user = UserModel.objects.get(email=email)
	except UserModel.DoesNotExist:
		return Response({"detail": "Password reset email sent."})

	uid = urlsafe_base64_encode(force_bytes(user.pk))
	token = default_token_generator.make_token(user)

	reset_url = f"http://localhost:5173/reset-password/{uid}/{token}/"

	send_mail(
		subject="Password Reset Request",
		message=f"Click the link to reset your password: {reset_url}",
		from_email="no-reply@example.com",
		recipient_list=[email],
	)

	return Response({"detail": "Password reset email sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request, uidb64, token):
	new_password = request.data.get("new_password")
	if not new_password:
		return Response({"detail": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)

	try:
		uid = force_str(urlsafe_base64_decode(uidb64))
		user = UserModel.objects.get(pk=uid)
	except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
		return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)

	if not default_token_generator.check_token(user, token):
		return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

	user.set_password(new_password)
	user.save()

	return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
