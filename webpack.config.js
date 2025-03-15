import webpack from 'webpack';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackInlineSourcePlugin from '@effortlessmotion/html-webpack-inline-source-plugin';

// see https://iamwebwiz.medium.com/how-to-fix-dirname-is-not-defined-in-es-module-scope-34d94a86694d
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const isInline = process.env.INLINE_BUILD === 'true';
const dataFilePath = process.env.DATA_FILE || undefined
const dataLabel =
  process.env.DATA_LABEL
  ? JSON.stringify(process.env.DATA_LABEL)
  : (dataFilePath
    ? JSON.stringify(path.basename(dataFilePath, path.extname(dataFilePath)))
    : null);
const faviconPath = path.resolve(__dirname, 'src/favicon.png');
const faviconBase64 = fs.existsSync(faviconPath)
  ? `data:image/png;base64,${fs.readFileSync(faviconPath).toString('base64')}`
  : '';

console.log()
console.log('================================================================')
console.log()
console.log('Build customization: ')
console.log()
console.log(`[env.INLINE_BUILD] Inline build:      ${isInline}`)
console.log(`[env.DATA_FILE]    Custom data file:  ${dataFilePath ? dataFilePath : '**none**'}`)
console.log(`[env.DATA_LABEL]   Custom data label: ${dataLabel ? dataLabel : '**none**'}`)
console.log()
console.log('================================================================')
console.log()

export default {
  entry: './src/entry.js',
  devtool: 'source-map',
  plugins: [
    /*
    new CopyWebpackPlugin({
      patterns: [
        {
          context : 'src', from: '*.ttf'
        },
      ]
    }),
    */
    new webpack.DefinePlugin({
      '__custom_data__' : dataFilePath
        ? JSON.stringify(fs.readFileSync(path.resolve(dataFilePath), 'utf8'))
        : 'null',
      '__custom_data_label__' : dataLabel
        ? dataLabel
        : 'null'
    }),
    new HtmlWebpackPlugin({
      // see https://gauger.io/fonticon/
      // and https://stackoverflow.com/questions/37298215/add-favicon-with-react-and-webpack
      filename: 'index.html',
      favicon: isInline ? false : './src/favicon.png',
      ...(isInline && {
         templateContent: ({ htmlWebpackPlugin }) => `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${htmlWebpackPlugin.options.title}</title>
            ${faviconBase64 ? `<link rel="icon" href="${faviconBase64}" type="image/png">` : ''}
          </head>
          <body>
            <div id="app"></div>
          </body>
          </html>
        `,
      }),
      title: 'du vis',
      meta : {
        viewport : 'user-scalable=no, width=device-width, initial-scale=1.0',
        'apple-mobile-web-app-capable' : 'yes'
      },
      inject: 'body',
      minify: isInline, // Minify if in inline mode
      inlineSource: isInline ? '.(js|css)$' : undefined,
    }),
    ...(isInline ? [new HtmlWebpackInlineSourcePlugin()] : []),
  ],
  module: {
    rules: [
      {
        test: /\.css$/, 
        use: [ 'style-loader', 'css-loader' ] 
      },
      {
        test: /\.(ttf|woff|woff2)$/,
        type: isInline ? 'asset/inline' : 'asset/resource',
      },
      { 
        test: /\.txt.gz$/,
        use: [ 'raw-loader', 'gzip-loader'  ]
      },
      {
        test: /\.txt$/,
        use: [ 'raw-loader' ]
      },
      {
        // See https://stackoverflow.com/questions/37671342/how-to-load-image-files-with-webpack-file-loader
        // and https://v4.webpack.js.org/loaders/file-loader/
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [ 'file-loader' ]
      }
    ]
  },
  output: {
    filename: isInline ? 'bundle.js' : 'main.js',
    // filename: 'main.js',
     publicPath: '',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  // stats : 'detailed',
};
