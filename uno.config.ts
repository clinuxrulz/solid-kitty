import { defineConfig } from "unocss";
import presetUno from "unocss/preset-uno";

export default defineConfig({
	presets: [
        presetUno({
            "dark": "media",
        }),
    ],
    shortcuts: [
        { "btn": "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800", },
        { "nav-tabs": "flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400", },
        { "nav-item": "me-2", },
        { "nav-link-selected": "inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500", },
        { "nav-link": "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300", }
    ],
    rules: [
    ],
});
