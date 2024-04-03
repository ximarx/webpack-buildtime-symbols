"use strict";

/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack").Parser} Parser */

class BuildtimeSymbolsPlugin {

    /**
     * @param {{
     *  importAlias: "BUILDTIME_SYMBOL_TO_STRING",
     *  importModule: "webpack-buildtime-symbols",
     *  parserTypes: ["javascript/auto", "javascript/dynamic", "javascript/esm"]
     * }} options
     */
    constructor(options) {
        options = options || {};
        this.importAlias = options.importAlias || 'BUILDTIME_SYMBOL_TO_STRING';
        this.importModule = options.importModule || 'webpack-buildtime-symbols';
        this.parserTypes = options.parserTypes || ["javascript/auto", "javascript/dynamic", "javascript/esm"];
    }

    /**
     * Apply the plugin
     * @param {Compiler} compiler Webpack compiler
     * @returns {void}
     */
    apply(compiler) {
        compiler.hooks.compilation.tap(
            "BuildtimeSymbolsPlugin",
            (compilation, { normalModuleFactory }) => {
                // This is a naive attempt to support both webpack 4 and 5:
                // hooks api looks the same across the two version. What changes and makes
                // a huge change for us it ParserHelpers class, which has been renamed and moved
                // to a new location.
                let ParserHelpers;
                let isWebpack5 = false;
                try {
                    ParserHelpers = require('webpack/lib/ParserHelpers');
                } catch (requireerror) {
                    ParserHelpers = require('webpack/lib/javascript/JavascriptParserHelpers');
                    isWebpack5 = true;
                }

                /**
                 * Handler
                 * @param {Parser} parser Parser
                 * @returns {void}
                 */
                const handler = parser => {
                    // Hook to call for the importAlias function in free function call and replace the function call
                    // with a constant token equal to the string representation of the first argument name passed.
                    // This replaces any call to function alias specified when no import for the symbol is specified
                    parser.hooks.call.for(this.importAlias).tap('BuildtimeSymbolsPlugin', (expression) => {
                        return ParserHelpers.toConstantDependency(
                            parser,
                            JSON.stringify(expression.arguments[0].name)
                        ).bind(parser)(expression)
                    });

                    // When an import for the macro is specified (so that function call is not highlighted as invalid
                    // from IDE for example) the "call" hook above is not triggered.
                    //
                    // I.e.
                    // >>> import {BUILDTIME_SYMBOL_TO_STRING} from "webpack-buildtime-symbols";
                    // >>> console.log("Runtime: ", BUILDTIME_SYMBOL_TO_STRING(ClassName));
                    //
                    // then BUILDTIME_SYMBOL_TO_STRING() call does not trigger the default `call` hook above.
                    // So the trick to be able to import the symbol and get rid of IDE error notification while keeping
                    // the macro functionality is to attach to importSpecificer hook for the import module configured
                    // and remove the ALIAS from the list of definitions (making later call as free function call).
                    // This restore the call hooks behavior for what we need.
                    // This trick is inspired by HarmonyImportDependencyParserPlugin.
                    // The !isWebpack5 is needed to exclude this behavior when compiling in webpack 5 context:
                    // replicating this workaround in webpack 5 is a bit more complicated. When in webpack 5, only
                    // free function call (without import of macro) can be used
                    !isWebpack5 && parser.hooks.importSpecifier.tap(
                        "BuildtimeSymbolsPlugin",
                        (statement, source, id, name) => {
                            if (source === this.importModule) {
                                parser.scope.definitions.delete(name);
                                return true;
                            }
                        }
                    );
                };

                this.parserTypes.forEach((parserType) => {
                    normalModuleFactory.hooks.parser
                        .for(parserType)
                        .tap("BuildtimeSymbolsPlugin", handler);
                });
            }
        )
    }
}

module.exports = BuildtimeSymbolsPlugin;
