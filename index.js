#!/usr/bin/env node

'use strict';

/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
const beautify      = require('js-beautify').js_beautify;
const chalk         = require('chalk');
const fs            = require('fs-extra');
const path          = require('path');
const pkg           = require('./package.json');
const program       = require('commander');
const slugify       = require('slugify');
const backup        = require('mongodb-backup');
const restore       = require('mongodb-restore');
const _             = require('underscore');
const moment        = require('moment');
const prompt        = require('prompt');
const request       = require('request');
const decompress    = require('decompress');
const mongo         = require('mongodb').MongoClient;
const assert        = require('assert');
const bcrypt        = require('bcryptjs');
const Promise       = require('Promise').default;

/**
 * -----------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------
 */
const base     = path.resolve(process.cwd());
const log      = console.log;
const types    = ['helper', 'plugin', 'widget'];
const jam      = 'https://github.com/camdagr8/jam/archive/master.zip';

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
const create = (type, opt) => {
    log(chalk.yellow(`[jam] create ${type}`));

    // Validate the <type> value
    if (validType(type) !== true) {
        log(chalk.red(`[jam] create error: <type> must be ${types.join(',')}`));
        return;
    }

    type = String(type).toLowerCase();

    if (type === 'plugin' || type === 'widget') {
        createModule(type, opt);
    }

    if (type === 'helper') {
        createHelper(type, opt);
    }
};

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
    let core    = (opt.hasOwnProperty('core')) ? '_core' : '';
    let name    = (opt.hasOwnProperty('name')) ? opt.name : 'helper-' + Date.now();
    let id      = String(slugify(name)).toLowerCase();

    // Get the module directory
    let mpath;

    if (opt.hasOwnProperty('path')) {
        mpath = opt.path;
    } else {
        mpath = ['', base, 'src/app', core, 'helper', id];
        mpath = mpath.join('/');
        mpath = mpath.replace(/\/\/+/g, '/');
    }

    log(chalk.yellow('  creating helper:'), id, chalk.yellow('in'), mpath);

    // Create the module directory if it doesn't exist
    if (!fs.existsSync(mpath)) {
        fs.mkdirSync(mpath);
    }


    // Create the icon file
    let ifile   = mpath + '/icon.ejs';
    let icon    = `<path d="M10 10 H 90 V 90 H 10 L 10 10" />`;
    fs.writeFileSync(ifile, icon);

    // Create the helper file
    let mod = `module.exports = {
        id: '${id}',

        wysiwyg: "{{${id} param='fubar'}}",

        helper: () => { return 'something'; }
    };`;

    mod = beautify(mod);
    fs.writeFileSync(`${mpath}/mod.js`, mod);

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

    let core    = (opt.hasOwnProperty('core')) ? '_core' : '';
    let name    = (opt.hasOwnProperty('name')) ? opt.name : 'module-' + Date.now();
    let id      = String(slugify(name)).toLowerCase();


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
    if (!fs.existsSync(mpath)) {
        fs.mkdirSync(mpath);
    }

    // Create the mod.js file
    let mod = `module.exports = {
        id: '${id}',

        index: 1000000,

        perms: ['all'],

        sections: ['all'],

        type: '${type}',

        zone: 'widgets'
    };`;
    mod = beautify(mod);

    let mfile = mpath + '/mod.js';
    fs.writeFileSync(mfile, mod);

    // Create the widget.ejs file
    if (type === 'widget') {
        let wfile = mpath + '/widget.ejs';
        let widget = `<!--// Widget ${id} //-->`;

        fs.writeFileSync(wfile, widget);
    }


    log(chalk.green('  created  module:'), id);
};


/**
 *
 * list()
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Outputs a list of installed modules
 */
const list = () => {
    log(chalk.yellow('[jam] list scanning...'));

    let path = base + '/src/app';

    let paths = [];

    paths.push(path + '/_core/helper');
    paths.push(path + '/helper');

    paths.push(path + '/_core/plugin');
    paths.push(path + '/plugin');

    paths.sort();

    let items = [];

    paths.forEach((p) => {

        // Exit if the mod.js file isn't in the module directory
        if (!fs.existsSync(p)) {
            log(chalk.red('[jam] list error: invalid path'), p);
            return;
        }


        // Read the directory
        let dirs = fs.readdirSync(p);
        dirs.forEach((dir) => {
            if (dir.substr(0, 1) === '.') {
                return;
            }

            let obj = {module: dir, path: p + '/' + dir};

            // Require the mod so we can get it's info
            try {
                let mpath  = p + '/' + dir + '/mod.js';
                let mod    = require(mpath);

                if (mod.hasOwnProperty('zone')) {
                    obj.zone = mod.zone;
                }

                if (mod.hasOwnProperty('sections')) {
                    obj.sections = mod.sections;
                }

            } catch (e) { }

            items.push(obj);

        });
    });

    if (items.length > 0) {
        log('');
        log(beautify(JSON.stringify(items)));
    }

    log('');
    log(chalk.green('[jam] list complete!'));
    log('');
};


