describe("E2E: Update internal user (Admin) -> ManageUsers reflects change", () => {
	const backendBase = "http://127.0.0.1:8000";
	const frontendBase = "http://localhost:5173";
	const adminCreds = { username: "ejemplo_interno", password: "example_" };
	let accessToken = null;
	let createdInternalId = null;
	let createdUsername = null;

	before(() => {
		// Login via UI and capture token for API calls
		cy.visit(`${frontendBase}/login`);
		cy.get('input[placeholder="usuario"]').clear().type(adminCreds.username);
		cy.get('input[type="password"], input[placeholder="••••••••"]')
			.first()
			.clear()
			.type(adminCreds.password);
		cy.get('button[type="submit"]').click();
		cy.url({ timeout: 10000 }).should("not.include", "/login");
		cy.wait(300);
		cy.window()
			.then((win) => {
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
				accessToken = acc;
			})
			.then(() => {
				// create internal user via API using the token obtained from UI login
				const ts = Date.now();
				createdUsername = `e2e_edit_${ts}`;
				const payload = {
					user: {
						username: createdUsername,
						email: `${createdUsername}@test.local`,
						first_name: `Create${ts}`,
						last_name: "User",
						document_id: String(
							10000000 + Math.floor(Math.random() * 89999999),
						),
						password: "StrongPass1!",
					},
					role: "COACH",
				};
				cy.request({
					method: "POST",
					url: `${backendBase}/api/internal-users/`,
					headers: {
						Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
						"Content-Type": "application/json",
					},
					failOnStatusCode: false,
					body: payload,
				}).then((res) => {
					cy.log("create internal user response", JSON.stringify(res.body));
					expect([200, 201]).to.include(res.status);
					const body = res.body || {};
					createdInternalId = body.user_id ?? body.user?.id ?? body.id ?? null;
					expect(createdInternalId, "createdInternalId should exist").to.exist;
					cy.wrap(createdInternalId).as("createdInternalId");
				});
			});
	});

	it("edits the created user and sees the change in ManageUsers list", function () {
		const newName = `EditedName_${Date.now()}`;

		cy.visit(`${frontendBase}/internal-users/administrar-usuarios`);
		cy.get("table.manage-table tbody", { timeout: 15000 }).should("exist");

		cy.contains(createdUsername, { timeout: 12000 })
			.should("exist")
			.parents("tr")
			.as("targetRow");

		cy.get("@targetRow").within(() => {
			cy.get('button[title="Editar"]').click();
		});

		cy.get("form.edit-panel", { timeout: 10000 })
			.should("exist")
			.within(() => {
				cy.contains("label", "Nombre")
					.parent()
					.find("input")
					.first()
					.then(($input) => {
						if ($input && $input.length) {
							cy.wrap($input).clear().type(newName);
						} else {
							cy.get('input:visible:not([type="file"])')
								.not('[id^="update-user-photo-"]')
								.first()
								.clear()
								.type(newName);
						}
					});

				cy.contains("label", "Email")
					.parent()
					.find("input")
					.first()
					.then(($e) => {
						if ($e && $e.length) {
							cy.wrap($e).clear().type(`edited_${Date.now()}@test.local`);
						}
					});

				cy.contains("button", "Guardar").click();
			});

		cy.wait(700);
		cy.visit(`${frontendBase}/internal-users/administrar-usuarios`);
		cy.get("table.manage-table tbody", { timeout: 15000 }).should("exist");

		cy.contains(newName, { timeout: 12000 }).should("exist");
		cy.contains(createdUsername).should("exist");
	});

	after(function () {
		// NOTE: per request, do NOT delete the created user here.
		cy.log(
			"skipping cleanup: createdInternalId =",
			this.createdInternalId ?? createdInternalId,
		);
	});
});
