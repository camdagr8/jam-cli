
# Jam Command-Line Interface

## Getting started

Install the Jam-CLI globally:
```sh
npm install -g brkfst-jam-cli
```

You can now use `jam` globally.

All jam commands should be run from your Jam root directory, for instance:
```sh
$ cd "/My Jam/Project"
$ jam --version
```

```sh
Usage: jam [options] [command]

Commands:

    create <type> [options]  Creates the specified module <type>: helper | plugin | widget | theme
    backup [options]         Backup MongoDB <db> to directory <path>
    list                     Lists installed modules and helpers
    restore [options]        Restore MongoDB <db> from directory <path>
    migrate [options]        Migrate from one MongoDb to another
    install [options]        Install Jam from Git

Options:

    -h, --help     output usage information
    -V, --version  output the version number
```
