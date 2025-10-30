from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import User, Client, Canine, EnrollmentPlan, TransportService, Enrollment, Attendance, InternalUser
from .serializers import (
	UserSerializer, ClientSerializer, CanineSerializer, EnrollmentPlanSerializer,
	TransportServiceSerializer, EnrollmentSerializer, AttendanceSerializer,
	DashboardStatsSerializer, InternalUserSerializer
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
	search_fields = ['username', 'email', 'first_name', 'last_name', 'user_type']
	ordering_fields = ['username', 'date_joined', 'user_type']
	ordering = ['-date_joined']
	
	def get_queryset(self):
		user = self.request.user
		# Filter users by type if query param provided
		user_type = self.request.query_params.get('user_type', None)
		if user_type:
			return User.objects.filter(user_type=user_type)
		return User.objects.all()
	
	@action(detail=True, methods=['get'])
	def profile(self, request, pk=None):
		"""Get user profile"""
		user = self.get_object()
		serializer = self.get_serializer(user)
		return Response(serializer.data)
	
	@action(detail=False, methods=['get'])
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
	search_fields = ['user__username', 'user__email', 'role']
	ordering_fields = ['user__date_joined']
	ordering = ['-user__date_joined']

class ClientViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Cliente management.
	"""
	queryset = Client.objects.all()
	serializer_class = ClientSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
	ordering_fields = ['user__registration_date']
	ordering = ['-user__registration_date']
	
	@action(detail=True, methods=['get'])
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
	search_fields = ['name', 'breed']
	ordering_fields = ['name', 'creation_date']
	ordering = ['name']
	
	def get_queryset(self):
		queryset = Canine.objects.all()
		# Filters
		tamaño = self.request.query_params.get('tamaño', None)
		raza = self.request.query_params.get('raza', None)
		cliente_id = self.request.query_params.get('cliente_id', None)
		estado = self.request.query_params.get('estado', None)
		
		if tamaño:
			queryset = queryset.filter(tamaño=tamaño)
		if raza:
			queryset = queryset.filter(raza__icontains=raza)
		if cliente_id:
			queryset = queryset.filter(cliente_id=cliente_id)
		if estado is not None:
			queryset = queryset.filter(estado=estado.lower() == 'true')
		
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
	search_fields = ['canine__name', 'plan__name']
	ordering_fields = ['enrollment_date', 'expiration_date', 'creation_date']
	ordering = ['-creation_date']
	
	def get_queryset(self):
		queryset = Enrollment.objects.all()
		
		# Filters
		canine_id = self.request.query_params.get('canine_id', None)
		plan_id = self.request.query_params.get('plan_id', None)
		tamaño = self.request.query_params.get('tamaño', None)
		raza = self.request.query_params.get('raza', None)
		estado = self.request.query_params.get('estado', None)
		
		if canine_id:
			queryset = queryset.filter(canine_id=canine_id)
		if plan_id:
			queryset = queryset.filter(plan_id=plan_id)
		if tamaño:
			queryset = queryset.filter(canine__tamaño=tamaño)
		if raza:
			queryset = queryset.filter(canine__raza__icontains=raza)
		if estado is not None:
			queryset = queryset.filter(estado=estado.lower() == 'true')
		
		return queryset
	
	@action(detail=False, methods=['get'])
	def report_by_plan(self, request):
		"""Report: Enrollments by plan"""
		enrollments = Enrollment.objects.values('plan__nombre').annotate(
			count=Count('id')
		).order_by('-count')
		return Response(enrollments.data if hasattr(enrollments, 'data') else list(enrollments))
	
	@action(detail=False, methods=['get'])
	def report_by_size(self, request):
		"""Report: Enrollments by canine size"""
		enrollments = Enrollment.objects.values('canine__tamaño').annotate(
			count=Count('id')
		).order_by('-count')
		return Response(enrollments.data if hasattr(enrollments, 'data') else list(enrollments))
	
	@action(detail=False, methods=['get'])
	def report_by_transport(self, request):
		"""Report: Enrollments by transport service"""
		enrollments = Enrollment.objects.values('transport_service__nombre').annotate(
			count=Count('id')
		).order_by('-count')
		return Response(enrollments.data if hasattr(enrollments, 'data') else list(enrollments))
	
	@action(detail=False, methods=['get'])
	def report_by_breed(self, request):
		"""Report: Enrollments by breed (top 10)"""
		enrollments = Enrollment.objects.values('canine__raza').annotate(
			count=Count('id')
		).order_by('-count')[:10]
		return Response(enrollments.data if hasattr(enrollments, 'data') else list(enrollments))


class AttendanceViewSet(viewsets.ModelViewSet):
	"""
	ViewSet for Attendance management.
	"""
	queryset = Attendance.objects.all()
	serializer_class = AttendanceSerializer
	permission_classes = [IsAuthenticated]
	filter_backends = [filters.OrderingFilter]
	ordering_fields = ['date', 'arrival_time']
	ordering = ['-date', '-arrival_time']
	
	def get_queryset(self):
		queryset = Attendance.objects.all()
		
		# Filters
		enrollment_id = self.request.query_params.get('enrollment_id', None)
		fecha = self.request.query_params.get('fecha', None)
		estado = self.request.query_params.get('estado', None)
		fecha_desde = self.request.query_params.get('fecha_desde', None)
		fecha_hasta = self.request.query_params.get('fecha_hasta', None)
		
		if enrollment_id:
			queryset = queryset.filter(enrollment_id=enrollment_id)
		if fecha:
			queryset = queryset.filter(fecha=fecha)
		if estado:
			queryset = queryset.filter(estado=estado)
		if fecha_desde:
			queryset = queryset.filter(fecha__gte=fecha_desde)
		if fecha_hasta:
			queryset = queryset.filter(fecha__lte=fecha_hasta)
		
		return queryset
	
	@action(detail=False, methods=['get'])
	def today(self, request):
		"""Get today's attendance"""
		today = timezone.now().date()
		attendances = Attendance.objects.filter(fecha=today)
		serializer = self.get_serializer(attendances, many=True)
		return Response(serializer.data)
	
	@action(detail=False, methods=['post'])
	def register_arrival(self, request):
		"""Register canine arrival"""
		enrollment_id = request.data.get('enrollment_id')
		llegada_tipo = request.data.get('llegada_tipo')
		
		try:
			enrollment = Enrollment.objects.get(pk=enrollment_id, estado=True)
			today = timezone.now().date()
			
			attendance, created = Attendance.objects.get_or_create(
				enrollment=enrollment,
				fecha=today,
				defaults={
					'llegada_tipo': llegada_tipo,
					'hora_llegada': timezone.now().time(),
					'estado': Attendance.Estado.PRESENTE
				}
			)
			
			if not created:
				attendance.hora_llegada = timezone.now().time()
				attendance.llegada_tipo = llegada_tipo
				attendance.save()
			
			serializer = self.get_serializer(attendance)
			return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
		except Enrollment.DoesNotExist:
			return Response({'error': 'Enrollment not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
	
	@action(detail=True, methods=['post'])
	def register_departure(self, request, pk=None):
		"""Register canine departure"""
		attendance = self.get_object()
		attendance.hora_salida = timezone.now().time()
		attendance.estado = Attendance.Estado.DESPACHADO
		attendance.save()
		serializer = self.get_serializer(attendance)
		return Response(serializer.data)
	
	@action(detail=False, methods=['get'])
	def report_by_date(self, request):
		"""Report: Attendance by date range"""
		fecha_desde = request.query_params.get('fecha_desde', None)
		fecha_hasta = request.query_params.get('fecha_hasta', None)
		
		attendances = Attendance.objects.all()
		
		if fecha_desde:
			attendances = attendances.filter(fecha__gte=fecha_desde)
		if fecha_hasta:
			attendances = attendances.filter(fecha__lte=fecha_hasta)
		
		data = attendances.values('fecha').annotate(
			count=Count('id')
		).order_by('fecha')
		
		return Response(list(data))
	
	@action(detail=False, methods=['get'])
	def report_by_status(self, request):
		"""Report: Attendance by status"""
		data = Attendance.objects.values('estado').annotate(
			count=Count('id')
		).order_by('-count')
		return Response(list(data))


class DashboardStatsView(APIView):
	"""
	Dashboard statistics endpoint.
	"""
	permission_classes = [IsAuthenticated]
	
	def get(self, request):
		"""Get dashboard statistics"""
		from collections import defaultdict
		
		today = timezone.now().date()
		
		# Basic counts
		total_clients = Client.objects.count()
		total_canines = Canine.objects.filter(status=True).count()
		total_enrollments = Enrollment.objects.count()
		active_enrollments = Enrollment.objects.filter(status=True).count()
		total_attendance_today = Attendance.objects.filter(date=today).count()
		
		# Enrollments by plan
		enrollments_by_plan = dict(
			Enrollment.objects.values('plan__name')
			.annotate(count=Count('id'))
			.values_list('plan__name', 'count')
		)
		
		# Attendance by size
		attendance_by_size = dict(
			Attendance.objects.values('enrollment__canine__size')
			.annotate(count=Count('id'))
			.values_list('enrollment__canine__size', 'count')
		)
		
		# Attendance by status
		attendance_by_status = dict(
			Attendance.objects.values('status')
			.annotate(count=Count('id'))
			.values_list('status', 'count')
		)
		
		# Upcoming expirations (next 30 days)
		thirty_days_from_now = today + timedelta(days=30)
		upcoming_expirations = Enrollment.objects.filter(
			status=True,
			expiration_date__lte=thirty_days_from_now,
			expiration_date__gte=today
		).count()
		
		stats = {
			'total_clients': total_clients,
			'total_canines': total_canines,
			'total_enrollments': total_enrollments,
			'active_enrollments': active_enrollments,
			'total_attendance_today': total_attendance_today,
			'enrollments_by_plan': enrollments_by_plan,
			'attendance_by_size': attendance_by_size,
			'attendance_by_status': attendance_by_status,
			'upcoming_expirations': upcoming_expirations,
		}
		
		serializer = DashboardStatsSerializer(stats)
		return Response(serializer.data)



