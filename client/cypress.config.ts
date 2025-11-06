import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: "http://localhost:5173",
		setupNodeEvents(_on, _config) {
			// parámetros prefijados con "_" para evitar la regla no-unused-vars
			return _config;
		},
	},
});
