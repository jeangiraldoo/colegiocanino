// This spec tests modifying an enrollment (attendance) from the internal users' Register Attendance view.
// It uses the UI login helper to authenticate and stubs network requests where needed.

import { TEST_DATA } from "./_test_data";
import { login } from "./_utils";

const internalUser = TEST_DATA[0];
const today = new Date().toISOString().slice(0, 10);

describe("Internal user - modify enrollment", () => {
	beforeEach(() => {
		// Log in through the UI helper so the app has valid tokens and user_type/role
		login(internalUser);
	});

	it("dispatches a canine (sets status to dispatched) and shows locked UI", () => {
		// Prepare a single enrollment returned by /api/enrollments/
		cy.intercept("GET", "/api/enrollments/?status=true&ordering=-creation_date", {
			statusCode: 200,
			body: [
				{
					id: 555, // enrollment id
					canine: 42,
					canine_name: "TestDog-42",
					photo: null,
				},
			],
		}).as("getEnrollments");

		// No attendance exists yet for today
		cy.intercept(
			{"method": "GET", "url": new RegExp(`/api/attendance/\\?date=${today}.*`)},
			(req) => {
				// For the initial load (without enrollment_id), return empty array
				if (!req.url.includes("enrollment_id=")) {
					req.reply({ statusCode: 200, body: [] });
					return;
				}
				// when queried with enrollment_id=555 return empty -> will trigger POST
				req.reply({ statusCode: 200, body: [] });
			},
		).as("getAttendance");

		// Intercept creation of attendance (POST)
		cy.intercept("POST", "/api/attendance/", (req) => {
			// echo back a created record with status 'dispatched'
			req.reply({
				statusCode: 201,
				body: {
					id: 9001,
					enrollment: 555,
					canine_name: "TestDog-42",
					date: today,
					arrival_time: null,
					departure_time: new Date().toISOString().slice(11, 19),
					status: "dispatched",
					withdrawal_reason: "Despachado por e2e",
				},
			});
		}).as("createAttendance");

		// Visit the internal register page
		cy.visit("/internal-users/registrar-asistencia");

		// Wait for enrollments to load and assert the canine appears in the table
		cy.wait("@getEnrollments");
		cy.contains("TestDog-42").should("exist");

		// Click the 'Despachado' button for that row
		cy.contains("TestDog-42")
			.closest("tr")
			.within(() => {
				cy.contains("Despachado").click();
			});

		// Wait for the createAttendance POST and assert it was called
		cy.wait("@createAttendance").its("response.statusCode").should("eq", 201);

		// After dispatch, the UI for that row (last cell) should show 'Locked' for non-admin
		cy.contains("TestDog-42")
			.closest("tr")
			.within(() => {
				cy.contains("Locked").should("exist");
			});
	});

	it("updates the observations field (withdrawal_reason) for an enrollment", () => {
		// Stub enrollments as before
		cy.intercept("GET", "/api/enrollments/?status=true&ordering=-creation_date", {
			statusCode: 200,
			body: [
				{ id: 777, canine: 77, canine_name: "ObsDog-77", photo: null },
			],
		}).as("getEnrollments2");

		// No attendance exists initially for this enrollment -> create on commit
		cy.intercept(
			{"method": "GET", "url": new RegExp(`/api/attendance/\\?date=${today}.*`)},
			(req) => req.reply({ statusCode: 200, body: [] }),
		).as("getAttendance2");

		// Intercept POST /api/attendance/ and return saved record
		cy.intercept("POST", "/api/attendance/", (req) => {
			req.reply({
				statusCode: 201,
				body: {
					id: 91011,
					enrollment: 777,
					canine_name: "ObsDog-77",
					date: today,
					arrival_time: null,
					departure_time: null,
					status: "present",
					withdrawal_reason: req.body.withdrawal_reason || "",
				},
			});
		}).as("createAttendance2");

		cy.visit("/internal-users/registrar-asistencia");
		cy.wait("@getEnrollments2");
		cy.contains("ObsDog-77").should("exist");

		// Type into the observations input and blur to trigger commitReason
		cy.contains("ObsDog-77")
			.closest("tr")
			.within(() => {
				cy.get('input[placeholder="Observaciones (opcional)"]').clear().type("Nota de prueba E2E").blur();
			});

		// Wait for POST and assert the saved withdrawal_reason is echoed back
		cy.wait("@createAttendance2").its("request.body.withdrawal_reason").should("eq", "Nota de prueba E2E");

		// And the input should reflect the saved value
		cy.contains("ObsDog-77")
			.closest("tr")
			.within(() => {
				cy.get('input[placeholder="Observaciones (opcional)"]').should("have.value", "Nota de prueba E2E");
			});
	});
});
