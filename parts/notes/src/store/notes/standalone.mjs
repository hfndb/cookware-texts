"use strict";
import { AppConfig } from "../../../generic/config.mjs";

export function initConfig() {
	let cfg = AppConfig.getInstance("notes");
	cfg.options.formats = {
		date: "DD-MM-YYYY",
		datetime: "DD-MM-YYYY HH:mm",
		time: "HH:mm",
		decimalSeparator: ",",
		thousandsSeparator: ".",
	};

	cfg.options.logging = {
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
				dir: "/tmp/notes",
				format: "DD-MM-YYYY HH:mm:ss",
			},
			udf: {
				active: false,
			},
		},
	};
}

let log = {
	debug: function(...pars) {
		console.log(...pars);
	},
	error: function(...pars) {
		console.log(...pars);
	},
	info: function(...pars) {
		console.log(...pars);
	},
	warn: function(...pars) {
		console.log(...pars);
	},
};

export function setupLogger(logger) {
	let cfg = AppConfig.getInstance();
	log = logger;
}
