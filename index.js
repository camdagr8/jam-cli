#!/usr/bin/env node

'use strict';


const chalk 		= require('chalk');
const fs 			= require('fs');
const log 			= console.log;
const path 			= require('path');
const program 		= require('commander');
const slugify 		= require('slugify');

program.version('1.0.0');


const validType = (type) => {
	if (!type) { return false; }
	let types = ['atom', 'molecule', 'organism'];
	type = String(type).toLowerCase();
	return (types.indexOf(type) > -1);
};

/**
 *
 * create <type> --name <name> --category [category]
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 */
program.command('create <type>')
	.description('Creates the specified material <type> atom | molecule | organism')
	.option('-c, --category [category]', 'The category to place the new material in')
	.option('-d, --dna [dna]', 'The DNA ID')
	.option('-n, --name <name>', 'The name of the material')
	.action((cmd, opt) => {

		let cat = (opt.hasOwnProperty('category')) ? opt.category : null;
		let dna = (opt.hasOwnProperty('dna')) ? opt.dna : null;
		let name = (opt.hasOwnProperty('name')) ? opt.name : 'new-material';

		const base = path.basename(process.cwd());

		log(chalk.yellow('creating:'), cmd, name, chalk.yellow('in'), base);

		log(chalk.green('created:'), cmd, name);
	});

program.parse(process.argv);
