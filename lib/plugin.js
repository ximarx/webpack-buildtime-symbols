"use strict";

/** @typedef {import("webpack").Compiler} Compiler */
/** @typedef {import("webpack").Parser} Parser */

class BuildtimeSymbolsPlugin {

    /**
     * @param {{
     *  importAlias: BUILDTIME_SYMBOL_TO_STRING,
     *  importModule: BUILDTIME_SYMBOL_TO_STRING,
     *  parserTypes: ["javascript/auto", "javascript/dynamic", "javascript/esm"]
     * }} options
     */
    constructor(options) {
        options = options || {};
        this.importAlias = options.importAlias || 'BUILDTIME_SYMBOL_TO_STRING';
        this.importModule = options.importModule || 'webpack-buildtime-symbols/lib/runtime';
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
                    parser.hooks.call.for(this.importAlias).tap('BuildtimeSymbolsPlugin', (expression) => {
                        return ParserHelpers.toConstantDependency(
                            parser,
                            JSON.stringify(expression.arguments[0].name)
                        ).bind(parser)(expression)
                    });

                    // "call" hook above is triggered for "free" function call. This means that if we have an
                    // import ALIAS from module, the ALIAS() call does not trigger the `call` hook above.
                    // To restore the hook, the trick is to attach to importSpecificer for the
                    // import module and remove the ALIAS from the definitions. This restore the call hooks
                    // behavior for what we need.
                    // This trick is inspired by HarmonyImportDependencyParserPlugin.
                    // The !isWebpack5 is needed to exclude this trick for webpack 5 because the trick implementation
                    // is a bit more complicated to replicate. You can still use this, but you cannot "import" the alias
                    // above until this trick is replicated also for webpack 4
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
