const { BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
function create() {
  win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    transparent: true
  })
  if (isDev) {
    win.loadURL('http://localhost:8080/#/screenshot')
  } else {
    win.loadFile(path.resolve(__dirname, '../../dist/screenshot.html'))
  }
}
function close() {
  win.close()
}

function send(channel, ...args) {
  win.webContents.send(channel, ...args)
}

module.exports = { create, send, close }