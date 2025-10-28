from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
	path("admin/", admin.site.urls),
	# API app routes
	path("api/", include("api.urls")),
	# JWT authentication endpoints
	path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
	path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
	
]
