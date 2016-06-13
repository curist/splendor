var webpack = require('webpack');
var path = require('path');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var precss = require('precss');
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
      app: path.join(__dirname, 'app')
    }
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!postcss-loader")
      }
    ]
  },
  postcss: function() {
    return [precss, autoprefixer];
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'build by webpack @ ' + new Date(),
      hash: true,
      template: 'index.ejs'
    }),
    new ExtractTextPlugin('style.css'),
    new webpack.NoErrorsPlugin(),
  ]
};
