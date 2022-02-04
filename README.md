<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

# webpack-buildtime-symbols

Convert at built-time symbols to their string representation. Basically this plugin allows to retain
the symbol name as a string after a mangling or uglification compiler pass.

## Install

```console
npm install webpack-buildtime-symbols --save-dev
```

or

```console
yarn add -D webpack-buildtime-symbols
```

## Setup

**webpack.config.js**

```js
const BuildtimeSymbolsPlugin = require("webpack-buildtime-symbols/lib/plugin");
module.exports = {
  plugins: [new BuildtimeSymbolsPlugin()],
};
```

### Usage: Webpack 4
**any-file.js|ts**

```js
import {BUILDTIME_SYMBOL_TO_STRING} from "webpack-buildtime-symbols/lib/runtime";
import {ClassName} from "another-place";

console.log("Runtime: ", BUILDTIME_SYMBOL_TO_STRING(ClassName));
```


After build/minification/uglification the produced result is equivalent to:

```js
console.log("Runtime: ", "ClassName");
```


### Usage: Webpack 5

Note: webpack 5 support is supposed but not verified. 
 Import of BUILDTIME_SYMBOL_TO_STRING is not supported for sure right now. 

**any-file.js|ts**

```js
// No import for BUILDTIME_SYMBOL_TO_STRING is currently supported
import {ClassName} from "another-place";

console.log("Runtime: ", BUILDTIME_SYMBOL_TO_STRING(ClassName));
```


## Options

|           Name            |    Type    |            Default            | Description                         |
|:-------------------------:|:----------:|:-----------------------------:|:------------------------------------|
|     **importAlias**       | `{String}` | `BUILDTIME_SYMBOL_TO_STRING`  | Macro name used to decorate symbols |


