# Testing @ Syncano

### Testing React apps with Nightwatch - before(), after() hooks and custom commands

This is the second part of End to End testing of React apps with Nightwatch series.
In the [previous post](https://www.syncano.io/blog/testing-syncano/) I've talked about Nightwatch:
- installation
- configuration of nightwatch.json and package.json files
- adding ECMAS 6 to Nightwatch
- Writing the test in Page Object Pattern methodology

In this part I'll focus on couple of tricks that'll let you write better tests.
I'll cover:
- Using `before()` and `after()` hooks in your tests
- Extending Nightwatch with custom commands


This post builds upon the previous part of the series, which can be found here:
[End to End testing of React apps with Nightwatch - Part 1](https://www.syncano.io/blog/testing-syncano/)
You don't have to go through the first part but we'll be basing on the code
that was written there. The code can be found in [syncano-testing-examples](https://github.com/Syncano/syncano-testing-examples/)
in **part-1** folder. Finished code for this part of Nightwatch tutorial series
can be found in **part-2** folder.

Since we moved all the technicalities out of the way, we can get to the good
bits. Lets start with the before() and after() hooks in Nightwatch.

#### Using before() and after() hooks in your tests

`before()` and `after()` hooks are quite self descriptive. They let you write code,
that'll get executed before or after your test suite (tests that are grouped in
one file). Another useful variation are `beforeEach()` and `afterEach()` hooks.
Pieces of code encapsulate in these will get executed before or after **each**
test in a file. Ok, enough with the theory! Lets see those bad boys in action.

> It's also possible to use `before()` and `after()` hooks in a global context.
> In this case they would execute code before and after whole suite is run.
> These hooks should be defined in globals.js file

Remember the login test we've written in the previous part (it's in `tests/testLogin.js`
	file)? It looked like this:

```javascript
export default {
  'User Logs in': (client) => {
    const loginPage = client.page.loginPage();
    const instancesPage = client.page.instancesPage();

    loginPage
      .navigate()
      .login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);

    instancesPage.expect.element('@instancesListDescription').text.to.contain('Your first instance.');

    client.end();
  }
};
```

That's very nice. But what if I wanted to:
- Have couple of tests grouped in a single file (they are executed sequentially)
- The browser to open before all tests from this file and closed after
they are finished
- Login should be performed before all the tests

This is where the hooks come in. Thanks to `before()` and `after()` I can extract
parts of the logic out of the tests and make them more robust. Lets consider a
case, where I'd want a user to login and then view his Instance details. This is
how I'd structure such test:

```javascript
export default {
  before(client) {
    const loginPage = client.page.loginPage();
		const instancesPage = client.page.instancesPage();

    loginPage
      .navigate()
			.login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);

		instancesPage.waitForElementPresent('@instancesTable');
  },
  after(client) {
    client.end();
  },
  'User goes to Instance details  view': (client) => {
		const instancesPage = client.page.instancesPage();
		const socketsPage = client.page.socketsPage();

		instancesPage
      .navigate()
      .click('@instancesTableName')

		socketsPage.waitForElementPresent('instancesDropdown');
  }
};
```
So now the `before()` hook will take care of login steps and `after()` will close
the browser when all tests from this file are done. Simple, right? The only thing
I need to do now is fill in the missing selectors. I'll add `@instancesTable` selector to the
instancesPage, so that it looks like this:

```javascript
export default {
  elements: {
    instancesListDescription: {
      selector: '//div[@class="description-field col-flex-1"]',
      locateStrategy: 'xpath'
    },
    instancesTable: {
      selector: 'div[id=instances]'
    }
  }
};
```

Since it's a css selector, I don't have to pass the `locateStrategy` property
in the instancesTable object because nightwatch is using css as a default
locator strategy.

I'll also need to add `socketsPage.js` file in the `pages` folder and add these
lines:

instancesPage:

```javascript
export default {
  elements: {
    instancesDropdown: {
      selector: '.instances-dropdown'
    }
  }
};
```

That's it! The only thing you need to do now, is to export your email and password
(if you haven't done so) as an environment variables. Open your terminal app
and type these lines:

```sh
export $NIGHTWATCH_EMAIL=YOUR_SYNCANO_EMAIL
export $NIGHTWATCH_PASSWORD=YOUR_SYNCANO_PASSWORD
```

> If you don't want to use environment variables, you can pass your email
> and password as strings directly to loginPage.login() method

### Extending nightwatch with custom commands

Once your test suite gets bigger, you'll notice that there are steps within your
tests that could be abstracted away and reused across your project. This is where
custom commands come in. Thanks to this feature you'll be able to define methods
that are accessible from anywhere within a test suite.

First thing we need to do, is add a folder for the custom commands. You can add
it in the root of the project and name it `commands`. Once it's done, you'll have
to tell nightwatch where the custom commands are. To do this:
- open `nightwatch.json` file
- edit the code in line 4 to look like this:

```javascript
"custom_commands_path": "./commands",
```
Now nightwatch will know where to look for the commands.

Since there are a lot of dropdowns in the Syncano Dashboard, it makes sense to
abstract the logic around them into a custom command. The command will:
- wait for the dropdown element to be visible
- click the dropdown
- wait for the dropdown animation to finish (this helps with the test stability)
- click the dropdown option
- wait for the dropdown to be removed from the DOM

In order to create this command:
- add `clickListItemDropdown.js` file in the commands folder
- paste this code in the `clickListItemDropdown.js` file:

```javascript
// 'listItem' is the item name from the list. Corresponding dropdown menu will be clicked  
// 'dropdoownChoice' can be part of the name of the dropdown option like "Edit" or "Delete"

exports.command = function clickListItemDropdown(listItem, dropdownChoice) {
  const listItemDropdown =
	`//div[text()="${listItem}"]/../../../following-sibling::div//span[@class="synicon-dots-vertical"]`;
  const choice = `//div[contains(text(), "${dropdownChoice}")]`;

  return this
    .useXpath()
    .waitForElementVisible(listItemDropdown)
    .click(listItemDropdown)
    // Waiting for the dropdown click animation to finish
    .waitForElementNotPresent('//span[@class="synicon-dots-vertical"]/preceding-sibling::span/div')
    .click(choice)
    // Waiting for dropdown to be removed from DOM
    .waitForElementNotPresent('//iframe/following-sibling::div[@style]/div');
};
```

Now, since we have the command ready we will want to use it in a test. Create a
`testInstances.js` file in the `tests` folder. We will use the `before()` and
`after()` hooks from the first part of this post. The draft for this test will
look like this:

```javascript

export default {
  before(client) {
    const loginPage = client.page.loginPage();
		const instancesPage = client.page.instancesPage();

    loginPage
      .navigate()
			.login(process.env.NIGHTWATCH_EMAIL, process.env.NIGHTWATCH_PASSWORD);

		instancesPage.waitForElementPresent('@instancesTable');
  },
  after(client) {
    client.end();
  },
  'User clicks Edit Instance dropdown option': (client) => {
		const instancesPage = client.page.instancesPage();
		const socketsPage = client.page.socketsPage();
		const instanceName = client.globals.instanceName;

		instancesPage
      .clickListItemDropdown(instanceName, 'Edit')
			.waitForElementPresent('@instanceDialogEditTitle')
			.waitForElementPresent('@instanceDialogCancelButton')
			.click('@instanceDialogCancelButton')
			.waitForElementPresent('@instancesTable')
  }
};
```

The test will:
- log in the user in the `before()` step
- Click the Instance dropdown
- Click 'Edit' option from the dropdown
- Wait for the Dialog window to show up
- Click 'Cancel' button
- Wait for the Instances list to show up

What we still need to do is to add the missing selectors in the `pages/instancesPage.js`
file. Copy the code and paste it below the existing selectors (remember about adding
	comma after the last one already present):

```javascript
instanceDialogEditTitle: {
	selector: '//h3[text()="Update an Instance"]',
	locateStrategy: 'xpath'
},
instanceDialogCancelButton: {
	selector: '//button//span[text()="Cancel"]',
	locateStrategy: 'xpath'
}
```

We are also using a global variable within a test. Go to `globals.js` file and
add a new line:

```javascript
instanceName: INSTANCE_NAME
```
where the INSTANCE_NAME would be the name of your Syncano instance.


> Rembember to use npm run e2e-setup before starting tests. You only need to do it once.

Now, since everything is ready, you can run your tests. We want to run only a
single test, so we'll run the suite like this:

```sh
npm test -t tests/testInstances.js
```

That's it for the second part of "Testing React apps with Nightwatch" series. Be sure to follow us for more parts to come!

If you have any questions or just want to say hi, drop me a line at support@syncano.com
