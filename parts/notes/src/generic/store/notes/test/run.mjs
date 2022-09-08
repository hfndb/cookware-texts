#! /usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { AppConfig } from "../../../config.mjs";
import { Logger } from "../../../log.mjs";
import { Formatter } from "../../../utils.mjs";
import { FileUtils, Note, Notes, StringExt } from "../index.mjs";
import { integrate } from "../integration.mjs";
import { Kitchen, Recipe } from "../howto/structure.mjs";
import { SampleInquiry } from "../howto/usage.mjs";
import { Merger } from "../scribe/merge.mjs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup standalone version of integration with
// files from cookware-headless-ice
let cfg = AppConfig.getInstance("notes");
integrate();

let log = Logger.getInstance();
console.debug = log.debug; // For dev purposes

// -----------------------------------------------------------------------------------
// Section: Test for adding notes
// -----------------------------------------------------------------------------------

let frmttr = new Formatter();

// Default config for tests
cfg.options.test = {};
Object.assign(cfg.options.test, {
	debug: false, // debug info from Topic while adding note
	interval: 50, // Qty of notes before adding 1 day
	lastDate: new Date(2000, 1, 1),
	nr: 0,
	// Parts of this test
	parts: {
		add: true,
		merge: true,
		replace: true,
		retain: true,
		shred: true,
		scanUsing: {
			filter: true,
			inquirer: true,
		},
	},
	path: "/tmp/notes",
	runs: 1, // Run test how many times?
	show: {
		lastNote: false,
		notes: false,
		scanResults: false,
		structure: false,
	},
	start: Date.now(),
	qtyTestItems: 100000, // Qty of notes to add per run
});

// Project config for tests
cfg = Object.assign(
	cfg.options.test,
	FileUtils.readJsonFile(join(__dirname, "settings.json")),
);

// Set an absolute path to where notes are stored
Notes.setPath(cfg.path);

// Function called from a loop
function addNote() {
	cfg.nr++;
	if (cfg.nr % cfg.interval == 0) {
		cfg.lastDate.setDate(cfg.lastDate.getDate() + 1); // rolls over
	}

	let result = kitchen.composeNote(
		Recipe,
		{
			stringExample: randomUUID(),
			dateExample: cfg.lastDate,
			intExample: Math.floor(Math.random() * 1000),
			floatExample: Math.random() * 1000,
		},
		cfg.debug,
	);
	if (result.key < -1) return false;

	//cfg.debug = true;

	return true;
}

let kitchen, recipe;

export async function test() {
	kitchen = await Kitchen.getInstance(); // Topic
	recipe = new Recipe(); // Structure

	// Loop to add notes
	let now = Date.now();
	for (let i = 0; cfg.parts.add && i < cfg.qtyTestItems; i++) {
		addNote();
	}
	let timeElapsed = Date.now() - now;

	// Show some possibly interesting info

	if (cfg.show.structure) console.log("Structure:", kitchen.toStructure());

	if (cfg.parts.add && cfg.show.notes) {
		console.log("Note(s):");
		for (let i = 0; i < kitchen.notes.length; i++) {
			let item = kitchen.notes[i];
			console.log(Note.get2write(kitchen, item));
			if (cfg.show.lastNote && i == kitchen.notes.length - 1) {
				Reflect.deleteProperty(item, "__structure");
				let dt = item.dateExample;
				console.log(
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
	console.log(`Notes added: ${frmttr.int(cfg.nr)}`);
	console.log(
		`Time needed to add (memory): ${StringExt.microSeconds2string(
			timeElapsed,
			false,
		)}`,
	);

	if (cfg.parts.retain) {
		now = Date.now();
		await kitchen.retain(Recipe);
		timeElapsed = Date.now() - now;
		console.log(
			`Time needed to retain (disk): ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);
	}

	if (cfg.parts.merge) {
		await Merger.mergeServer(kitchen, Notes.vars.serverName);
	}

	// Let's scan recipes
	if (cfg.parts.scanUsing.inquirer) {
		let iqr = new SampleInquiry();

		now = Date.now();
		await kitchen.scan(Recipe, iqr);
		timeElapsed = Date.now() - now;
		console.log(
			`Time needed to scan (disk) using inquirer: ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);

		if (cfg.show.scanResults) {
			console.log(iqr.toObject());
		}
	}

	if (cfg.parts.scanUsing.filter) {
		now = Date.now();
		let rt = []; // For colleting notes
		await kitchen.scanUsingFilter(Recipe, rt, nt => {
			return 1; // Add to rt
		});
		timeElapsed = Date.now() - now;
		console.log(
			`Time needed to scan (disk) using filter: ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);

		if (cfg.show.scanResults) {
			for (let i = 0; i < rt.length; i++) {
				rt[i] = Note.toObject(rt[i]);
			}
			console.log(rt); // Collected Note objects
		}
	}

	let nt, rt; // For collecting notes
	if (cfg.parts.replace) {
		// Replace a note, causing rewrite of a file
		rt = [];
		await kitchen.scanUsingFilter(Recipe, rt, nt => {
			return nt.key == 1 ? 2 : 0; // Get only one, ignore others
		});

		nt = rt[0];

		nt.stringExample = "Updated";

		kitchen.replaceNote(Recipe, nt);
		now = Date.now();
		await kitchen.retain(Recipe);
		timeElapsed = Date.now() - now;

		console.log(
			`Time needed to replace a note: ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);
	}

	if (cfg.parts.shred) {
		// Shred a note, causing rewrite of a file
		rt = [];
		await kitchen.scanUsingFilter(Recipe, rt, nt => {
			return nt.key == 2 ? 2 : 0; // Get only one, ignore others
		});

		kitchen.shredNote(Recipe, rt[0]);
		now = Date.now();
		await kitchen.retain(Recipe);
		timeElapsed = Date.now() - now;

		console.log(
			`Time needed to shred a note: ${StringExt.microSeconds2string(
				timeElapsed,
				false,
			)}`,
		);
	}

	// -----------------------------------------------------------------------------------
	// Section: Generic statistics
	// -----------------------------------------------------------------------------------
	console.log(`Stats:\n${Notes.getStats()}`);
}

for (let i = 0; i < cfg.runs; i++) {
	await test();
}
