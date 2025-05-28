import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Ban, GraduationCap, UserCheck, UserMinus, Users } from "lucide-react"; // For the trend arrow icon
import { ChartConfig } from "./ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useFetchStudentsStatsQuery } from "../services/users.api";
import { isApiError } from "../utils/helpers";
import StatsCard from "./StatsCard";

function YearlyChartSkeleton({ chartConfig, data }: { chartConfig: ChartConfig; data: any }) {
	return (
		<ChartContainer
			config={chartConfig}
			className="relative pointer-events-none select-none"
		>
			<BarChart accessibilityLayer data={data} className="blur-xs">
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="year"
					tickLine={false}
					tickMargin={10}
					axisLine={false}
					tickFormatter={(value) => value.toString()}
				/>
				<Bar dataKey="active" fill="var(--color-active)" radius={4} />
				<Bar dataKey="inactive" fill="var(--color-inactive)" radius={4} />
				<Bar dataKey="alumni" fill="var(--color-alumni)" radius={4} />
			</BarChart>
			<div className="absolute inset-0 flex justify-center items-center">
				<div className="shadow-md text-muted-foreground flex gap-2 items-center">
					<Ban width={18}/>
					<span className="text-md">No data found</span>
				</div>
			</div>
		</ChartContainer>
	)
}

function SecondayChartSkeleton({ chartConfig, data }: { chartConfig: ChartConfig; data: any }) {
	return (
		<ChartContainer
			config={chartConfig}
			className="relative pointer-events-none select-none"
		>
			<BarChart accessibilityLayer data={data} className="blur-xs">
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="label"
					tickLine={false}
					tickMargin={10}
					axisLine={false}
					tickFormatter={(value) => value}
				/>
				<Bar dataKey="total" fill="var(--color-total)" radius={4} />
			</BarChart>
			<div className="absolute inset-0 flex justify-center items-center">
				<div className="shadow-md text-muted-foreground flex gap-2 items-center">
					<Ban width={18}/>
					<span className="text-md">No data found</span>
				</div>
			</div>
	
		</ChartContainer>
	)
}

