import wd from 'wd'
import reporter from './reporter'
import action from './action'

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let driver
// 开始和关闭，一般来说不应该手动操作， 这是为了支持之后多段测试而准备的。 但是多段测试的问题，在于展示页面的处理。
// 初始化，返回一个wd对象。
async function init () {
  let deviceName = process.env.deviceName
  let udid = process.env.udid
  let platformVersion = process.env.platformVersion
  let app = process.env.app
  let profileType = process.env.profileType
  driver = await wd.promiseChainRemote({
    host: 'localhost',
    port: 4723
  })
  await driver.init({
    platformName: 'iOS',
    automationName: 'XCUITest',
    sendKeyStrategy: 'oneByOne',
    useNewWDA: 'true',
    udid: udid,
    deviceName: deviceName,
    platformVersion: platformVersion,
    app: app
  })
  let reportServerURL = process.env.reporterServerURL
  let data = Buffer.from(reportServerURL).toString('base64')
  await driver.pushFile('@org.axe.Localhost/Documents/axe_middle_server_url', data)
  // 上传中转服务器地址到APP中。
  if (profileType !== '') {
    await driver.execute('mobile:startPerfRecord', {profileName: profileType, pid: 'current'})
    await sleep(1000)
  }
  await sleep(500)
  return driver
}
// 关闭。
async function close () {
  if (!driver) return
  let profileType = process.env.profileType
  if (profileType !== '') {
    await driver.execute('mobile:stopPerfRecord', {
      'profileName': profileType,
      'remotePath': 'http://localhost:2670/uploadTrace',
      'method': 'POST'})
    // 完成上传后，要做一个标记。以在后台找到该文件。
    await reporter.endProfile()
  }
  await driver.closeApp()
  await driver.quit()
  driver = undefined
}

// 获取driver.
async function getDriver () {
  if (driver) {
    return driver
  } else {
    return init()
  }
}

let currentScenarioID

async function createScenario (test) {
  let response = await reporter.createScenario({
    title: test.title,
    startTime: new Date().getTime()
  })
  currentScenarioID = response.id
}

async function endScenario (test) {
  await reporter.endScenario({
    duration: test.duration,
    endTime: new Date().getTime(),
    status: test.status,
    id: currentScenarioID
  })
}

// 做一个标记。记录时间、操作名称、和进行截图。
async function mark (title) {
  // TODO 截图操作
  let screenshot = await driver.takeScreenshot()
  let time = new Date().getTime()
  return reporter.mark({
    title: title,
    time: time,
    suiteID: process.env.suiteID,
    scenarioID: currentScenarioID,
    data: screenshot
  }).catch(err => {
    console.log(err.message)
  })
}

export default {
  init: init,
  close: close,
  getDriver: getDriver,
  mark: mark,
  createScenario: createScenario,
  endScenario: endScenario,
  action: action,
  sleep: sleep
}
