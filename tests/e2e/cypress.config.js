module.exports = {
	e2e: {
		specPattern: "specs/**/*.cy.ts",
		baseUrl: "http://localhost:5173",
		env: {
			apiUrl: "http://localhost:8000/api",
		},
		setupNodeEvents(on, config) {
			// implement node event listeners here
		},
	},
};
