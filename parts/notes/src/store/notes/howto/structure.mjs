"use strict";
import { Part, Structure, Topic } from "../index.mjs";

// Howto setup a topic with structure

/**
 * Structure. You could compare this with a table structure in a database
 */
export class Recipe extends Structure {
	constructor() {
		super({
			name: "recipe",
			additional: [], // For example; ingredients of recipe
			autoAdd: {
				key: true, // Default behavior, autoincrement
				added: false, // Idem dito, datetime when added
				updated: false, // Idem dito, datetime when updated
			},
			parts: [
				// Part 'key' is automatically added (auto increment)

				// Choices for variant:
				// string (default), boolean, date, datetime, int, float
				// string with unlimited lenght, like blob or text in a database.

				new Part({
					name: "stringExample",
				}),
				// If variant is date or datetime, default value can be set to now,
				// which will be auto-replaced while adding a note,
				// if no value provided.
				new Part({
					defaultValue: "now",
					name: "dateExample",
					variant: "date",
				}),
				new Part({
					name: "intExample",
					variant: "int",
				}),
				new Part({
					name: "floatExample",
					variant: "float",
				}),
			],
		});
	}
}

/**
 * Topic. You could compare this with a catalog or schema in a database
 */
export class Kitchen extends Topic {
	/**
	 * @private
	 * @var {Kitchen}
	 */
	static _instance;

	constructor() {
		super({
			format: "tsv", // File format on hard disk
			name: "kitchen",
			structures: [Recipe],
		});
	}

	/**
	 * Singleton factory to get instance
	 *
	 * @returns {Promise<Kitchen>}
	 */
	static async getInstance() {
		if (!Kitchen._instance) {
			Kitchen._instance = new Kitchen();
			await Topic.init(Kitchen._instance);
		}
		return Kitchen._instance;
	}
}
