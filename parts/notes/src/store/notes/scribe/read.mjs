"use strict";
import { createReadStream, ReadStream } from "node:fs";
import { join } from "node:path";
import { Queues } from "../../../queue.mjs";
import { Lock } from "../../../file-system/lock.mjs";
import {
	test,
	FileUtils,
	log,
	Note,
	Notes,
	Structure,
	Topic,
} from "../index.mjs";
import { Inquirer } from "../inquirer.mjs";
import { StoreManager } from "../manager.mjs";

// For study: https://github.com/baudehlo/node-fs-ext

/**
 * @property {boolean} block
 * @property {string} fileFormat
 * @property {string} previous Incoming data received so far but not transformed to note yet
 * @param {Inquirer} iqr To gather information
 * @param {Structure} strctr
 * @param {Topic} tpc
 */
export class Reader {
	block = false; // Block reading
	fileFormat = "";
	previous = "";

	/**
	 * @param {string} tpc
	 * @param {boolean} [queue] Use queue
	 */
	static async getKeys(tpc, queue = false) {
		let path = join(
			StoreManager.topics[tpc].dir,
			StoreManager.topics[tpc].files.keys,
		);

		// Just to be sure
		if (queue) {
			let lck = new Lock(path);
			await Queues.get(path); // For async
			await lck.lock(); // For other pid's
		}

		let bgn = performance.now();
		let rt = FileUtils.readJsonFile(path);
		Notes.addRead(performance.now() - bgn, JSON.stringify(rt));
		return rt;
	}

	/**
	 * @param {string} tpc
	 * @returns {Object|null}
	 */
	static getStructure(tpc) {
		let t = StoreManager.topics[tpc];
		let path = join(t.dir, t.files.structure);

		if (!test("-f", path)) return null;

		let bgn = performance.now();
		let rt = FileUtils.readJsonFile(path);
		Notes.addRead(performance.now() - bgn, JSON.stringify(rt));
	}

	/**
	 * Generic: Force end of stream
	 *
	 * @param {ReadStream} rs
	 */
	static closeReadStream(rs) {
		rs.close(); // May not stop the stream
		// From Node.js docs fs.createReadStream(path[, options]), artificially mark end-of-stream
		rs.push(null);
		rs.read(0);
	}

	/**
	 * Almost generic: Iterate through a file.
	 * Node.js explicitely, highly recommends async interation while reading
	 * @see https://node.dev/post/understanding-streams-in-node-js
	 *
	 * @param {ReadStream} rs
	 * @param {Function} resolve To resolve promise
	 * @param {string} format of file
	 */
	async interateFile(rs, resolve, format) {
		let vars = {
			bgn: performance.now(),
			bytesRead: 0,
			chunksRead: 0,
			isTxt: format == "txt",
			pause: 0, // ms for pausing while reading
		};

		for await (const chunk of rs) {
			vars.bytesRead += chunk.length;
			vars.chunksRead++;

			if (vars.isTxt) {
				this.previous += chunk.toString();
			}

			this.processIncoming();

			if (this.iqr.isStopped) {
				Reader.closeReadStream(rs);
				break;
			}
		}
		Notes.addRead(performance.now() - vars.bgn, vars.bytesRead);

		resolve();
		this.processIncoming(true);
	}

	/**
	 * Process incoming chunk during file iteration
	 *
	 * @private
	 */
	processIncoming() {
		let vars = {
			complete: false,
			idxFrom: 0, // Search from index...
			idxFound: 0, // Index ending of complete note
			qtyNtFound: 0, // Qty of notes found so far
			ntCnt: this.strctr.noteCnt, // Qty of notes for one complete note in structure
		};

		for (let i = 0; !vars.complete && i < vars.ntCnt; i++) {
			vars.idxFound = this.previous.indexOf(
				this.tpc.transformer.eon,
				vars.idxFrom,
			);
			if (vars.idxFound >= 0) {
				vars.idxFrom = vars.idxFound;
				vars.qtyNtFound++;
			} else break; // Exit for loop
			vars.complete = vars.qtyNtFound == vars.ntCnt;
		}

		if (vars.complete) {
			let raw = this.previous.slice(0, vars.idxFound + 1);
			let obj = Note.parse(this.tpc, this.strctr, raw);
			this.previous = this.previous.slice(vars.idxFound + 1);

			let note = this.tpc.composeNote(this.strctr, obj);
			// Not needed for Inquirer results:
			Reflect.deleteProperty(note, "__structure");

			this.iqr.processNote(note);
			if (!note.toIgnore()) {
				this.iqr.aggregateAutoSet(note);
			}

			// Recurse, since chunk might contain other than this note
			this.processIncoming();
		}
	}

	/**
	 * Scan one file
	 *
	 * @private
	 * @param {string} file
	 * @todo Use 'begin' while opening read stream for optimized reading
	 */
	async scanFile(file) {
		if (this.block) return;

		this.previous = "";

		let reader,
			instance = this;
		try {
			reader = createReadStream(file, {
				highWaterMark: 1 * 1024, // 1 KB
			});
		} catch (err) {
			log.error(`Error while opening file ${file}`, err);
			return;
		}

		// Will resolve when scanning is stopped or end of file reached.
		return new Promise(function(resolve) {
			instance.interateFile(reader, resolve, instance.tpc.transformer.fileFormat);
		});
	}

	/** Scan a structure within a topic for notes
	 *
	 * @param {Topic} tpc
	 * @param {Structure} strctr
	 * @param {Inquirer} iqr To gather information
	 */
	async scan(tpc, strctr, iqr) {
		let sm = await StoreManager.getInstance(),
			tmp;

		this.iqr = iqr;
		this.strctr = strctr;
		this.tpc = tpc;

		// Collect file list to process:

		// Merged in all servers
		let files = sm.get4reading(tpc, strctr.name, 1);

		// Queue not merged yet in all pid's
		tmp = sm.get4reading(tpc, strctr.name, 2);
		files.push(...tmp);

		// Current in all pid's
		tmp = sm.get4reading(tpc, strctr.name, 3);
		files.push(...tmp);

		// Process file list
		for (let i = 0; i < files.length; i++) {
			if (test("-f", files[i])) {
				await this.scanFile(files[i]);
			}
		}
	}
}
