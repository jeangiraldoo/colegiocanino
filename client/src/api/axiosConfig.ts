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

		// When running under Cypress e2e, set a header to bypass reCAPTCHA verification on server
		// If running under Cypress, set header to allow server-side test bypass.
		// Use a narrow cast to avoid `any` lint complaints.
		try {
			if (typeof window !== "undefined") {
				const w = window as unknown as { Cypress?: boolean };
				if (w.Cypress) {
					config.headers["x-skip-recaptcha"] = "1";
				}
			}
		} catch {
			// ignore in non-browser contexts
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export default apiClient;
