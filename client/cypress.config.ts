import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:5173",
        setupNodeEvents(_on, _config) {
            // implement node event listeners here
            // los parámetros están prefijados con "_" para evitar la regla de no-unused-vars
            return _config;
        },
    },
});
