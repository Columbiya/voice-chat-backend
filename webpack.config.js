const path = require("path");

module.exports = {
  entry: "./src/main.ts",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[content-hash].bundle.ts",
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
    extensions: [".tsx", ".ts", ".js"],
  },
};
