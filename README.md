# Syncano Testing Examples
[![Slack Status](https://img.shields.io/badge/chat-on_slack-blue.svg)](https://www.syncano.io/slack-invite/)

End to End testing of React applications with Nightwatch

## Introduction
In the mid of 2015 our front-end team took the challenge of rebuilding the entire Dashboard from scratch. In a matter of three months we built a new version using the [React](https://github.com/facebook/react) library. Since it was hard to keep up with writing unit tests at such demanding pace we decided that end-to-end (e2e) will be our go-to test strategy.

The most obvious choice for e2e tests is [Selenium](https://github.com/SeleniumHQ/selenium) but there are many language bindings and frameworks to choose from. Eventually we settled on [Nightwatch.js](http://nightwatchjs.org/).

We wanted to share our experience, thus we have created this repository holding all our blog post with code examples.
Every part of it will be organized in separate folder beginning with `part-` and number representing the blog post number in series.

## Requirements
First thing you need to do is to install [Node.js](https://nodejs.org/en/) if you don’t yet have it. You can find the installation instructions on the Node.js project page. Once you have node installed, you can take advantage of it’s package manager called `npm`.

You will also `need` [Chrome Browser](https://www.google.com/chrome/), [Java v8](https://java.com/en/download/) and [Java Development Kit](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) as they are all required for `Selenium` and `Nightwatch` to work properly.

Also be sure to `sign up` to our service by going to [Syncano Dashboard]("https://dashboard.syncano.io/#/signup"), as you will need account in it.

## Installation

Before you will be able to run any tests you should install proper `part` in it's folder. To do so just follow examples below, where `X` is post number/directory.

```sh
$ cd part-X/
$ npm install
$ npm run e2e-setup
```
Now you have installed all dependancies using `npm` and executed `node` script that installs selenium.

## Contact

If you have any questions, or just want to say hi, drop us a line at [support@syncano.com](mailto:support@syncano.com).
