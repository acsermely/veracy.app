import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Veracy",
				short_name: "Veracy",
				description:
					"Veracy is The decentralized social media platform.",
				theme_color: "#000000",
				display: "standalone",
				icons: [
					{
						src: "veracy-icon.svg",
						type: "image/svg+xml",
						sizes: "any",
						purpose: "monochrome any",
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			$lib: path.resolve("./src/lib"),
		},
	},
});
