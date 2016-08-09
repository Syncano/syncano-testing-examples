import createConnection from './createConnection';
import createInstance from './createInstance';
import createScript from './createScript';
import saveVariables from './saveVariables';

createConnection()
  .then((user) => createInstance(user))
  .then((user) => createScript(user))
  .then((user) => {
    delete user.connection;
    console.log('Your test setup:\n', user);
    saveVariables(user);
  })
  .catch((error) => console.log('Global error:\n', error));
