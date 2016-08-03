'use strict';

var assert = require('assert');
var async = require('async');
var log = require('loglevel');
var auth = require('./lib/auth.js');
var helpers = require('./lib/helpers.js');

function Meeseeks(opts) {
  var _this = this;
  opts = opts || {};
  this.opts = {};
  this.opts.name = opts.name || ('meeseeks:' + Math.random());
  this.opts.jwtSigningToken = opts.jwtSigningToken || '';
  this.opts.logLevel = opts.logLevel || helpers.logLevelFromEnv();
  this.log = log.getLogger(this.opts.name);
  this.log.setLogLevel(this.opts.logLevel);
  Object.defineProperty(this, 'handler', {
    value: function(event, context) {
      this.debug('Event Received', JSON.stringify(event, null, 2));
      var meeseeksContext = _this.createContextFromEvent(event);
      var origin = { event: event, context: context };
      _this._invoke(meeseeksContext, origin);
    },
  });
  this._listeners = {};
  this.log.info('Handler "' + this.opts.name + '" Ready');
}

Meeseeks.prototype.define = function(name, definition) {
  if (this._listeners[name]) throw new Error('Meeseeks: Listener already exists for "' + name + '"');
  this.log.info('Defined "' + name + '"');
  this._listeners[name] = definition;
};

Meeseeks.prototype.createContextFromEvent = function(event) {
  var authorization = auth.verify(this.opts.jwtSigningToken, event.token);
  var meeseeksContext = {
    name: event.method,
    body: event.body || {},
    authorization: authorization,
    identity: authorization.sub,
    received: helpers.now(),
  };
  helpers.deepFreeze(meeseeksContext);
  return meeseeksContext;
};

Meeseeks.prototype._invoke = function(meeseeksContext, origin) {
  var _this = this;
  var listener = this._listeners[meeseeksContext.name];
  if (!listener) {
    origin.context.fail(new Error('invalid target "' + meeseeksContext.name + '"'));
    this.log.warn('No listener exists for "' + meeseeksContext.name + '"');
    return;
  }
  var done = this._callback.bind(this, meeseeksContext, origin.context);
  this.log.info('Invoking "' + meeseeksContext.name + '"');
  this.log.debug('Context', JSON.stringify(meeseeksContext, null, 2));
  if (typeof listener === 'function') {
    listener(meeseeksContext, done);
  }
  else {
    async.waterfall([
      function validate(next) {
        if (listener.validation) {
          _this.log.debug('Validating');
          listener.validation(meeseeksContext, function(err) {
            if (err) return next(err);
            next(null);
          });
        }
        else {
          next(null);
        }
      },
      function act(next) {
        if (listener.action) {
          _this.log.debug('Action');
          listener.action(meeseeksContext, next);
        }
        else {
          next(null);
        }
      },
      function respond() { // act args are designed to be dynamic
        if (listener.response) {
          _this.log.debug('Transforming response');
          listener.response.apply(listener, arguments);
        }
        else {
          arguments[arguments.length - 1](null); // next
        }
      },
    ], done);
  }
};

Meeseeks.prototype._callback = function(meeseeksContext, context, err, res) {
  if (err) {
    this.log.warn('Completed "' + meeseeksContext.name + '" with error');
    this.log.debug('Result: ', JSON.stringify(err, null, 2));
  }
  else {
    this.log.info('Completed "' + meeseeksContext.name + '"');
    this.log.debug('Result: ', JSON.stringify(res, null, 2));
  }
  context.done(err, res);
};

module.exports = Meeseeks;
