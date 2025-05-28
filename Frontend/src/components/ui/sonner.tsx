import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster: React.FC<ToasterProps> = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();
	const animationStyle = {
		animation: "slide-in 0.3s",
	};
	// toast position is by default top-right [set by me]
	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			position="top-right"
			swipeDirections={["right"]}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg cursor-pointer",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
					cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium",
				},
				style: animationStyle,
			}}
			{...props}
		/>
	);
};

const warningToastOptions = {
	style: {
		backgroundColor: "var(--warning-foreground)",
		color: "black",
		borderColor: "var(--warning-foreground)",
	},
};

export { Toaster, warningToastOptions };
