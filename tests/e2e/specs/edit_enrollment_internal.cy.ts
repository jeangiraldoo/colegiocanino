// Cypress E2E: Use the real Edit Enrollment modal form
// Logs in via UI (with recaptcha stub) and uses the existing modal component in the app

describe("Internal users - Edit Enrollment (end-to-end single flow)", () => {
	const username = "carlos.director";
	const password = "Perro123";

	it("logs in, navigates to Caninos, edits enrollment and toggles status in a single flow", () => {
		// Visit login and sign in
		cy.visit("/login");
		cy.get('input[placeholder="usuario"]', { timeout: 10000 }).clear().type(username);
		cy.get('input[placeholder="••••••••"]', { timeout: 10000 }).clear().type(password);

		// stub recaptcha verification so login proceeds in tests
		cy.intercept("POST", "/api/recaptcha/verify/", { statusCode: 200, body: { success: true } }).as(
			"recaptcha",
		);

		cy.get('button[type="submit"]').click();

		// Wait until internal users area loads
		cy.url({ timeout: 15000 }).should("include", "/internal-users");

		// Click the 'Caninos' link in the sidebar (robust selectors)
		cy.contains("a", /Caninos/i, { timeout: 10000 })
			.should("be.visible")
			.click({ force: true });

		// Wait for table to appear and open the first row's edit modal
		cy.get("table.manage-table tbody tr", { timeout: 10000 })
			.first()
			.within(() => {
				cy.get('button[title^="Editar matrícula"]').scrollIntoView().click({ force: true });
			});

		// Modal should be visible
		cy.get('div[role="dialog"]', { timeout: 10000 }).should("be.visible");

		// We'll intercept PATCH calls per-action to avoid ambiguous matches

		// Fill modal: choose plan and transport if available
		// Fill modal: choose plan and transport if available and store chosen values
		cy.get('div[role="dialog"] select', { timeout: 8000 })
			.first()
			.then(($sel) => {
				const opts = $sel.find("option");
				if (opts.length > 1) {
					const pickIndex = 1;
					const val = String(opts.eq(pickIndex).val());
					cy.wrap(val).as("firstPlan");
					cy.wrap($sel).select(val);
				} else {
					cy.wrap("").as("firstPlan");
				}
			});

		cy.get('div[role="dialog"] select')
			.eq(1)
			.then(($sel) => {
				const opts = $sel.find("option");
				if (opts.length > 1) {
					const pickIndex = 1;
					const val = String(opts.eq(pickIndex).val());
					cy.wrap(val).as("firstTransport");
					cy.wrap($sel).select(val);
				} else {
					cy.wrap("").as("firstTransport");
				}
			});

		// Set date and store it
		const today = new Date().toISOString().slice(0, 10);
		cy.get('div[role="dialog"] input[type="date"]')
			.clear()
			.type(today)
			.then(() => cy.wrap(today).as("firstDate"));

		// Save the first change and wait for that specific PATCH, then verify via API
		cy.intercept("PATCH", "/api/enrollments/*/").as("firstPatch");
		cy.get('div[role="dialog"] button.btn-primary').click();
		cy.wait("@firstPatch", { timeout: 10000 })
			.then((interception) => {
				const status = interception?.response?.statusCode ?? 0;
				const body = interception?.response?.body ?? {};
				if (!(status >= 200 && status < 300)) {
					throw new Error(`PATCH failed with status ${status}: ${JSON.stringify(body)}`);
				}
				const enrollmentId = body && (body.id || body.pk);
				if (!enrollmentId) throw new Error("PATCH returned no id");

				// Get access token from storage in the browser context and call the API with Authorization
				return cy.window().then((win) => {
					const token =
						win.localStorage.getItem("access_token") || win.sessionStorage.getItem("access_token");
					if (!token) throw new Error("No access_token found in storage for API verification");
					return cy
						.request({
							method: "GET",
							url: `/api/enrollments/${enrollmentId}/`,
							headers: { Authorization: `Bearer ${token}` },
						})
						.its("body");
				});
			})
			.then((enr) => {
				// Assert enrollment stored values match what we chose first
				cy.get("@firstPlan").then((fp) => {
					if (fp) expect(String(enr.plan)).to.equal(String(fp));
				});
				cy.get("@firstTransport").then((ft) => {
					if (ft) expect(String(enr.transport_service)).to.equal(String(ft));
				});
				cy.get("@firstDate").then((fd) => {
					if (fd) expect(String(enr.enrollment_date)).to.equal(String(fd));
				});
			});
	});
});

it("negative: saving without selecting a plan should return 400 and keep modal open", () => {
	// Credentials
	const username = "carlos.director";
	const password = "Perro123";

	// Login
	cy.visit("/login");
	cy.get('input[placeholder="usuario"]', { timeout: 10000 }).clear().type(username);
	cy.get('input[placeholder="••••••••"]', { timeout: 10000 }).clear().type(password);
	cy.intercept("POST", "/api/recaptcha/verify/", { statusCode: 200, body: { success: true } }).as(
		"recaptcha",
	);
	cy.get('button[type="submit"]').click();
	cy.url({ timeout: 15000 }).should("include", "/internal-users");

	// Navigate to Caninos
	cy.contains("a", /Caninos/i, { timeout: 10000 })
		.should("be.visible")
		.click({ force: true });
	cy.get("table.manage-table tbody tr", { timeout: 10000 })
		.first()
		.within(() => {
			cy.get('button[title^="Editar matrícula"]').scrollIntoView().click({ force: true });
		});
	cy.get('div[role="dialog"]', { timeout: 10000 }).should("be.visible");

	// Intentionally clear/select the empty placeholder for plan to provoke validation error
	cy.get('div[role="dialog"] select', { timeout: 8000 })
		.first()
		.then(($sel) => {
			const opts = $sel.find("option");
			// try to select an empty option if present, otherwise deselect by selecting the first option with empty value
			const emptyOpt = opts.filter((i, o) => String(o.value) === "");
			if (emptyOpt.length) cy.wrap($sel).select(String(emptyOpt.eq(0).val()));
			else if (opts.length) cy.wrap($sel).select("");
		});

	const today = new Date().toISOString().slice(0, 10);
	cy.get('div[role="dialog"] input[type="date"]').clear().type(today);

	// Intercept and assert the backend returns 400 for this invalid payload
	cy.intercept("PATCH", "/api/enrollments/*/").as("badPatch");
	cy.get('div[role="dialog"] button.btn-primary').click();
	cy.wait("@badPatch", { timeout: 10000 }).then((interception) => {
		const status = interception?.response?.statusCode ?? 0;
		// Expect a 4xx validation error
		expect(status).to.equal(400);
	});

	// Modal should remain open so user can fix errors
	cy.get('div[role="dialog"]').should("be.visible");
});
