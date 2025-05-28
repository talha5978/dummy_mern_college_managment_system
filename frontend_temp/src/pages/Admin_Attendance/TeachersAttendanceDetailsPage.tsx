import moment from "moment";
import { Calendar } from "@/components/ui/calendar";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetTeacherAttendanceQuery } from "../../services/attendance.api";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { AttendencePIChart } from "../../components/AttendencePIChart";

export const getDayStatus = (dayData: string) => {
	if (!dayData) return { color: "gray", label: "No Data" };
	if (dayData === "P") return { color: "green", label: "All Present" };
	if (dayData === "A") return { color: "red", label: "All Absent" };
	if (dayData === "L") return { color: "yellow", label: "On Leave" };
	if (dayData === "H") return { color: "orange", label: "On Leave" };
	return { color: "orange", label: "Mixed" };
};

export const AttendancePieChart = ({ data } : {
	data: {
		totalPresent: number;
		totalAbsent: number;
		totalLeave: number;
		totalHolidays: number;
		overallAttendancePercentage: number;
	};
}) => {
	const pieData = [
		{ name: "Present", value: data.totalPresent },
		{ name: "Absent", value: data.totalAbsent },
		{ name: "Leave", value: data.totalLeave },
		{ name: "Holidays", value: data.totalHolidays },
	];

	return (
		<div className="flex flex-col w-full">
			<span className="w-fit *:w-fit self-center">
				<p className="text-xl font-semibold leading-none">Overall Attendance</p>
			</span>
			<AttendencePIChart
				pieData={pieData}
				overallAttendancePercentage={data.overallAttendancePercentage}
			/>
		</div>
	);
};


export const MonthlyCalendar = ({ monthData, month }: { monthData: {
	[date: string]: "P" | "A" | "L" | "H"
}; month: string }) => {
	// Precompute statuses for each day for efficiency
	const dayStatuses = useMemo(() => {
		const statuses: { [key: string]: any } = {};
		Object.keys(monthData).forEach((date) => {
			statuses[date] = getDayStatus(monthData[date]);
		});
		return statuses;
	}, [monthData]);


	// Add colored dot below each day
	const getColoredContent = ({ date }: { date: string }) => {
		const formattedDate = moment(date).format("YYYY-MM-DD");
		const status = dayStatuses[formattedDate];
		if (status) {
			return (
				<div className="flex justify-center">
					<div
						className={`w-2 h-2 rounded-full mt-1 ${
							status.color === "green"
								? "bg-green-500"
								: status.color === "red"
								? "bg-red-500"
								: status.color === "yellow"
								? "bg-[#FFBB28]"
								: "bg-[#FF8042]"
						}`}
					/>
				</div>
			);
		}
		return null;
	};

	const getDayContent = (date:string) => {
		const formattedDate = moment(date).format("YYYY-MM-DD");
		const status = dayStatuses[formattedDate];
		if (status) {
			return (
				<div className="flex flex-col items-center">
					<time dateTime={formattedDate}>{moment(date).date()}</time>
					<div
						className={`w-2 h-2 rounded-full mt-1 ${
							status.color === "green"
								? "bg-green-500"
								: status.color === "red"
								? "bg-red-500"
								: status.color === "yellow"
								? "bg-yellow-500"
								: "bg-gray-400"
						}`}
					/>
				</div>
			);
		}
		return <time dateTime={formattedDate}>{moment(date).date()}</time>;
	};

    const defaultMonthDate = moment(month, "MMMM YYYY").toDate();
    
	return (
		<div className="flex justify-center">
			<Calendar
				mode="single"
				month={defaultMonthDate}
				tileContent={getColoredContent}
				className="border rounded-md shadow"
				classNames={{
					nav_button_previous: "hidden",
					nav_button_next: "hidden",
					nav_button: "hidden",
					cell: "p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
					day: "size-8 p-0 font-normal aria-selected:opacity-100 cursor-pointer",
				}}
				dayClassName={getColoredContent} // Apply background colors
				components={{
					DayContent: ({ date }: { date: string }) => getDayContent(date), // Add dots
				}}
			/>
		</div>
	);
};

// Main Component
const TeacherAttendanceDeatilsPage = () => {
	let { teacherId } = useParams();
	
	const shouldSkipQuery = !teacherId;

	const { data: teacherAttendance, isLoading } = useGetTeacherAttendanceQuery(teacherId ?? "", { skip: shouldSkipQuery });
	const [selectedMonth, setSelectedMonth] = useState<null | string>(null);
	const navigate = useNavigate();

	if (isLoading && !teacherAttendance) return <div>Loading...</div>; // Replace with your SpinnerLoader if available

	return (
		<section className="sm:p-6 sm:pt-0 p-0 space-y-8">
			<div>
				<span className="cursor-pointer" onClick={() => navigate(-1)}>
					<ArrowLeft height={24} width={24} />
				</span>
				<h1 className="text-3xl font-bold text-center mt-2">Attendance Details</h1>
			</div>
			{/* *:bg-amber-900 bg-red-600 USE TO DEBUG */}
			<div className="flex flex-col gap-8 justify-center max-w-xl mx-auto">
				{/* Pie Chart Section */}
				<div className="w-full sm:p-6 p-2 rounded-lg shadow-md">
					{teacherAttendance && <AttendancePieChart data={teacherAttendance.data} />}
				</div>

				{/* Monthly Tiles Section */}
				<div className="w-full sm:p-6 p-2 rounded-lg shadow-md">
					<h2 className="text-xl font-semibold mb-4 text-center">Monthly Attendance</h2>
					<div className="grid grid-cols-1 gap-2">
						{teacherAttendance &&
							Object.keys(teacherAttendance.data.data).map((month) => (
								<Button key={month} onClick={() => setSelectedMonth(month)} className="flex gap-2">
									<span>{month}</span>
									<span className={`px-2 ${teacherAttendance?.data.monthlyAttendancePercentage[month] > 70 ? "bg-green-400" : "bg-[#FF8042]"} rounded-sm`}>
										{teacherAttendance?.data.monthlyAttendancePercentage[month]}%
									</span>
								</Button>
							))}
					</div>
				</div>
				{/* Calendar Section for Selected Month */}
				{selectedMonth && (
					<div className="sm:p-6 p-0 rounded-lg shadow-md w-full">
						<h2 className="text-xl font-semibold mb-4 text-center">Attendance for {selectedMonth}</h2>
						{teacherAttendance && (
							<MonthlyCalendar
								monthData={teacherAttendance.data.data[selectedMonth]}
								month={selectedMonth}
							/>
						)}
					</div>
				)}
			</div>
		</section>
	);
};


export { TeacherAttendanceDeatilsPage };