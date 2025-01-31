import { defineConfig } from "unocss";
import presetUno from "unocss/preset-uno";

export default defineConfig({
	presets: [ presetUno(), ],
    shortcuts: [
        { "btn": `bg-blue-400 text-blue-100 py-2 px-4 rounded-lg`, },
        [/^btn-(.*)$/, ([, c]) => `bg-${c}-400 text-${c}-100 py-2 px-4 rounded-lg`],
    ],
    rules: [
    ],
});
