/**
 * This is a macro replaced at buildtime with the "String" representation of
 * `symbol`
 *
 * This macro allow to preserve the string representation of the symbol after mangling and uglyfications
 *
 * @param {*} symbol
 * @return string
 */
export function BUILDTIME_SYMBOL_TO_STRING(symbol) {
    throw new Error(
        "You should never end here. "
        + "Please make sure BuildTimeSymbolsPlugin is registered in your webpack.config.js"
    );
}
