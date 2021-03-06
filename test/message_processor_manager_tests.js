const assert = require('assert');
const MessageProcessor = require('./../core/message_processor.js');
const MessageProcessorManager = require('./../core/message_processor_manager.js');
const MockLogger = require('./mock_objects/mock_logger.js');
const MockMessage = require('./mock_objects/mock_message.js');
const MockConfig = require('./mock_objects/mock_config.js');
const strings = require('./../core/string_factory.js').messageProcessorManager;

const config = new MockConfig('Server Admin', ['bot-admin-id']);
const Msg = new MockMessage('channel1', 'user1', 'Username', ['Server Admin'], [], 'msg');
const MsgHello = new MockMessage('channel1', 'user1', 'Username', ['Server Admin'], [], 'hello');
const MsgHello2 = new MockMessage('channel1', 'user1', 'Username', ['Server Admin'], [], 'hello2');

describe('MessageProcessorManager', function() {
  describe('load()', function() {
    it('Fails to load from invalid directory', function() {
      let logger = new MockLogger();
      let processorManager = new MessageProcessorManager(logger);
      return processorManager.load('invalid_dir').then(() => {
        assert(logger.failureMessage === strings.genericLoadingError);
        let result = processorManager.processInput(null, Msg, config);
        assert(result === false);
      });
    });
    it('Fails to load invalid processor', function() {
      let logger = new MockLogger();
      let processorManager = new MessageProcessorManager(logger);
      return processorManager.load(__dirname + '/mock_message_processors/valid_and_invalid').then(() => {
        assert(logger.failed === true);
        let result = processorManager.processInput(null, Msg, config);
        assert(result === false);
      });
    });
    it('Loads valid processors', function() {
      let logger = new MockLogger();
      let processorManager = new MessageProcessorManager(logger);
      return processorManager.load(__dirname + '/mock_message_processors/valid_and_invalid').then(() => {
        let result = processorManager.processInput(null, MsgHello, config);
        assert(result === true);
        result = processorManager.processInput(null, MsgHello2, config);
        assert(result === true);
        result = processorManager.processInput(null, Msg, config);
        assert(result === false);
      });
    });
    it('Gracefully handles exception in processor', function() {
      let logger = new MockLogger();
      let processorManager = new MessageProcessorManager(logger);
      return processorManager.load(__dirname + '/mock_message_processors/valid_throws').then(() => {
        assert(logger.failed !== true);
        let result = processorManager.processInput(null, MsgHello, config);
        assert(logger.failed === true);
      });
    });
    it('Gracefully handles message processor returning undefined', function() {
      let logger = new MockLogger();
      let processorManager = new MessageProcessorManager(logger);
      return processorManager.load(__dirname + '/mock_message_processors/valid_returns_undefined').then(() => {
        assert(logger.failed !== true);
        let result = processorManager.processInput(null, MsgHello, config);
        assert(logger.failed === true);
      });
    });
    it('Gracefully handles message processor returning string', function() {
      let logger = new MockLogger();
      let processorManager = new MessageProcessorManager(logger);
      return processorManager.load(__dirname + '/mock_message_processors/valid_returns_string').then(() => {
        assert(logger.failed !== true);
        let result = processorManager.processInput(null, MsgHello, config);
        assert(logger.failed === true);
      });
    });
  });
});
