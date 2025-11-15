// client/src/api/axiosConfig.ts

import axios from "axios";

// Crea una instancia de axios con configuración base
const apiClient = axios.create({
	baseURL: "/", // La base URL es la raíz, ya que Vite se encargará del proxy a /api/
});

// Interceptor para añadir el token de autenticación a cada petición
apiClient.interceptors.request.use(
	(config) => {
		// Busca el token en sessionStorage primero, luego en localStorage
		const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token");

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export default apiClient;
