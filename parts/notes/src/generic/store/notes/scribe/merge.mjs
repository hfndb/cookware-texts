"use strict";
import { join } from "node:path";
import { getDirList } from "../../../file-system/dirs.mjs";
import { exec, test, FileUtils, log, Notes, Topic } from "../index.mjs";
import { StoreManager } from "../manager.mjs";

/**
 * For merging queued and current files in processes into 'merged'
 * for structure within a specified server like localhost
 */
export class Merger {
	tpc; // Topic to work with

	vars = {
		merged: "", // 'Merged' file
		sizeMerged: 0, // of that file
		rootPath: "", // of structure for server
		server: "",
		strctr: "", // Structure name
		pid: "",
		queue: "", // Queue file
		sizeQueue: 0,
	};

	constructor(tpc) {
		this.tpc = tpc;
	}

	/** Merge queue files in topic into merged, triggered by cron job
	 *
	 * @param {Topic} tpc
	 * @returns {Promise<boolean>} for success
	 */
	static async mergeServer(tpc, server) {
		StoreManager.topics[tpc.name].dir;
		let sm = await StoreManager.getInstance();
		let mrg = new Merger(tpc);

		for (let i = 0; i < tpc.structures.length; i++) {
			// @ts-ignore
			let strctr = tpc.structures[i];
			if (typeof strctr != "object") {
				strctr = new strctr();
			}
			mrg.vars.merged = sm.getMerged4server(tpc, strctr.name, server);
			mrg.vars.sizeMerged = FileUtils.getFileSize(mrg.vars.merged);
			mrg.vars.rootPath = join(
				Notes.options.dir,
				sm.getDir(tpc.name, strctr.name, server),
			);
			mrg.vars.server = server;
			mrg.vars.strctr = strctr.name;

			// Nesting would become too deep, so create a hierarchical 'waterfall'
			await mrg.processStructure();
		}

		return true;
	}

	/**
	 * Process a structure within a topic passed to mergeServer
	 */
	async processStructure() {
		if (!test("-d", this.vars.rootPath)) return; // No files yet
		let dirs = getDirList(this.vars.rootPath, false); // List of pid's

		for (let i = 0; i < dirs.length; i++) {
			this.vars.pid = dirs[i];
			await this.processQueueFiles();
		}
	}

	/**
	 * Process files for pid selected in processStructure
	 *
	 * @private
	 */
	async processQueueFiles() {
		let ok = true;
		let qd = join(this.vars.rootPath, this.vars.pid);
		let files = FileUtils.getFileList(qd);

		// First merge all numbered queue files
		for (let i = 0; ok && i < files.length; i++) {
			this.vars.queue = files[i];
			if (this.vars.queue.includes("current")) continue;
			this.vars.sizeQueue = FileUtils.getFileSize(this.vars.queue);
			ok = ok || (await this.mergeFiles());
		}

		// Look at remaing current files in pid dir,
		// if untouched for too long, merge them too and
		// remove pid directory.
		let ftm = 1000 * 60; // factor ms to minutes
		let nw = Date.now();
		files = FileUtils.getFileList(qd);
		for (let i = 0; ok && i < files.length; i++) {
			let diff = nw - FileUtils.getLastModified("", files[i]); // diff in ms
			if (diff / ftm < Notes.options.maxRest.current) continue;

			this.vars.queue = files[i];
			let cmd = `cat ${this.vars.queue} >> ${this.vars.merged}; rm -rf ${qd}`;
			try {
				let output = exec(cmd, { async: false, silent: false });
				if (output.code) throw new Error(output.stderr);
			} catch (err) {
				log.warn(err);
			}
		}
	}

	/**
	 * Merge files selected in processQueueFiles
	 */
	async mergeFiles() {
		let sm = await StoreManager.getInstance();
		if (
			this.vars.sizeMerged + this.vars.sizeQueue >
			Notes.options.maxSize.merged
		) {
			this.vars.merged = sm.getMerged4server(
				this.tpc,
				this.vars.strctr,
				this.vars.server,
				true,
			);
		}

		let cmd = `cat ${this.vars.queue} >> ${this.vars.merged}; rm ${this.vars.queue}`;
		try {
			let output = exec(cmd, { async: false, silent: false });
			if (output) throw new Error(output);
			return true;
		} catch (err) {
			log.err(err);
			return false;
		}
	}
}
