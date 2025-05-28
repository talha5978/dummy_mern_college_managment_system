import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
	iconColor?: string;
}

export default function StatsCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	className,
	iconColor = "text-primary",
}: StatCardProps) {
	return (
		<Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
			<CardContent className="px-6 py-3">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm font-medium text-muted-foreground">{title}</p>
						<h3 className="mt-2 text-3xl font-bold">{value}</h3>
						{description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
						{trend && (
							<div className="mt-[.7rem] flex items-center">
								<span
									className={cn(
										"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
										trend.isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
									)}
								>
									{trend.value}%
									{trend.isPositive ? (
										<TrendingUp className="ml-2 h-4 w-4" />
									) : (
										<TrendingDown className="ml-2 h-4 w-4" />
									)}
								</span>
								<span className="ml-2 text-xs text-muted-foreground">vs. last year</span>
							</div>
						)}
					</div>
					<div className={cn("rounded-md p-3 bg-primary/10", iconColor)}>
						<Icon className="h-7 w-7" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
