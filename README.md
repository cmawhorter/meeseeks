# meeseeks

A very basic framework for developing microservices on AWS Lambda.  Support for JWT baked in.

Demo project wip [here](https://github.com/cmawhorter/meeseeks-demo).

## Getting Started

### 1. Create your lambda function project

```sh
mkdir my-microservice
cd my-microservice
echo '{}' > package.json
npm install meeseeks --save
touch index.js
```

index.js
```js
var Meeseeks = require('meeseeks');
var meeseeks = new Meeseeks({
  name: 'my-service',
  // using auth0? see here for more info on where to find your
  // jwt signing token: https://auth0.com/docs/jwt
  // it'll start with "-----BEGIN CERTIFICATE-----"
  jwtSigningToken: process.env.JWT_SIGNING_KEY, 
});

// an alternative signature is available (and recommended). see below.
meeseeks.define('read-time', function(context, callback) {
  callback(null, new Date().toISOString());
});

module.exports.handler = meeseeks.handler;
```

### 2. Deploy it to AWS Lambda

Now, create a zip and upload it to lambda (if you've never done this before, see AWS' documentation).

### 3. Set IAM permissions for the lambda function

This depends on how you'll be invoking your lambda function.  You can use cognito to grant your end-users the ability to invoke your function directly from the browser.

### 4. Make a request

Invoke your lambda function with contents that matches this signature:

```js
{
  "method": "read-time",
  "authorization": "", // <== this is your user's jwt token ("id_token" in auth0)
  "body": {}, // optional body
}
```

The response will be something like `'"2016-08-04T00:13:48.589Z"'`. 

Show what the library does as concisely as possible, developers should be able to figure out **how** your project solves their problem by looking at the code example. Make sure the API you are showing off is obvious, and that your code is short and concise.

## Why

By using auth0 + aws cognito + lambda together, you can easily achieve "serverless" in a pretty painless way.  Microservices are great too.  

This combines all the things so you can throw together microservices in a standard, secure way that is fun to develop and maintain.


## API Reference

### Options

```js
new Meeseeks(options);
```

- `jwtSigningToken` - Required. This is your private jwt signing certificate that will be used to validate jwt tokens.
- `name` - Optional/Good Idea. Must be unique.  Defaults to something random if not provided.
- `skipJwtValidation` - Optional. For development only.  Decodes jwt token, but does not validate it.  Simplifies development so you don't have to keep generating new jwt tokens when they expire. Defaults to `false`, unless NODE_ENV===development.
- `logLevel` - Optional. Defaults to soemthing sane based on NODE_ENV.

## Tests

Tests are non-existent but the code is pretty simple.  Contributions welcome, but they're not a high priority for me right now.

## License

MIT
