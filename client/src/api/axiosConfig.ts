// client/src/api/axiosConfig.ts

import axios from "axios";

// Determine API base URL. Prioritize Vite env var `VITE_API_BASE` so deployments
// or local overrides can change the target. Fall back to the Render URL per request.
// Example: set VITE_API_BASE=https://colegiocanino.onrender.com
const baseURL =
	(import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_API_BASE ??
	"https://colegiocanino.onrender.com";

// Create axios instance that will resolve requests like `/api/...` against the
// configured baseURL (so `/api/...` -> `https://colegiocanino.onrender.com/api/...`).
const apiClient = axios.create({
	baseURL,
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
