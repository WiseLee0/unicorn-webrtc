const { ipcMain } = require('electron')
const single = require('./signal')
const { send: sendPuppetWindow, shamClose: closePuppetWindow } = require('./windows/puppet')
const { create: createControlWindow, send: sendControlWindow, close: closeControlWindow } = require('./windows/control')
const { create: createMultiplayerWindow, send: sendMultiplayerWindow } = require('./windows/multiplayer')
const { create: createScreenshotWindow, close: closeScreenshotWindow } = require('./windows/screenshot')
const signal = require('./signal')

module.exports = () => {
  // 获取本机控制码
  ipcMain.handle('getMyCode', async () => {
    let { code } = await single.invoke('getMyCode', null, 'resMyCode')
    return code
  })

  // 两端进行连接
  ipcMain.on('connect', async (e, remoteCode, label) => {
    single.send('connect', { remoteCode, label })
  })
  single.on('operate', data => {
    data.camp = 'operate'
    sendPuppetWindow('connect-status', data)
  })
  single.on('receive', data => {
    data.camp = 'receive'
    sendPuppetWindow('connect-status', data)
  })
  single.on('notFound', () => {
    sendPuppetWindow('notFound')
  })

  // 关闭连接
  single.on('receive-close', () => {
    closeControlWindow()
  })
  single.on('operate-close', () => {
    sendPuppetWindow('close')
  })
  ipcMain.on('myChat-close', () => {
    signal.send('leaveRoom', { label: 'chat' })
  })
  single.on('chat-close', (data, name) => {
    sendPuppetWindow('chat-close', name)
  })
  single.on('multiplayer-close', (data, name) => {
    sendMultiplayerWindow('multiplayer-close', name)
  })
  ipcMain.on('screenshot-close', () => {
    sendPuppetWindow('screenshot-close')
    closeScreenshotWindow()
  })
  ipcMain.on('puppet-close', () => {
    closePuppetWindow()
  })

  // 创建控制窗口
  ipcMain.on('createControlWindow', () => {
    createControlWindow()
  })
  let dataURL = null
  ipcMain.on('createScreenshot', (e, data) => {
    createScreenshotWindow()
    dataURL = data
  })
  ipcMain.handle('scrennshotData', () => {
    return dataURL
  })
  let msgData = null
  ipcMain.on('createMultiplayerWindow', (e, data) => {
    createMultiplayerWindow()
    msgData = data
  })
  ipcMain.handle('multiplayerData', () => {
    return msgData
  })

  // 转发给另一端
  ipcMain.on('forward', async (e, event, data = "") => {
    single.send('forward', { event, data })
  })

  // screen 媒体协商
  single.on('puppet-offer', (data, name = "") => {
    sendPuppetWindow('offer', data, name)
  })
  single.on('multiplayer-offer', (data, name = "") => {
    sendMultiplayerWindow('offer', data, name)
  })
  single.on('puppet-answer', (data, name = "") => {
    sendPuppetWindow('answer', data, name)
  })
  single.on('contorl-answer', data => {
    sendControlWindow('answer', data)
  })
  single.on('multiplayer-answer', (data, name = "") => {
    sendMultiplayerWindow('answer', data, name)
  })
  single.on('sendPuppetCandidate', (data, name = "") => {
    sendPuppetWindow('candidate', data, name)
  })
  single.on('sendControlCandidate', data => {
    sendControlWindow('candidate', data)
  })
  single.on('sendMultiplayerCandidate', (data, name = "") => {
    sendMultiplayerWindow('candidate', data, name)
  })

  // 多端进行连接
  ipcMain.on('joinRoom', async (e, name, label) => {
    single.send('joinRoom', { name, label })
  })
  single.on('join-status', async data => {
    sendPuppetWindow('join-status', data)
  })
  single.on('join-nums', async data => {
    sendPuppetWindow('join-nums', data)
  })

  // 转发给其他端
  ipcMain.on('forwardRoom', async (e, event, data, name) => {
    single.send('forwardRoom', { event, data, name })
  })
}