describe("API - Users Endpoints", () => {
    const API_URL = "http://localhost:8000/api";
    let authToken: string;
    let userId: number;

    // Test data
    const newUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: "testpass123",
        first_name: "Test",
        last_name: "User",
        phone_number: "1234567890",
        address: "123 Test Street",
    };

    describe("POST /api/register/", () => {
        it("should register a new user successfully", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/register/`,
                body: newUser,
            }).then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).to.have.property("user");
                expect(response.body.user).to.have.property("username", newUser.username);
                expect(response.body.user).to.have.property("email", newUser.email);
                expect(response.body).to.have.property("access");
                expect(response.body).to.have.property("refresh");

                // Save token and user ID for later tests
                authToken = response.body.access;
                userId = response.body.user.id;
            });
        });

        it("should fail to register with duplicate username", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/register/`,
                body: newUser,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(400);
            });
        });

        it("should fail to register without required fields", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/register/`,
                body: {
                    username: "incomplete",
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(400);
            });
        });
    });

    describe("POST /api/token/", () => {
        it("should login and get JWT tokens", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/token/`,
                body: {
                    username: newUser.username,
                    password: newUser.password,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("access");
                expect(response.body).to.have.property("refresh");

                // Update auth token
                authToken = response.body.access;
            });
        });

        it("should fail login with wrong password", () => {
            cy.request({
                method: "POST",
                url: `${API_URL}/token/`,
                body: {
                    username: newUser.username,
                    password: "wrongpassword",
                },
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });

    describe("GET /api/profile/", () => {
        it("should get user profile when authenticated", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/profile/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("username", newUser.username);
                expect(response.body).to.have.property("email", newUser.email);
                expect(response.body).to.have.property("first_name", newUser.first_name);
            });
        });

        it("should fail to get profile without authentication", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/profile/`,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });
    });

    describe("GET /api/user-type/", () => {
        it("should get user type when authenticated", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/user-type/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("user_type");
            });
        });
    });

    describe("GET /api/users/", () => {
        it("should list users (may require permissions)", () => {
            cy.request({
                method: "GET",
                url: `${API_URL}/users/`,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                failOnStatusCode: false,
            }).then((response) => {
                // May return 200 or 403 depending on permissions
                expect([200, 403]).to.include(response.status);

                if (response.status === 200) {
                    expect(response.body).to.be.an("array");
                }
            });
        });
    });
});