const StudentStats = () => {
	const [view, setView] = useState("class"); // Default to class-wise view

	const {
		data: statsData,
		isLoading: isFetchingStats,
		error: statsFetchingError,
	} = useFetchStudentsStatsQuery();

	if (isApiError(statsFetchingError) ) {
		console.error(statsFetchingError.data.message);
		toast.error(statsFetchingError.data.message);
	}

	let yearlyChartData : unknown = [];

	const trends : {
		yearly: any[];
		byClass: any[];
		byProgram: any[];
	} = statsData?.data.trends || { yearly: [], byClass: [], byProgram: [] };
	
	yearlyChartData = trends.yearly.map((item:any) => ({
		year: item.year,
		active: item.active,
		inactive: item.inactive,
		alumni: item.alumni,
	}));

	//const selectedTrends = view === "class" ? trends.byClass : trends.byProgram;

	const classChartData = trends.byClass.map((item) => ({
		label: item.class,
		total: item.total + Math.floor(Math.random() * 50), // RANDOM NUMBER FOR DEMO
	}));
	
	const programChartData = trends.byProgram.map((item) => ({
		label: item.program,
		total: item.total + Math.floor(Math.random() * 50), // RANDOM NUMBER FOR DEMO
	}));

	const trendsChartData = view === "class" ? classChartData : programChartData;

	interface ChartConfig {
		[key: string]: {
			label: string;
			color: string;
		};
	}

	const chartConfig = {
		active: {
			label: "Active Students",
			color: "hsl(var(--chart-1))", // Blue (default --chart-1)
		},
		inactive: {
			label: "Inactive Students",
			color: "hsl(var(--chart-2))", // Red (default --chart-2)
		},
		alumni: {
			label: "Alumni",
			color: "hsl(var(--chart-3))", // Green (default --chart-3)
		},
		total: {
			label: "Total Students",
			color: "hsl(var(--chart-4))", // Purple (default --chart-4)
		},
	} satisfies ChartConfig;

	const sampleChartConfig = {
		active: {
			label: "Active Students",
			color: "hsl(0, 0%, 50%)", // Medium Gray
		},
		inactive: {
			label: "Inactive Students",
			color: "hsl(0, 0%, 30%)", // Dark Gray
		},
		alumni: {
			label: "Alumni",
			color: "hsl(0, 0%, 70%)", // Light Gray
		},
		total: {
			label: "Total Students",
			color: "hsl(0, 0%, 20%)", // Very Dark Gray
		},
	} satisfies ChartConfig;

	const sampleData = {
		yearly: [
			{ year: 2020, active: 100, inactive: 50, alumni: 25 },
			{ year: 2021, active: 120, inactive: 60, alumni: 30 },
			{ year: 2022, active: 140, inactive: 70, alumni: 35 },
		],
		byClass: [
			{ class: "Class 1", total: 50 },
			{ class: "Class 2", total: 65 },
			{ class: "Class 3", total: 38 },
			{ class: "Class 4", total: 24 },
		],
		byProgram: [
			{ program: "Program 1", total: 100 },
			{ program: "Program 2", total: 80 },
			{ program: "Program 3", total: 120 },
		]
	}

	function getCardTrend() {
		const yearlyTrends = statsData?.data.trends.yearly || [];

		// Check if we have enough data (at least 2 years)
		if (yearlyTrends.length < 2) {
			return { trendValue: 0, isPositive: false };
		}

		// Sort by year to ensure chronological order
		const sortedTrends = [...yearlyTrends].sort((a: any, b: any) => a.year - b.year);
		//@ts-ignore
		// Current year is the last entry 
		const currentYearActive = sortedTrends[sortedTrends.length - 1].active;
		//@ts-ignore
		// Previous year is the second-to-last entry
		const previousYearActive = sortedTrends[sortedTrends.length - 2].active;

		// Avoid division by zero
		if (previousYearActive === 0) {
			return { trendValue: 0, isPositive: false };
		}

		// Calculate percentage change
		const trendValue = Math.floor(((currentYearActive - previousYearActive) / previousYearActive) * 100);
	
		return { trendValue, isPositive: trendValue > 0 };
	}
	
	return (
		<section className="space-y-6">
			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatsCard
					title="Total Students"
					value={statsData?.data.overallStats.total || 0}
					icon={Users}
					iconColor="text-blue-500"
					description="All registered students"
				/>
				<StatsCard
					title="Active Students"
					value={statsData?.data.overallStats.active || 0}
					icon={UserCheck}
					iconColor="text-green-500"
					description="Currently enrolled students"
					trend={{
						value: getCardTrend().trendValue || 0,
						isPositive: getCardTrend().isPositive || false,
					}}
				/>
				<StatsCard
					title="Inactive Students"
					value={statsData?.data.overallStats.inactive || 0}
					icon={UserMinus}
					iconColor="text-amber-500"
					description="On leave or suspended"
				/>
				<StatsCard
					title="Alumni"
					value={statsData?.data.overallStats.alumni || 0}
					icon={GraduationCap}
					iconColor="text-purple-500"
					description="Graduated students"
				/>
			</section>
			<section className="grid md:grid-cols-3 grid-cols-1 gap-4">
				{/* Yearly Trends Section */}
				<Card>
					<CardHeader>
						<CardTitle>Yearly Student Trends</CardTitle>
						<CardDescription>Overall trends over the years</CardDescription>
					</CardHeader>
					<CardContent>
						{isFetchingStats || statsFetchingError ? (
							<YearlyChartSkeleton chartConfig={sampleChartConfig} data={sampleData.yearly} />
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart
									accessibilityLayer
									data={(yearlyChartData || sampleData.yearly) as any[]}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="year"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										tickFormatter={(value) => value.toString()}
									/>
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator="dashed" />}
									/>
									<Bar dataKey="active" fill="var(--color-active)" radius={4} />
									<Bar dataKey="inactive" fill="var(--color-inactive)" radius={4} />
									<Bar dataKey="alumni" fill="var(--color-alumni)" radius={4} />
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
				{/* Class-wise or Program-wise Trends Section FOR MOBILE */}
				<Card className="md:hidden flex">
					<CardHeader className="flex flex-row flex-wrap items-center justify-between">
						<div>
							<CardTitle>{view === "class" ? "Class-wise Trends" : "Program-wise Trends"}</CardTitle>
							<CardDescription>
								Trends based on {view === "class" ? "classes" : "programs"}
							</CardDescription>
						</div>
						<Select value={view} onValueChange={setView}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Select View" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="class">Class wise</SelectItem>
								<SelectItem value="program">Program wise</SelectItem>
							</SelectContent>
						</Select>
					</CardHeader>
					<CardContent>
						{isFetchingStats || statsFetchingError ? (
							<SecondayChartSkeleton chartConfig={sampleChartConfig} data={sampleData.byClass} />
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart
									accessibilityLayer
									data={(trendsChartData || sampleData.byClass) as any[]}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="label"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										tickFormatter={(value) => value}
									/>
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator="dashed" />}
									/>
									<Bar dataKey="total" fill="var(--color-total)" radius={4} />
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
				{/* Class-wise or Program-wise Trends Section FOR DESKTOP / TABLETS*/}
				<Card className="hidden md:flex">
					<CardHeader>
						<CardTitle>Class wise Trends</CardTitle>
						<CardDescription>Trends based on classes</CardDescription>
					</CardHeader>
					<CardContent>
						{isFetchingStats || statsFetchingError ? (
							<SecondayChartSkeleton chartConfig={sampleChartConfig} data={sampleData.byClass} />
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart
									accessibilityLayer
									data={(trendsChartData || sampleData.byClass) as any[]}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="label"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										tickFormatter={(value) => value}
									/>
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator="dashed" />}
									/>
									<Bar dataKey="total" fill="var(--color-total)" radius={4} />
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
				<Card className="hidden md:flex">
					<CardHeader>
						<CardTitle>Program wise Trends</CardTitle>
						<CardDescription>Trends based on programs</CardDescription>
					</CardHeader>
					<CardContent>
						{isFetchingStats || statsFetchingError ? (
							<SecondayChartSkeleton chartConfig={sampleChartConfig} data={sampleData.byProgram} />
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart
									accessibilityLayer
									data={(trendsChartData || sampleData.byProgram) as any[]}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="label"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
										tickFormatter={(value) => value}
									/>
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator="dashed" />}
									/>
									<Bar dataKey="total" fill="var(--color-total)" radius={4} />
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</section>
		</section>
	);
};

export default StudentStats;
