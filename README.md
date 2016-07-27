# Testing @ Syncano

### End to End testing of React applications with Nightwatch part I

#### Why we joined the dark side
In the mid of 2015 our front-end team took the challenge of rebuilding the entire Dashboard from scratch. In a matter of three months we built a new version using the React library. Since it was hard to keep up with writing unit tests at such demanding pace we decided that end-to-end (e2e) will be our go-to test strategy.

The most obvious choice for e2e tests is Selenium but there are many language bindings and frameworks to choose from. Eventually we settled on Nightwatch.js for a number of reasons:

* It has built-in support for Page Object Pattern methodology
* It’s written in Node.js so it nicely integrates with the front-end stack
* It has built-in test runner. You can run your tests in parallel, sequentially, with different environments etc.
* It was easy to integrate with CircleCI which we currently use as our continuous integration tool
* It’s handling taking screenshots on errors and failures

In this post I’ll show you how to setup a simple Nightwatch project with using the Page Object Pattern. The code to this tutorial is on [Github](https://github.com/Syncano/syncano-testing-examples) so you can grab the fully working example from there or follow the tutorial steps to make it from scratch.

#### Installation
First thing you need to do is to install Node.js if you don’t yet have it. You can find the installation instructions on the Node.js project page. Once you have node installed, you can take advantage of it’s package manager called `npm`.

Go to your terminal, create an empty repository and cd into it. Next, type `npm init`. You can skip the steps of initialising `package.json` file by pressing enter several times and typing ‘yes’ at the end.

Once you have a package.json file, while in the same directory, type `npm install nightwatch --save-dev`. This will install the latest version of nightwatch into the `node_modules` directory inside your project and save it in your `package.json` file as a development dependency.

Next, in order to be able to run the tests, we need to download the Selenium standalone server. We could do this manually and take it from the projects’ website but lets use npm to handle this:

- Type `npm install selenium-download --save-dev`
- Create `selenium-download.js` file in the root directory of your project
- Paste this code into the `selenium-download.js` file:
```javascript
	var selenium = require('selenium-download');
	selenium.ensure('./bin', function(error) {
	  if (error) {
	    return callback(error);
	}
	});
```
- Modify your package.json file by adding a `scripts` property with `"e2e-setup": "node_modules/selenium-standalone/bin/selenium-standalone install"”` line. The package.json should look more or less like this:
```javascript
{
  "name": "syncano-testing-examples",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "e2e-setup": "node_modules/selenium-standalone/bin/selenium-standalone install"
  },
  "author": "",
  "license": "ISC",
	"devDependencies": {
    "babel-cli": "^6.11.4",
    "babel-core": "^6.11.4",
    "babel-loader": "6.2.4",
    "babel-plugin-add-module-exports": "^0.2.1",
    "babel-preset-es2015": "^6.9.0",
    "nightwatch": "^0.9.5",
    "selenium-standalone": "5.1.1"
  }
}

```

Now running  `npm e2e-setup` will download the latest version of selenium server and chromedriver (which will be needed for running tests in Chrome browser)

#### Configuration

Nightwatch relies on `nightwatch.json` as the configuration file for the test runs. It should be placed in projects root directory. It specifies various configuration settings like test environments (browsers, resolutions), test file paths and selenium-specific settings. This is how the configuration file can look like:

```javascript
{
  "src_folders": ["tests"],
  "output_folder": "reports",
  "custom_commands_path": "",
  "custom_assertions_path": "",
  "page_objects_path": "pages",
  "globals_path": "globals",

  "selenium": {
    "start_process": true,
    "server_path": "./node_modules/selenium-standalone/.selenium/selenium-server/2.53.0-server.jar",
    "log_path": "./reports",
    "host": "127.0.0.1",
    "port": 4444,
    "cli_args": {
      "webdriver.chrome.driver": "./node_modules/selenium-standalone/.selenium/chromedriver/2.21-x64-chromedriver"
    }
  },
  "test_settings": {
    "default": {
      "launch_url": "https://dashboard.syncano.io",
      "selenium_port": 4444,
      "selenium_host": "localhost",
      "silent": true,
      "desiredCapabilities": {
        "browserName": "chrome",
        "javascriptEnabled": true,
        "acceptSslCerts": true
      }
    }
  }
}
```

I'll go through the important parts of the `nightwatch.json` file:

* `src_folders` - an array that contains the folders that your tests reside in
* `output_folder` - folder where the test artifacts (XML reports, selenium log and screenshots) are being stored
* `page_objects_path` - a folder where your Page Objects will be defined
* `globals_path` - path to a file which stores global variables
* `selenium` - selenium specific settings. In our case it's important to have the `start_process` set to `true` so that selenium server starts automatically. Also the `server_path` and `webdriver.chrome.driver` paths should have proper folder specified.

`test_settings` is an object where you specify the test environments. The important bit in the `default` environment is the `desiredCapabilities` object where we specify the `chrome` as the `browserName` so that Nightwatch will run the test against it.

#### Adding ECMAScript 6 to nightwatch

We are writing the Syncano Dashboard according to the ECMAScript 6 specs and we wanted to do the same for Nightwatch. In order to be able to do that, you'll have to add a `nightwatch.conf.js` file to the root of your project. The file should contain these couple of lines:

```javascript
require('babel-core/register');

module.exports = require('./nightwatch.json');
```
Bang! You can now write your tests in ECMAS 6

> Edit: things have changed since I've written this article. Now you'll need to
> add es2015 preset in .babelrc config file and add `add-module-exports` plugin
> and do `npm i babel-plugin-add-module-exports babel-preset-es2015 --save-dev`.
> Everything should work after that. See the syncano-testing-examples repo for
> details

#### The Tests

Before we get to the test code there are only two things left to do:

* Go to [Syncano Dashboard]("https://dashboard.syncano.io/#/signup") and sign up to our service (if you suspect that this article is an elaborate plot to make you sign up, then you are right)
* Go to your terminal and paste these two lines (where "your_email" and "your_password" will be the credentials that you just used when signing up):
	* `export EMAIL="your_email"`
	* `export PASSWORD="your_password"`

(If you are on a windows machine than the command will be `SET` instead of `export`)

##### Test if a user can log in to the application
In the root of your project create a `tests` directory. Create a testLogin.js file and paste there this code:

```javascript
export default {
  'User Logs in': (client) => {
    const loginPage = client.page.loginPage();
    const instancesPage = client.page.instancesPage();

    loginPage
      .navigate()
      .login(process.env.EMAIL, process.env.PASSWORD);

    instancesPage.expect.element('@instancesListDescription').text.to.contain('Your first instance.');

    client.end();
  }
};
```

This is a test that is checking if a user is able to log in to the application. As you can see the code is simple:

* User navigates to the log in page
* User logs in using his credentials (I'm using node `process.env` method to get the environment variables we exported in the previous step)
* The tests asserts that 'Your first instance.' text is visible on the page.
* `client.end()` method ends the browser session

The way to achieve this sort of clarity within a test, where the business logic is presented clearly and test can be easily understood even by non tech-saavy people is by introducing the Page Object pattern. `loginPage` and `instancesPage` objects contain all the methods and ui elements that are needed to make interactions within that page.

##### Log in Page Object
Page Objects files should be created in a `pages` folder. Create one in the root of your project. Next, create a `loginPage.js` file that will contain this code:

```javascript
const loginCommands = {
  login(email, pass) {
    return this
      .waitForElementVisible('@emailInput')
      .setValue('@emailInput', email)
      .setValue('@passInput', pass)
      .waitForElementVisible('@loginButton')
      .click('@loginButton')
  }
};

export default {
  url: 'https://dashboard.syncano.io/#/login',
  commands: [loginCommands],
  elements: {
    emailInput: {
      selector: 'input[type=text]'
    },
    passInput: {
      selector: 'input[name=password]'
    },
    loginButton: {
      selector: 'button[type=submit]'
    }
  }
};
```

The file contains an object loginCommands that stores a `login` method. The `login` method waits for an email input element to be visible, sets the values of email and password fields, waits for login button to be visible and finally clicks the button. We actually could write these steps in the "User Logs in" test. If we are planning to create a bigger test suite though then it makes sense to encapsulate that logic into a single method that can be reused in multiple test scenarios.

Apart from the `loginCommands` there's a second object defined below which is  actually the Page Object that we instantiate in the `testLogin.js` file with this line:

`const loginPage = client.page.loginPage();`

as you can see the Page Object contains:

* the pages url (when `navigate()` method in the test is called it uses this url as a parameter)
* `commands` property where we pass the `loginCommands` object defined above, so that the `login` method can be used within this page's context
* `elements` property where the actual selectors for making interactions with the web page are stored

As you've probably noticed there's an `@` prefix used before the locators both inside the test and in the loginCommands object. This tells Nightwatch that it should refer to the key declared in the `elements` property inside the Page Object.

##### Instances Page Object

Now let's create a second file in the pages folder that will be named `instancesPage.js`. It should contain the following code:

```javascript
export default {
  elements: {
    instancesListDescription: {
      selector: '//div[@class="description-field col-flex-1"]',
      locateStrategy: 'xpath'
    }
  }
};
```

It's a lot simpler than the loginPage file since it only has a single `instancesListDescription` element. What is interesting about this element is that it's not a CSS selector as the elements in the loginPage.js file but an XPath selector. You can use XPath selectors by adding a `locateStrategy: xpath` property to the desired element.

The `instancesListDescription` element is used in the 11 line of the loginPage.js file to assert if a login was successful.

```javascript
    instancesPage.expect.element('@instancesListDescription').to.be.visible;
```
As you can see the assertion is verbose and readable because Nightwatch relies on [Chai Expect](http://chaijs.com/api/bdd/) library which allows for use of these BDD-style assertions.

##### Global configuration

There's one last piece of the puzzle missing in order to be able to run the tests. Nightwatch commands like `waitForElementVisible()` or the assertions require the timeout parameter to be passed along the element, so that the test throws an error when that timeout limit is reached. So normally the `waitForElementVisible()` method would look like this:

`waitForElementVisible('@anElement', 3000)`

similarly the assertion would also have to have the timeout specified:

`instancesPage.expect.element('@instancesListDescription').to.be.visible.after(3000);`

Where `3000` is the amount of milliseconds after which the test throws an `element not visible` exception. Fortunately we can move that value outside the test so that the code is cleaner. In order to do that create a globals.js file in the root of your project and paste there this code:

```javascript
export default {
  waitForConditionTimeout: 10000,
};
```

Now all the Nightwatch methods that require a timeout will have this global 10 second timeout specified as default. You can still define a special timeout for single calls if needed.

##### Running the test

That's it! The only thing left to do is to run the test. In the terminal, go to your projects' root directory (where the nightwatch.json file is in) and run this command:

`nightwatch`

With a bit of luck you should see a console output similar to this one:

```
Starting selenium server... started - PID:  13085

[Test Login] Test Suite
=======================

Running:  User Logs in
 ✔ Element <input[type=text]> was visible after 87 milliseconds.
 ✔ Element <button[type=submit]> was visible after 43 milliseconds.
 ✔ Expected element <//div[@class="description-field col-flex-1"]> text to contain: "Your first instance." - condition was met in 2474ms

OK. 3 assertions passed. (10.437s)
```

Well done! You've run your first Nightwatch test.

### Summary
In this article you've learned how to:

* Install and configure Nightwatch.js and it's dependencies
* Create an end to end test in the Page Object Pattern methodology
* Use the globals.js file

This just the beginning in terms of what can be achieved with Nightwatch. In the following posts I'll be showing you how to:

* Use `before()` and `after()` hooks in your tests
* Extend Nightwatch with custom commands
* Add your tests to continuous integration tools like CircleCI
* Use cool XPath selectors that will save you development time

If you have any questions or just want to say hi, drop me a line at support@syncano.com
