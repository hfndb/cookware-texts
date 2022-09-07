"use strict";
import { Inquirer, Notes } from "../index.mjs";
import { Kitchen, Recipe } from "./structure.mjs";

// Configuration: Set an absolute path to where notes are stored
Notes.setPath("/tmp/notes");

/**
 * Howto's about usage, in function blocks
 */
export class Howto {
	/** Adding a note
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

	/** Retrieve in a simple way.
	 *
	 * Scan a structure within a topic for notes.
	 * You could compare this with Array.filter()
	 */
	async scanSimple() {
		let kitchen = await Kitchen.getInstance(),
			rt = []; // return value
		await kitchen.scanUsingFilter(Recipe, rt, nt => {
			// nt = Note instance
			switch (nt.key) {
				case 1:
					return 0; // Ignore
				case 2:
					return 1; // Add to rt
				case 3:
					return 2; // Add to rt and finish scanning
			}
		});

		console.log(rt); // Collected Note objects

		// Stripped from internal properties beginning with __
		let nt = rt[0];
		console.log(Note.toString(nt)); // As string
		console.log(Note.toObject(nt)); // As object
	}

	/** Retrieve and report in an advanced way.
	 *
	 * Scan a structure within a topic for notes.
	 * You could compare this with an SQL SELECT
	 */
	async scan() {
		// Extended instance of Inquirer, see below
		let iqr = new SampleInquiry();
		await iqr.doSo();

		// Collected Note objects, during iqr.processNote()
		console.log(iqr.results);
		// Calculated aggregates, known as a report summary
		console.log(iqr.aggregates);

		// Stripped from internal properties beginning with __
		let nt = iqr.results[0];
		console.log(Note.toString(nt)); // As string
		console.log(Note.toObject(nt)); // As object

		/**
		 * If you would like to create groups within a report, then:
		 * - Create an instance of Inquirer
		 * - Create a next instance and connect that to the first by means
		 *   of the parent property. Nest deeper than that if you like,
		 *   to create an hierarchy.
		 * - Then add aggregates at the deepest level.
		 */
	}

	/** Edit already written notes
	 */
	async edit() {
		let kitchen = await Kitchen.getInstance(),
			notes = [];

		// Get some notes to edit
		await kitchen.scanUsingFilter(Recipe, notes, nt => {
			return nt.key == 1 ? 1 : 2;
		});

		// Replace aka update
		notes[0].intExample = 2;
		kitchen.replaceNote(Recipe, notes[0]);

		// Shred aka delete ake erase
		kitchen.shredNote(Recipe, notes[1]);

		// Retain, elsewhere known as 'save' or 'update'
		await kitchen.retain(Recipe);
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
	 * @param {Note} nt
	 */
	processNote(nt) {
		// You could add calculated properties or do whatever else here

		// Add note to result set of inquiry
		if (nt.stringExample.includes("test")) {
			this.results.push(nt);
		}

		if (false) {
			// Mark note as to ignore for aggregate counting
			this.ignore();
		}

		if (false) {
			// If you want to finish scanning
			this.stop();
		}
	}
}
