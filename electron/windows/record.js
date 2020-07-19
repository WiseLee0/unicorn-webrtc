const { BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
function create() {
  win = new BrowserWindow({
    width: 0,
    height: 0,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    transparent: true
  })
  if (isDev) {
    win.loadURL('http://localhost:8080/#/record')
  } else {
    win.loadFile(path.resolve(__dirname, '../../dist/record.html'))
  }
}
function close() {
  win.close()
}

function send(channel, ...args) {
  win.webContents.send(channel, ...args)
}

module.exports = { create, send, close }