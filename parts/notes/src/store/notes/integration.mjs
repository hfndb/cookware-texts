"use strict";
import { AppConfig } from "../../config.mjs";
import { Logger } from "../../log.mjs";
import { test, FileUtils, Notes } from "./index.mjs";
import { initConfig, setupLogger } from "./standalone.mjs";

let log;

/**
 * Function to integrate notes into a cookware product;
 * logging and project settings.
 *
 * @param {boolean} standalone For cron jobs, tests and alike
 * @param {boolean} showLocks Log open file locks to console
 */
export function integrate(standalone = false, showLocks = true) {
	let cfg = AppConfig.getInstance();
	if (cfg.options.store.notes) {
		Notes.options = cfg.options.store.notes;
	}
	Notes.vars.serverName = cfg.options.server.name;
	Notes.options.dir = cfg.options.store.notes.dir;
	Notes.options.domain = cfg.options.domain.domain;

	if (standalone) {
		initConfig();
		setupLogger(Logger.getInstance(cfg.options.logging));
	}

	log = Logger.getInstance(cfg.options.logging);

	if (showLocks) isLocked(true);
}

/**
 * Check whether a lockfile is present, for any Topic
 * and if so, if verbose, output a list file to the console.
 *
 * @param {boolean} verbose Log to console
 * @returns {boolean} for some lockfile found
 */
export function isLocked(verbose = false) {
	if (!test("-d", Notes.options.dir)) return false;

	let rt = [];
	let lst = FileUtils.getFileList(Notes.options.dir, { recursive: true });
	for (let i = 0; i < lst.length; i++) {
		if (lst[i].endsWith(".lock")) {
			rt.push(lst[i]);
		}
	}

	if (rt.length > 0 && verbose && log) {
		log.warn("Lockfile(s) found:", rt);
	}

	return rt.length > 0;
}

export { log };
