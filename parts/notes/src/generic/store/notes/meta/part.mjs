"use strict";
import { VARIANT } from "../index.mjs";

/** @typedef PartOptions
 * @property {*} [defaultValue]
 * @property {string|Structure} [foreignKey]
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} [required]
 * @property {number} [variant]
 */

/** Structure of a part of a note
 *
 * @property {*} defaultValue
 * @property {string|Structure} foreignKey
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} required
 * @property {number} variant
 */
export class Part {
	defaultValue;
	description;
	foreignKey;
	name;
	required;
	variant;

	/**
	 * @param {PartOptions} opts
	 */
	constructor(opts) {
		this.description = opts.description || opts.name;
		this.variant = opts.variant || VARIANT.STRING;
		this.required = opts.required || false;

		if (opts.foreignKey) {
			if (typeof opts.foreignKey == "string") this.name = opts.name;
			else this.name = opts.foreignKey.name; // Instance of Structure
		} else {
			this.name = opts.name;
		}

		if (opts.defaultValue != undefined) {
			this.defaultValue = opts.defaultValue;
			return;
		}

		switch (this.variant) {
			case VARIANT.BOOLEAN:
				this.defaultValue = false;
				break;
			case VARIANT.FLOAT:
			case VARIANT.INT:
				this.defaultValue = 0;
				break;
			case VARIANT.DATE:
			case VARIANT.DATETIME:
			case VARIANT.FOREIGN_KEY:
			case VARIANT.STRING:
				this.defaultValue = "";
				break;
			case VARIANT.ARRAY:
				this.defaultValue = [];
				break;
			case VARIANT.OBJECT:
				this.defaultValue = {};
				break;
		}
	}

	/** To write to file system
	 */
	static toStructure(obj) {
		return {
			defaultValue: obj.defaultValue,
			foreignKey: obj.foreignKey,
			name: obj.name,
			required: obj.required,
			variant: obj.variant,
		};
	}
}
