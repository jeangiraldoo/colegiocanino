describe("E2E: Register internal user (HU-1)", () => {
	const backendTokenUrl = "http://127.0.0.1:8000/api/token/";
	const frontendBase = "http://localhost:5173";
	const adminCreds = {
		username: "ejemplo_interno",
		password: "example_",
	};

	before(() => {
		cy.request({
			method: "POST",
			url: backendTokenUrl,
			body: adminCreds,
			failOnStatusCode: false,
		}).then((res) => {
			if (res.status === 200 && res.body?.access) {
				cy.window().then((win) => {
					win.localStorage.setItem("access_token", res.body.access);
					if (res.body.refresh)
						win.localStorage.setItem("refresh_token", res.body.refresh);
				});
			} else {
				cy.visit(`${frontendBase}/login`);
				cy.get('input[placeholder="usuario"]')
					.clear()
					.type(adminCreds.username);
				cy.get('input[type="password"], input[placeholder="••••••••"]')
					.first()
					.clear()
					.type(adminCreds.password);
				cy.get('button[type="submit"]').click();
				cy.url({ timeout: 6000 }).should("not.include", "/login");
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
			.type("")
			.invoke("val")
			.then(console.log);

		cy.get('button[type="submit"]').click();

		cy.url({ timeout: 8000 }).should((url) => {
			expect(
				url.includes("/internal-users/administrar-usuarios") ||
					url.includes("/internal-users"),
			).to.equal(true);
		});
		cy.contains("Usuario interno creado correctamente.", {
			timeout: 8000,
		}).should("exist");
	});
});

it("register-user", function () {});
