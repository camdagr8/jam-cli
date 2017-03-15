#!/usr/bin/env node

'use strict';


const chalk 		= require('chalk');
const fs 			= require('fs');
const log 			= console.log;
const path 			= require('path');
const program 		= require('commander');
const slugify 		= require('slugify');
const base 			= path.basename(process.cwd());



/**
 *
 * err(...)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Formats error messages
 */
const err = (...args) => {
	log('');
	log(' ' , args.join(' '));
	log('');
};


/**
 *
 * validType(type)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Validates the material type is an atom, molecule, or organism.
 * @param type {String} The material type to validate.
 * @returns {Boolean}
 */
const types = ['helper', 'plugin', 'widget'];
const validType = (type) => {
	if (!type) { return false; }
	type = String(type).toLowerCase();
	return (types.indexOf(type) > -1);
};





// Initialize the program
program.version('1.0.0');



/**
 *
 * create <type> --name <name> --category [category]
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 */
program.command('create <type>')
	.description('Creates the specified module <type>: ' + types.join(' | '))
	.option('-c, --core', 'Determines if the module is to be created inside the _core application')
	.option('-n, --name [name]', 'The name of the module')
	.action((type, opt) => {

		// Validate the <type> value
		if (validType(type) !== true) {
			err('error:', 'create <type> must be `' + types.join('`, `') + '`');
			return;
		}


		let core = (opt.hasOwnProperty('core')) ? '/_core' : '';
		let name = (opt.hasOwnProperty('name')) ? opt.name : 'widget-' + Date.now();


		log(chalk.yellow('  creating:'), type, name, chalk.yellow('in'), '/' + base + core);

		// DO SOME MAGIC HERE

		log(chalk.green('  created:'), type, name);
	});

program.parse(process.argv);
