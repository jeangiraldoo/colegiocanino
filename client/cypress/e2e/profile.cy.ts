describe("Login as user 'jeanpi'", () => {
	beforeEach(() => {
		cy.visit("/login")

		cy.get('input[type="text"]').type("jeanpi")
		cy.get('input[type="password"]').type("superjean")

		cy.get('button[type="submit"]').click()

		cy.url().should("include", "/portal-cliente/dashboard")
		cy.contains("¡Bienvenido")
		cy.contains("Jean Giraldo!")
	})

	it("Should update Jean's profile", () => {
		cy.visit("/portal-cliente/perfil")
		cy.contains("button", "Editar Perfil").click()
		cy.get('input[name="first_name"]').type("notjean")
		cy.contains("button", "Guardar Cambios").click()
		cy.get('input[name="first_name"]').should("have.value", "Jeannotjean") // Technically appends "notjean" to the current name
	})
})

describe("Login as user 'superclient'", () => {
	beforeEach(() => {
		cy.visit("/login")

		cy.get('input[type="text"]').type("superclient")
		cy.get('input[type="password"]').type("jeanclient")

		cy.get('button[type="submit"]').click()

		cy.url().should("include", "/portal-cliente/dashboard")
		cy.contains("¡Bienvenido")
		cy.contains("supername superlast!")
	})

	it("Should update superclient's profile", () => {
		cy.visit("/portal-cliente/perfil")
		cy.contains("button", "Editar Perfil").click()
		cy.get('input[name="first_name"]').type("notsuperclient")
		cy.contains("button", "Guardar Cambios").click()

		// Technically appends "notsuperclient" to the current name
		cy.get('input[name="first_name"]').should("have.value", "supernamenotsuperclient")
	})
})
