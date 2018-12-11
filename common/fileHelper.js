// 文件助手。
const path = require('path')
const fs = require('fs')
const parser = require('xml2json')
const tmp = require('tmp')

function workSpacePath () {
  let workPath = process.cwd()
  return workPath
}

// 测试配置文件。
function settingFilePath () {
  return path.join(workSpacePath(), 'setting.json')
}

// 读取每次测试后输出的文件内容。
function getXunitReporter () {
  let xmlPath = path.join(workSpacePath(), 'json-custom.xml')
  let data = fs.readFileSync(xmlPath)
  // 删除文件.
  fs.unlinkSync(xmlPath)
  return parser.toJson(data, {object: true})
}

// tmp 目录. 由axe-mocha创建。
let tmpObject
function getTmpPath () {
  if (!tmpObject) {
    tmpObject = tmp.dirSync()
  }
  return tmpObject.name
}

function cleanTmp () {
  if (tmpObject) {
    tmpObject.removeCallback()
  }
}

module.exports = {
  settingFilePath: settingFilePath,
  getXunitReporter: getXunitReporter,
  getTmpPath: getTmpPath,
  cleanTmp: cleanTmp
}
