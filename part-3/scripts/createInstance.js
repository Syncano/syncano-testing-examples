const createInstance = (user) => {
  const name = 'testInstance' + Date.now();
  const instance = {
    name
  };

  return user.connection.Instance
    .please()
    .create(instance)
    .then(() => {
      user.instanceName = name;
      user.connection.setInstanceName(user.instanceName);
      return user;
    })
    .catch((error) => console.error('Instance error:\n', error.message));
};

export default createInstance;
