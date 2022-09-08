"use strict";
/**
 * Principle:
 *     Alternative to create and maintain a strict queue for specific activity
 *     to prevent concurrent activity.
 *
 * Method:
 *     Keeps a register, queues with requests.
 *     Each kind of activity has a unique identifier.
 *     From there a matter like waiting for your turn in a queue.
 *
 * Applied hack:
 *   - Principle as in a shop:
 *     If you make a promise, you will fulfill that. Or not.
 *     In a waiting queue, an expectation is not fulfilled by you but from the outside.
 *
 *   - Principle as in a court system:
 *     A judge can't use a promise, but wants a witness to fullfil an expectation.
 *     "Next witness please. Do you solemnly swear to..."
 *     is like hacking a psyche to magically create a promise within a witness to
 *     create or uphold an expectation from a judge that will be fulfilled by a witness.
 *
 *   - In JavaSscript, a Promise is fulfilled from within outwards.
 *     In the code below, a hack for a Promise changes this standard behavior,
 *     to behavior like in a waiting queue, queued expectations so to say.
 *     @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 *
 * Applications of this principle:
 *
 * @example
 * // Lock access to a file, thus preventing writing and afterwards removing an additional .lock file
 *
 * let file = "/tmp/test"; // Unique key for queue
 * await Queues.get(file); // Queues can be read as Expectations
 * // Write to file system here
 * Queues.done(file);
 */
export class Queues {
	static dm = false; // Debug mode

	/**
	 * Queues operational.
	 * Static vars are thread safe in multi thread environments.
	 *
	 * @private
	 * @todo In a multithreaded environment queues could be registered using memcache(d) or redis
	 * @see https://github.com/weyoss/redis-smq ; message queue using redis-server
	 */
	static queue = {};

	/**
	 * Process next shift in one specific queue
	 *
	 * @private
	 * @param {string} key Unique key
	 */
	async nextShift(key) {
		// If busy for key, return
		if (Queues.queue[key].q.length == 0) return;

		// Mark key as busy
		Queues.queue[key].b = true;

		// Get next shift in this queue, remove from array
		let shift = Queues.queue[key].q.shift();
		// array: idx 0 = waiting promise, 1 = function to fullfil, resolve that promise

		// Signal that time slot has been obtained
		shift[1](true);
	}

	/**
	 * Method to add a lock to a unique key
	 *
	 * @param {string} key Unique key
	 */
	static async get(key) {
		// (Create and) add to queue
		if (!Queues.queue[key])
			Queues.queue[key] = {
				b: false, // busy
				q: [], // queue for key
			};

		// Get queue going
		let cnt = Queues.queue[key].q.push([null, null]) - 1;
		const prms = new Promise(function(resolve) {
			Queues.queue[key].q[cnt][1] = resolve;
		});
		Queues.queue[key].q[cnt][0] = prms;
		let fl = new Queues();
		fl.nextShift(key); // Don't wait here

		await prms; // Wait for turn in queue
	}

	/**
	 * Method to remove a lock from a key
	 *
	 * @param {string} key Unique key
	 */
	static done(key) {
		// Remove 'busy' from key
		Queues.queue[key].b = false;

		if (Queues.queue[key].q.length == 0) return;
		let fl = new Queues();
		fl.nextShift(key); // Don't wait here
	}
}
