
/*
    E2E Tests for Listing Canines
    User Story: Como Director, quiero ver una lista de los caninos matriculados 
    respecto a un filtro (por raza, plan, etc.) para encontrar registros específicos rápidamente.
*/

describe("Director - List Canines", () => {
    beforeEach(() => {
        // Mock the API response for canines to ensure consistent test data
        cy.intercept("GET", "/api/canines/", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "Buddy",
                    breed: "Golden Retriever",
                    age: 3,
                    size: "big",
                    photo: null,
                    creation_date: "2023-01-01T10:00:00Z",
                    status: true,
                    client: 101,
                    client_name: "John Doe"
                },
                {
                    id: 2,
                    name: "Max",
                    breed: "Beagle",
                    age: 2,
                    size: "medium",
                    photo: null,
                    creation_date: "2023-02-01T10:00:00Z",
                    status: true,
                    client: 102,
                    client_name: "Jane Smith"
                },
                {
                    id: 3,
                    name: "Bella",
                    breed: "Poodle",
                    age: 1,
                    size: "mini",
                    photo: null,
                    creation_date: "2023-03-01T10:00:00Z",
                    status: false,
                    client: 103,
                    client_name: "Alice Johnson"
                },
                {
                    id: 4,
                    name: "Luna",
                    breed: "Golden Retriever",
                    age: 4,
                    size: "big",
                    photo: null,
                    creation_date: "2023-01-15T10:00:00Z",
                    status: true,
                    client: 101,
                    client_name: "John Doe"
                }
            ]
        }).as("getCanines");

        // Simulate authentication (Bypass real login)
        cy.window().then((win) => {
            win.localStorage.setItem("access_token", "mock-token-for-e2e");
            win.localStorage.setItem("user_role", "DIRECTOR");
            win.localStorage.setItem("user_type", "internal");
        });

        // Visit the page where list canines is displayed
        cy.visit("/internal-users/listar-caninos");

        // Wait for the data to load
        cy.wait("@getCanines");
    });

    it("displays the list of canines with correct information", () => {
        // Verify the table headers exist
        cy.contains("th", "Nombre").should("be.visible");
        cy.contains("th", "Raza").should("be.visible");
        cy.contains("th", "Edad").should("be.visible");
        cy.contains("th", "Tamaño").should("be.visible");
        cy.contains("th", "Dueño").should("be.visible");
        cy.contains("th", "Estado").should("be.visible");

        // Verify all 4 mocked canines are displayed
        cy.get("tbody tr").should("have.length", 4);

        // Verify specific data for the first row (Buddy)
        cy.contains("Buddy").should("be.visible");
        cy.contains("Golden Retriever").should("be.visible");
        cy.contains("3 años").should("be.visible");

        // Verify status badge
        cy.contains("Activo").should("be.visible");
    });

    it("filters canines by breed", () => {
        // Select 'Golden Retriever' from the breed filter
        cy.get("select").eq(0).select("Golden Retriever"); // Assuming 1st select is Breed

        // Should show 2 Golden Retrievers (Buddy and Luna)
        cy.get("tbody tr").should("have.length", 2);
        cy.contains("Buddy").should("be.visible");
        cy.contains("Luna").should("be.visible");
        cy.contains("Max").should("not.exist"); // Beagle should be hidden
    });

    it("filters canines by size", () => {
        // Select 'Mediano' from the size filter
        cy.get("select").eq(1).select("medium"); // Assuming 2nd select is Size

        // Should show 1 Medium dog (Max)
        cy.get("tbody tr").should("have.length", 1);
        cy.contains("Max").should("be.visible");
        cy.contains("Buddy").should("not.exist");
    });

    it("filters canines by search query (name)", () => {
        // Type 'Bella' into the search input
        cy.get('input[placeholder*="Buscar"]').type("Bella");

        // Should show 1 result (Bella)
        cy.get("tbody tr").should("have.length", 1);
        cy.contains("Bella").should("be.visible");
    });

    it("filters canines by search query (owner)", () => {
        // Type 'Jane' (owner of Max) into the search input
        cy.get('input[placeholder*="Buscar"]').type("Jane");

        // Should show 1 result (Max)
        cy.get("tbody tr").should("have.length", 1);
        cy.contains("Max").should("be.visible");
    });
});
