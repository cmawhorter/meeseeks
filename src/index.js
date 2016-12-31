'use strict';

var assert = require('assert');
var async = require('async');
var Logger = require('./lib/logger.js');
var RequestId = require('./lib/request-id.js');
var auth = require('./lib/auth.js');

function Meeseeks(opts) {
  var _this = this;
  opts = opts || {};
  this.opts = {};
  this.opts.name = opts.name || ('meeseeks:' + Math.random());
  this.opts.jwtSigningToken = opts.jwtSigningToken || '';
  this.opts.skipJwtValidation = opts.skipJwtValidation || (process.env.NODE_ENV === 'development');
  this.opts.logLevel = opts.logLevel || 'debug';
  this.opts.requestIdGenerator = opts.requestIdGenerator || RequestId(opts.requestIdOptions || {});
  this.log = Logger(this.opts);
  Object.defineProperty(this, 'handler', {
    value: function(event, context) {
      var meeseeksContext = _this.createContextFromEvent(event);
      meeseeksContext.log.debug({ event: event }, 'Event Received');
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
  var requestId = event.requestId || this.opts.requestIdGenerator();
  var contextualLogger = this.log.child({ requestId: requestId });
  var authorization = auth.verify(event.authorization, this.opts.jwtSigningToken, this.opts.skipJwtValidation);
  contextualLogger.debug({ auth: authorization }, 'Authorization: ');
  var meeseeksContext = {
    name: event.method,
    body: event.body || {},
    authorization: null, //authorization,
    identity: authorization ? authorization.sub : null,
    received: new Date().toISOString(),
    requestId: requestId,
  };
  Object.defineProperty(meeseeksContext, 'log', {
    enumerable: false,
    value: contextualLogger,
  })
  Object.freeze(meeseeksContext);
  return meeseeksContext;
};

Meeseeks.prototype._invoke = function(meeseeksContext, origin) {
  var _this = this;
  var listener = this._listeners[meeseeksContext.name];
  if (!listener) {
    origin.context.fail(new Error('invalid target "' + meeseeksContext.name + '"'));
    meeseeksContext.log.warn('No listener exists for "' + meeseeksContext.name + '"');
    return;
  }
  var done = this._callback.bind(this, meeseeksContext, origin.context);
  meeseeksContext.log.debug({ context: meeseeksContext }, 'Invoking "' + meeseeksContext.name + '"');
  if (typeof listener === 'function') {
    listener(meeseeksContext, done);
  }
  else {
    async.waterfall([
      function validate(next) {
        if (listener.validation) {
          meeseeksContext.log.debug('Validating');
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
          meeseeksContext.log.debug('Action');
          listener.action(meeseeksContext, next);
        }
        else {
          next(null);
        }
      },
      function respond() { // act args are designed to be dynamic
        if (listener.response) {
          meeseeksContext.log.debug('Transforming response');
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
    meeseeksContext.log.warn({ err: err }, 'Completed "' + meeseeksContext.name + '" with error');
  }
  else {
    meeseeksContext.log.debug({ res: res }, 'Completed "' + meeseeksContext.name + '"');
  }
  context.done(err, res);
};

module.exports = Meeseeks;
