var package = require('../package.json');
var webpack = require('webpack');
var path = require('path');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var autoprefixer = require('autoprefixer');

module.exports = {
  entry: './app/index.js',
  output: {
    path: 'build',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: 'build'
  },
  resolve: {
    alias: {
      app: path.join(__dirname, '..', 'app')
    }
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('css!postcss')
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract('css!postcss!less')
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
        loader: 'file'
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file'
      },
    ]
  },
  postcss: function() {
    return [autoprefixer];
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Splenda v' + package.version,
      hash: true,
      template: 'index.ejs'
    }),
    new ExtractTextPlugin('style.css'),
    new webpack.NoErrorsPlugin(),
  ]
};
