'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// 开始和关闭，一般来说不应该手动操作， 这是为了支持之后多段测试而准备的。 但是多段测试的问题，在于展示页面的处理。
// 初始化，返回一个wd对象。
var init = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var deviceName, udid, platformVersion, app, profileType, reportServerURL, data;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            deviceName = process.env.deviceName;
            udid = process.env.udid;
            platformVersion = process.env.platformVersion;
            app = process.env.app;
            profileType = process.env.profileType;
            _context.next = 7;
            return _wd2.default.promiseChainRemote({
              host: 'localhost',
              port: 4723
            });

          case 7:
            driver = _context.sent;
            _context.next = 10;
            return driver.init({
              platformName: 'iOS',
              automationName: 'XCUITest',
              sendKeyStrategy: 'oneByOne',
              useNewWDA: 'true',
              udid: udid,
              deviceName: deviceName,
              platformVersion: platformVersion,
              app: app
            });

          case 10:
            reportServerURL = process.env.reporterServerURL;
            data = Buffer.from(reportServerURL).toString('base64');
            _context.next = 14;
            return driver.pushFile('@org.axe.Localhost/Documents/axe_middle_server_url', data);

          case 14:
            if (!(profileType !== '')) {
              _context.next = 19;
              break;
            }

            _context.next = 17;
            return driver.execute('mobile:startPerfRecord', { profileName: profileType, pid: 'current' });

          case 17:
            _context.next = 19;
            return sleep(1000);

          case 19:
            _context.next = 21;
            return sleep(500);

          case 21:
            return _context.abrupt('return', driver);

          case 22:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function init() {
    return _ref.apply(this, arguments);
  };
}();
// 关闭。


var close = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var profileType;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (driver) {
              _context2.next = 2;
              break;
            }

            return _context2.abrupt('return');

          case 2:
            profileType = process.env.profileType;

            if (!(profileType !== '')) {
              _context2.next = 8;
              break;
            }

            _context2.next = 6;
            return driver.execute('mobile:stopPerfRecord', {
              'profileName': profileType,
              'remotePath': 'http://localhost:2670/uploadTrace',
              'method': 'POST' });

          case 6:
            _context2.next = 8;
            return _reporter2.default.endProfile();

          case 8:
            _context2.next = 10;
            return driver.closeApp();

          case 10:
            _context2.next = 12;
            return driver.quit();

          case 12:
            driver = undefined;

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function close() {
    return _ref2.apply(this, arguments);
  };
}();

// 获取driver.


var getDriver = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!driver) {
              _context3.next = 4;
              break;
            }

            return _context3.abrupt('return', driver);

          case 4:
            return _context3.abrupt('return', init());

          case 5:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getDriver() {
    return _ref3.apply(this, arguments);
  };
}();

var createScenario = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(test) {
    var response;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return _reporter2.default.createScenario({
              title: test.title,
              startTime: new Date().getTime()
            });

          case 2:
            response = _context4.sent;

            currentScenarioID = response.id;

          case 4:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function createScenario(_x) {
    return _ref4.apply(this, arguments);
  };
}();

var endScenario = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(test) {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return _reporter2.default.endScenario({
              duration: test.duration,
              endTime: new Date().getTime(),
              status: test.status,
              id: currentScenarioID
            });

          case 2:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function endScenario(_x2) {
    return _ref5.apply(this, arguments);
  };
}();

// 做一个标记。记录时间、操作名称、和进行截图。


var mark = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(title) {
    var screenshot, time;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return driver.takeScreenshot();

          case 2:
            screenshot = _context6.sent;
            time = new Date().getTime();
            return _context6.abrupt('return', _reporter2.default.mark({
              title: title,
              time: time,
              suiteID: process.env.suiteID,
              scenarioID: currentScenarioID,
              data: screenshot
            }).catch(function (err) {
              console.log(err.message);
            }));

          case 5:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function mark(_x3) {
    return _ref6.apply(this, arguments);
  };
}();

var _wd = require('wd');

var _wd2 = _interopRequireDefault(_wd);

var _reporter = require('./reporter');

var _reporter2 = _interopRequireDefault(_reporter);

var _action = require('./action');

var _action2 = _interopRequireDefault(_action);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

var driver = void 0;

var currentScenarioID = void 0;

exports.default = {
  init: init,
  close: close,
  getDriver: getDriver,
  mark: mark,
  createScenario: createScenario,
  endScenario: endScenario,
  action: _action2.default,
  sleep: sleep
};