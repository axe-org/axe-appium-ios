#!/usr/bin/env node
const path = require('path')
const device = require('./device')
const _mocha = require('./mocha')
const fs = require('fs')
const reporter = require('./reporter')
const npmRun = require('npm-run')
// const process = require('child_process')

const child = npmRun.exec('axe-test-server', {cwd: process.cwd()})

require('child_process').spawnSync('sleep', [2])
let needExit = false
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
  let testOutputDir = path.resolve(setting.testOutputDir)
  if (fs.existsSync(testOutputDir)) {
    // fs.rmdirSync(setting.testOutputDir)
    require('child_process').execSync('rm -rf ' + testOutputDir)
  }
  fs.mkdirSync(testOutputDir)
  // 告知服务器文件存储路径.
  reporter.setReporterSavePath(testOutputDir)
  // 下载测试报告到该目录。
  require('child_process').exec(`curl -L https://github.com/axe-org/axe-test-report/releases/download/v0.2.0-alpha.0/axe-test-report.zip > axe-test-report.zip && unzip axe-test-report.zip && rm axe-test-report.zip`,
    {cwd: testOutputDir}, () => {
      if (needExit) {
        child.kill('SIGINT')
        process.exit(0)
      }
      needExit = true
    })
}
device.getDeviceInfo(async (error) => {
  if (error) {
    process.exit(1)
  }
  await _mocha.run(setting)
  // 测试完成后，关闭应用。
  if (needExit) {
    child.kill('SIGINT')
    process.exit(0)
  }
  needExit = true
})
