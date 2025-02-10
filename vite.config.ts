import inject from "@rollup/plugin-inject";
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
			workbox: {
				navigateFallbackDenylist: [/landing*/],
			},
			manifest: {
				name: "Veracy.app",
				short_name: "Veracy",
				description:
					"Veracy is The decentralized social media platform.",
				display: "standalone",
				icons: [
					{
						src: "veracy-icon.svg",
						type: "image/svg+xml",
						sizes: "any",
						purpose: "any",
					},
					{
						src: "veracy-icon-512.png",
						type: "image/png",
						sizes: "512x512",
						purpose: "any",
					},
					{
						src: "veracy-icon-192.png",
						type: "image/png",
						sizes: "192x192",
						purpose: "any",
					},
					{
						src: "veracy-icon-144.png",
						type: "image/png",
						sizes: "144x144",
						purpose: "any",
					},
					{
						src: "veracy-icon-128.png",
						type: "image/png",
						sizes: "128x128",
						purpose: "any",
					},
					{
						src: "veracy-icon-72.png",
						type: "image/png",
						sizes: "72x72",
						purpose: "any",
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			$lib: path.resolve("./src/lib"),
			$scripts: path.resolve("./scripts"),
		},
	},
	build: {
		target: "esnext",
		sourcemap: true,
		rollupOptions: {
			plugins: [
				inject({
					include: ["node_modules/@ledgerhq/**"],
					modules: { Buffer: ["buffer", "Buffer"] },
				}),
			],
		},
	},
});
