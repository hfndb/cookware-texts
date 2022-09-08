"use strict";

// File needed for AppConfig in ./generic/config.mjs
let DefaultConfig = {
	version: "0.0.1",
	// -------------------------------------
	// Section: From cookware-headeless-ice
	// -------------------------------------

	// For AppConfig in generic/config.mjs
	env: {
		node_path: [],
	},
	// For Formatter in generic/utils.mjs
	formats: {
		date: "DD-MM-YYYY",
		datetime: "DD-MM-YYYY HH:mm",
		time: "HH:mm",
		decimalSeparator: ",",
		thousandsSeparator: ".",
	},
	// For AppConfig in generic/config.mjs
	javascript: {
		dirs: {
			output: "dist/static/js",
			source: "src",
		},
		removeObsolete: {
			active: true,
		},
	},
	// For Logger in ./generic/log.
	logging: {
		exitOnError: true,
		level: "debug",
		playSoundOn: {
			error: false,
			warning: false,
		},
		transports: {
			console: {
				active: true,
				format: "HH:mm:ss",
			},
			file: {
				active: false,
				dir: "/tmp/cookware-texts",
				format: "DD-MM-YYYY HH:mm:ss",
			},
			udf: {
				active: false,
			},
		},
	},

	// -------------------------------------
	// Section: From cookware-texts
	// -------------------------------------

	// For generic/store/notes/integration.mjs
	domain: {
		description: "Website name",
		domain: "yourdomain.com",
		url: "http://www.yourdomain.com",
		appDir: "q", // added for cookware-texts
	},

	// For files in ./generic/store/notes
	store: {
		notes: {
			dir: "/tmp", // Absolute or relative
			maxRest: {
				current: 10, // Minutes untouched before elegible for merging into 'merged'
			},
			maxSize: {
				current: 1 * 1024 * 1024, // 1 MB
				merged: 6 * 1024 * 1024, // 6 MB
			},
			serverName: "localhost",
		},
	},
};

export { DefaultConfig };