/**
 *
 * validType(type)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Validates the module type is a helper, plugin, widget.
 * @param type {String} The material type to validate.
 * @returns {Boolean}
 */
const validType = (type) => {
    if (!type) {
        return false;
    }
    type = String(type).toLowerCase();
    return (types.indexOf(type) > -1);
};


/**
 *
 * do_restore
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.1
 *
 * @description Restore a MongoDB from file
 */
const do_restore = (opt, callback) => {
    log(chalk.yellow('[jam] restoring...'));

    let errs = [];
    let reqs = ['db', 'path'];
    reqs.forEach((p) => { if (!opt.hasOwnProperty(p)) { errs.push(p); } });
    if (errs.length > 0) {
        errs.forEach((err) => { log(chalk.red('[jam] backup error:'), `--${err} is a required parameter`); });
        return;
    }

    let f = moment().valueOf();

    let params    = {
        uri       : opt.db,
        root      : opt.path,
        parser    : (opt.hasOwnProperty('type')) ? opt.type : undefined,
        tar       : (opt.hasOwnProperty('zip')) ? `${db}_backup_${f}.tar` : undefined
    };
    _.keys(params).forEach((key) => { if (_.isEmpty(params[key])) { delete params[key]; } });

    if (opt.hasOwnProperty('collections')) {
        let col = opt.collections.replace(/[, ]+/g, ',');
        params['collections'] = col.split(',');
    }

    if (opt.hasOwnProperty('clear')) {
        if (params.hasOwnProperty('collections')) {
            params['dropCollections'] = _.clone(params.collections);
        } else {
            params['drop'] = true;
        }
        delete params.collections;
    }

    params['callback'] = function () {
        if (typeof callback === 'function') { callback(opt); }
        log(chalk.green('[jam] restore complete'), params.root);
    };

    restore(params);
};


/**
 *
 * do_backup
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.1
 *
 * @description Backup a MongoDB to file
 */
const do_backup = (opt, callback) => {
    log(chalk.yellow('[jam] backup...'));

    let errs = [];
    let reqs = ['db', 'path'];
    reqs.forEach((p) => { if (!opt.hasOwnProperty(p)) { errs.push(p); } });
    if (errs.length > 0) {
        errs.forEach((err) => { log(chalk.red('[jam] backup error:'), `--${err} is a required parameter`); });
        return;
    }

    let f = moment().valueOf();

    let params    = {
        uri       : opt.db,
        root      : opt.path,
        parser    : (opt.hasOwnProperty('type')) ? opt.type : undefined,
        tar       : (opt.hasOwnProperty('zip')) ? `${db}_backup_${f}.tar` : undefined
    };
    _.keys(params).forEach((key) => { if (_.isEmpty(params[key])) { delete params[key]; } });

    fs.ensureDirSync(params.root);

    if (opt.hasOwnProperty('collections')) {
        let col = opt.collections.replace(/[, ]+/g, ',');
        params['collections'] = col.split(',');
    }

    params['callback'] = function () {
        log(chalk.green('[jam] backup complete'), params.root);
    };

    backup(params);
};


/**
 *
 * do_migration
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Migrate from one MongoDb to another
 */
const do_migration = (opt) => {
    log(chalk.yellow('[jam] migrating...'));

    let errs = [];
    let reqs = ['from', 'to'];
    reqs.forEach((p) => { if (!opt.hasOwnProperty(p)) { errs.push(p); } });
    if (errs.length > 0) {
        errs.forEach((err) => { log(chalk.red('[jam] migrate error:'), `--${err} is a required parameter`); });
        return;
    }

    fs.ensureDirSync(`${base}/tmp`);

    let f         = moment().valueOf();
    let db        = opt.from.split('/').pop();
    let params    = {
        uri       : opt.from,
        root      : fs.mkdtempSync(`${base}/tmp/migrate_`),
        parser    : (opt.hasOwnProperty('type')) ? opt.type : undefined,
        tar       : (opt.hasOwnProperty('zip')) ? `${db}_${f}.tar` : undefined
    };

    _.keys(params).forEach((key) => { if (_.isEmpty(params[key])) { delete params[key]; } });

    if (opt.hasOwnProperty('collections')) {
        let col = opt.collections.replace(/[, ]+/g, ',');
        params['collections']  = col.split(',');
    }

    let rparams = _.clone(params);
    delete rparams.callback;

    rparams['uri'] = opt.to;

    if (opt.hasOwnProperty('clear')) {
        if (rparams.hasOwnProperty('collections')) {
            rparams['dropCollections'] = _.clone(rparams.collections);
        } else {
            rparams['drop'] = true;
        }
        delete rparams.collections;
    }

    rparams['callback'] = function () {

        fs.removeSync(rparams.root);

        log(chalk.green('[jam] migration complete'), rparams.uri);
    };

    params['callback'] = function () {
        log(chalk.green(`[jam] backup complete ${rparams.uri}`));

        log(chalk.yellow(`[jam] restoring ${rparams.uri}... This may take awhile!`));

        restore(rparams);
    };

    backup(params);

};


