#!/usr/bin/env node

'use strict';

/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
const beautify 		= require('js-beautify').js_beautify;
const chalk 		= require('chalk');
const fs 			= require('fs');
const path 			= require('path');
const pkg 			= require('./package.json');
const program 		= require('commander');
const slugify 		= require('slugify');



/**
 * -----------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------
 */
const base 			= path.resolve(process.cwd());
const log 			= console.log;
const types 		= ['helper', 'plugin', 'widget'];


/**
 * -----------------------------------------------------------------------------
 * Initialize the CLI
 * -----------------------------------------------------------------------------
 */
program.version(pkg.version);



/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */

/**
 *
 * createHelper(type, opt)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Creates a helper module
 */
const createHelper = (type, opt) => {
	let core 	= (opt.hasOwnProperty('core')) ? '_core' : '';
	let name 	= (opt.hasOwnProperty('name')) ? opt.name : 'helper-' + Date.now();
	let id 		= String(slugify(name)).toLowerCase();

	// Get the module directory
	let mpath = '';
	if (opt.hasOwnProperty('path')) {
		mpath = opt.path;
	} else {
		mpath = ['', base, 'src/app', core, 'helper', id];
		mpath = mpath.join('/');
		mpath = mpath.replace(/\/\/+/g, '/');
	}

	log(chalk.yellow('  creating helper:'), id, chalk.yellow('in'), mpath);

	// Create the module directory if it doesn't exist
	if (!fs.existsSync(mpath)) { fs.mkdirSync(mpath); }



	// Create the icon file
	let ifile = mpath + '/icon.ejs';
	let icon = '<path d="M10 10 H 90 V 90 H 10 L 10 10" />';
	fs.writeFileSync(ifile, icon);

	// Create the helper file
	let mod = `module.exports = {
		id: '${id}',

		wysiwyg: "{{${id} param='fubar'}}",

		helper: () => { return 'something'; }
	};`

	mod = beautify(mod);

	let mfile = mpath + '/mod.js';

	fs.writeFileSync(mfile, mod);


	log(chalk.green('  created  helper:'), id);
};


/**
 *
 * createModule(type, opt)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Creates a plugin or widget module
 */
const createModule = (type, opt) => {

	let core 	= (opt.hasOwnProperty('core')) ? '_core' : '';
	let name 	= (opt.hasOwnProperty('name')) ? opt.name : 'module-' + Date.now();
	let id 		= String(slugify(name)).toLowerCase();


	// Get the module directory
	let mpath = '';
	if (opt.hasOwnProperty('path')) {
		mpath = opt.path;
	} else {
		mpath = ['', base, 'src/app', core, 'plugin', id];
		mpath = mpath.join('/');
		mpath = mpath.replace(/\/\/+/g, '/');
	}


	log(chalk.yellow('  creating module:'), id, chalk.yellow('in'), mpath);

	// Create the module directory if it doesn't exist
	if (!fs.existsSync(mpath)) { fs.mkdirSync(mpath); }

	// Create the mod.js file
	let mod = `module.exports = {
		id: '${id}',

		index: 1000000,

		perms: ['all'],

		sections: ['all'],

		type: '${type}',

		zone: 'widgets'
	};`
	mod = beautify(mod);

	let mfile = mpath + '/mod.js';
	fs.writeFileSync(mfile, mod);

	// Create the widget.ejs file
	if (type === 'widget') {
		let wfile = mpath + '/widget.ejs';
		let widget = `<!--// Widget ${id} //-->`

		fs.writeFileSync(wfile, widget);
	}


	log(chalk.green('  created  module:'), id);
}


const list = () => {

	let path = base + '/src/app';

	let paths = [];

	paths.push(path + '/_core/helper');
	paths.push(path + '/helper');

	paths.push(path + '/_core/plugin');
	paths.push(path + '/plugin');

	paths.sort();

	log(chalk.yellow('scanning...'));

	let items = [];

	paths.forEach((p) => {

		// Exit if the mod.js file isn't in the module directory
		if (!fs.existsSync(p)) { log(chalk.red('  invalid path'), p); return; }


		// Read the directory
		let dirs = fs.readdirSync(p);
			dirs.forEach((dir) => {
				if (dir.substr(0, 1) === '.') { return; }

				let obj = {module: dir, path: p+'/'+dir};

				// Require the mod so we can get it's info
				try {
					let mpath = p + '/' + dir + '/mod.js';
					let mod = require(mpath);

					if (mod.hasOwnProperty('zone')) {
						obj.zone = mod.zone;
					}

					if (mod.hasOwnProperty('sections')) {
						obj.sections = mod.sections;
					}

				} catch(e) { }

				items.push(obj);

			});
	});

	log('');
	log(beautify(JSON.stringify(items)));
	log('');
	log(chalk.green('scanning complete!'));
	log('');
};


/**
 *
 * err(...args)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
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
const validType = (type) => {
	if (!type) { return false; }
	type = String(type).toLowerCase();
	return (types.indexOf(type) > -1);
};



/**
 * -----------------------------------------------------------------------------
 * CLI Commands
 * -----------------------------------------------------------------------------
 */

/**
 *
 * create <type> --name <name> --category [category]
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 */
program.command('create <type>')
	.description('Creates the specified module <type>: ' + types.join(' | '))
	.option('-c, --core', 'Determines if the module is to be created inside the _core application')
	.option('-n, --name [name]', 'The name of the module')
	.option('-p, --path [path]', 'The absolute path where to create the module')
	.action((type, opt) => {

		// Validate the <type> value
		if (validType(type) !== true) {
			err('error:', 'create <type> must be `' + types.join('`, `') + '`');
			return;
		}

		type = String(type).toLowerCase();

		if (type === 'plugin' || type === 'widget') {
			createModule(type, opt);
		}

		if (type === 'helper') {
			createHelper(type, opt);
		}
	})
	.on('--help', () => {
		log('  Examples:');
		log('      $ jam create plugin -c -n "fubar"');
		log('      $ jam create plugin --name "foobar" --path "/My Project/src/plugin/fubar"');

		// Extra line
		log('');
	});



/**
 *
 * list
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Lists installed modules helpers
 */
program.command('list')
	.description('Lists installed modules and helpers')
	.action(list)
	.on('--help', () => {
		log('  Examples:');
		log('      $ jam list');

		// Extra line
		log('');
	});




/**
 * -----------------------------------------------------------------------------
 * DO NOT EDIT BELOW THIS LINE
 * -----------------------------------------------------------------------------
 */
program.parse(process.argv);

// output the help if nothing is passed
if (!process.argv.slice(2).length) {
	program.help();
}
