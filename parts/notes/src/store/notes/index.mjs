"use strict";
import shelljs from "shelljs";
import { FileUtils } from "../../file-system/files.mjs";
import { ObjectUtils } from "../../object.mjs";
import { StringExt } from "../../utils.mjs";
import { log } from "./integration.mjs";
import { Inquirer } from "./inquirer.mjs";
import { Note } from "./meta/note.mjs";
import { Part } from "./meta/part.mjs";
import { Structure } from "./meta/structure.mjs";
import { Topic } from "./meta/topic.mjs";
import { Notes } from "./notes.mjs";
const { exec, mv, test, touch } = shelljs;

let VARIANT = {
	ARRAY: 1,
	BOOLEAN: 2,
	DATE: 3,
	DATETIME: 4,
	FLOAT: 5,
	FOREIGN_KEY: 6,
	INT: 7,
	OBJECT: 8,
	STRING: 9,
};

export {
	exec,
	mv,
	test,
	touch,
	FileUtils,
	ObjectUtils,
	StringExt,
	log,
	Inquirer,
	Note,
	Notes,
	Part,
	Structure,
	Topic,
	VARIANT,
};