/**
 *
 * install
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description The install process
 */
const install = {
    init: (opt) => {
        let contents = [];
        fs.readdirSync(base).forEach((dir) => { if (dir.substr(0, 1) !== '.') { contents.push(dir); } });

        if (contents.length > 0 && !opt.overwrite) {
            log(chalk.red('[jam] install error:'), 'Jam install directory must be empty.');
            log(chalk.red('[jam] install error:'), '`cd` into an empty directory.');
            process.exit();
            return;
        }

        let params = {};
        let keys = ['username', 'password', 'port', 'db'];
        keys.forEach((key) => {
            if (opt.hasOwnProperty(key)) {
                if (!_.isEmpty(opt[key])) {
                    params[key] = opt[key];
                }
            }
        });

        // next -> prompt
        install.prompt(params);
    },

    prompt: (opt) => {

        let schema = {
            properties: {
                warn: {
                    required: true,
                    description: chalk.yellow('Installing will overwrite all Jam data in the specified MongoDB.. are you sure?'),
                    default: 'Y/N',
                    conform: function (answer) {
                        if (answer.toLowerCase() !== 'y') {
                            log(chalk.red('[jam] install exit'));
                            process.exit();
                        } else {
                            return true;
                        }
                    }
                },
                username: {
                    required: true,
                    description: chalk.yellow('Admin username:'),
                    message: 'Username is a required field',
                },
                password: {
                    hidden: true,
                    replace: '*',
                    required: true,
                    description: chalk.yellow('Admin password:'),
                    message: 'Enter the admin password'
                },
                confirm: {
                    hidden: true,
                    replace: '*',
                    required: true,
                    description: chalk.yellow('Confirm password:'),
                    message: 'Passwords do not match',
                    conform: function (input) {
                        let pass = prompt.history('password') || opt['password'];
                        return Boolean(pass === input);
                    }
                },
                db: {
                    required: true,
                    description: chalk.yellow('MongoDB connection string'),
                    message: 'Enter MongoDB connection string'
                },
                port: {
                    description: chalk.yellow('Local server port'),
                    message: 'Enter local server port',
                    default: 9000
                }
            }
        };

        prompt.message = '  > ';
        prompt.delimiter = '';
        prompt.override = opt;
        prompt.start();
        prompt.get(schema, (err, result) => {
            if (err) {
                log(chalk.red('[jam] install error:'), err);
                process.exit();
            } else {
                delete result.warn;
                delete result.confirm;
                delete result.overwrite;

                // next -> start
                install.start(result);
            }
        });
    },

    start: (opt) => {
        log(chalk.yellow('[jam] downloading... this may take awhile.'));

        // Create the tmp directory if it doesn't exist.
        fs.ensureDirSync(`${base}/tmp`);

        // Download the most recent version of jam
        request(jam)
        .pipe(fs.createWriteStream(`${base}/tmp/jam.zip`))
        .on('close', function () {
            log(chalk.yellow('[jam] download complete!'));
            log(chalk.yellow('[jam] unzipping...'));

            // next -> unzip
            setTimeout(install.unzip, 2000, opt);
        });
    },

    unzip: (opt) => {
        decompress(`${base}/tmp/jam.zip`, base, {strip: 1}).then(() => {
            // Delete the tmp directory
            fs.removeSync(`${base}/tmp`);

            // next -> configure
            setTimeout(install.configure, 1000, opt);
        });
    },

    configure: (opt) => {
        log(chalk.yellow('[jam] configuring environment...'));

        let env                = require(`${base}/src/env.json`);
        env['SERVER_URI']      = 'http://localhost:' + opt.port;
        env['PORT']            = Number(opt.port);
        env['DATABASE_URI']    = opt.db;

        // Write the updates to the env.json
        fs.writeFileSync(`${base}/src/env.json`, beautify(JSON.stringify(env)));

        // next -> restore
        setTimeout(install.restore, 2000, opt);
    },

    restore: (opt) => {
        log(chalk.yellow('[jam] loading data...'));

        let params = {
            root: __dirname + '/install',
            uri: opt.db,
            parser: 'json',
            drop: true,
            callback: function () {
                install.update_admin(opt);
            }
        };

        restore(params);
    },

    update_admin: (params) => {
        const opt = params;

        log(chalk.yellow('[jam] connecting to database...'));

        // connect to db
        mongo.connect(opt.db, function (err, db) {
            if (err) {
                log(chalk.red('[jam] install error:'), err.message);
                process.exit();
                return;
            }

            log(chalk.yellow('[jam] connected!'));
            log(chalk.yellow('[jam] creating admin user...'));

            bcrypt.hash(opt.password, 10, function (err, password) {
                if (err) {
                    log(chalk.red('[jam] install error:'), err.message);
                    process.exit();
                    return;
                }

                let collection = db.collection('_User');
                collection.updateOne({_id: "u5fMpRs2SP"}, {
                    $set: {
                        "_hashed_password"    : password,
                        "username"    : opt.username,
                        "email"       : opt.username
                    }
                }, function (err) {
                    if (err) {
                        log(chalk.red('[jam] install error:'), err.message);
                        process.exit();
                        return;
                    }

                    assert.equal(err, null);
                    log(chalk.green('[jam] install complete!'));
                    log('[jam] run `npm test` to launch the dev instance');
                    db.close();
                    process.exit();
                });
            });
        })
    }
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
    .option('-c, --core', '{Boolean} determines if the module is to be created inside the _core application')
    .option('-n, --name [name]', '{String} the name of the module')
    .option('-p, --path [path]', '{String} the absolute path where to create the module')
    .action(create)
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


program.command('backup')
    .description('Backup MongoDB <db> to directory <path>')
    .option('-d, --db <db>', '{String} URI for MongoDB connection')
    .option('-p, --path <path>', '{String} the absolute path where to save the backup')
    .option('-z, --zip [zip]', '{String} pack collections into a <zip>.tar file')
    .option('-t, --type [type]', '{String} the parser type (bson|json)')
    .option('-collections, --collections [collections]', '{Array} which collections to save')
    .action(do_backup)
    .on('--help', () => {
        log('  Examples:');
        log('      $ jam backup --db mongodb://dbuser:dbpassword@dbdomain.mongolab.com:27017/dbname --path "/backup/location" --collections "User,Session"');

        // Extra line
        log('');
    });


program.command('restore')
    .description('Restore MongoDB <db> from directory <path>')
    .option('-d, --db <db>', '{String} URI for MongoDB connection')
    .option('-p, --path <path>', '{String} the absolute path where to save the backup')
    .option('-z, --zip [zip]', '{Boolean} unpack collections from a .tar file')
    .option('-t, --type [type]', '{String} the parser type (bson|json)')
    .option('-collections, --collections [collections]', '{Array} which collections to restore')
    .option('-c, --clear [clear]', '{Boolean} drop collections before restore. If (--collections) is specified, only those collections will be dropped')
    .action(do_restore)
    .on('--help', () => {
        log('  Examples:');
        log('      $ jam restore --db mongodb://dbuser:dbpassword@dbdomain.mongolab.com:27017/dbname --path "/backup/location/dbname" --clear true');

        // Extra line
        log('');
    });


program.command('migrate')
    .description('Migrate from one MongoDb to another')
    .option('-f, --from <db>', '{String} URI for MongoDB connection to restore from')
    .option('-t, --to <db>', '{String} URI for MongoDB connection to restore to')
    .option('-z, --zip [zip]', '{String} Pack collections into a .tar file')
    .option('-collections, --collections [collections]', '{Array} which collections to migrate')
    .option('-c, --clear [clear]', '{Boolean} drop collections before migration. If (--collections) is specified, only those collections will be dropped')
    .action(do_migration)
    .on('--help', () => {
        log('  Examples:');
        log('      $ jam backup --from mongodb://dbuser:dbpassword@dbdomain.mongolab.com:27429/dbname--to mongodb://dbuser:dbpassword@localhost:27017/dbname');
        // Extra line
        log('');
    });


program.command('install')
    .description('Install Jam from Git')
    .option('-u, --username [username]', '{String} the admin username')
    .option('-p, --password [password]', '{String} the admin password')
    .option('-d, --db [database]', '{String} MongoDB connection string')
    .option('-o, --overwrite [overwrite]', '{Boolean} clear the install directory')
    .option('--port [port]', '{Number} local server port (default: 9090)')
    .action(install.init)
    .on('--help', () => {
        log('  Examples:');
        log('      $ jam install -u john@doe.com');
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