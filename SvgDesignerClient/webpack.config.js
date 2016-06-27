var webpack = require('webpack');

module.exports = {
    entry: {
        main: './scripts/main.ts'
    },
    output: {
        path: __dirname + "/wwwroot/appscripts/",
        filename: "[name].js"
    },
    resolve: {
        extensions: ['', '.js', '.ts'],
        modulesDirectories: ['node_modules']
    },
    module: {
        loaders: [{
            test: /\.ts$/,
            loader: 'ts'
        }]
    }//,
    //plugins: [
    //  new webpack.optimize.CommonsChunkPlugin({
    //      name: ['main', 'vendor', 'polyfills']
    //  })]
};