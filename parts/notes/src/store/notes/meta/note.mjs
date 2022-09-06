"use strict";
import { randomUUID } from "node:crypto";
import { log, ObjectUtils, VARIANT } from "../index.mjs";

/** One note
 *
 * @property {boolean|undefined} __ignore
 * @property {Structure} __structure
 */
export class Note {
	static STATUS_UNCHANGED = 0;
	static STATUS_NEW = 1;
	static STATUS_CHANGED = 2;
	static STATUS_SHREDDED = 3;

	__status; // one of the constants above
	__structure;
	__uuid; // to keep track of changes

	/**
	 * @param {Object} obj
	 * @param {Structure} strctr
	 */
	constructor(strctr, obj) {
		// Class definition passed? Then transform to instance
		if (typeof strctr == "function") strctr = new strctr();

		this.__status = Note.STATUS_UNCHANGED;
		this.__structure = strctr;
		this.__uuid = randomUUID();
		let part, val;

		if (!strctr || !strctr.parts) {
			log.info(strctr);
			log.info(new Error(`No structure`));
			process.exit(-1); // No mercy
			return;
		}

		// Transfer properties of obj to this
		for (let i = 0; i < strctr.parts.length; i++) {
			part = strctr.parts[i];
			val = obj[part.name];

			// Add default values for unspecified properties
			if (val == undefined && !part.required) {
				if (
					(part.variant == VARIANT.DATE || part.variant == VARIANT.DATETIME) &&
					part.defaultValue == "now"
				) {
					val = new Date();
				} else {
					val = part.defaultValue;
				}
			}
			this[part.name] = val;
		}

		if (this.key == undefined) {
			this.key = -1;
			this.__status = "new";
		}
	}

	/**
	 * @returns {boolean}
	 */
	isValid() {
		let tr = true,
			part,
			val;

		for (let i = 0; tr && i < this.__structure.parts.length; i++) {
			part = this.__structure.parts[i];
			val = this[part.name];

			if (part.required) {
				continue; // TODO required check
				if (val == undefined || val == null) tr = false;
			}
		}

		return tr;
	}

	/** During scanning in Inquirer, method processNote():
	 * Mark note as 'to ignore'
	 */
	ignore() {
		this.__ignore = true;
	}

	/** During scanning: Get mark note; 'to ignore'
	 * For internal usage by Reader
	 */
	toIgnore() {
		return this.__ignore ? true : false;
	}

	/** Clean string representation without internal properties beginning with __
	 *
	 * @param {Note} nt
	 * @returns {string}
	 */

	static toString(nt) {
		return JSON.stringify(Note.toObject(nt), null, "\t");
	}

	/** Stripped from internal properties beginning with __
	 *
	 * @param {Note} nt
	 * @returns {Object}
	 */
	static toObject(nt) {
		let prp = Object.getOwnPropertyDescriptors(object1);
		let rt = {};

		Object.keys(prp).forEach(key => {
			rt.key = nt.key;
		});

		return rt;
	}

	/** Parse a retrieved note and return an object
	 *
	 * @param {Topic} tpc
	 * @param {Structure} strctr
	 * @param {string} incoming
	 * @returns {Object|null}
	 */
	static parse(tpc, strctr, incoming) {
		return tpc.transformer.writable2object(incoming, strctr.parts);
	}

	/** To write to file system
	 * @param {Topic} tpc
	 * @param {Note} obj
	 */
	static get2write(tpc, obj) {
		return tpc.transformer.parts2writable(obj);
	}

	/** Append in file system
	 *
	 * @param {Topic} tpc
	 * @param {Note} obj
	 */
	static async append(tpc, obj) {
		await super.append(obj.__structure.name, super.get2write(obj.__structure));
	}
}
