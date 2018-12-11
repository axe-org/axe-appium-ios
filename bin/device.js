const {exec} = require('child_process')

const deviceModelTypes = {
  'iPhone1,1': 'iPhone',
  'iPhone1,2': 'iPhone 3G',
  'iPhone2,1': 'iPhone 3GS',
  'iPhone3,1': 'iPhone 4',
  'iPhone3,2': 'iPhone 4 GSM Rev A',
  'iPhone3,3': 'iPhone 4 CDMA',
  'iPhone4,1': 'iPhone 4S',
  'iPhone5,1': 'iPhone 5 (GSM)',
  'iPhone5,2': 'iPhone 5 (GSM+CDMA)',
  'iPhone5,3': 'iPhone 5C (GSM)',
  'iPhone5,4': 'iPhone 5C (Global)',
  'iPhone6,1': 'iPhone 5S (GSM)',
  'iPhone6,2': 'iPhone 5S (Global)',
  'iPhone7,1': 'iPhone 6 Plus',
  'iPhone7,2': 'iPhone 6',
  'iPhone8,1': 'iPhone 6s',
  'iPhone8,2': 'iPhone 6s Plus',
  'iPhone8,3': 'iPhone SE (GSM+CDMA)',
  'iPhone8,4': 'iPhone SE (GSM)',
  'iPhone9,1': 'iPhone 7',
  'iPhone9,2': 'iPhone 7 Plus',
  'iPhone9,3': 'iPhone 7',
  'iPhone9,4': 'iPhone 7 Plus',
  'iPhone10,1': 'iPhone 8',
  'iPhone10,2': 'iPhone 8 Plus',
  'iPhone10,4': 'iPhone 8',
  'iPhone10,5': 'iPhone 8 Plus',
  'iPhone10,3': 'iPhone X',
  'iPhone10,6': 'iPhone X GSM',
  'iPhone11,2': 'iPhone XS',
  'iPhone11,4': 'iPhone XS Max',
  'iPhone11,6': 'iPhone XS Max China',
  'iPhone11,8': 'iPhone XR'
}

let realDevices = []
let simulators = []

// 初始化，通过instruments 命令获取设备信息。 返回值第一个值为 error ,如果存在，则表示失败。
function getDeviceInfo (callback) {
  exec('instruments -s', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return callback(error)
    }
    let splits = stdout.split('\n')
    splits.forEach(function (item) {
      if (/(.+) \((\d+\.\d.?\d?)\) \[(.+)\].*/.test(item)) {
        let deviceName = RegExp.$1
        let platformVersion = RegExp.$2
        let udid = RegExp.$3
        let deviceInfo = {
          deviceName: deviceName,
          platformVersion: platformVersion,
          udid: udid
        }
        if (/.*\(Simulator\)/.test(item)) {
          deviceInfo.model = 'simulator'
          // 还需要过滤调 其他设备，只用iphone.
          if (/iPhone.*/.test(item)) {
            simulators.push(deviceInfo)
          }
        } else {
          realDevices.push(deviceInfo)
        }
      }
    })
    // 对于真机，获取设备型号信息。
    exec('system_profiler SPUSBDataType', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return callback(error)
      }
      stdout = stdout.replace(/\n/g, ' ')
      let list = /iPhone:.*?Serial Number: .*? /g.exec(stdout)
      realDevices.forEach(device => {
        list.forEach(item => {
          if (item.search(device.udid) !== -1) {
            // 找到udid, 获取设备型号。
            if (/Version: (\d{1,2})\.(\d{1,2})/.test(item)) {
              let level = parseInt(RegExp.$1)
              let type = parseInt(RegExp.$2)
              let model = `iPhone${level},${type}`
              device.model = deviceModelTypes[model]
            } else {
              device.model = 'unknow'
            }
          }
        })
      })
      callback()
    })
  })
}

// 根据Udid获取设备。
function getDeviceForUdid (udid) {
  for (let i = 0; i < realDevices.length; i++) {
    let device = realDevices[i]
    if (device.udid === udid) {
      return device
    }
  }
  for (let i = 0; i < simulators.length; i++) {
    let device = simulators[i]
    if (device.udid === udid) {
      return device
    }
  }
  return undefined
}

module.exports = {
  getDeviceInfo: getDeviceInfo,
  realDevices: realDevices,
  simulators: simulators,
  getDeviceForUdid: getDeviceForUdid
}
