import Syncano from 'syncano';

const createConnection = () => {
  const credentials = {
    email: process.env.NIGHTWATCH_EMAIL,
    password: process.env.NIGHTWATCH_PASSWORD
  }
  const connection = Syncano()

  return connection
    .Account
    .login(credentials)
    .then((user) => {
      connection.setAccountKey(user.account_key)
      user.connection = connection;
      return user;
    })
    .catch((error) => console.error('Connection error:\n', error.message));
};

export default createConnection;
