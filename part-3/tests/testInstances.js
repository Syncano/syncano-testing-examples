export default {
  before(client) {
    const loginPage = client.page.loginPage();
		const instancesPage = client.page.instancesPage();

    loginPage
      .navigate()
			.login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);

		instancesPage.waitForElementPresent('@instancesTable');
  },
  after(client) {
    client.end();
  },
  'User clicks Edit Instance dropdown option': (client) => {
		const instancesPage = client.page.instancesPage();
		const socketsPage = client.page.socketsPage();
		const instanceName = client.globals.instanceName;

		instancesPage
      .clickListItemDropdown(instanceName, 'Edit')
			.waitForElementPresent('@instanceDialogEditTitle')
			.waitForElementPresent('@instanceDialogCancelButton')
			.click('@instanceDialogCancelButton')
			.waitForElementPresent('@instancesTable')
  }
};
