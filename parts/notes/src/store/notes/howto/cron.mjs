#! /usr/bin/env node
import { integrate } from "../integration.mjs";
import { Merger } from "../scribe/merge.mjs";
import { Kitchen } from "./structure.mjs";

/**
 * Example of activity initiated using a cron job, to:
 * - Merge files generated in a process
 *
 * Triggering this file should be organized using cron or anacron.
 * @see https://en.wikipedia.org/wiki/Cron
 * @see https://en.wikipedia.org/wiki/Anacron
 */

// Initialization of variables for standalone usage
integrate(true);

// -----------------------------------------------------
// Section: Merge files generated in a process
// -----------------------------------------------------

// Get instance of Topic
let kitchen = await Kitchen.getInstance();
Merger.mergeServer(kitchen, "localhost");

// -----------------------------------------------------
// Section: Generate standardized reports
// -----------------------------------------------------
// TODO
