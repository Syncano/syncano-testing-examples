import tempInstance from '../tempInstance';

export default {
  before: (client) => {
    const loginPage = client.page.loginPage();

    loginPage
      .navigate()
      .login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);
    client.pause(2000);
  },
  after: (client) => client.end(),
  'User adds Script Endpoint socket': (client) => {
    const scriptEndpointsPage = client.page.scriptEndpointsPage();
    const scriptEndpointName = 'testScriptEndpoint';

    scriptEndpointsPage
      .navigate()
      .clickElement('@scriptEndpointZeroStateAddButton')
      .fillInput('@scriptEndpointModalNameInput', scriptEndpointName)
      .fillInput('@scriptEndpointModalDropdown', tempInstance.scriptName)
      .clickElement('@scriptEndpointUserOption')
      .clickElement('@scriptEndpointModalNextButton')
      .clickElement('@scriptEndpointSummaryCloseButton')
      .waitForElementVisible('@scriptEndpointListItemRow');
  }
}
