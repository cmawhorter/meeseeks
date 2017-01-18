'use strict';

const path          = require('path');
const streamBuffers = require('stream-buffers');
const AWS           = require('aws-sdk');
const archiver      = require('archiver');
const waterfall     = require('../lib/waterfall.js');

exports.command = 'update';
exports.desc    = 'Uploads the contents of dist to lambda as a new function version';
exports.builder = {
  region: {
    describe:       'AWS region to deploy to. Defaults to $AWS_REGION',
    default:        process.env.AWS_REGION,
  }
};

function createCodeBundle(next) {
  let output = new streamBuffers.WritableStreamBuffer();
  let archive = archiver('zip', {
    store: true,
  });
  output.on('close', () => next(null, output.getContents()));
  archive.on('error', () => next(err));
  archive.pipe(output);
  archive.directory(path.join(process.cwd(), 'dist/'));
  archive.finalize();
}

function addCodeParams(params, bufferCode) {
  Object.assign(params, {
    Publish:        true,
    ZipFile:        bufferCode,
  });
}

function addConfigParams(params, config) {
  config = config || {};
  Object.assign(params, {
    Description:    config.description || '',
    Handler:        'index.handler',
    MemorySize:     128,
    Publish:        true,
    Role:           new Error('not implemented'), // role arn
    Runtime:        'nodejs4.3',
    Timeout:        15,
    // VpcConfig: {},
    Environment:    config.environment ? { Variables: config.environment } : null,
  });
}

function createFunction(lambda, FunctionName, bufferCode, next) {
  let params = { FunctionName };
  addConfigParams(params);
  addCodeParams(params, bufferCode);
  lambda.createFunction(params, next);
}

function updateFunction(lambda, FunctionName, bufferCode, next) {
  let configParams = { FunctionName };
  addConfigParams(configParams);
  lambda.updateFunctionConfiguration(configParams, (err, data) => {
    if (err) return next(err);
    let codeParams = { FunctionName };
    addCodeParams(codeParams, bufferCode);
    lambda.updateFunctionCode(codeParams, next);
  });
}

function getExistingFunction(lambda, FunctionName, next) {
  let params = { FunctionName };
  lambda.getFunctionConfiguration(params, (err, data) => next(null, err ? false : data));
}

exports.handler = function(argv) {
  let promise = new Promise((resolve, reject) => {
    let lambda = new AWS.Lambda({ region: argv.region });
    waterfall({
      bundle: (state, next) => {
        createCodeBundle(next);
      },
      exists: (state, next) => {
        getExistingFunction(lambda, functionName, next);
      },
      update: (state, next) => {
        if (state.exists) {
          updateFunction(lambda, functionName, state.bundle, next);
        }
        else {
          createFunction(lambda, functionName, state.bundle, next);
        }
      },
    }, (err, state) => err ? reject(err) : resolve());
  });
  return promise;
};
