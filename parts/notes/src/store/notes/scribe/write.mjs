"use strict";
import { Buffer } from "node:buffer";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { Lock } from "../../../file-system/lock.mjs";
import { Queues } from "../../../queue.mjs";
import { NOTE_STATUS } from "../index.mjs";
import {
	mv,
	test,
	touch,
	FileUtils,
	log,
	Notes,
	Note,
	Topic,
} from "../index.mjs";
import { StoreManager } from "../manager.mjs";
import { Reader } from "./read.mjs";

/**
 * Approach:
 * - Write each new item to a separate file (fast but risking many files)
 * - Move current to queue file if max size is reached
 * - Use bash script and cron to merge()
 */

export class Writer {
	batch; // Incoming batch to write, raw data

	lastIndex4key = -1; // For updating keys after succesfully writing

	newKeys = []; // Newly obtained keys during batch

	size = {
		toWrite: 0,
		written: 0,
	};

	success = true;

	path = ""; // To 'current'

	/** Called from StoreManager and here at the end of append()
	 *
	 * @param {string} tpc
	 * @param {Object} keys
	 * @param {boolean} [queue] Use queue
	 */
	static async keysWrite(tpc, keys, queue = false) {
		let bgn = performance.now();
		FileUtils.writeJsonFile(
			keys,
			StoreManager.topics[tpc].dir,
			StoreManager.topics[tpc].files.keys,
			false,
		);
		Notes.addWrite(performance.now() - bgn, JSON.stringify(keys));

		if (!queue) return;

		let path = join(
			StoreManager.topics[tpc].dir,
			StoreManager.topics[tpc].files.keys,
		);
		Queues.done(path); // For async

		let lck = new Lock(path);
		lck.unlock(); // For other pid's
	}

	/** Called from StoreManager
	 *
	 * @param {Topic} tpc
	 * @param {boolean} force If already written
	 */
	static structureWrite(tpc, force = false) {
		let t = StoreManager.topics[tpc.name];

		if (test("-f", join(t.dir, t.files.structure)) && !force) return;
		let bgn = performance.now();
		FileUtils.writeJsonFile(tpc, t.dir, t.files.structure, false);
		Notes.addWrite(performance.now() - bgn, JSON.stringify(tpc));
	}

	/** @private
	 */
	async append2file() {
		try {
			let bgn = performance.now();
			appendFileSync(this.path, this.batch);
			Notes.addWrite(performance.now() - bgn, this.batch);
		} catch (err) {
			this.success = false;
			log.error(err.message);
			return;
		}

		this.size.written += this.size.toWrite;
		this.size.toWrite = 0;
	}

	/** @private
	 * @param {Topic} tpc
	 * @param {Structure} strctr
	 * @param {Note[]} changes
	 */
	async updateFiles(tpc, strctr, changes) {
		// Quick check. Any note to update or shred?
		let changed = changes.reduce((acc, item, idx) => {
			if (item.__status == NOTE_STATUS.NEW) return acc;
			acc = true;
			return acc;
		}, false);

		if (!changed) return;

		let idx,
			sm = await StoreManager.getInstance(),
			rewrite = false,
			rt,
			rdr = new Reader(),
			tmp;

		// Collect file list to process:

		// Merged in all servers
		let files = sm.get4reading(tpc, strctr.name, 1);

		// Queue not merged yet in all pid's
		tmp = sm.get4reading(tpc, strctr.name, 2);
		files.push(...tmp);

		// Current in all pid's
		tmp = sm.get4reading(tpc, strctr.name, 3);
		files.push(...tmp);

		// Function for Reader.scanFile()
		let processNote = nt => {
			idx = changes.findIndex(item => item.key == nt.key);
			if (idx < 0) return 1; // No change, add to rt

			if (changes[idx].__status == NOTE_STATUS.SHREDDED) {
				rewrite = true;
				return 0; // Ignore
			}

			if (changes[idx].__status == NOTE_STATUS.CHANGED) {
				rewrite = true;
				return 1; // Add to rt
			}
		};

		// Process file list
		for (let i = 0; i < files.length; i++) {
			if (!test("-f", files[i])) continue;
			rewrite = false;

			// Collect all notes to write in rt while filtering out shredded
			rt = await rdr.scanFileForEdit(tpc, strctr, files[i], processNote);
			if (!rewrite) continue;

			// Convert Note instances in rt to writeables
			for (let i = 0; i < rt.length; i++) {
				idx = changes.findIndex(item => item.key == rt[i].key);
				if (idx >= 0 && changes[idx].__status == NOTE_STATUS.CHANGED) {
					rt[i] = changes[idx]; // Replace note
				}
				rt[i] = Note.get2write(tpc, rt[i]);
			}

			// Overwrite
			await Queues.get(files[i]); // Just to be sure
			FileUtils.writeFile("", files[i], rt.join(""), false, true);
			Queues.done(files[i]);
		}
	}

	/**
	 * Append to current
	 *
	 * @param {string} server
	 * @param {string} pid
	 * @param {Topic} tpc
	 * @param {Structure} strctr
	 * @param {Note[]} toWrite
	 * @returns {Promise<boolean>} for success
	 */
	async write(server, pid, tpc, strctr, toWrite) {
		await this.updateFiles(tpc, strctr, toWrite); // First update

		let sm = await StoreManager.getInstance();
		let keys = await Reader.getKeys(tpc.name, true);

		// Needed for append2file()
		this.batch = ""; // raw data to write
		this.success = true;
		this.path = sm.getCurrent4process(tpc, strctr.name, server, pid);

		await Queues.get(this.path); // Just to be sure

		let sizes = {
			current: FileUtils.getFileSize(this.path), // -1 if not found
			note: 0,
		};

		let data, nt;
		for (let i = 0; this.success && i < toWrite.length; i++) {
			nt = toWrite[i]; // Note
			if (nt.__status != NOTE_STATUS.NEW) continue;

			// Get new key
			if (!keys[tpc.name][strctr.name]) keys[tpc.name][strctr.name] = 0; // In case of very first
			nt.key = ++keys[tpc.name][strctr.name];
			this.newKeys.push(nt.key);

			data = Note.get2write(tpc, nt);
			sizes.note = Buffer.byteLength(data, "utf8");

			let isLast = i == toWrite.length - 1;
			let needsNext =
				sizes.current + this.size.written + this.size.toWrite + sizes.note >
				Notes.options.maxSize.current;

			this.size.toWrite += sizes.note;
			this.batch += data;
			if (isLast || needsNext) {
				if (needsNext) {
					// Move current file to queue file
					mv(
						this.path,
						sm.getQueueFile4process(tpc, strctr.name, server, pid, true),
					);
					touch(this.path); // Force creation of new current file
					sizes.current = 0;
					this.size.written = 0;
				}
				await this.append2file();
			}
		}

		Queues.done(this.path);
		await Writer.keysWrite(tpc.name, keys, true);

		return this.success;
	}
}
