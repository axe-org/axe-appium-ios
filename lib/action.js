// 与中间层交互，获取AXE组件化的具体操作。
import request from 'request-promise'

function post (url, data) {
  return request({
    url: process.env.reporterServerURL + url,
    method: 'POST',
    json: true,
    headers: {
      'content-type': 'application/json'
    },
    body: data
  }).then(response => {
    // 当 response 中有 error时，也直接出错。
    if (response.error) {
      console.error(response.error)
      throw new Error(response.error)
    }
    return response
  })
};

function getJumpRouteActions (duration) {
  return getRouteActions('jump', duration)
}

function getViewRouteActions (duration) {
  return getRouteActions('view', duration)
}

/**
 * 获取 路由事件
 * @param type 类型 ， 分为 'jump' 和 'view' 两种。
 * @param duration 耗时 ，单位毫秒， 默认为 5000ms 内的所有路由事件。 
 * @returns [] , 返回值是一个路由事件列表，按照时间倒叙，第一个为最后发生的路由事件。
 * 路由事件数据 {
 *   time: 触发时间 毫秒，
 *   payload: 附带参数
 *   routeURL : 对应URL。
 * }
 */
function getRouteActions (type, duration = 5000) {
  let operation = 'route_' + type
  let now = new Date().getTime()
  let start = now - duration
  return post('/action/getRouteActions.json', {
    type: operation,
    startTime: start,
    endTime: now
  }).then(data => {
    // 避免为空。
    return data.actions ? data.actions : []
  })
}

/**
 * 获取事件列表。
 * @param name 事件名， 如果不填 , 则表示不限制事件名称。
 * @param duration 耗时，默认为 5000毫秒内的事件
 */
function getEventActions (name = undefined, duration = 5000) {
  let now = new Date().getTime()
  let start = now - duration
  return post('/action/getEventActions.json', {
    name: name,
    startTime: start,
    endTime: now
  }).then(data => {
    // 避免为空。
    return data.actions ? data.actions : []
  })
}


function getDataCenterSetActions (key, duration = 5000) {
  return getDataCenterActions('set', duration)
}

function getDataCenterRemoveActions (key, duration = 5000) {
  return getDataCenterActions('remove', duration)
}

function getDataCenterGetActions (key, duration = 5000) {
  return getDataCenterActions('get', duration)
}

/**
 * 获取数据中心的操作
 * @param {*} type 类型 
 * @param {*} key  键值
 * @param {*} duration  时长
 */
function getDataCenterActions (type, key, duration = 5000) {
  let now = new Date().getTime()
  let start = now - duration
  return post('/action/getDataCenterActions.json', {
    type: 'data_' + type,
    startTime: start,
    endTime: now,
    key: key
  }).then(data => {
    // 避免为空。
    return data.actions ? data.actions : []
  })
}

export default {
  getJumpRouteActions,
  getViewRouteActions,
  getRouteActions,
  getEventActions,
  getDataCenterActions,
  getDataCenterSetActions,
  getDataCenterRemoveActions,
  getDataCenterGetActions
}