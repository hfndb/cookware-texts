"use strict";
import { log, Notes } from "../index.mjs";

export class Transformer {
	static formats = {};

	static async get(f) {
		try {
			if (!Transformer.formats[f]) {
				let file = `./plugins/${f}.mjs`;
				let frmt = await import(file);
				Transformer.formats[f] = new frmt.default();
			}
		} catch (err) {
			log.error(`Loading format ${f} failed`, err);
			process.exit(-1);
		}

		return Transformer.formats[f];
	}
}
