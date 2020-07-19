const { globalShortcut } = require('electron')
const { create: createRecordWindow, send: sendRecordWindow, close: closeRecordWindow } = require('./windows/record.js')
const { send: sendPuppetWindow } = require('./windows/puppet.js')
let lock = false
let pause = false
module.exports = () => {
  globalShortcut.register('alt+A', () => {
    if (!lock) {
      createRecordWindow()
      lock = true
    }
  })
  globalShortcut.register('alt+D', () => {
    if (lock) {
      sendRecordWindow('close')
      setTimeout(() => {
        closeRecordWindow()
      }, 1000);
      this.lock = false
    }
  })
  globalShortcut.register('alt+Q', () => {
    if (!pause) {
      pause = true
      sendRecordWindow('pause')
    }
  })
  globalShortcut.register('alt+E', () => {
    if (pause) {
      pause = false
      sendRecordWindow('resume')
    }
  })
  globalShortcut.register('alt+Z', () => {
    sendPuppetWindow('screen-shot')
  })
}