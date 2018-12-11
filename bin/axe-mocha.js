#!/usr/bin/env node
const path = require('path')
const device = require('./device')
const _mocha = require('./mocha')
const fs = require('fs')
const reporter = require('./reporter')
// const process = require('child_process')

let testType = 'debug'
if (process.argv.length === 3) {
  // 测试类型 ， debug , release , profile
  testType = process.argv[2]
} else {
  console.log('error')
  process.exit(1)
}

let workPath = process.cwd()
let settingPath = path.join(workPath, 'setting.json')
const setting = require(settingPath)
setting.testType = testType

if (!setting.testOutputDir) {
  console.log('必须设置 testOutputDir 属性，以声明测试输出文件的存放路径')
  process.exit(1)
} else {
  // 创建文件夹
  if (fs.existsSync(setting.testOutputDir)) {
    // fs.rmdirSync(setting.testOutputDir)
    require('child_process').execSync('rm -rf ' + setting.testOutputDir)
  }
  fs.mkdirSync(setting.testOutputDir)
  // 告知服务器文件存储路径.
  reporter.setReporterSavePath(path.resolve(setting.testOutputDir))
}

device.getDeviceInfo((error) => {
  if (error) {
    process.exit(1)
  }
  _mocha.run(setting)
})
