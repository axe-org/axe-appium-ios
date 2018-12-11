'use strict';

// 跟reporter交互。

var request = require('request-promise');

var baseurl = 'http://localhost:2670';
function post(url, data) {
  return request({
    url: baseurl + url,
    method: 'POST',
    json: true,
    headers: {
      'content-type': 'application/json'
    },
    body: data
  }).then(function (response) {
    // 当 response 中有 error时，也直接出错。
    if (response.error) {
      console.error(response.error);
      // TODO 崩溃。
    }
    return response;
  });
};

function mark(info) {
  return post('/test/mark.json', info);
}

function endProfile() {
  var suiteID = process.env.suiteID;
  var profileType = process.env.profileType;
  return post('/endUploadTrace.json', {
    profile: profileType,
    suiteID: suiteID
  });
}

function createScenario(scenarioInfo) {
  var suiteID = process.env.suiteID;
  scenarioInfo['suiteID'] = suiteID;
  return post('/test/createScenario.json', scenarioInfo);
}

function endScenario(scenarioInfo) {
  var suiteID = process.env.suiteID;
  scenarioInfo['suiteID'] = suiteID;
  return post('/test/endScenario.json', scenarioInfo);
}

module.exports = {
  mark: mark,
  endProfile: endProfile,
  createScenario: createScenario,
  endScenario: endScenario
};