describe("E2E: Register internal user (HU-1)", () => {
	const frontendBase = "http://localhost:5173";
	const adminCreds = {
		username: "ejemplo_interno",
		password: "example_",
	};

	before(() => {
		// Always login via UI (do not attempt token API first)
		cy.visit(`${frontendBase}/login`);
		cy.get('input[placeholder="usuario"]').clear().type(adminCreds.username);
		cy.get('input[type="password"], input[placeholder="••••••••"]')
			.first()
			.clear()
			.type(adminCreds.password);
		cy.get('button[type="submit"]').click();
		cy.url({ timeout: 10000 }).should("not.include", "/login");
		cy.wait(300);
		// ensure tokens present in storage for robustness
		cy.window().then((win) => {
			const acc =
				win.localStorage.getItem("access_token") || win.sessionStorage.getItem("access_token");
			const ref =
				win.localStorage.getItem("refresh_token") || win.sessionStorage.getItem("refresh_token");
			if (!acc)
				throw new Error(
					"No access token found after UI login. Verify credentials and app storage keys.",
				);
			win.localStorage.setItem("access_token", acc);
			win.sessionStorage.setItem("access_token", acc);
			if (ref) {
				win.localStorage.setItem("refresh_token", ref);
				win.sessionStorage.setItem("refresh_token", ref);
			}
		});
	});

	it("registers a new internal user as admin", () => {
		const ts = Date.now();
		const username = `test_user_${ts}`;
		const email = `test_user_${ts}@test.local`;
		const cedula = String(Math.floor(1e7 + Math.random() * 9e7));

		cy.visit(`${frontendBase}/internal-users/registrar-usuarios`);

		cy.get('input[aria-label="documento"]').clear().type(cedula);
		cy.get('input[aria-label="username"]').clear().type(username);
		cy.get('input[placeholder="Nombre(s)"]').clear().type("Test");
		cy.get('input[placeholder="Apellido(s)"]').clear().type("User");
		cy.get('input[placeholder="email@dominio.com"]').clear().type(email);
		cy.get("select").select("COACH");
		cy.get('input[placeholder="dd/mm/yyyy"]').clear().type("01/01/1990");
		cy.get('input[placeholder="Mínimo 6 caracteres"], input[type="password"]')
			.last()
			.clear()
			.type("StrongPass1!");

		cy.get('button[type="submit"]').click();

		cy.url({ timeout: 8000 }).should((url) => {
			expect(
				url.includes("/internal-users/administrar-usuarios") || url.includes("/internal-users"),
			).to.equal(true);
		});
		cy.contains("Usuario interno creado correctamente.", {
			timeout: 8000,
		}).should("exist");
	});
});

it("register-user", function () {});
