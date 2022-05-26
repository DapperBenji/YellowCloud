const path = require('path')
const SizePlugin = require('size-plugin')
const WebpackBuildNotifierPlugin = require('webpack-build-notifier')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
import { Configuration } from 'webpack'

export const commonConfig: Configuration = {
   entry: {
      //'./src/scripts/background.ts',
      main: './src/scripts/main.js',
      popup: './src/scripts/popup.ts'
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
         },
      ]
   },
   optimization: {
      splitChunks: {
         cacheGroups: {
            chunks: 'all',
            vendor: {
               test: /[\\/]node_modules[\\/](insignia)[\\/]/,
               name: 'vendor',
            }
         }
      }
   },
   resolve: {
      extensions: ['.ts', '.js']
   },
   plugins: [
      new SizePlugin(),
      new WebpackBuildNotifierPlugin({
         title: 'YellowCloud',
         logo: path.resolve('./src/static/icons/logo-48.png'),
         suppressSuccess: true,
         sound: false
      }),
      new ForkTsCheckerWebpackPlugin()
   ],
   output: {
      filename: '[name].js',
      chunkFilename: '[name].js',
      sourceMapFilename: '[name].js.map',
      path: path.resolve(__dirname, 'dist'),
      clean: true
   }
}