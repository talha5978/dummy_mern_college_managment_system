import moment from "moment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { AttendanceLecture, DateLectures } from "../../types/global";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetStudentAttendanceQuery } from "../../services/attendance.api";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { AttendencePIChart } from "../../components/AttendencePIChart";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
const getDayStatus = (dayData: AttendanceLecture[]) => {
	if (!dayData || dayData.length === 0) return { color: "gray", label: "No Data" };
	const statuses = dayData.map((entry) => entry.status);
	if (statuses.every((status) => status === "P")) return { color: "green", label: "All Present" };
	if (statuses.every((status) => status === "A")) return { color: "red", label: "All Absent" };
	if (statuses.some((status) => status === "L")) return { color: "yellow", label: "On Leave" };
	if (statuses.some((status) => status === "H")) return { color: "orange", label: "On Leave" };
	return { color: "orange", label: "Mixed" };
};

const AttendancePieChart = ({ data } : {
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


const MonthlyCalendar = ({ monthData, month }: { monthData: DateLectures; month: string }) => {
	const [selectedDay, setSelectedDay] = useState<any>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
    
	// Precompute statuses for each day for efficiency
	const dayStatuses = useMemo(() => {
		const statuses: { [key: string]: any } = {};
		Object.keys(monthData).forEach((date) => {
			statuses[date] = getDayStatus(monthData[date]);
		});
		return statuses;
	}, [monthData]);

	// Handle click on a day
	const handleDayClick = (date:string) => {
		const formattedDate = moment(date).format("YYYY-MM-DD");
        
		if (monthData[formattedDate]) {
			setSelectedDay(formattedDate);
			setIsDialogOpen(true);
		}
	};

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
				onDayClick={handleDayClick}
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

			{selectedDay && (
				<Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
					<DialogContent>
						<DialogHeader className="mt-4">
							<DialogTitle>Attendance for {selectedDay}</DialogTitle>
						</DialogHeader>
						<div className="space-y-2">
							{monthData[selectedDay].map((lecture: AttendanceLecture, index: number) => (
								<Button
									key={index}
									className={`flex justify-between p-2 border-b w-full pointer-events-none ${
										lecture.status === "P"
											? "bg-green-300 dark:bg-green-300"
											: lecture.status === "A"
											? "bg-red-400 dark:bg-red-400"
											: "bg-[#FFBB28] dark:bg-[#FFBB28]"
									} *:dark:text-muted`}
									variant="outline"
								>
									<span>{lecture.lecture}</span>
									<span className={`font-semibold p-1 rounded-sm`}>{lecture.status}</span>
								</Button>
							))}
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};

// Main Component
const StudentAttendanceDetailsPage = () => {
	const { stdId } = useParams();
	const shouldSkipQuery = !stdId;

	const { data: stdAttendance, isLoading } = useGetStudentAttendanceQuery(stdId ?? "", { skip: shouldSkipQuery });
	const [selectedMonth, setSelectedMonth] = useState<null | string>(null);
	const navigate = useNavigate();
	const userData = useSelector((state: RootState) => state.auth.userData);

	if (isLoading && !stdAttendance) return <div>Loading...</div>; // Replace with your SpinnerLoader if available

	return (
		<section className="sm:p-6 sm:pt-0 p-0 space-y-8">
			<div>
				<span className={`cursor-pointer ${userData?.role === "student" ? "hidden" : ""}`} onClick={() => navigate(-1)}>
					<ArrowLeft height={24} width={24} />
				</span>
				<h1 className="text-3xl font-bold text-center mt-2">Attendance Details</h1>
			</div>
			{/* *:bg-amber-900 bg-red-600 USE TO DEBUG */}
			<div className="flex flex-col gap-8 justify-center max-w-xl mx-auto">
				{/* Pie Chart Section */}
				<div className="w-full sm:p-6 p-2 rounded-lg shadow-md">
					{stdAttendance && <AttendancePieChart data={stdAttendance.data} />}
				</div>

				{/* Monthly Tiles Section */}
				<div className="w-full sm:p-6 p-2 rounded-lg shadow-md">
					<h2 className="text-xl font-semibold mb-4 text-center">Monthly Attendance</h2>
					<div className="grid grid-cols-1 gap-2">
						{stdAttendance &&
							Object.keys(stdAttendance.data.data).map((month) => (
								<Button key={month} onClick={() => setSelectedMonth(month)} className="flex gap-2">
									<span>{month}</span>
									<span className={`px-2 ${stdAttendance?.data.monthlyAttendancePercentage[month] > 70 ? "bg-green-400" : "bg-[#FF8042]"} rounded-sm`}>
										{stdAttendance?.data.monthlyAttendancePercentage[month]}%
									</span>
								</Button>
							))}
					</div>
				</div>
				{/* Calendar Section for Selected Month */}
				{selectedMonth && (
					<div className="sm:p-6 p-0 rounded-lg shadow-md w-full">
						<h2 className="text-xl font-semibold mb-4 text-center">
							Attendance for {selectedMonth}
						</h2>
						{stdAttendance && (
							<MonthlyCalendar
								monthData={stdAttendance.data.data[selectedMonth] as DateLectures}
								month={selectedMonth}
							/>
						)}
					</div>
				)}
			</div>
		</section>
	);
};


export { StudentAttendanceDetailsPage };