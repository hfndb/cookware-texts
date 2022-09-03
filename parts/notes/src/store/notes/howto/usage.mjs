"use strict";
import { Kitchen, Recipe } from "./structure.mjs";
import { Inquirer } from "../inquirer.mjs";

/**
 * Howto's about usage, in function blocks
 */
export class Howto {
	/**
	 * Adding a note
	 */
	async add() {
		// Get instance of Topic
		let kitchen = await Kitchen.getInstance();

		let added = [];

		// Get instance of Note
		let note = kitchen.composeNote(Recipe, {
			description: "blah blah",
			dateExample: Date.now(),
			intExample: 123,
			floatExample: 123.45,
		});

		added.push(note);

		/**
		 * Returned note: Added note with added property 'key'. Value of 'key':
		 * -2 if (for example checking required parts) failed,
		 * -1 if not written yet,
		 * >= 0 for key in file system (compare with auto-increment in database)
		 */

		// Elsewhere known as 'save' or 'update'
		// Retain created notes for Recipe in this instance of Kitchen
		await kitchen.retain(Recipe);
	}

	/**
	 * Scan a structure within a topic for notes.
	 * You could compare this with an SQL SELECT
	 */
	async scan() {
		// Extended instance of Inquirer, see below
		let iqr = new SampleInquiry();
		await iqr.doSo();

		/**
		 * Instance of SampleInquiry now has some aggregated values in
		 * the object iqr.aggregates, known as a report summary.
		 *
		 * If you would like to create groups within a report, then:
		 * - Create an instance of Inquirer
		 * - Create a next instance and connect that to the first by means
		 *   of the parent property. Nest deeper than that if you like,
		 *   to create an hierarchy.
		 * - Then add aggregates at the deepest level.
		 */
	}
}

/**
 * Extending Inquirer is a recommended method to organize them into one or more files,
 * which can be needed for organizing bigger projects with various inquiries.
 */
export class SampleInquiry extends Inquirer {
	constructor() {
		super(); // Will initialize count for all scanned notes
		this.addAggregate(this.MIN, "intExample"); // Determine minimal value in this part
		this.addAggregate(this.MAX, "intExample"); // Same, for maximal value
		this.addAggregate(this.AVG, "intExample"); // Same, for average value
		this.addAggregate(this.SUM, "intExample"); // Same, for sum of values
		this.addAggregate(this.CNT, "intExample"); // Not necessary here, but to show...
	}

	/**
	 * Go and inquire. Scan notes.
	 */
	async doSo() {
		let kitchen = await Kitchen.getInstance();
		await kitchen.scan(Recipe, this);
	}

	/**
	 * Overwritten method, called by Reader for each Note
	 *
	 * @param {Note} obj
	 */
	processNote(obj) {
		// You could add calculated properties or do whatever else here

		// Add note to result set of inquiry
		if (obj.stringExample.includes("test")) {
			this.results.push(obj);
		}

		if (false) {
			// Mark note as to ignore for aggregate counting
			this.ignore();
		}

		if (false) {
			// If you want to stop scanning
			this.stop();
		}
	}
}
