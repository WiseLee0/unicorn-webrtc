const { BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const single = require('../signal')

let win
function create() {
    win = new BrowserWindow({
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.on('close', () => {
        single.send('forwardRoom', { event: 'multiplayer-close', data: '', name: "" })
        single.send('leaveRoom', { label: 'multiplayer' })
        win = null
    })
    if (isDev) {
        win.loadURL('http://localhost:8080/#/multiplayer/')
    } else {
        win.loadFile(path.resolve(__dirname, '../../dist/multiplayer.html'))
    }
}

function send(channel, ...args) {
    win.webContents.send(channel, ...args)
}

module.exports = { create, send }