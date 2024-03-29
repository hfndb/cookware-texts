"use strict";
import { DateUtils } from "../../../../object.mjs";
import { VARIANT } from "../../index.mjs";

/** Transform variants aka types to string vice versa
 */
export default class TsvPlugin {
	eon = "\n"; // End of note, while reading or writing
	ext = ".tsv";
	fileFormat = "txt"; // For Reader
	name = "tsv";

	/**
	 * Temp replacers for... in string variant.
	 *
	 * Newline
	 * Used: Because sign
	 *
	 * Tab
	 * Used: Therefore sign
	 *
	 * @see https://en.wikipedia.org/wiki/Therefore_sign
	 *
	 * If control codes for newline or tab are used in a note,
	 * they will be permanently be replaced by ⊥ (falsum symbol)
	 *
	 * @see https://en.wikipedia.org/wiki/Falsum
	 */
	static replacers = {
		newline: {
			regexFrom: /∴/gm,
			regexTo: /\n/gm,
			sign: "∴",
		},
		tab: {
			regexFrom: /∵/gm,
			regexTo: /\t/gm,
			sign: "∵",
		},
	};

	/**
	 * String to variant
	 *
	 * @private
	 * @param {number} variant
	 * @param {string} val Value
	 * @returns {*}
	 */
	string2variant(variant, val) {
		let rt = val;

		switch (variant) {
			case VARIANT.BOOLEAN:
				rt = val ? true : false;
				break;
			case VARIANT.FLOAT:
				rt = val.includes(".") ? parseFloat(val) : parseInt(val);
				break;
			case VARIANT.INT:
				rt = parseInt(val);
				break;
			case VARIANT.STRING:
				rt = val
					.replace(TsvPlugin.replacers.newline.regexFrom, "\n")
					.replace(TsvPlugin.replacers.tab.regexFrom, "\t");
				break;
			case VARIANT.DATE:
				// Month readable but month for Date instance starts with index 0
				rt = new Date(
					parseInt(val.substring(0, 4)),
					parseInt(val.substring(4, 6)) - 1,
					parseInt(val.substring(6, 8)),
				);
				break;
			case VARIANT.DATETIME:
				// Month readable but month for Date instance starts with index 0
				rt = new Date(
					parseInt(val.substring(0, 4)),
					parseInt(val.substring(4, 6)) - 1,
					parseInt(val.substring(6, 8)),
					parseInt(val.substring(8, 10)),
					parseInt(val.substring(10, 12)),
				);
				break;
			case VARIANT.ARRAY:
			case VARIANT.OBJECT:
				rt = JSON.parse(val);
				break;
			default:
				rt = val;
		}
		return rt;
	}

	/**
	 * Variant to string
	 *
	 * @private
	 * @param {number} variant
	 * @param {*} val Value
	 * @returns {string}
	 */
	variant2string(variant, val) {
		let rt = val;

		switch (variant) {
			case VARIANT.BOOLEAN:
				rt = val ? "1" : "0";
				break;
			case VARIANT.FLOAT:
			case VARIANT.INT:
				rt = val.toString();
				break;
			case VARIANT.STRING:
				rt = val
					.replace(
						TsvPlugin.replacers.newline.regexTo,
						TsvPlugin.replacers.newline.sign,
					)
					.replace(TsvPlugin.replacers.tab.regexTo, TsvPlugin.replacers.tab.sign);
				break;
			case VARIANT.DATE:
			case VARIANT.DATETIME:
				if (!rt) return ""; // Empty date
				let p = DateUtils.date2parts(val);
				rt = `${p.year}${p.month}${p.day}`;
				if (variant == VARIANT.DATETIME) rt += `${p.hours}${p.minutes}`;
				break;
			case VARIANT.ARRAY:
			case VARIANT.OBJECT:
				rt = JSON.stringify(val);
				break;
		}
		return rt;
	}

	/**
	 * Parts in a structure to writable for file system
	 *
	 * @param {Note} obj
	 * @returns {string}
	 */
	parts2writable(obj) {
		let ta = [];
		let part, val;
		for (let i = 0; i < obj.__structure.parts.length; i++) {
			part = obj.__structure.parts[i];
			val = obj[part.name];
			ta.push(this.variant2string(part.variant, val));
		}
		return ta.join("\t") + this.eon;
	}

	/**
	 * Writable for file system to object.
	 * Empty parts will be set to a value of null.
	 *
	 * @param {string} str Incoming from file system
	 * @param {Part[]} prts
	 * @returns {Object|null}
	 */
	writable2object(str, prts, obj) {
		let ta = str.split("\t"),
			tr = {},
			part,
			val;

		for (let i = 0; i < prts.length; i++) {
			part = prts[i];
			val = ta[i];
			if (!val) {
				tr[part.name] = null;
				continue;
			}
			tr[part.name] = this.string2variant(part.variant, val);
		}

		return tr;
	}
}
