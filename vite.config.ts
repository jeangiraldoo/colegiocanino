import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	root: "client",
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@emotion/styled": path.resolve(__dirname, "node_modules/@emotion/styled"),
			"@emotion/react": path.resolve(__dirname, "node_modules/@emotion/react"),
		},
	},
	// Dev proxy to Django backend
	server: {
		proxy: {
			"/api": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
				secure: false,
			},
			"/media": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
				secure: false,
			},
			"/static": {
				target: "http://127.0.0.1:8000",
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
