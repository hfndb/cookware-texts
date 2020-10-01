# cookware-texts

_cookware-texts_ is a modular toolkit, a next step after [cookware-headless-ice](https://github.com/hfndb/cookware-headless-ice). **Still being developed**.


## Prerequisites

Installation of prerequisites:
```
apt-get install git gitk mplayer nodejs nodejs-doc npm whois
```

In case you experience problems while installing global packages, look [here](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).


## Installation

```
$ cd /absolute/path/to/cookware-texts
$ npm install
$ npm build
```

Add an alias in your ~/.bashrc, for your convenience:

```
alias cookware-texts=/opt/cookware-texts/bin/starter.sh
```


## Configuration

All configuration options are set in the file config.json. For your convenience, this file is backuped to config-org.json. In case you mess up, you can always revert.

As a **general rule** all directory paths in config.json are relative to the project root.

Config.json in a project directory **overrides** the default program settings, as configured in default-config.js in the 'src' directory.
Apart from configuration options for cookware-headless-ice, config.json contains sections which are described in module docs.


## Usage

+ Read new entries in web server log:

	```
	$ cookware-texts -p
	```

+ Run other tool:

	```
	$ cookware-texts <command>
	```

Detailed usage information [here](./docs/usage.md).

## License

CC BY-NC 4.0, see [license](./LICENSE.md).


## Integrated packages

Described in module docs.


[comment]: <> (No comments here)
