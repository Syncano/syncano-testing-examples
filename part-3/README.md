# Testing React apps with Nightwatch - Data Driven Testing at Syncano

This is the third part of the “End-to-End Testing of React Apps with Nightwatch” series.

In the [previous posts](https://www.syncano.io/blog/end-to-end-testing-of-react-apps-with-nightwatch-part-2/), we've talked about Nightwatch and how to:

- install and configure Nightwatch.js and it's dependencies
- create an end-to-end test in the Page Object Pattern methodology
- use the globals.js file
- use before() and after() hooks in your tests
- expand the functions of Nightwatch with custom commands


## In this part, I'll focus on creating tools for data-driven testing.

What is data-driven testing? Let's check Wikipedia for a definition of it.

> Data-driven testing is the creation of test scripts to run together with their related data sets in a framework. The framework provides re-usable test logic to reduce maintenance and improve test coverage. Input and result (test criteria) data values can be stored in one or more central data sources or databases, the actual format and organization can be implementation specific.

In general, this is exactly what we'll try to achieve.

_Why?_ you may ask.

While we expanded our tests in `Syncano`, we had to deal with race conditions, `Nightwatch` running tests in the order of folder/file names, and general issues with components dependencies.

To solve these, and many other problems, our decision was to create accounts/Instances and components of our Dashboard before tests even start. This is how our tool was born.

In this post, I'll show you a simplified version of our approach to data-driven testing.

I'll cover:

- creating a JavaScript tool for data-driven testing
- using this tool with Nightwatch tests
- running tests with our tool

>This post builds upon the previous part of the series, which can be found here: [End-to-End Testing of React Apps with Nightwatch - Part 2](https://www.syncano.io/blog/end-to-end-testing-of-react-apps-with-nightwatch-part-2/). You don't have to go through the first two parts, but I'll be building on the code that was written there. The code can be found in [syncano-testing-examples](https://github.com/Syncano/syncano-testing-examples/), on the **part-one** and **part-two** branches.

>Finished code for this part of the Nightwatch tutorial series can be found in the **part-three** branch.

## Creating javascript tool for data driven testing

Before we start we'll need to modify `package.json` a bit by adding `syncano` as a dependency.

```javascript
[...]
"devDependencies": {
  [...]
  "syncano": "1.0.23"
}
```

This will let us use a `Syncano` package to connect to the Syncano Dashboard, create a test Instance, and feed it with data.

Because we use the API in Syncano for all the operations, and we have JavaScript libraries, we can easily use them in our tests!

The overall plan of how our tool will work is:

- connect to Syncano account
- create test Instance in our account
- create test script in our Instance
- cave our test Instance information in a js file
- use our tool in the tests
- perform a cleanup on our account after tests

Let's get to work! We'll start by creating a new folder named `scripts`, where we will add all the files to keep the repo organized.

First, I'll show you how to create a simple connection script to a `Syncano` account, which will enable us to later feed our account with data.

Let's create a file named `createConnection.js` and paste this code in there:

```javascript
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
    .catch((error) => console.error('Connection', error.message));
}

export default createConnection;
```

Right now we have a function that will connect us with Syncano, get connection object, and return it.

Also, we are using our exported `NIGHTWATCH_EMAIL` and `NIGHTWATCH_PASSWORD`; this way, the script will connect to your account (an explanation of how the export works is in [part one](https://www.syncano.io/blog/testing-syncano/) of this series). In our code, we simply use the `Syncano` JavaScript library to connect to our account, and return the connection object that we will assign to the `user` variable.

> I won't focus too much on explaining JavaScript and our Syncano library. If you need more info, check them out at [docs](http://docs.syncano.io/v0.1.1/docs/).

But we need to use it, so now we will create the main part of the whole `test data creation` script.

So, the next step is to create a `createTestData.js` file in the `scripts` folder. This will be our main script that will call other JavaScript files and execute them.

Let's source our newly created connection in it.

```javascript
import createConnection from './createConnection';

createConnection()
  .then((user) => console.log(user.connection))
  .catch((error) => console.log(error));
```

We've just sourced our script! Now, if we run it in the terminal using `babel-node scripts/createTestData.js` we should get a really big output. That's the connection object.

Neat! But we need to expand our script. So, our next step will be creating a test Instance. Don't worry, we will delete it at the end of our tests, so that it won't mess up your account!

Let's create another file -- `createInstances.js` -- with this code in it:

```javascript
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
}

export default createInstance;
```

Since we are connected with the Syncano API using the Syncano JS lib, we can now start creating test data.

As you may see, we don't import the `Syncano` library here, we just pass the user that has the connection object.

After the script succeeds, we assign our Instance name to `user.instanceName`, and set it as the current Instance (this is needed for next script).

Now we need to modify our `createTestData.js` file. Let's do this by changing it to:

```javascript
import createConnection from './createConnection';
import createInstance from './createInstance';

createConnection()
  .then((user) => createInstance(user))
  .then((user) => {
    delete user.connection;
    console.log('Your test setup:\n', user);
  })
  .catch((error) => console.log('Global error:\n', error));
```

We have imported our `createInstance` file, chained it with createConnection, and logged out of our setup at the end of script.

> We also added delete `user.connection` to cut out the connection object in the final output, as it is not useful for us anymore.

Ok, we have our test Instance created. Now it's time to add more data items that'll be needed in further tests.

I'll show you how to add a `script`, which we will later use to create an e2e test in `Nightwatch` by creating a script endpoint. Our script name will be displayed in a dropdown menu.

But, first things first, let's create a file named `createScript.js` and append it with this code:

```javascript
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
```

Now we have a way to create a script. Neat! We are almost done with the data creation!

As before, we append the user with `scriptName`. This way we will be able to save it later to a file.

It's time to modify `createTestData.js` once more. Just replace it with:

```javascript
import createConnection from './createConnection';
import createInstance from './createInstance';
import createScript from './createScript';

createConnection()
  .then((user) => createInstance(user))
  .then((user) => createScript(user))
  .then((user) => {
    delete user.connection;
    console.log('Your test setup:\n', user);
  })
  .catch((error) => console.log('Global error:\n', error));
```

As before, we are just chaining the `createScript` method after `createInstance`.

Great! We have created a simple tool to connect to our account and to create a test `Instance` and a test `script`.

Now we can start testing... But wait! We are missing two very important things. We should somehow save our `instanceName` and `scriptName` so that `Nightwatch` tests can use them. We should also do some cleanup after the tests are finished!

Right now we need to export our variables to a file, so create a `saveVariables.js` file in the `scripts` folder. Append it with:

```javascript
import fs from 'fs';

const saveVariables = (data) => {
  const fileName = 'tempInstance.js';
  const variableFile = fs.createWriteStream(`./${fileName}`);
  const json = JSON.stringify(data);

  variableFile.write('export default ' + json + ';');
  console.log(`\n> File saved as ${fileName}`);
};

export default saveVariables;
```
By simply converting our object to JSON and doing a small trick in `'export default ' + json + ';'` we create a JavaScript file that can be easily imported in our tests!

We also need to append the `createTestData.js` file with the newly created `saveVariables.js` file:

```javascript
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
```

Now we have saved our test data in a file! We will use that file in our tests to get the `script` and `Instance` names.

The only thing we’re missing is a cleanup routine. So let's create a script that will delete our `Instance` after we've used it to run our tests.

We're gonna reuse the `createInstancje.js` file and create a new one with just small modifications, naming it `deleteInstancje.js`;

```javascript
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
```

And let's create a main script that will do the cleanup. Start by naming it `cleanUp.js`.

```javascript
import createConnection from './createConnection';
import deleteInstance from './deleteInstance';
import tempInstance from '../tempInstance';

createConnection()
  .then((user) => deleteInstance(user, tempInstance.instanceName))
  .catch((error) => console.error('Cleanup error:\n', error.message));
```

We created it in a similar fashion as `createTestData.js`. To execute it, just type `babel-node scripts/cleanUp.js` in the terminal.

Everything is set up! Now we only need to write our tests in Nightwatch to see how our tool works with it.

So let's get to the work! :mans_shoe:

## Using the JavaScript tool with Nightwatch tests

> In this section, I'll use custom commands that we use on a daily basis to speed up the work and make the code easier to read. I won't explain how they are working. For more info on that, just check our [github repo](https://github.com/Syncano/syncano-testing-examples).

> I have also slightly altered `nightwatch.json` and `package.json`, so be sure to check those.

Our tool creates a testing Instance and a file with variables for us, but how can we use it? Let’s consider a case where we want to test our Script Endpoint socket in the Dashboard. The tests require that the user has a `script` (component) before he can make a Script Endpoint. How we can solve this issue? We could just create one more test case in our test suite for a Script Endpoint. But... it won't be good idea in the long run. We could easily duplicate code that way, creating unnecessary additional steps that take longer to execute, and we would have to do cleanup after each test suite.

That's why we have created our tool. First create the file `testScriptEndpoint.js` in the tests folder. This is what the test code should look like:

```javascript
import tempInstance from '../tempInstance';

export default {
  before: (client) => {
    const loginPage = client.page.loginPage();

    loginPage
      .navigate()
      .login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);
  },
  after: (client) => client.end(),
  'User adds Script Endpoint socket': (client) => {
    const scriptEndpointsPage = client.page.scriptEndpointsPage();
    const scriptEndpointName = 'testScriptEndpoint';

    scriptEndpointsPage
      .navigate()
      .clickElement('@scriptEndpointZeroStateAddButton')
      .fillInput('@scriptEndpointModalNameInput', scriptEndpointName)
      .selectDropdownValue('@scriptEndpointModalDropdown', tempInstance.scriptName)
      .clickElement('@scriptEndpointModalNextButton')
      .clickElement('@scriptEndpointSummaryCloseButton')
      .waitForElementVisible('@scriptEndpointListItemRow');
  }
}
```

If you followed the previous parts of the series, the code should be familiar to you. But let's take a closer look at these two lines of code:

```javascript
import tempInstance from '../tempInstance';
[...]
.selectDropdownValue('@scriptEndpointModalDropdown', tempInstance.scriptName)
[...]
```

As you can see, we have imported our `tempInstance.js` file that was generated using our tool, and there is where we have our scriptName.

By referring to it by `tempInstance.scriptName`, we can get it's value and use it in our tests, just like in the snippet above. How cool is that!? Now we don't need to create additional test cases before the main test.

Thanks to that, we have just created a Nightwatch test that will navigate to our `script-endpoints` page, fill required fields with data, and then select a script that we created using our tool!

But that's not all, we still need to write all selectors for the Script Endpoint page. So let's create a file named `scriptEndpointsPage.js` in our `tests` folder.

This is how I've created it.


```javascript
import tempInstance from '../tempInstance';

export default {
  url: `https://dashboard.syncano.io/#/instances/${tempInstance.instanceName}/script-endpoints`,
  elements: {
    scriptEndpointZeroStateAddButton: {
      selector: '//*[@data-e2e="zero-state-add-button"]',
      locateStrategy: 'xpath'
    },
    scriptEndpointModalNameInput: {
      selector: 'input[name="name"]'
    },
    scriptEndpointModalDropdown: {
      selector: 'input[data-e2e="script-name"]'
    },
    scriptEndpointUserOption: {
      selector: `[data-e2e=${tempInstance.scriptName}-user-option]`
    },
    scriptEndpointModalNextButton: {
      selector: '[data-e2e="script-dialog-confirm-button"]'
    },
    scriptEndpointSummaryCloseButton: {
      selector: '[data-e2e="script-endpoint-summary-dialog-close-button"]'
    },
    scriptEndpointListItemRow: {
      selector: '[data-e2e="testscriptendpoint-script-socket-row"]'
    }
  }
}
```

Most of this should be familiar to you from `Part 1` and `Part 2` of our series.

But let's focus on both lines below:

```javascript
import tempInstance from '../tempInstance';
[...]
url: `https://dashboard.syncano.io/#/instances/${tempInstance.instanceName}/script-endpoints`,
[...]
```

The first line is the same as in the `scriptEndpointsPage.js` file. We simply `import` the file with data used for the tests. As for the second line, you will see that we are referring to `instanceName` from the `tempInstance.js` file.

Thanks to that, our tests are universal. Every time a new test Instance is created, we don't need to change the URL. Our navigate function, used in the tests, will know where to go.

> You may also see that I have used different locators than the locators used in `Part 1` and `Part 2`. This is due to the fact that we are rewriting some parts of the Dashboard to include data-e2e attributes. This helps us target DOM objects easily and without any issues while performing tests. Locators are written as CSS selectors, omitting the type of tag that they are attached to. DOM can change easily, but with selectors like this we're spending less time on test maintenance. We'll discuss this approach in future blog posts.

## Running the tests

Now we are ready to run tests using our tool and our newly created tests.

To do that, you could use every command one by one, but by doing it that way you can forget some of the steps.

Instead, just copy this to your terminal:

> Don't forget to include your main Instance name in `globals.js`. It is not used in our test, but it is still necessary for others.

```sh
babel-node scripts/createTestData.js \
  && npm test -t tests/testScriptEndpoint.js \
  && babel-node scripts/cleanUp.js
```

Neat! We just created a data-driven test using our tool!

> The way tests are started in the above code is not the best way. We could create a test runner in bash to give us more control over tests, since here only one of the tests will start. But that is information for a future topic in our Nightwatch series.

## Summary

In this article you've learned how to:

- create a JavaScript tool for data-driven testing
- create Nightwatch tests using that tool

That's it for the third part of our "End-to-End Testing of React Apps with Nightwatch" series.
Be sure to follow us for more parts to come!

If you have any questions, or just want to say hi, drop us a line at [support@syncano.com](mailto:support@syncano.com).
