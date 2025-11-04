describe("E2E: Dispatch a dog (attendance) - admin -> verify by UI search", () => {
	const frontendBase = "http://localhost:5173";
	const adminCreds = {
		username: "ejemplo_interno",
		password: "example_",
	};

	before(() => {
		cy.visit(`${frontendBase}/login`);
		cy.get('input[placeholder="usuario"]').clear().type(adminCreds.username);
		cy.get('input[type="password"], input[placeholder="••••••••"]')
			.first()
			.clear()
			.type(adminCreds.password);
		cy.get('button[type="submit"]').click();
		cy.url({ timeout: 10000 }).should("not.include", "/login");
		cy.wait(300);
		cy.window().then((win) => {
			const acc =
				win.localStorage.getItem("access_token") ||
				win.sessionStorage.getItem("access_token");
			const ref =
				win.localStorage.getItem("refresh_token") ||
				win.sessionStorage.getItem("refresh_token");
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

	it("dispatches first enrolled dog and verifies it via attendance view search", () => {
		cy.visit(`${frontendBase}/internal-users/registrar-asistencia`);
		cy.get("table.manage-table tbody", { timeout: 10000 })
			.should("exist")
			.then(($tbody) => {
				if ($tbody.find("tr").length === 0) {
					throw new Error(
						"No enrolled dogs found. Seed an enrollment before running this test.",
					);
				}
			});

		cy.get("table.manage-table tbody tr")
			.first()
			.within(() => {
				cy.get("td")
					.eq(1)
					.invoke("text")
					.then((txt) => {
						let raw = String(txt || "").trim();
						raw = raw.replace(/\s+/g, " ");
						raw = raw.replace(/(?:[-–—\s]*)\d{4}[-/]\d{2}[-/]\d{2}\b/, "");
						raw = raw.replace(/[-–—\s:_]+$/g, "");
						const name = raw.trim();
						cy.wrap(name).as("dispatchedCanine");
					});
				cy.contains("button", "Despachado").click();
			});

		cy.wait(800);

		cy.get("@dispatchedCanine").then((canineName) => {
			cy.visit(`${frontendBase}/internal-users/visualizar-asistencia`);
			cy.get('input[placeholder="Buscar por nombre, tipo o motivo..."]', {
				timeout: 10000,
			})
				.clear()
				.type(String(canineName));
			cy.contains("button", /Actualizar|Update/i).click();
			cy.contains(String(canineName), { timeout: 10000 })
				.parents("tr")
				.within(() => {
					cy.contains(/Despachado|Despachad|Dispatched/i).should("exist");
				});
		});
	});
});
