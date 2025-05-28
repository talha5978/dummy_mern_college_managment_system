
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Label } from "recharts";
import { PI_CHART_COLORS as COLORS } from "../constants";

const chartConfig = {
	value: {
		label: "Count",
	},
	Present: {
		label: "Present",
		color: COLORS[0],
	},
	Absent: {
		label: "Absent",
		color: COLORS[1],
	},
	Leave: {
		label: "Leave",
		color: COLORS[2],
	},
	Holidays: {
		label: "Holidays",
		color: COLORS[3],
	},
};

interface COMP_PROPS {
    pieData: {
        name: string;
        value: number;
    }[];
    overallAttendancePercentage: number;
}

export const AttendencePIChart = ({ pieData, overallAttendancePercentage } : COMP_PROPS) => {
	return (
		<ChartContainer config={chartConfig} className="w-full h-full max-w-[300px] mx-auto aspect-square">
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={pieData}
						cx="50%"
						cy="50%"
						innerRadius="50%"
						outerRadius="70%"
						paddingAngle={5}
						dataKey="value"
						nameKey="name"
						label={false}
					>
						{pieData.map((_entry, index) => (
							<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
						))}
						<Label
							content={({ viewBox }) => {
								if (viewBox && "cx" in viewBox && "cy" in viewBox) {
									return (
										<text
											x={viewBox.cx}
											y={viewBox.cy}
											textAnchor="middle"
											dominantBaseline="middle"
										>
											<tspan
												x={viewBox.cx}
												y={viewBox.cy}
												className="fill-foreground sm:text-3xl text-2xl font-bold"
											>
												{overallAttendancePercentage}%
											</tspan>
											<tspan
												x={viewBox.cx}
												y={viewBox.cy + 24}
												className="fill-muted-foreground"
											>
												Attendance
											</tspan>
										</text>
									);
								}
							}}
						/>
					</Pie>
					<Tooltip content={<ChartTooltipContent />} cursor={false} />
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
};
