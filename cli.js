#!/usr/bin/env node

'use strict'
const dns = require('dns')
const readline = require('readline')
const meow = require('meow')
const logUpdate = require('log-update')
const chalk = require('chalk')
const debounce = require('lodash.debounce')
const hasAnsi = require('has-ansi')
const mem = require('mem')
const moment = require('moment')
const wheretogo = require('./')

// limit it to 7 results so not to overwhelm the user
// this also reduces the chance of showing unrelated emojis
const fetch = mem(str => wheretogo(str).then(arr => arr.length ?
  arr.slice(0, 7).map(e => `${chalk.green(moment(e.start).fromNow())}: ${chalk.bold(e.n)} @ ${chalk.yellow(e.v)} ${chalk.dim(`(${e.lat}, ${e.lng})`)}
  ${chalk.dim(JSON.stringify(e.d))}
  Link: ${e.tktU ? `${chalk.underline(e.tktU)}` : 'no Ticket Link available'} - by ${chalk.bold(e.c)}: ${chalk.underline('https://www.facebook.com/' + e.cId)}`).join('\n\n') :
  `No events found`));

const debouncer = debounce(cb => cb(), 200);

const cli = meow(`
	Usage
	  $ wheretogo [text]

	Example
	  $ wheretogo 'bandung'
	  [eventResults]

	Run it without arguments to enter the live search
`);

if (cli.input.length > 0) {
	fetch(cli.input[0]).then(console.log);
	return;
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const pre = `\n${chalk.bold('Where you at?')}\n${chalk.bold.cyan('›')} `;
const query = [];
let prevResult = '';

dns.lookup('a.omgwhen.com', err => {
	if (err && err.code === 'ENOTFOUND') {
		logUpdate(`\n${chalk.bold.red('› ')}${chalk.dim('Please check your internet connection')}\n\n`);
		process.exit(1);
	} else {
		logUpdate(`${pre}${chalk.dim('Relevant events will appear when you start writing')}\n\n`);
	}
});

process.stdin.on('keypress', (ch, key) => {
	key = key || {};

	if (hasAnsi(key.sequence)) {
		return;
	}

	if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
		if (query.length <= 1) {
			logUpdate();
			readline.moveCursor(process.stdout, 0, -1);
		}

		process.exit();
	}

	if (key.name === 'backspace') {
		query.pop();
	} else if (key.name === 'return' || (key.ctrl && key.name === 'u')) {
		query.length = 0;
	} else {
		query.push(ch);
	}

	const queryStr = query.join('');

	logUpdate(`${pre}${chalk.bold(queryStr)}\n${prevResult}\n`);

	if (query.length <= 1) {
		prevResult = '';
		logUpdate(`${pre}${chalk.bold(queryStr)}\n\n`);
		return;
	}

	debouncer(() => {
		fetch(queryStr).then(events => {
			if (query.length <= 1) {
				return;
			}

			prevResult = events;
			logUpdate(`${pre}${chalk.bold(query.join(''))}\n${events}\n`);
		});
	});
});
