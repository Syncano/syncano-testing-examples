### Testing React apps with Nightwatch - javascript tool for data driven testing

This is the third part of End to End testing of React apps with Nightwatch series.
In the [previous posts](https://www.syncano.io/blog/testing-syncano/) We've talked about Nightwatch:

- Using `before()` and `after()` hooks in your tests
- Extending Nightwatch with custom commands

In this part I'll focus on script that let us feed dashboard with data, and then use it in example e2e test.
I'll cover:

- Creating javascript tool for data driven testing
- Using javascript tool with nightwatch tests


This post builds upon the previous part of the series, which can be found here [End to End testing of React apps with Nightwatch - Part 2](https://www.syncano.io/blog/testing-syncano/)
You don't have to go through the first two parts but I'll be basing on the code that was written there. The code can be found in [syncano-testing-examples](https://github.com/Syncano/syncano-testing-examples/) on **part-one** and **part-two** branches.
Finished code for this part of Nightwatch tutorial series can be found in **part-three** branch.

#### Creating javascript tool for data driven testing

As mentioned in our title we are going to create tool for data driven testing.
What is data driven testing? Let's check `wikipedia` for it.

> Data-driven testing is the creation of test scripts to run together with their related data sets in a framework. The framework provides re-usable test logic to reduce maintenance and improve test coverage. Input and result (test criteria) data values can be stored in one or more central data sources or databases, the actual format and organisation can be implementation specific.

Yes this is what we will try to achieve, but in a simple matter.
Before we start we will need to modify `package.json` a bit by adding `syncano` dependencies.

```javascript
[...]
"devDependencies": {
  [...]
  "syncano": "1.0.23"
}
```

This will let us use `syncano` package to connect to dashboard, create test instance, and feed it with data.
As we use API in Syncano for all operation and we have javascript libraries we can easily use them in our tests!

Overlay plan how our tool will work is:

- Connect to syncano account
- Create test instance in our account
- Create test script in our instance
- Save our test instance information in js file
- Use our tool in test
- Do a cleanup on our account after tests

Let's get to the work, start by creating new folder named `scripts`, we will add all files there to keep repo organized.

First I'll show you how to create a simple connection script to `syncano` account, this will enable us to later feed our account with data.
Let's create file named `createConnection.js` and paste this into it:

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

Right now we have function that will connect us with Syncano, get connection object and return it.
Also we are using our exported `NIGHTWATCH_EMAIL` and `NIGHTWATCH_PASSWORD`, this way our tool will connect to your account.
In our code we simply use `Syncano` javascript library to connect to our account, and return connection object, that we assign to `user` variable.

> I won't focus too much on explaining javascript and our Syncano library if you need more info check them at [docs](http://docs.syncano.io/v0.1.1/docs/).

But we need to use it, so now we will create main point of whole `test data creation` script.
So next step is to create `createTestData.js` file in `scripts` folder.
This will be our main script that will call other javascript file and execute them.
Let's source our newly created connection in it.

```javascript
import createConnection from './createConnection';

createConnection()
  .then((user) => console.log(user.connection))
  .catch((error) => console.log(error));
```

We just have sourced our script! Now if we run in in console using `babel-node scripts/createTestData.js` we should get really big output, that's our connection object.
Neat! But we need to expand our script. So our next step will be creating test instance, don't worry, we will delete it at the end of tests!

So let's create another file `createInstances.js` and add this to it:

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

Similar to our connection we now what to create test instance using our connection.
As you may see we don't import `Syncano` library here, just pass our user that have connection object.
After script succeeds we assign our instance name to `user.instanceName`, and set it as current instance (needed for next script).

Now we need to modify our `createTestData.js` file, let's do this by changing it to:

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

We have imported our `createInstance` file, chained it with createConnection and logged out our setup at the end of script.

> We also added delete user.connection to cut out connection object in final output, as it is not useful for us anymore.

Right now we have our test instance create, now we can play with it by adding more items.
I'll show you how to add a `script`, we will later use it to create e2e test in `nightwatch` by creating script endpoint.
Our script name will be displayed in dropdown.

But first things first, let's create file named `createScript.js` and appending it with this:

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

Now that we have a way to create Script. Neat! We are almost done with data creation!
As before we append user with `scriptName`. This way we will be able to save it later to file.

It's time to modify `createTestData.js` once more.
Just replace it with:

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

Similar way we just chaining `createScript` after `createInstance`.
Great! We have created simple tool to connect to our account, create test instance and script.
Now we can start testing... but wait we are missing two very important things, we should somehow export our `instanceName` and `scriptName`, and do some cleanup!

Right now we need to export our variables to file, so create `saveVariables.js` file in `scripts` folder. Append it with:

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
By simply converting our object to JSON and doint a small trick in `'export default ' + json + ';'` we create javascript that can be easily imported in our tests!
Now we also need to append `createTestData.js` file with newly created `saveVariables.js` file:

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

Now we have saved our test data in file! We will use that file in a tests to get names of instance and script.

We are missing only a cleanup routine. So let's create a script that will delete our instance after we test on it.
We gonna reuse `createInstancje.js` file and create a new one with just small modifications, naming it `deleteInstancje.js`;

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

And let's create a main script that will do the cleanup, start with naming it `cleanUp.js`.

```javascript
import createConnection from './createConnection';
import deleteInstance from './deleteInstance';
import tempInstance from '../tempInstance';

createConnection()
  .then((user) => deleteInstance(user, tempInstance.instanceName))
  .catch((error) => console.error('Cleanup error:\n', error.message));
```

We created it with similar fashion like `createTestData.js`.
To execute it just type in console `babel-node scripts/cleanUp.js`.

Everything is setup! Now we only need to write our tests in nightwatch to see how our tool works with it.

So let's get to the work! :mans_shoe:

### Using javascript tool with nightwatch tests

> In this section I'll use custom commands that we use on daily basis to speed up work and make code easier to read. I won't explain how they are working. For more info just check github repo.

> I have also slightly altered nightwatch.json and package.json, so be sure to check it.

Our tools creates for us testing instance, file with variables, but how we can use it? Lets consider a case, where we want to test our Script Endpoint socket in dashboard. They require that user created script (component) before creating Script Endpoint. How we can solve this issue? We could just create one more test case in our test suite for Script Endpoint. But... it won't be good idea in long run. We could easily duplicate code that way, create unnecessary more steps that take longer to execute, and we would have to do cleanup after each test suite.

That's why we have created our tool, first create file `testScriptEndpoint.js` in tests folder, then this is how I'd used it in test:

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

Most should be familiar for you, but let's take a look at this two lines of code:

```javascript
import tempInstance from '../tempInstance';
[...]
.selectDropdownValue('@scriptEndpointModalDropdown', tempInstance.scriptName)
[...]
```

As you can see we have imported our `tempInstance.js` file that was generated using tool, there we have our scriptName.
By referring to it by `tempInstance.scriptName` we can get it's value and use it in our test. Like see in snippet above.
How cool is that? Now we don't need to create additional test cases before main test.

Thanks to that we have just created nightwatch test that will navigate to our `script-endpoints` page, fill required fields, with data, and then select from dropdown script that we created using our tool!

But that's not all, we still need to write all selector for script-endpoint page. So let's create file named `scriptEndpointsPage.js` in our `tests` folder.
This is how I'd created it.

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
      selector: '//div[@class="script-dropdown"]/div/div',
      locateStrategy: 'xpath'
    },
    scriptEndpointModalNextButton: {
      selector: '[data-e2e="script-socket-submit-button"]'
    },
    scriptEndpointSummaryCloseButton: {
      selector: '[data-e2e="script-socket-close-dialog"]'
    },
    scriptEndpointListItemRow: {
      selector: '[data-e2e="testscriptendpoint-script-socket-row"]'
    }
  }
}
```

Most of this should be familiar for you from `Part 1` and `Part 2` of our series.
But let's focus on both lines below:

```javascript
import tempInstance from '../tempInstance';
[...]
url: `https://dashboard.syncano.io/#/instances/${tempInstance.instanceName}/script-endpoints`,
[...]
```

First line is same as in test, we simply `import` our file with data used for tests. As for second line, you will see that we are referring to `instanceName` from `tempInstance.js` file.
Thanks to that our tests is universal, every time new test instance will be created, we don't need to change the url. Our navigate function used in tests will know where to go.

> You may also see that I have used different locators that are used in Part I and Part II, this is due to that we are rewriting some parts of dashboard to include data-e2e attribute to easily and without any issue target DOM objects on website while testing them. They are written in css selector, omitting type of tag that they are attached to. DOM can change easliy but with selectors like this we don't need to maintain test that much. But this whole concept is more for future parts.

So now we are ready to run tests using our tool and newly created tests.
To do that, you could use every command one by one, but this way you can forget some of the steps.
Instead of that just copy that to your terminal:

> Don't forget to include your main instance name in globals.js.
> It is not used in our test but still necessary for others.

```sh
babel-node scripts/createTestData.js \
  && npm test tests/testScriptEndpoint.js \
  && babel-node scripts/cleanUp.js
```

Neat! We just created data driven test using our tool!

### Summary

In this article you've learned how to:

- Create javascript tool for data driven testing
- Create nightwatch tests using that tool

That's it for the third part of "Testing React apps with Nightwatch" series.
Be sure to follow us for more parts to come!
If you have any questions or just want to say hi, drop us a line at support@syncano.com
