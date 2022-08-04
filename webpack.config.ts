import path from "path";
import { Configuration, ProvidePlugin } from "webpack";
import * as webpackDevServer from "webpack-dev-server";
import WasmPackPlugin from "@wasm-tool/wasm-pack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const config: Configuration = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
    publicPath: '/public/',
  },
  plugins: [
      new WasmPackPlugin({
          crateDirectory: path.resolve(__dirname, ".")
      }),
      new NodePolyfillPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.bin/,
        type: 'asset/inline',
        generator: {
          dataUrl: content => {
            return content;
          }
        }
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  experiments: {
    asyncWebAssembly: true,
  },
  mode: "production",
  performance: {
    maxEntrypointSize: 10000000,
    maxAssetSize: 10000000,
  },
  optimization: {
    minimize: false
  },
  devServer: {
    host: "127.0.0.1",
    port: 3000,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }
};

export default config;
