// 跟reporter交互。

var request = require('request-promise')

function post (url, data) {
  return request({
    url: url,
    method: 'POST',
    json: true,
    headers: {
      'content-type': 'application/json'
    },
    body: data
  })
};

const baseurl = 'http://localhost:2670'

function setReporterSavePath (path) {
  return post(baseurl + '/setSavePath.json', {path: path})
}

function startSuite (suiteInfo) {
  return post(baseurl + '/test/startSuite.json', suiteInfo)
}

function endSuite (endInfo) {
  return post(baseurl + '/test/endSuite.json', endInfo)
}

module.exports = {
  setReporterSavePath: setReporterSavePath,
  startSuite: startSuite,
  endSuite: endSuite
}
