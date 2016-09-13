const createScript = (user) => {
  const label = 'testScript' + Date.now();
  const scriptObject = {
    label,
    source: 'print "Hellow World!"',
    runtime_name: 'python_library_v5.0'
  };

  return user.connection.Script
    .please()
    .create(scriptObject)
    .then(() => {
      user.scriptName = label;
      return user;
    })
    .catch((error) => console.error('Script error:\n', error.message));
};

export default createScript;
