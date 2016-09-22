import createConnection from './createConnection';
import deleteInstance from './deleteInstance';
import tempInstance from '../tempInstance';

createConnection()
  .then((user) => deleteInstance(user, tempInstance.instanceName))
  .catch((error) => console.error('Cleanup error:\n', error.message));
