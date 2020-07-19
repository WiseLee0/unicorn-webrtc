const { BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
let win
let winQuitApp = false
function create() {
  win = new BrowserWindow({
    width: 500,
    height: 350,
    maxWidth: 500,
    maxHeight: 350,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
    autoHideMenuBar: true,
    transparent: true
  })
  win.on('close', e => {
    if (winQuitApp) {
      win = null
    }
    else {
      e.preventDefault()
      win.hide()
    }
  })
  if (isDev) {
    win.loadURL('http://localhost:8080/#/puppet')
  } else {
    win.loadFile(path.resolve(__dirname, '../../dist/puppet.html'))
  }
}

function send(channel, ...args) {
  win.webContents.send(channel, ...args)
}

function show() {
  win.show()
}

function realClose() {
  winQuitApp = true
  win.close()
}

function shamClose() {
  winQuitApp = false
  win.close()
}

module.exports = { create, send, show, realClose, shamClose }