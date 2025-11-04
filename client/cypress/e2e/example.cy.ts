describe("Landing page", () => {
	it("should load successfully", () => {
		cy.visit("/")
		cy.contains("Página de inicio (FUTURA LANDING)")
	})
})
