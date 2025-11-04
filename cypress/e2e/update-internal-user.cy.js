describe("E2E: Update internal user (Admin) -> ManageUsers reflects change", () => {
	const backendBase = "http://127.0.0.1:8000";
	const backendTokenUrl = `${backendBase}/api/token/`;
	const frontendBase = "http://localhost:5173";
	const adminCreds = {
		username: "ejemplo_interno",
		password: "example_",
	};
	let accessToken = null;
	let createdInternalId = null;
	let createdUsername = null;

	before(() => {
		cy.intercept({
			method: "GET",
			url: `${backendBase}/api/internal-users/**`,
		}).as("getInternalUsers");
		cy.intercept({ method: "GET", url: `${backendBase}/api/users/**` }).as(
			"getUsers",
		);

		const setAuthAndUser = (access, refresh) => {
			cy.window().then((win) => {
				win.localStorage.setItem("access_token", access);
				win.sessionStorage.setItem("access_token", access);
				if (refresh) {
					win.localStorage.setItem("refresh_token", refresh);
					win.sessionStorage.setItem("refresh_token", refresh);
				}
			});

			cy.request({
				method: "GET",
				url: `${backendBase}/api/user-type/`,
				headers: { Authorization: `Bearer ${access}` },
				failOnStatusCode: false,
			}).then((r) => {
				cy.log("user-type response", JSON.stringify(r.body));
				const b = r.body || {};
				const role = b.role ?? (b.user && b.user.role) ?? "";
				const userId = b.user_id ?? (b.user && b.user.id) ?? "";
				const clientId = b.client_id ?? "";
				cy.window().then((win) => {
					if (role) win.localStorage.setItem("user_role", String(role));
					if (userId) win.localStorage.setItem("user_id", String(userId));
					if (clientId) win.localStorage.setItem("client_id", String(clientId));
				});
			});
		};

		const createUser = () => {
			const ts = Date.now();
			createdUsername = `e2e_edit_${ts}`;
			const payload = {
				user: {
					username: createdUsername,
					email: `${createdUsername}@test.local`,
					first_name: `Create${ts}`,
					last_name: "User",
					document_id: String(10000000 + Math.floor(Math.random() * 89999999)),
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
				createdInternalId =
					body.id ??
					body.pk ??
					(body.internaluser &&
						(body.internaluser.id ?? body.internaluser.pk)) ??
					(body.user && (body.user.id ?? body.user.pk)) ??
					null;
				if (!createdInternalId && body.user && body.user.id)
					createdInternalId = body.user.id;
				expect(createdInternalId, "createdInternalId should exist").to.exist;
				cy.wrap(createdInternalId).as("createdInternalId");
			});
		};

		cy.request({
			method: "POST",
			url: backendTokenUrl,
			body: adminCreds,
			failOnStatusCode: false,
		}).then((res) => {
			cy.log("token response status", res.status);
			cy.log("token response body", JSON.stringify(res.body));
			if (res.status === 200 && res.body?.access) {
				accessToken = res.body.access;
				setAuthAndUser(res.body.access, res.body.refresh);
				createUser();
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

				cy.url({ timeout: 10000 }).should("not.include", "/login");
				cy.window()
					.then((win) => {
						const tokens = {
							access_local: win.localStorage.getItem("access_token"),
							access_sess: win.sessionStorage.getItem("access_token"),
							refresh_local: win.localStorage.getItem("refresh_token"),
							refresh_sess: win.sessionStorage.getItem("refresh_token"),
							user_role:
								win.localStorage.getItem("user_role") ||
								win.sessionStorage.getItem("user_role"),
							user_id:
								win.localStorage.getItem("user_id") ||
								win.sessionStorage.getItem("user_id"),
						};
						cy.log("tokens after UI login", JSON.stringify(tokens));
						accessToken = tokens.access_local ?? tokens.access_sess ?? null;
					})
					.then(() => {
						if (!accessToken) {
							cy.request({
								method: "POST",
								url: backendTokenUrl,
								body: adminCreds,
								failOnStatusCode: false,
							}).then((r2) => {
								cy.log("second token attempt", r2.status);
								if (r2.status === 200 && r2.body?.access) {
									accessToken = r2.body.access;
									setAuthAndUser(r2.body.access, r2.body.refresh);
								}
							});
						}
					})
					.then(createUser);
			}
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
		const idToDelete = this.createdInternalId ?? createdInternalId;
		if (idToDelete) {
			cy.request({
				method: "DELETE",
				url: `${backendBase}/api/internal-users/${encodeURIComponent(String(idToDelete))}/`,
				headers: {
					Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
				},
				failOnStatusCode: false,
			}).then((res) => {
				cy.log("delete res", res.status);
			});
		}
	});
});
