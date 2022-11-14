const path = require("path");
const Dotenv = require("dotenv-webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

var webpack = require("webpack");

module.exports = {
  entry: {
    main: "./src/index.js",
  },
  output: {
    path: path.join(__dirname, "../build"),
    filename: "[name].bundle.js",
  },
  mode: "development",
  devServer: {
    static: path.join(__dirname, "../build"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
    }),
    new Dotenv({
      path: "./.env.mcm",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "static", to: "static" },
      ],
    }),
  ].filter(Boolean),
};
