"use strict";
import { log, Notes, VARIANT } from "../index.mjs";
import { Part } from "./part.mjs";

/** @typedef StructureOptions
 * @property {string} name
 * @property {string[]} additional Classes additional notes
 * @property {Object} autoAdd
 * @property {Part[]} parts
 * @property {number} variant. Constant in VARIANT
 */

/** Structure of a note aka record, row
 *
 * @property {string} name
 * @property {string[]} additional Classes additional notes
 * @property {Object} autoAdd
 * @property {Part[]} parts
 * @property {number} variant. Constant in VARIANT
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
			process.exit(-1); // No mercy
		}
		this.notes = [];
		this.parts = opts.parts;
		this.autoAdd = Object.assign(
			{
				added: false,
				updated: false,
			},
			opts.autoAdd || {},
		);

		// Add key part
		this.parts.unshift(
			new Part({
				defaultValue: "autoincrement",
				name: "key",
				required: true,
				variant: VARIANT.INT,
			}),
		);

		if (this.autoAdd.updated)
			this.parts.unshift(
				new Part({
					defaultValue: "now",
					name: "updated",
					variant: VARIANT.DATETIME,
				}),
			);

		if (this.autoAdd.added)
			this.parts.unshift(
				new Part({
					defaultValue: "now",
					name: "added",
					variant: VARIANT.DATETIME,
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
