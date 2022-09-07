"use strict";
import { Inquirer, log, Note, Notes, NOTE_STATUS } from "../index.mjs";
import { Reader } from "../scribe/read.mjs";
import { Writer } from "../scribe/write.mjs";
import { StoreManager } from "../manager.mjs";
import { Transformer } from "../transform/transformer.mjs";

/** @typedef TopicOptions
 * @property {string} name
 * @property {Note[]} notes
 * @property {Structure[]} structures Classes main structures
 * @property {Structure[]} [additional] Classes additional notes
 */

/** Topic bundles notes
 *
 * @property {string} name
 * @property {Object} toWrite Queue for writing
 * @property {Structure[]} structures Classes main structures
 * @property {Structure[]} [additional] Classes additional notes
 */
export class Topic {
	/**
	 * @param {TopicOptions} opts
	 */
	constructor(opts) {
		this.format = opts.format;
		this.name = opts.name;
		this.structures = opts.structures;
		this.toWrite = {};
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

	/** Retain is another word for 'save' or 'update' to disk
	 *
	 * @param {*} strctr Structure definition or instance
	 */
	async retain(strctr) {
		if (typeof strctr != "object") strctr = new strctr();
		let tw = [],
			wrtr = new Writer();

		for (let i = 0; i < this.toWrite[strctr.name].length; i++) {
			tw.push(this.toWrite[strctr.name][i]); // Pass object reference, to get new key back
		}
		// Get rid of references not needed any more.
		// Caller might have kept them, since they were passed by reference.
		this.toWrite[strctr.name] = []; // Could also be done using .splice()

		await wrtr.write(
			Notes.vars.serverName,
			process.pid.toString(),
			this,
			strctr,
			tw,
		);
	}

	// --------------------------------------------------------
	// Part: compose, replace, shred note
	// --------------------------------------------------------

	/** During this.composeNote(), this.replaceNote() and this.shredNote()
	 *
	 * @parivate
	 */
	add2queue(nt) {
		let n = nt.__structure.name;

		// Queue for writing
		if (!this.toWrite[n]) this.toWrite[n] = [];

		if (nt.__status == NOTE_STATUS.UNCHANGED) return;
		else if (nt.__status == NOTE_STATUS.NEW) {
			this.toWrite[n].push(nt);
		} else if (
			nt.__status == NOTE_STATUS.CHANGED ||
			nt.__status == NOTE_STATUS.SHREDDED
		) {
			let idx = this.toWrite[n].findIndex(item => {
				if (nt?.key && nt.key > 0) return item?.key == nt.key;
				return nt.__uuid && item?.__uuid == nt?.__uuid;
			});
			if (idx >= 0) {
				this.toWrite[n][idx] = nt;
			} else {
				this.toWrite[n].push(nt);
			}
		} else {
			log.error("Unknown status of note", nt);
			process.exit(-1); // No mercy
		}
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
		this.add2queue(nt);
		return nt;
	}

	/** Replace note
	 *
	 * @param {*} strctr Structure definition or instance
	 * @param {Note} nt
	 */
	replaceNote(strctr, nt) {
		let toQueue = nt instanceof Note ? nt : this.composeNote(strctr, nt);
		toQueue.__status = NOTE_STATUS.CHANGED;
		this.add2queue(toQueue);
	}

	/** Shred (aka delete, remove) note
	 *
	 * @param {*} strctr Structure definition or instance
	 * @param {Note} nt
	 */
	shredNote(strctr, nt) {
		let toQueue = nt instanceof Note ? nt : this.composeNote(strctr, nt);
		toQueue.__status = NOTE_STATUS.SHREDDED;
		this.add2queue(toQueue);
	}

	// --------------------------------------------------------
	// Part: scanning
	// --------------------------------------------------------

	/** Scan a structure for notes
	 *
	 * @param {Structure} strctr
	 * @param {Inquirer} iqr Inquirer to gather information
	 */
	async scan(strctr, iqr) {
		let s = typeof strctr == "object" ? strctr : new strctr();
		let rdr = new Reader();
		await rdr.scan(Reader.SCAN_INQUIRER, this, s, iqr);
	}

	/** Scan a structure for notes
	 *
	 * @param {Structure} strctr
	 * @param {Note[]} rt Result set in case of a function passed
	 * @param {Function} fltr Filter function, see howto/usage.mjs
	 */
	async scanUsingFilter(strctr, rt, fltr) {
		let s = typeof strctr == "object" ? strctr : new strctr();
		let rdr = new Reader();
		await rdr.scan(Reader.SCAN_FILTER, this, s, fltr, rt);
	}
}
