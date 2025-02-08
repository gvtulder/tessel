import path from "path";
import child_process from "child_process";
import webpack from "webpack";
import HtmlBundlerPlugin from "html-bundler-webpack-plugin";
import WorkboxPlugin from "workbox-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

const __dirname = import.meta.dirname;

function git(command) {
  return child_process.execSync(`git ${command}`, { encoding: "utf8" }).trim();
}

export default {
  mode: "production",
  // devtool: "source-map",

  output: {
    path: path.resolve(__dirname, "public"),
    publicPath: "/",
    library: "tilegame",
  },

  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(git("rev-parse --short HEAD")),
    }),

    new HtmlBundlerPlugin({
      entry: {
        index: "index.html",
      },
      js: {
        filename: "js/[name].[contenthash:8].js",
      },
      css: {
        filename: "css/[name].[contenthash:8].css",
      },
      loaderOptions: {
        sources: [
          {
            tag: "img",
            filter: ({ attributes }) => {
              console.log(attributes);
              return attributes["src"] != "icon.png";
            },
          },
        ],
      },
    }),

    new WorkboxPlugin.GenerateSW({
      swDest: "sw.js",
      sourcemap: false,
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: new RegExp(".*(js|css|png|html|woff)"),
          handler: "StaleWhileRevalidate",
        },
      ],
    }),
  ],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["css-loader"],
      },
      {
        test: /\.(ico|png|jpe?g|svg|json|woff)/,
        type: "asset/resource",
        generator: {
          filename: "[name]-[contenthash:8][ext]",
        },
      },
      {
        test: /icon\.png|manifest\.json/,
        type: "asset/resource",
        generator: {
          filename: "[name][ext]",
        },
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },

  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      "...",
    ],
  },
};
