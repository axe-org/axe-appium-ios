const device = require('./device')
const {execSync} = require('child_process')
const path = require('path')
const reporter = require('./reporter')
const fileHelper = require('../common/fileHelper')
const os = require('os')
const fs = require('fs')

let localAddress
function run (setting) {
  let ifaces = os.networkInterfaces()
  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return
      }
      localAddress = `http://${iface.address}:2670`
    })
  })
  let reporterServerURL = setting.testServer
  if (reporterServerURL === 'localhost') {
    reporterServerURL = localAddress
  }
  process.env.reporterServerURL = reporterServerURL
  if (setting.testType === 'debug') {
    debugTest(setting)
  } else if (setting.testType === 'profile') {
    profileTest(setting)
  } else if (setting.testType === 'release') {
    releaseTest(setting)
  } else {
    console.error('请设置正确的 测试类型！')
    process.exit(1)
  }
}

async function debugTest (setting) {
  // 获取设备列表。
  let udidList = setting.debugTestDevices
  let deviceList = []
  if (udidList && udidList.length) {
    // 获取设备列表。
    udidList.forEach(udid => {
      let deviceInfo = device.getDeviceForUdid(udid)
      if (!device) {
        console.error('未找到设备 ', udid)
      } else {
        deviceList.push(deviceInfo)
      }
    })
  } else {
    // 默认， 使用第一个真机设备。
    let deviceInfo = device.realDevices[0]
    deviceList.push(deviceInfo)
  }
  for (let i = 0; i < deviceList.length; i++) {
    let device = deviceList[i]
    await mochaTest(device)
  }
}

async function releaseTest (setting) {
  // 获取设备列表。
  let udidList = setting.releaseTestDevices
  let deviceList = []
  if (udidList && udidList.length) {
    // 获取设备列表。
    udidList.forEach(udid => {
      let deviceInfo = device.getDeviceForUdid(udid)
      if (!device) {
        console.error('未找到设备 ', udid)
      } else {
        deviceList.push(deviceInfo)
      }
    })
  } else {
    // 默认， 使用所有真机
    deviceList = device.realDevices.slice()
  }
  for (let i = 0; i < deviceList.length; i++) {
    let device = deviceList[i]
    await mochaTest(device)
  }
}

async function profileTest (setting) {
  let profileTestSetting = setting.profileTestSetting
  for (const profileType in profileTestSetting) {
    // 获取设备列表。
    let udidList = profileTestSetting[profileType]
    let deviceList = []
    if (udidList && udidList.length) {
      // 获取设备列表。
      udidList.forEach(udid => {
        let deviceInfo = device.getDeviceForUdid(udid)
        if (!device) {
          console.error('未找到设备 ', udid)
        } else {
          deviceList.push(deviceInfo)
        }
      })
    } else {
      // 默认， 使用第一个真机设备。
      let deviceInfo = device.realDevices[0]
      deviceList.push(deviceInfo)
    }
    for (let i = 0; i < deviceList.length; i++) {
      let device = deviceList[i]
      if (device.isSimulator) {
        console.log('异常，当前只支持真机进行性能测试。 因为模拟器性能太好了，无法真正体现性能问题。')
        continue
      }
      device['profileType'] = profileType
      await mochaTest(device)
    }
  }
}

let workPath = process.cwd()
// 调用mocha进行测试
async function mochaTest (device) {
  process.env.profileType = device.profileType || ''
  console.log(`device: ${device.deviceName} , udid: ${device.udid}`, device.profileType ? ` , profile: ${device.profileType}` : '')
  process.env.deviceName = device.deviceName
  process.env.platformVersion = device.platformVersion
  process.env.udid = device.udid
  // 模拟器与真机的app地址不同。
  if (device.isSimulator) {
    process.env.app = path.join(workPath, '..', 'build', 'iphonesimulator', 'Build', 'Products', 'Release-iphonesimulator', 'Localhost.app')
  } else {
    process.env.app = path.join(workPath, '..', 'build', 'iphoneos', 'Build', 'Products', 'Release-iphoneos', 'Localhost.app')
  }
  let response = await reporter.startSuite({
    deviceName: device.deviceName,
    platformVersion: device.platformVersion,
    udid: device.udid,
    model: device.model,
    type: device.profileType ? 'profile' : 'test',
    starTime: new Date().getTime(),
    profile: device.profileType
  })
  let suiteID = response.id
  process.env.suiteID = suiteID

  let crashPath = path.join(workPath, '..', 'build', 'deviceLog')
  try {
    // 先清空日志。
    execSync(`rm -rf ${crashPath} && mkdir ${crashPath}`)
    // 导出崩溃日志可能会失败，所以要做重试。
    for (let i = 0; i < 20; i++) {
      try {
        execSync(`idevicecrashreport -u ${device.udid} -e ${crashPath}`)
        break
      } catch (error) {
      }
    }
    execSync(`mocha test.js`, {stdio: [0, 1, 2]})
  } catch (error) {
    // console.error(error)
  } finally {
    // 然后才找到真正的崩溃日志。
    execSync(`rm -rf ${crashPath} && mkdir ${crashPath}`)
    // 导出崩溃日志可能会失败，所以要做重试。
    for (let i = 0; i < 20; i++) {
      try {
        execSync(`idevicecrashreport -u ${device.udid} -e ${crashPath}`)
        break
      } catch (error) {
      }
    }
  }
  let crashLog
  // 找到崩溃日志。
  fs.readdirSync(crashPath).forEach(file => {
    if (/Localhost-\d{4}-\d{2}-\d{2}-(\d{2})(\d{2})(\d{2})\.ips/.test(file)) {
      let crashFilePath = path.join(crashPath, file)
      crashLog = fs.readFileSync(crashFilePath, 'utf-8')
    }
  })
  // 读取输出文件。
  let data = fileHelper.getXunitReporter()
  console.log(JSON.stringify(data))
  await reporter.endSuite({
    suiteID: suiteID,
    data: data,
    endTime: new Date().getTime(),
    crashLog: crashLog
  })
}

module.exports = {
  run: run
}
