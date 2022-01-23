const path = require('path')
import { Configuration } from 'webpack'

export const commonConfig: Configuration = {
   entry: [
      //'./src/scripts/background.ts',
      //'./src/scripts/main.ts',
      './src/scripts/popup.ts'
   ],
   devtool: 'inline-source-map',
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
         },
      ],
   },
   optimization: {
      splitChunks: {
         cacheGroups: {
            vendor: {
               test: /[\\/]node_modules[\\/](insignia)[\\/]/,
               name: 'vendor',
               chunks: 'all'
            }
         }
      }
   },
   resolve: {
      extensions: ['.tsx', '.ts', '.js'],
   },
   output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'target'),
   }
}

export default commonConfig