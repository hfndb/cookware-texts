"use strict";

/** @typedef PartOptions
 * @property {*} [defaultValue]
 * @property {string|Structure} [foreignKey]
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} [required]
 * @property {string} [variant]
 */

/** Structure of a part of a note
 *
 * @property {*} defaultValue
 * @property {string|Structure} foreignKey
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} required
 * @property {string} variant
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
		this.variant = opts.variant || "string";
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
			case "boolean":
				this.defaultValue = false;
				break;
			case "float":
			case "int":
				this.defaultValue = 0;
				break;
			case "date":
			case "string":
				this.defaultValue = "";
				break;
			case "array":
				this.defaultValue = [];
				break;
			case "object":
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
