export function login(user) {
	cy.clearCookies();
	cy.clearLocalStorage();
	cy.visit("/login");

	cy.get('input[type="text"]').type(user.username);
	cy.get('input[type="password"]').type(user.password);
	cy.get('button[type="submit"]').click();

	// Wait for either client or internal portal to load
	cy.url({ timeout: 10000 }).should((u) => {
		expect(u).to.satisfy(
			(val) => val.includes("/portal-cliente") || val.includes("/internal-users"),
		);
	});

	// Ensure the UI shows a welcome indicator (don't assert full name to avoid flaky selectors)
	cy.contains("¡Bienvenido").should("exist");

	// Navigate to a sensible default area depending on the portal type
	cy.url().then((u) => {
		if (String(u).includes("/portal-cliente")) {
			// Client portal: go to 'Mis Mascotas'
			cy.contains(/Mis Mascotas/i, { timeout: 5000 }).click({ force: true });
		} else {
			// Internal users portal: go to 'Caninos' list
			cy.get(".sidebar-link").contains("Caninos", { timeout: 5000 }).click({ force: true });
		}
	});
}
