"use strict";
import { log, ObjectUtils } from "./index.mjs";

/**
 * For scanning purposes
 *
 * @property {boolean} continue
 * @property {Inquirer|null} parent
 * @property {*[]} results
 * @todo report grouping (hierarchical nesting)
 */
export class Inquirer {
	/**
	 * Overall count of read notes
	 */
	cnt;

	/**
	 * If you want to do something like an SQL Select, to get a result set.
	 */
	results = [];

	// Some constants for aggregates
	CNT = "cnt";
	AVG = "avg";
	MIN = "min";
	MAX = "max";
	SUM = "sum";

	/**
	 * Inquiring continues as long is this property is false.
	 * Read by Reader.
	 * @private
	 */
	isStopped = false;

	/**
	 * @private
	 */
	aggregates = {
		// Counter(s)
		cnt: {},
		// Average(s)
		avg: {},
		// Maximal(s)
		max: {},
		// Minimal(s)
		min: {},
		// Total(s)
		sum: {},
	};

	/**
	 * Method to overwrite while extending
	 */
	constructor() {
		this.cnt = 0;
	}

	/**
	 * Called by Reader while scanning notes, before passing to user defined function
	 */
	aggregateAutoSet(obj) {
		this.cnt++;

		// Counters
		let keys = Object.keys(this.aggregates.cnt);
		for (let i = 0; i < keys.length; i++) {
			let k = keys[i];
			if (k == "all" || obj[k] == undefined) continue;
			this.aggregates.cnt[k]++;
		}

		// Minimal values
		keys = Object.keys(this.aggregates.min);
		for (let i = 0; i < keys.length; i++) {
			let k = keys[i];
			if (obj[k] == undefined) continue;
			if (["boolean", "string"].includes(typeof obj[k])) continue;
			this.aggregates.min[k] =
				this.aggregates.min[k] == null
					? obj[k]
					: Math.min(this.aggregates.min[k], obj[k]);
		}

		// Maximal values
		keys = Object.keys(this.aggregates.max);
		for (let i = 0; i < keys.length; i++) {
			let k = keys[i];
			if (obj[k] == undefined) continue;
			if (["boolean", "string"].includes(typeof obj[k])) continue;
			this.aggregates.max[k] =
				this.aggregates.max[k] == null
					? obj[k]
					: Math.max(this.aggregates.max[k], obj[k]);
		}

		// Sums
		keys = Object.keys(this.aggregates.avg);
		for (let i = 0; i < keys.length; i++) {
			let k = keys[i];
			if (["date", "boolean", "string"].includes(typeof obj[k])) continue;
			this.aggregates.sum[k] += obj[k];
		}

		// Averages
		keys = Object.keys(this.aggregates.avg);
		for (let i = 0; i < keys.length; i++) {
			let k = keys[i];
			if (obj[k] == undefined) continue;
			if (["boolean", "string"].includes(typeof obj[k])) continue;
			this.aggregates.avg[k] = this.aggregates.sum[k] / this.aggregates.cnt[k];
		}
	}

	/**
	 * Add an aggregate for a part in structure.
	 * Method to call in constructor while extending.
	 *
	 * @param {string} which Name of property in a Note
	 * @param {string} name Name of aggregate (cnt, min, max, avg, sum)
	 */

	addAggregate(which, name) {
		if (!this.aggregates[which]) {
			log.error(`Aggregate ${which} unknown. Skipping ${name}`);
			return;
		}
		this.aggregates[which][name] = which == "cnt" ? 0 : null;

		// In case of nesting (report grouping)
		if (this.parent != null) this.parent.addAggregate(which, name);
	}

	/**
	 * Method to overwrite while extending.
	 *
	 * @param {Notes} obj
	 */
	processNote(obj) {}

	/**
	 * Stop scanning.
	 * Called by this.processNote() or Reader, method processNote()
	 */
	stop() {
		this.isStopped = true;
	}

	/**
	 * Return a presentable object
	 */
	toObject() {
		// Remove constants and return object
		let obj = ObjectUtils.clone(this);
		Reflect.deleteProperty(obj, "CNT");
		Reflect.deleteProperty(obj, "AVG");
		Reflect.deleteProperty(obj, "MIN");
		Reflect.deleteProperty(obj, "MAX");
		Reflect.deleteProperty(obj, "SUM");
		return obj;
	}
}
