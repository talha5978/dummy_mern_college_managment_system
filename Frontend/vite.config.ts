import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

console.log(String(process.env.VITE_BACKEND_ORIGIN));

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			"/api": {
				// target: "http://localhost:8000/api",
                // process.env not import.meta.env !!
                target: String(process.env.VITE_BACKEND_ORIGIN || "http://localhost:8000"),
				changeOrigin: true,
				secure: false,
			}
		},
	},
	optimizeDeps: {
		include: ['@diceui/combobox'],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		}
	}
});
