describe("API - Canines Endpoints", () => {
    const API_URL = "http://localhost:8000/api";
    let authToken: string;
    let clientId: number;
    let canineId: number;

    // Test data
    const testUser = {
        username: `canineowner_${Date.now()}`,
        email: `canineowner_${Date.now()}@example.com`,
        password: "testpass123",
        first_name: "Canine",
        last_name: "Owner",
    };

    const testCanine = {
        name: "Max",
        breed: "Labrador Retriever",
        age: 3,
        size: "big",
    };

    const updatedCanine = {
        name: "Max Updated",
        breed: "Golden Retriever",
        age: 4,
        size: "big",
    };

    before(() => {
        // Register a user and get auth token
        cy.request({
            method: "POST",
            url: `${API_URL}/register/`,
            body: testUser,
        }).then((response) => {
            authToken = response.body.access;
            clientId = response.body.user.client_profile?.id;
        });
    });

    describe("POST /api/canines/", () => {
        it("should create a new canine successfully", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/canines/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: {
                    ...testCanine,
                    client: clientId,
                },
            }).then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).to.have.property("id");
                expect(response.body).to.have.property("name", testCanine.name);
                expect(response.body).to.have.property("breed", testCanine.breed);
                expect(response.body).to.have.property("age", testCanine.age);
                expect(response.body).to.have.property("size", testCanine.size);
                expect(response.body).to.have.property("status", true);

                // Save canine ID for later tests
                canineId = response.body.id;
            });
        });

        it("should fail to create canine without authentication", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/canines/`,
                body: testCanine,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });

        it("should fail to create canine without required fields", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/canines/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: {
                    name: "Incomplete Dog",
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(400);
            });
        });
    });

    describe("GET /api/canines/", () => {
        it("should list all canines", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/canines/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.be.an("array");
                expect(response.body.length).to.be.greaterThan(0);

                // Check if our created canine is in the list
                const ourCanine = response.body.find((c) => c.id === canineId);
                expect(ourCanine).to.exist;
                expect(ourCanine.name).to.eq(testCanine.name);
            });
        });

        it("should fail to list canines without authentication", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/canines/`,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });

    describe("GET /api/canines/:id/", () => {
        it("should get canine details by ID", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/canines/${canineId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("id", canineId);
                expect(response.body).to.have.property("name", testCanine.name);
                expect(response.body).to.have.property("breed", testCanine.breed);
                expect(response.body).to.have.property("age", testCanine.age);
            });
        });

        it("should return 404 for non-existent canine", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/canines/99999/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(404);
            });
        });
    });

    describe("PUT /api/canines/:id/", () => {
        it("should update canine successfully", () => {
            cy.request({
                method: "PUT",
                url: `${API_URL}/canines/${canineId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: {
                    ...updatedCanine,
                    client: clientId,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("id", canineId);
                expect(response.body).to.have.property("name", updatedCanine.name);
                expect(response.body).to.have.property("breed", updatedCanine.breed);
                expect(response.body).to.have.property("age", updatedCanine.age);
            });
        });

        it("should fail to update without authentication", () => {
            cy.request({
                method: "PUT",
                url: `${API_URL}/canines/${canineId}/`,
                body: updatedCanine,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });

    describe("PATCH /api/canines/:id/", () => {
        it("should partially update canine", () => {
            cy.request({
                method: "PATCH",
                url: `${API_URL}/canines/${canineId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: {
                    age: 5,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("age", 5);
                expect(response.body).to.have.property("name", updatedCanine.name);
            });
        });
    });

    describe("DELETE /api/canines/:id/", () => {
        it("should delete canine successfully", () => {
            cy.request({
                method: "DELETE",
                url: `${API_URL}/canines/${canineId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(204);
            });
        });

        it("should return 404 when trying to get deleted canine", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/canines/${canineId}/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(404);
            });
        });

        it("should fail to delete without authentication", () => {
            cy.request({
                method: "DELETE",
                url: `${API_URL}/canines/1/`,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });
});
