"use strict";
import { log, ObjectUtils, Notes } from "./index.mjs";
import { Reader } from "./scribe/read.mjs";
import { Writer } from "./scribe/write.mjs";
import { Inquirer } from "./inquirer.mjs";
import { StoreManager } from "./manager.mjs";
import { Transformer } from "./transform/transformer.mjs";

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

/** @typedef StructureOptions
 * @property {string} name
 * @property {string[]} additional Classes additional notes
 * @property {Object} autoAdd
 * @property {Part[]} parts
 * @property {number} variant. One of the static properties of this class
 */

/** Structure of a note aka record, row
 *
 * @property {string} name
 * @property {string[]} additional Classes additional notes
 * @property {Object} autoAdd
 * @property {Part[]} parts
 * @property {number} variant. One of the static properties of this class
 * @todo Implement additional as in one invoice with multiple related items
 */
export class Structure {
	/**
	 * @param {StructureOptions} opts
	 */
	constructor(opts) {
		this.name = opts.name;
		this.additional = opts.additional || [];
		this.noteCnt = this.additional.length + 1; // For Reader
		if (this.noteCnt > 1) {
			log.error(
				`Alarm for structure ${this.name}; More than one structure in one note not implemented yet`,
			);
			process.exit(-1);
		}
		this.notes = [];
		this.parts = opts.parts;
		this.autoAdd = Object.assign(
			{
				key: true,
				added: false,
				updated: false,
			},
			opts.autoAdd || {},
		);

		if (this.autoAdd.updated)
			this.parts.unshift(
				new Part({
					defaultValue: "now",
					name: "updated",
					variant: "datetime",
				}),
			);

		if (this.autoAdd.added)
			this.parts.unshift(
				new Part({
					defaultValue: "now",
					name: "added",
					variant: "datetime",
				}),
			);

		// Add key part
		if (this.autoAdd.key)
			this.parts.unshift(
				new Part({
					defaultValue: "autoincrement",
					name: "key",
					required: true,
					variant: "int",
				}),
			);
	}

	/** To write to file system
	 */
	static toStructure(obj) {
		let tr = {
			cacheAllNotes: obj.cacheAllNotes,
			name: obj.name,
			parts: [],
			variant: obj.variant,
		};

		for (let i = 0; i < obj.parts.length; i++) {
			tr.parts.push(Part.toStructure(obj.parts[i]));
		}

		return tr;
	}

	/** Write to some file system
	 */
	async write() {
		await Notes.writeStructure(this.name, this.getStructure2write());
	}
}

/** One note
 *
 * @property {boolean|undefined} __ignore
 * @property {Structure} __structure
 */
export class Note {
	__structure;

	/**
	 * @param {Object} obj
	 * @param {Structure} strctr
	 */
	constructor(strctr, obj) {
		// Class definition passed? Then transform to instance
		if (typeof strctr == "function") strctr = new strctr();

		this.__structure = strctr;
		let part, val;

		if (!strctr || !strctr.parts) {
			log.info(strctr);
			log.info(new Error(`No structure`));
			process.exit(-1);
			return;
		}

		// Transfer properties of obj to this
		for (let i = 0; i < strctr.parts.length; i++) {
			part = strctr.parts[i];
			val = obj[part.name];

			// Add default values for unspecified properties
			if (val == undefined && !part.required) {
				if (part.variant.startsWith("date") && part.defaultValue == "now") {
					val = new Date();
				} else {
					val = part.defaultValue;
				}
			}
			this[part.name] = val;
		}

		if (this.key == undefined) {
			this.key = -1;
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
				continue;
				if (val == undefined || val == null) tr = false;
			}
		}

		return tr;
	}

	/**
	 * During scanning in Inquirer, method processNote():
	 * Mark note as 'to ignore'
	 */
	ignore() {
		this.__ignore = true;
	}

	/**
	 * During scanning: Get mark note; 'to ignore'
	 * For internal usage by Reader
	 */
	toIgnore() {
		return this.__ignore ? true : false;
	}

	/**
	 * For serializing
	 */
	toString() {
		let tmp = ObjectUtils.clone(this);
		Reflect.deleteProperty(tmp, "__structure");
		return tmp;
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

/** @typedef TopicOptions
 * @property {string} name
 * @property {Note[]} notes
 * @property {Structure[]} structures Classes main structures
 * @property {Structure[]} [additional] Classes additional notes
 */

/** Topic bundles notes
 *
 * @property {string} name
 * @property {Object} notes To retain aka append
 * @property {Structure[]} structures Classes main structures
 * @property {Structure[]} [additional] Classes additional notes
 */
export class Topic {
	notes = {};

	/**
	 * @param {TopicOptions} opts
	 */
	constructor(opts) {
		this.format = opts.format;
		this.name = opts.name;
		this.structures = opts.structures;
		this.transformer = null;
	}

	/** Initialize instance of a Topic
	 *
	 * @param {Topic} obj
	 */
	static async init(obj) {
		if (obj.transformer) return;
		obj.transformer = this.transformer = await Transformer.get(obj.format);

		// Class definitions passed? Then transform to instances
		// Needed for store manager
		for (let i = 0; i < obj.structures.length; i++) {
			if (typeof obj.structures[i] != "object")
				obj.structures[i] = new obj.structures[i]();
		}

		let sm = await StoreManager.getInstance();
		sm.add(obj);
	}

	/** To write to file system
	 */
	toStructure() {
		let tr = {
			format: this.format,
			name: this.name,
			structures: [],
		};

		for (let i = 0; i < this.structures.length; i++) {
			let strctr = this.structures[i];
			tr.structures.push(strctr.toStructure(new strctr()));
		}

		return tr;
	}

	/** Read from some file system
	 */
	readStructure() {
		return Reader.getStructure(this.name);
	}

	/** Compose an instance of Note based on the passed structure and object
	 *
	 * @param {*} strctr Structure definition or instance
	 * @param {Object} opts
	 * @param {boolean} [debug]
	 * @returns {Note}
	 */
	composeNote(strctr, opts, debug) {
		let nt = new Note(strctr, opts); // Note with specified structure
		if (debug) log.info("Composed: ", nt);

		let n = nt.__structure.name;
		if (!this.notes[n]) this.notes[n] = [];
		this.notes[n].push(nt);

		return nt;
	}

	/** Replace note
	 *
	 * @param {Structure} strctr
	 * @param {*} data To replace
	 * @param {number} key
	 * @returns {boolean} for success
	 */
	async replaceNote(strctr, data, key) {
		// TODO replaceNote
	}

	/**
	 * Retain is another word for 'save' or 'update' to disk
	 *
	 * @param {*} strctr Structure definition or instance
	 */
	async retain(strctr) {
		let s = typeof strctr == "object" ? strctr : new strctr(),
			tw = [];
		let wrtr = new Writer();

		for (let i = 0; i < this.notes[s.name].length; i++) {
			tw.push(this.notes[s.name][i]); // Pass object reference, to get new key back
		}
		// Get rid of references not needed any more.
		// Caller might have kept them, since they were passed by reference.
		this.notes[s.name] = []; // Could also be done using .splice()

		await wrtr.append(
			Notes.vars.serverName,
			process.pid.toString(),
			this,
			s.name,
			tw,
		);
	}

	/** Scan a structure for notes
	 *
	 * @param {Structure} strctr
	 * @param {Inquirer} iqr To gather information
	 */
	async scan(strctr, iqr) {
		let s = typeof strctr == "object" ? strctr : new strctr();
		let rdr = new Reader();
		await rdr.scan(this, s, iqr);
	}
}
