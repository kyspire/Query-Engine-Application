"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var daisyui_1 = __importDefault(require("daisyui"));
exports["default"] = {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {}
    },
    plugins: [require("@tailwindcss/typography"), daisyui_1["default"]],
    daisyui: {
        themes: ["sunset"]
    }
};
//# sourceMappingURL=tailwind.config.js.map