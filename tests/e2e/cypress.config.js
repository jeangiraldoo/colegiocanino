const path = require("path");

let startDevServer;
try {
	// optional dependency: only load if installed
	// eslint-disable-next-line global-require
	startDevServer = require("@cypress/vite-dev-server").startDevServer;
} catch (err) {
	// eslint-disable-next-line no-console
	console.warn(
		"Optional @cypress/vite-dev-server not found. Install it to enable TypeScript specs/support: `npm i -D @cypress/vite-dev-server`",
	);
}

module.exports = {
	// Keep this config focused on TypeScript specs only
	e2e: {
		// Resolve paths relative to this config file so Cypress finds files correctly
		// Specs are stored in tests/e2e/specs (not tests/e2e/cypress/specs)
		specPattern: path.join(__dirname, "specs", "**", "*.cy.ts"),
		supportFile: path.join(__dirname, "cypress", "support", "e2e.ts"),
		baseUrl: "http://localhost:5173",
		setupNodeEvents(on, config) {
			// Use Vite as Cypress dev server so Cypress can load .ts support and spec files
			if (startDevServer) {
				on("dev-server:start", (options) =>
					startDevServer({ options, viteConfig: { root: process.cwd() } }),
				);
			} else {
				// fallback: do not register a dev-server handler so config won't throw
			}
			return config;
		},
	},
};
