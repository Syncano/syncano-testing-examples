import Syncano from 'syncano';

const createConnection = () => {
  const credentials = {
    email: process.env.EMAIL,
    password: process.env.PASSWORD
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
