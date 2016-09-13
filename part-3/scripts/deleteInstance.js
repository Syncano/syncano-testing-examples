const deleteInstance = (user, instanceName) => {
  const instance = {
    name: instanceName
  };
  return user.connection.Instance
    .please()
    .delete(instance)
    .then(() => console.log(`${instanceName} was deleted.`))
    .catch((error) => console.error('Instance delete error:\n', error.message));
};

export default deleteInstance;
