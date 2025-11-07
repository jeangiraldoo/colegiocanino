describe("Login as user 'Monica'", () => {
	it("Should log in succesfully", () => {
		cy.visit("/login")

		cy.get('input[type="text"]').type("Monica")
		cy.get('input[type="password"]').type("M@n1c4_0909")

		cy.get('button[type="submit"]').click()

		cy.url().should("include", "/portal-cliente/dashboard")
		cy.contains("¡Bienvenido")
		cy.contains("Monica!")
	})
})

describe("Login as user 'Jean'", () => {
	it("Should log in succesfully", () => {
		cy.visit("/login")

		cy.get('input[type="text"]').type("jeanpi")
		cy.get('input[type="password"]').type("superjean")

		cy.get('button[type="submit"]').click()

		cy.url().should("include", "/portal-cliente/dashboard")
		cy.contains("¡Bienvenido")
		cy.contains("Jean Giraldo!")
	})
})
