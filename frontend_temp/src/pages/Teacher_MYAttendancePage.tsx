import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useGetTeacherAttendanceQuery } from "../services/attendance.api";
import { useState } from "react";
import { AttendancePieChart, MonthlyCalendar } from "./Admin_Attendance/TeachersAttendanceDetailsPage";
import { Button } from "@/components/ui/button";


const My_Attendance_Page = () => {
	const teacherId = useSelector((state: RootState) => state.auth.userData?._id);
	const shouldSkipQuery = !teacherId;

	const { data: teacherAttendance, isLoading } = useGetTeacherAttendanceQuery(teacherId ?? "", { skip: shouldSkipQuery });
    console.log(teacherAttendance);
    
	const [selectedMonth, setSelectedMonth] = useState<null | string>(null);

	if (isLoading && !teacherAttendance) return <div>Loading...</div>; // Replace with your SpinnerLoader if available

	return (
		<section className="sm:p-6 sm:pt-0 p-0 space-y-8">
			<div>
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
}

export default My_Attendance_Page