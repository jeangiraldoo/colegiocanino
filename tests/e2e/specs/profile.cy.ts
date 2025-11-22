import { TEST_DATA } from "./_test_data";
import { login } from "./_utils";

const NEW_USER_PROFILE_DATA = [{ name: "nuevousuario" }, { name: "jeanpi" }];

function update_user_profile(new_name) {
	cy.visit("/portal-cliente/perfil");
	cy.contains("button", "Editar Perfil").click();
	cy.get('input[name="first_name"]').clear().type(new_name);
	cy.contains("button", "Guardar Cambios").click();
}

function test_user_on_new_profile_data(user) {
	NEW_USER_PROFILE_DATA.forEach((newData) => {
		it(`should update profile name to ${newData.name} and reset`, () => {
			update_user_profile(newData.name);
			cy.get('input[name="first_name"]').should("have.value", newData.name);

			update_user_profile(user.name);
			cy.get('input[name="first_name"]').should("have.value", user.name);
		});
	});
}

describe("Updating profile", () => {
	TEST_DATA.forEach((user) => {
		describe(`Profile modification for ${user.username}`, () => {
			beforeEach(() => {
				login(user);
			});
			test_user_on_new_profile_data(user);
		});
	});
});
