module.exports = {
  configureWebpack: {
    target: "electron-renderer"
  },
  devServer: {
    host: '127.0.0.1',
    port: 8080,
  },
  pages: process.env.NODE_ENV === 'production' ? {
    puppet: {
      entry: 'src/pages/puppet/main.ts',
      template: 'public/index.html',
      filename: 'puppet.html'
    },
    control: {
      entry: 'src/pages/control/main.ts',
      template: 'public/index.html',
      filename: 'control.html'
    },
    multiplayer: {
      entry: 'src/pages/multiplayer/main.ts',
      template: 'public/index.html',
      filename: 'multiplayer.html'
    }
  } : {
      index: {
        entry: 'src/main.ts',
        template: 'public/index.html',
        filename: 'index.html',
        title: 'wiselee'
      }
    },
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
}