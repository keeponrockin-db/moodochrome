'use strict'
const reload = require('require-reload')(require);

/**
 * @typedef {Object} ActionResponse
 * @property {boolean} True if the reaction was handled by the reaction processor, false if not.
 * @property {error} If the reaction was handled by the reaction processor but errored, a brief error message for the log.
 */

/**
* Represents a reaction processor.
* @property {String} name - The name of the processor (for logging purposes).
*/
class ReactionProcessor {
  /**
  * @param {Object} processorData - The raw processor data loaded from a file.
  */
  constructor(processorData) {
    if (!processorData) {
      throw new Error('No processor data');
    }
    if (!processorData.action || typeof processorData.action !== 'function') {
      throw new Error('Processor does not have an action, or it is not a function.');
    }
    if (!processorData.name || typeof processorData.name !== typeof '') {
      throw new Error('Processor does not have a name , or it is not a string.');
    }

    this.name = processorData.name;
    this.action_ = processorData.action;
  }

  /**
  * Try handling a reaction.
  * @param {Eris.Message} msg - The Eris message to consider handling.
  * @param {String} emoji
  * @param {String} userId
  * @returns {(boolean|ActionResponse)} Returns the return value of the action. That should be either true if the message was handled, false otherwise.
  *   Alternatively, an ActionResponse can be returned with an error string for logging.
  */
  handle(msg, emoji, userId) {
    return this.action_(msg, emoji, userId);
  }
}

module.exports = ReactionProcessor;
