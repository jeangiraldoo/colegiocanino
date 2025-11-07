module.exports = {
  e2e: {
	specPattern: "specs/**/*.cy.ts",
	baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
};
