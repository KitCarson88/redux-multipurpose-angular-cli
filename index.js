#!/usr/bin/env node
const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const path = require('path');
const args = process.argv.slice(2);
const argv = require('minimist')(args);
const {Plop, run} = require('plop');

function start()
{
  clear();

  console.log(chalk.green(figlet.textSync('Multipurpose', { horizontalLayout: 'full' })));
  console.log(chalk.white(figlet.textSync('Redux', { horizontalLayout: 'full' })));
  console.log(chalk.red(figlet.textSync('Cli', { horizontalLayout: 'full' })));

  Plop.launch({
    cwd: argv.cwd,
    // In order for `plop` to always pick up the `plopfile.js` despite the CWD, you must use `__dirname`
    configPath: path.join(__dirname, 'plopfile.js'),
    require: argv.require,
    completion: argv.completion
  // This will merge the `plop` argv and the generator argv.
  // This means that you don't need to use `--` anymore
  }, run);
}

start();