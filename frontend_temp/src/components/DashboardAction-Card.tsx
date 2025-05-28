import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
	title: string;
	description: string;
	icon: LucideIcon;
	actionLabel: string;
	onClick: () => void; // Define the onClick prop
	className?: string;
}

export default function DashboardActionCard({
	title,
	description,
	icon: Icon,
	actionLabel,
	onClick,
	className,
}: ActionCardProps) {
	return (
		<Card className={cn("transition-all hover:shadow-md", className)}>
			<CardContent className="p-6 flex flex-col items-center text-center">
				<div className="rounded-md bg-primary/10 p-3 mb-4">
					<Icon className="h-6 w-6 text-primary" />
				</div>
				<h3 className="text-lg font-semibold">{title}</h3>
				<p className="text-sm text-muted-foreground mt-1 mb-4">
					{description}
				</p>
				<Button onClick={onClick} className="w-full cursor-pointer">
					{actionLabel}
				</Button>
			</CardContent>
		</Card>
	);
}
