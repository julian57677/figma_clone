// webpack.config.js
const path = require('path');

module.exports = {
  // other webpack configurations...

  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  }
};
