import type { Config } from 'tailwindcss';
import daisyui from "daisyui";

import generated from "@tailwindcss/typography";

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {}
  },

  plugins: [generated, daisyui],

  daisyui: {
    themes: ["sunset"]
  }
} satisfies Config;
