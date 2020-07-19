module.exports = () => {
  if (process.platform === 'win32') {
    require('./win32.js')
  } else {
    // 不处理
  }
}