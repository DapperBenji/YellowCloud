import { Configuration } from 'webpack'
import { merge } from 'webpack-merge'
const { commonConfig } = require('./webpack.common.ts')

const devConfig = merge<Configuration>(commonConfig, {
   mode: 'development',
   devtool: 'inline-source-map'
})

export default devConfig