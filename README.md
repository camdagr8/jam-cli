
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
$ jam list
```

```sh
Usage: jam [command] [options]

Options:

    -h, --help     output usage information
    -V, --version  output the version number

Commands:

  create [options] <type>  Creates the specified module <type>: helper | plugin | widget
	  Options:

	  -h, --help         output usage information
	  -c, --core         Determines if the module is to be created inside the _core application
	  -n, --name [name]  The name of the module
	  -p, --path [path]  The absolute path where to create the module


  list                     Lists installed modules and helpers


```
