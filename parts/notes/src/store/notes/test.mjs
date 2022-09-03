#! /usr/bin/env node
import { Logger } from "../../../generic/log.mjs";
import { Formatter } from "../../utils.mjs";
import { randomUUID } from "node:crypto";
import { StringExt, Note, Notes } from "./index.mjs";
import { Kitchen, Recipe } from "./howto/structure.mjs";
import { SampleInquiry } from "./howto/usage.mjs";
import { integrate } from "./integration.mjs";
import { Merger } from "./scribe/merge.mjs";

// Setup standalone version of integration with
// files from cookware-headless-ice
integrate(true);

let log = Logger.getInstance();

// -----------------------------------------------------------------------------------
// Section: Test for adding notes
// -----------------------------------------------------------------------------------

let frmttr = new Formatter();

let vars = {
	debug: false, // debug info from Topic while adding note
	interval: 50, // Qty of notes before adding 1 day
	lastDate: new Date(2000, 1, 1),
	nr: 0,
	// Parts of this test
	parts: {
		add: true,
		merge: true,
		retain: true,
		scan: true,
	},
	runs: 1, // Run test how many times?
	show: {
		lastNote: false,
		notes: false,
		scanResults: false,
		structure: false,
	},
	start: Date.now(),
	qtyTestItems: 100000, // Qty of notes to add per run
};

// Function called from a loop
function addNote() {
	vars.nr++;
	if (vars.nr % vars.interval == 0) {
		vars.lastDate.setDate(vars.lastDate.getDate() + 1); // rolls over
	}

	let result = kitchen.composeNote(
		Recipe,
		{
			stringExample: randomUUID(),
			dateExample: vars.lastDate,
			intExample: Math.floor(Math.random() * 1000),
			floatExample: Math.random() * 1000,
		},
		vars.debug,
	);
	if (result.key < -1) return false;

	//vars.debug = true;

	return true;
}

let kitchen, recipe;

export async function test() {
	// If cookware logger active... switch file logging off
	if (log.opts) {
		log.opts.transports.file.active = false;
	}

	kitchen = await Kitchen.getInstance(); // Topic
	recipe = new Recipe(); // Structure

	// Loop to add notes
	let now = Date.now();
	let timeElapsed = now - vars.start;
	for (let i = 0; vars.parts.add && i < vars.qtyTestItems; i++) {
		addNote();
	}

	// Show some possibly interesting info

	if (vars.show.structure) log.info("Structure:", kitchen.toStructure());

	if (vars.parts.add && vars.show.notes) {
		log.info("Note(s):");
		for (let i = 0; i < kitchen.notes.length; i++) {
			let item = kitchen.notes[i];
			log.info(Note.get2write(kitchen, item));
			if (vars.show.lastNote && i == kitchen.notes.length - 1) {
				Reflect.deleteProperty(item, "__structure");
				let dt = item.dateExample;
				log.info(
					"Last item: ",
					item,
					"Date parts: ",
					dt.getFullYear(),
					dt.getMonth(),
					dt.getDate(),
					dt.getHours(),
					dt.getMinutes(),
				);
			}
		}
	}

	// Statistics for adding notes
	log.info(`Notes added: ${frmttr.int(vars.nr)}`);
	log.info(
		`Time needed to add (memory): ${StringExt.microSeconds2string(
			timeElapsed,
			false,
		)}`,
	);

	if (vars.parts.retain) {
		now = Date.now();
		await kitchen.retain(Recipe);
		timeElapsed = now - vars.start - timeElapsed;
		log.info(
			`Time needed to retain (disk): ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);
	}

	if (vars.parts.merge) {
		await Merger.mergeServer(kitchen, Notes.vars.serverName);
	}

	if (vars.parts.scan) {
		// Let's scan recipes
		let iqr = new SampleInquiry();

		now = Date.now();
		await kitchen.scan(Recipe, iqr);
		timeElapsed = now - vars.start - timeElapsed;
		log.info(
			`Time needed to scan (disk): ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);

		if (vars.show.scanResults) {
			log.info(iqr.toObject());
		}
	}

	// -----------------------------------------------------------------------------------
	// Section: Generic statistics
	// -----------------------------------------------------------------------------------
	log.info(`Stats:\n${Notes.getStats()}`);
}

for (let i = 0; i < vars.runs; i++) {
	await test();
}
