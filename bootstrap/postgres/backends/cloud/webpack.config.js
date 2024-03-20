/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: 'production',
  entry: ['./serverless.ts'],
  externals: [nodeExternals({
    allowlist: package => package.includes('@vramework')
  })],
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'pg-native': path.join(__dirname, 'aliases/pg-native.js')
    }
  },
  output: {
    libraryTarget: 'commonjs',
    path: __dirname,
    filename: 'index.js'
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: require.resolve('ts-loader')
      }
    ]
  }
};