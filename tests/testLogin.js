import utils from '../../utils';

export default {
  tags: ['administrators'],
  before: (client) => {
    client.pause(100);
  },
  after: (client) => {
    client.end();
  },
  'User Logs in': (client) => {
    const loginPage = client.page.loginPage();

    loginPage
      .navigate()
      .login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);
  }
};
