import { TEST_DATA } from "./_test_data";
import { login } from "./_utils";

for (const data of TEST_DATA) {
	describe(`Login as user ${data.username}`, () => {
		it("Should log in succesfully", () => {
			login(data);
		});
	});
}
