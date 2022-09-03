"use strict";
import { Buffer } from "node:buffer";
import { performance } from "node:perf_hooks";
import { Formatter } from "../../utils.mjs";
import { StringExt, Note, Topic } from "./index.mjs";

/** Handle storage of notes (records, rows) in files
 */

// ---------------------------------------------------------------------------
// Section: To be set from the outside, during integration
// ---------------------------------------------------------------------------

/** Retrieve or store notes
 */
export class Notes {
	/**
	 * Options
	 */
	static options = {
		dir: "/tmp",
		domain: "localhost",
		maxRest: {
			current: 10, // Minutes untouched before elegible for merging into 'merged'
		},
		maxSize: {
			current: 1 * 1024 * 1024, // 1 MB
			merged: 6 * 1024 * 1024, // 6 MB
		},
	};

	// ---------------------------------------------------------------------------
	// Main section
	// ---------------------------------------------------------------------------

	// ---------------------------------------------------------------------------
	// Section: Variables during uptime
	// ---------------------------------------------------------------------------
	static vars = {
		start: Date.now(),
		serverName: "localhost",
		reads: {
			size: 0,
			qty: 0,
			duration: 0,
			fastest: 0,
			slowest: 0,
		},
		writes: {
			size: 0,
			qty: 0,
			duration: 0, // In total
			fastest: 0,
			slowest: 0,
		},
	};

	static getStats() {
		let frmttr = new Formatter();
		let uptime = StringExt.microSeconds2string(
			Date.now() - Notes.vars.start,
			false,
		);
		return `Total uptime ${uptime}
Reads:
- Quantity: ${frmttr.int(Notes.vars.reads.qty)}
- Total size: ${StringExt.bytesToSize(Notes.vars.reads.size)}
- Slowest: ${StringExt.microSeconds2string(Notes.vars.reads.slowest)}
- Fastest: ${StringExt.microSeconds2string(Notes.vars.reads.fastest)}
Writes:
- Quantity: ${frmttr.int(Notes.vars.writes.qty)}
- Total size: ${StringExt.bytesToSize(Notes.vars.writes.size)}
- Slowest: ${StringExt.microSeconds2string(Notes.vars.writes.slowest)}
- Fastest: ${StringExt.microSeconds2string(Notes.vars.writes.fastest)}`;
	}

	// ---------------------------------------------------------------------------
	// Section: Functions namespaced as static methods
	// ---------------------------------------------------------------------------

	static addRead(duration, what) {
		Notes.vars.reads.qty++;
		Notes.vars.reads.size +=
			typeof what == "number" ? what : Buffer.byteLength(what, "utf8");
		Notes.vars.reads.duration += duration;
		if (!Notes.vars.reads.fastest) {
			Notes.vars.reads.fastest = duration;
			Notes.vars.reads.slowest = duration;
		} else {
			Notes.vars.reads.fastest = Math.min(Notes.vars.reads.fastest, duration);
			Notes.vars.reads.slowest = Math.max(Notes.vars.reads.slowest, duration);
		}
	}

	static addWrite(duration, what) {
		Notes.vars.writes.qty++;
		Notes.vars.writes.size += Buffer.byteLength(what, "utf8");
		Notes.vars.writes.duration += duration;
		if (!Notes.vars.writes.fastest) {
			Notes.vars.writes.fastest = duration;
			Notes.vars.writes.slowest = duration;
		} else {
			Notes.vars.writes.fastest = Math.min(Notes.vars.writes.fastest, duration);
			Notes.vars.writes.slowest = Math.max(Notes.vars.writes.slowest, duration);
		}
	}
}
