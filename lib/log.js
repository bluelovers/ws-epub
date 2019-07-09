"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_color2_1 = require("debug-color2");
exports.console = new debug_color2_1.Console(null, {
    enabled: true,
    inspectOptions: {
        colors: true,
    },
    chalkOptions: {
        enabled: true,
    },
});
exports.console.enabledColor = true;
exports.default = exports.console;
//# sourceMappingURL=log.js.map