/**
 * This "fake" module is just a stub to allow IDEs to resolve the `BUILDTIME_SYMBOL_TO_STRING` macro and provide
 * autocomplete/auto-import for it in TypeScript files.
 * NOTE: This does not influence the behavior of this plugin at all.
 */
declare module 'webpack-buildtime-symbols' {
    export const BUILDTIME_SYMBOL_TO_STRING: (symbol: any) => string;
}
