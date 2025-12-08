describe("API - Enrollments Endpoints", () => {
    const API_URL = "http://localhost:8000/api";
    let authToken: string;
    let clientId: number;
    let canineId: number;
    let planId: number;
    let transportServiceId: number;
    let enrollmentId: number;

    // Test data
    const testUser = {
        username: `Monica`,
        email: `enrolluser_${Date.now()}@example.com`,
        password: "M@n1c4_0909",
        first_name: "Enroll",
        last_name: "User",
    };

    const testCanine = {
        name: "Buddy",
        breed: "Golden Retriever",
        age: 2,
        size: "big",
    };

    const testPlan = {
        name: "Plan Test Cypress",
        duration: "1_mes",
        price: "150000.00",
        active: true,
    };

    const testTransport = {
        type: "full",
    };

    

    before(() => {
        // Register a user and get auth token
        cy.request({
            method: "POST",
            url: `${API_URL}/token/`,
            body: {
                username: testUser.username,
                password: testUser.password,
            },
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            failOnStatusCode: false,
        }).then((loginResponse) => {
            authToken = loginResponse.body.access;

            // Get client ID using the user-type endpoint
            cy.request({
                method: "GET",
                url: `${API_URL}/user-type/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
            }).then((userTypeResponse) => {
                // The user-type endpoint returns client_id directly
                clientId = userTypeResponse.body.client_id;
            });

            // Create a canine
            cy.request({
                method: "POST",
                url: `${API_URL}/canines/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
                body: {
                    ...testCanine,
                    client: clientId,
                },
            }).then((canineResponse) => {
                canineId = canineResponse.body.id;
            });

            // Create an enrollment plan
            cy.request({
                method: "POST",
                url: `${API_URL}/enrollment-plans/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
                body: testPlan,
            }).then((planResponse) => {
                if (planResponse.status === 201) {
                    planId = planResponse.body.id;
                    enrollmentId = planResponse.body.id;

                } else {
                    // If creation fails, try to get existing plans
                    cy.request({
                        method: "GET",
                        url: `${API_URL}/enrollment-plans/`,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }).then((plansResponse) => {
                        if (plansResponse.body.length > 0) {
                            planId = plansResponse.body[0].id;
                        }
                    });
                }
            });

            // Create a transport service
            cy.request({
                method: "POST",
                url: `${API_URL}/transport-services/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
                body: testTransport,
            }).then((transportResponse) => {
                if (transportResponse.status === 201) {
                    transportServiceId = transportResponse.body.id;
                } else {
                    // If creation fails, try to get existing transport services
                    cy.request({
                        method: "GET",
                        url: `${API_URL}/transport-services/`,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }).then((servicesResponse) => {
                        if (servicesResponse.body.length > 0) {
                            transportServiceId = servicesResponse.body[0].id;
                        }
                    });
                }
            });

            const enrollmentPayload = {
				canine: 1,
				plan: 1,
				transport_service: 1,
				enrollment_date: "2025-12-01",
				expiration_date: "2025-12-31",
				status: true,
			};

            // Create an enrollment
            cy.request({
                method: "POST",
                url: `${API_URL}/enrollments/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
                body: enrollmentPayload,
            }).then((enrollmentResponse) => {
                console.log(enrollmentResponse.body);
                expect(enrollmentResponse.status).to.eq(201);
                if (enrollmentResponse.status === 201) {
                    enrollmentId = enrollmentResponse.body.id;
                }
            });
        });
    });

    describe("GET /api/enrollment-plans/", () => {
        it("should list all enrollment plans", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/enrollment-plans/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.be.an("array");
            });
        });
    });

    describe("GET /api/transport-services/", () => {
        it("should list all transport services", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/transport-services/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.be.an("array");
            });
        });
    });

    describe("POST /api/enrollments/", () => {
        it("should create a new enrollment successfully", () => {
            const today = new Date();
            const expirationDate = new Date(today);
            expirationDate.setDate(expirationDate.getDate() + 30);

            const enrollmentData = {
                canine: 1,
                plan: 1,
                transport_service: 1,
                enrollment_date: today.toISOString().split("T")[0],
                expiration_date: expirationDate.toISOString().split("T")[0],
                status: true,
            };

            cy.request({
                method: "POST",
                url: `${API_URL}/enrollments/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
                body: enrollmentData,
            }).then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).to.have.property("id");
                expect(response.body).to.have.property("canine", 1);
                expect(response.body).to.have.property("plan", 1);
                expect(response.body).to.have.property("transport_service", 1);
                expect(response.body).to.have.property("status", true);

                // Save enrollment ID for later tests
                enrollmentId = response.body.id;
            });
        });

        it("should fail to create enrollment without authentication", () => {
            const today = new Date();
            const expirationDate = new Date(today);
            expirationDate.setDate(expirationDate.getDate() + 30);

            cy.request({
                method: "POST",
                url: `${API_URL}/enrollments/`,
                body: {
                    canine: canineId,
                    plan: planId,
                    transport_service: transportServiceId,
                    enrollment_date: today.toISOString().split("T")[0],
                    expiration_date: expirationDate.toISOString().split("T")[0],
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });

        it("should fail to create enrollment without required fields", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/enrollments/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: {
                    canine: canineId,
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(400);
            });
        });
    });

    describe("GET /api/enrollments/", () => {
        it("should list all enrollments", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/enrollments/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.be.an("array");
                expect(response.body.length).to.be.greaterThan(0);
            });
        });

        it("should fail to list enrollments without authentication", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/enrollments/`,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });

    describe("GET /api/enrollments/:id/", () => {
        it("should get enrollment details by ID", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/enrollments/${1}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
                failOnStatusCode: false,
            }).then((response) => {

                // Check if our created enrollment is in the list
                // Check if our created enrollment is in the list
                cy.log(`Looking for enrollment ID: ${enrollmentId}`);
                cy.log("Enrollment NOT found!");
                console.log("Enrollment NOT found. Available:", 32, "Target:", response);
                 
        
                
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("id", 1);
                expect(response.body).to.have.property("canine");
                expect(response.body).to.have.property("plan");
                expect(response.body).to.have.property("transport_service");
            });
        });

        it("should return 404 for non-existent enrollment", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/enrollments/99999/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(404);
            });
        });
    });

    describe("PATCH /api/enrollments/:id/", () => {
        it("should update enrollment status", () => {
            cy.request({
                method: "PATCH",
                url: `${API_URL}/enrollments/${enrollmentId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: {
                    status: false,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("status", false);
            });
        });
    });

    describe("DELETE /api/enrollments/:id/", () => {
        it("should return 404 when trying to get deleted enrollment", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/enrollments/${enrollmentId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(404);
            });
        });
    });
});
