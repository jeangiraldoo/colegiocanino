export function login(user) {
	cy.clearCookies();
	cy.clearLocalStorage();
	cy.visit("/login");

	cy.get('input[type="text"]').type(user.username);
	cy.get('input[type="password"]').type(user.password);
	cy.get('button[type="submit"]').click();

	cy.url().should("include", "/portal-cliente/dashboard");
	cy.contains("¡Bienvenido");
	cy.contains(`${user.name} ${user.last_name}!`);
}
