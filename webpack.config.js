const path = require("path");

module.exports = {
  entry: "./src/main.ts",
  mode: "development",
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[hash].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
