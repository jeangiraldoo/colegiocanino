export function login(user) {
	cy.clearCookies();
	cy.clearLocalStorage();
	cy.visit("/login");

	cy.get('input[type="text"]').type(user.username);
	cy.get('input[type="password"]').type(user.password);
	cy.get('button[type="submit"]').click();

	// Wait for client portal to load (allow either dashboard or other portal routes)
	cy.url({ timeout: 10000 }).should((u) => {
		expect(u).to.include("/portal-cliente");
	});

	// Ensure the UI shows a welcome indicator (don't assert full name to avoid flaky selectors)
	cy.contains("¡Bienvenido").should("exist");

	// Navigate to 'Mis Mascotas' in the sidebar so tests can continue from there
	// Use a tolerant selector in case the element is inside a nav or button
	cy.contains(/Mis Mascotas/i).click({ force: true });
}
