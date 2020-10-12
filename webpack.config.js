/* eslint-disable no-undef */

const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const WebpackMd5Hash = require('webpack-md5-hash')
const HappyPack = require('happypack')
const mergeWith = require('lodash/mergeWith')
const isArray = require('lodash/isArray')


const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 80
const sourceDir = process.env.SOURCE || 'src/index.jsx'
const publicPath = `/${process.env.PUBLIC_PATH || 'public'}/`.replace('//', '/')
const sourcePath = path.join(process.cwd(), sourceDir)
const outputPath = path.join(process.cwd(), 'dist')

function customizer(objValue, srcValue) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue)
  }
  return undefined
}

const wpConfig = {
  base: {
    module: {
      rules: [
        { test: /\.jsx?$/, exclude: /node_modules/, use: 'happypack/loader' },
        { test: /\.(png|jpe?g|svg|woff2?|ttf|eot)$/, loader: 'url-loader?limit=8000' },
        { test: /\.svg$/i, use: 'raw-loader' },
        { test: /.*\.(gif|png|jpe?g)$/i, exclude: /node_modules/, use: [{ loader: 'file-loader' }] },
        {
          test: /\.css$/, exclude: /node_modules/, use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
          ],
        },
      ],
    },
    plugins: [
      new webpack.ProgressPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.join(process.cwd(), 'public/index.html'),
      }),
      new HappyPack({
        loaders: ['babel-loader'],
      }),
      new webpack.DefinePlugin({
        NODE_ENV: process.env.NODE_ENV,
        PUBLIC_PATH: publicPath.replace(/\/$/, ''),
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      modules: [].concat(sourceDir, ['node_modules']),
    },
    entry: sourcePath,
  },
  development: {
    mode: 'development',
    plugins: [
      new webpack.HotModuleReplacementPlugin({
        fullBuildTimeout: 200,
      }),
    ],
    entry: {
      app: ['webpack/hot/only-dev-server'],
    },
    output: {
      filename: 'bundle.js',
      path: publicPath,
      publicPath,
    },
    devtool: 'cheap-module-source-map',
    devServer: {
      hot: true,
      inline: true,
      historyApiFallback: { index: publicPath },
      contentBase: 'public',
      headers: { 'Access-Control-Allow-Origin': '*' },
      host,
      port,
      stats: 'errors-only',
      public: host,
    },
    optimization: {
      namedModules: true,
    },
  },
  production: {
    mode: 'production',
    plugins: [
      new WebpackMd5Hash(),
    ],
    output: {
      filename: 'bundle.js',
      path: outputPath,
      publicPath: 'public',
    },
    devServer: {
      contentBase: "build",
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          cache: false,
          parallel: true,
          sourceMap: true,
          extractComments: true,
        }),
      ],
      splitChunks: {
        name: 'vendor',
        minChunks: 2,
      },
    },
  },
}

const config = mergeWith(
  {},
  wpConfig.base,
  wpConfig[process.env.NODE_ENV],
  customizer,
)

module.exports = config