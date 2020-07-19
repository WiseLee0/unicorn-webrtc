const { ipcMain } = require('electron')
const robot = require('./robotjs')
const vkey = require('vkey')
function handleMove(data) {
  let { clientX, clientY, screen, video } = data
  let x = clientX * screen.width / video.width
  let y = clientY * screen.height / video.height
  robot.moveMouse(x, y)
}

function handleClick(data) {
  let { clientX, clientY, screen, video } = data
  let x = clientX * screen.width / video.width
  let y = clientY * screen.height / video.height
  robot.moveMouse(x, y)
  robot.mouseClick()
}

function handleRightClick(data) {
  let { clientX, clientY, screen, video } = data
  let x = clientX * screen.width / video.width
  let y = clientY * screen.height / video.height
  robot.moveMouse(x, y)
  robot.mouseClick('right')
}

function handleKey(data) {
  const modifiers = []
  if (data.meta) modifiers.push('meta')
  if (data.shift) modifiers.push('shift')
  if (data.alt) modifiers.push('alt')
  if (data.control) modifiers.push('control')
  let key = vkey[data.keyCode].toLowerCase()
  if (key == '<enter>') {
    robot.keyTap('enter')
  }
  if (key == '<space>') {
    robot.keyTap('space')
  }
  if (key == '<backspace>') {
    robot.keyTap('backspace')
  }
  if (key[0] !== '<') {
    robot.keyTap(key, modifiers)
  }
}

module.exports = () => {
  ipcMain.on('robot', (e, type, data) => {
    if (type === 'move') {
      handleMove(data)
    } else if (type === 'click') {
      handleClick(data)
    } else if (type === 'rightClick') {
      handleRightClick(data)
    } else if (type === 'key') {
      handleKey(data)
    }
  })

  ipcMain.handle('robotShot', (e, data) => {
    const res = robot.getPixelColor(data.x, data.y)
    return res
  })
}