"use strict";
import { rm, test, touch } from "../sys.mjs";
import { FileUtils } from "./files.mjs";

export class Lock {
	attempts = 0;
	lockfile = "";
	resolve; // Function to resolve promise
	reject; // Function to reject promise

	/**
	 * @param {string} path Should exist
	 * @param {number} delay Between attempts
	 * @param {number} maxAttempts To lock
	 */
	constructor(path, delay = 10, maxAttempts = 10) {
		this.delay = delay;
		this.lockfile = path + ".lock";
		this.maxAttempts = maxAttempts;
	}

	/**
	 * Lock a file by trying to create a .lock file
	 */
	async lock(path) {
		let instance = this;

		return new Promise(function(resolve, reject) {
			// Enable resolving or rejectin promise from the outside
			instance.resolve = resolve;
			instance.reject = reject;
			instance.attemp2lock();
		});
	}

	/**
	 * Attempt to write a .lockfile
	 */
	attemp2lock() {
		if (test("-f", this.lockfile)) {
			if (this.attempts == this.maxAttempts) this.reject();
			this.attempts++;
			setTimeout(() => {
				this.attemp2lock();
			}, this.delay);
			return;
		} else {
			touch(this.lockfile);
			this.resolve();
		}
	}

	/**
	 * Unlock a file by removing the .lock file
	 */
	unlock(path) {
		if (test("-f", this.lockfile)) rm(this.lockfile);
	}
}
