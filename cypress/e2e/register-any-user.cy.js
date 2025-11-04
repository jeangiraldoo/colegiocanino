describe("E2E: Register any user", () => {
	const frontendBase = "http://localhost:5173";

	it("fills the register form and is redirected to login", () => {
		const ts = Date.now();
		const firstName = "Test";
		const lastName = "User";
		const username = `e2e_user_1762234319559`;
		const email = `e2e_user_${ts}@test.local`;
		const documentId = String(Math.floor(1e6 + Math.random() * 9e6));
		const password = "StrongPass1!";

		cy.visit(`${frontendBase}/register`);

		cy.get('input[name="firstName"]').clear().type(firstName);
		cy.get('input[name="lastName"]').clear().type(lastName);
		cy.get('input[name="documentId"]').clear().type(documentId);
		cy.get('input[name="username"]').clear().type(username);
		cy.get('input[name="email"]').clear().type(email);
		cy.get('input[name="password"]').clear().type(password);
		cy.get('input[name="confirmPassword"]').clear().type(password);

		cy.get('input[type="checkbox"]').check();

		cy.get('button[type="submit"]').click();

		cy.contains("¡Registro exitoso", { timeout: 8000 }).should("be.visible");
		cy.url({ timeout: 10000 }).should("include", "/login");
	});
});
