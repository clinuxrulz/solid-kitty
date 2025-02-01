import { defineConfig } from "unocss";
import presetUno from "unocss/preset-uno";

/* See: https://flowbite.com/docs/ for examples */
export default defineConfig({
	presets: [
        presetUno({
            "dark": "media",
        }),
    ],
    shortcuts: [
        { "main": "bg-white dark:bg-black dark:text-gray-400"},
        { "btn": "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800", },
        { "nav-tabs": "flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400", },
        { "nav-item": "me-2", },
        { "nav-link-selected": "inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500", },
        { "nav-link": "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300", },
        { "list-container-1": "relative flex flex-col rounded-lg bg-white shadow-sm border border-slate-200", },
        { "list-container-2": "flex min-w-[240px] flex-col gap-1 p-1.5", },
        { "list-item-selected": "text-slate-800 flex w-full items-center rounded-md p-3 transition-all bg-slate-100 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100" },
        { "list-item": "mt-1 text-slate-800 flex w-full items-center rounded-md p-3 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100", },
        { "list-item-button-container": "ml-auto grid place-items-center justify-self-end", },
        { "list-item-button": "rounded-md border border-transparent p-2.5 text-center text-sm transition-all text-slate-600 hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none", },
    ],
    rules: [
    ],
});

/*
<div class="relative flex flex-col rounded-lg bg-white shadow-sm border border-slate-200">
  <nav class="flex min-w-[240px] flex-col gap-1 p-1.5">
    <div
      role="button"
      class="text-slate-800 flex w-full items-center rounded-md p-3 transition-all bg-slate-100 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
    >
      Inbox
    </div>
      <div
      role="button"
        class="mt-1 text-slate-800 flex w-full items-center rounded-md p-3 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
      >
        Trash
      </div>
      <div
        role="button"
        class="mt-1 text-slate-800 flex w-full items-center rounded-md p-3 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
      >
        Settings
      </div>
  </nav>
</div>
*/