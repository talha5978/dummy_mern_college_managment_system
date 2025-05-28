import { type Config } from "tailwindcss";

const config: Config = {
    important: true,
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			fontSize: {
				xs: "0.85rem",
				sm: "0.95rem",
				md: "1.05rem",
				lg: "1.125rem",
			},
			screens: {
				"custom-sidebar": "850px",
			}
		},
	},
	plugins: [],
};

export default config;
