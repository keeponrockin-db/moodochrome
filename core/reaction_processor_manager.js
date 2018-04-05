'use strict'
const reload = require('require-reload')(require);
const FileSystemUtils = reload('./util/file_system_utils.js');
const ReactionProcessor = reload('./reaction_processor.js');
const PublicError = reload('./../core/public_error.js');
const strings = reload('./string_factory.js').messageProcessorManager;
const statistics = require('./statistics.js');

function handleError(msg, err, logger, config) {
  const loggerTitle = 'REACTION';
  let errorToOutput = err;
  if (!errorToOutput.output) {
    errorToOutput = PublicError.createWithGenericPublicMessage(false, '', err);
  }
  errorToOutput.output(logger, loggerTitle, undefined, msg, true);
}

/**
* Loads and executes commands in response to user input.
*/
class ReactionProcessorManager {
  /**
  * @param {String} directory - The directory to load reaction processors from
  * @param {Logger} logger - The logger to log to
  */
  constructor(logger) {
    this.logger_ = logger;
    this.processors_ = [];
  }

  /**
  * Loads reaction processors. Can be called to reload reaction processors that have been edited.
  */
  load(directory) {
    const loggerTitle = 'REACTION MANAGER';
    this.processors_ = [];
    return FileSystemUtils.getFilesInDirectory(directory).then((processorFiles) => {
      for (let processorFile of processorFiles) {
        try {
          let processorInformation = reload(processorFile);
          let processor = new ReactionProcessor(processorInformation);
          this.processors_.push(processor);
        } catch (err) {
          this.logger_.logFailure(loggerTitle, 'Failed to load reaction processor from file: ' + processorFile, err);
        }
      }
      this.processors_.push(new ReactionProcessor(reload('./reaction_processors/user_and_channel_hook.js')));
    }).catch(err => {
      this.logger_.logFailure(loggerTitle, strings.genericLoadingError, err);
    });
  }

  /**
  * Receives and considers agreeing to process user input.
  * @param {Eris.Message} msg - The msg to process.
  * @param {String} emoji
  * @param {String} userId
  * @returns {Boolean} True if a reaction processor accepted responsibility to handle the message and did so, false otherwise.
  */
  processInput(msg, emoji, userId) {
    let handledByProcessorName = this.processInputHelper_(msg, emoji, userId);
    if (handledByProcessorName) {
      statistics.incrementMessagesProcessedForCommandName(handledByProcessorName, userId);
      return true;
    }
    return false;
  }

  processInputHelper_(msg, emoji, userId) {
    const loggerTitle = 'REACTION';
    for (let processor of this.processors_) {
      try {
        let result = processor.handle(msg, emoji, userId);
        if (result && result.then) {
          result.then(innerResult => {
            if (typeof innerResult === typeof '') {
              throw PublicError.createWithGenericPublicMessage(false, innerResult);
            }
            this.logger_.logReactionReaction(loggerTitle, msg, emoji, userId, processor.name, true);
          }).catch(err => handleError(msg, err, this.logger_));
          return processor.name;
        } else if (typeof result === typeof '') {
          throw PublicError.createWithGenericPublicMessage(false, result);
        } else if (result === true) {
          this.logger_.logReactionReaction(loggerTitle, msg, emoji, userId, processor.name, true);
          return processor.name;
        } else if (result !== false) {
          this.logger_.logFailure(loggerTitle, 'Reaction processor \'' + processor.name +
            '\' returned an invalid value. It should return true if it will handle the message, false if it will not. A promise will be treated as true and resolved.');
        }
      } catch (err) {
        handleError(msg, err, this.logger_);
        return processor.name;
      };
    }

    return false;
  }
}

module.exports = ReactionProcessorManager;
