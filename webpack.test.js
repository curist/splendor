var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './test/test.js',
  target: 'node',
  // output: {
  //   path: '/tmp',
  //   filename: 'test.bundle.js'
  // },
  resolve: {
    alias: {
      app: path.join(__dirname, 'app')
    }
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'null-loader'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.(jpg|jpeg|png)$/,
        loader: 'null-loader'
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.DEBUG': '"*"'
    }),
    new webpack.NoErrorsPlugin(),
  ]
};
