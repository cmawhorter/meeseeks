#!/usr/bin/env node
'use strict';

process.title = 'meeseeks-cli';

const path        = require('path');
const deepAssign  = require('deep-assign');
const yargs       = require('yargs');

const universalOptions = {
  config: {
    alias: 'c',
    describe: 'Meeseeks project config file'
  }
};

function addCommand(id) {
  let cmd = require(`./command/${id}.js`);
  yargs.command(deepAssign({ builder: universalOptions }, cmd));
}

addCommand('serve');
addCommand('build');
addCommand('update');
addCommand('deploy');

yargs.coerce({
  config: (arg) => require(path.join(process.cwd(), arg))
});

yargs.help('h');
yargs.alias('h', 'help');

yargs.version(() => require(path.join(__dirname, '../package.json')).version);
