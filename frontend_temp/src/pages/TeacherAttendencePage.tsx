import React from "react";
import { isApiError } from "../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../components/Loaders";
import { useGetTodaySectionsForAttendanceQuery } from "../services/attendance.api";
import { AlarmClockOff, ArrowRight, BookOpen } from "lucide-react";
import { TodaySectionsForAttendanceData } from "../types/global";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const LectureCard = ({ lecture, ...props }: { lecture: TodaySectionsForAttendanceData }) => {
	const navigate = useNavigate();

	const handleNavigate = () => {
		navigate(`/dashboard/teacher/attendance/students/mark-attendance/${lecture.section._id}/${lecture.subject}`);
	};

	return (
		<Card
			className="w-full max-w-sm border dark:border-muted-foreground rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 pt-2 pb-3 mx-auto"
			{...props}
		>
			<CardHeader className="px-4 py-1 border-b ">
				<CardTitle className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
					<BookOpen className="w-4 h-4 text-primary" />
					{lecture.subject}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-4 py-1">
				<div className="flex flex-col gap-3">
					<div>
						<p className="text-xs text-primary uppercase tracking-wide">Section</p>
						<p className="mt-1 text-base font-medium text-primary">{lecture.section.name}</p>
					</div>
					<Button
						onClick={handleNavigate}
						size="sm"
						variant="outline"
						className="w-full text-white/90 hover:text-white/90 dark:hover:text-white/90 flex items-center justify-center gap-2 text-sm font-medium bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500"
					>
						Mark Attendance
						<ArrowRight className="w-4 h-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};


const StudentsAttendence_Teachers: React.FC = () => {
	const {
		data: todaySectionsData,
		isLoading: isFetchingSections,
		error: sectionsFetchError,
	} = useGetTodaySectionsForAttendanceQuery();

	if (isApiError(sectionsFetchError)) {
		console.error(sectionsFetchError.data.message);
		toast.error(sectionsFetchError.data.message);
	}

	if (isFetchingSections) {
		return (
			<div className="flex w-full h-full items-center justify-center p-6 md:p-10">
				<SpinnerLoader />
			</div>
		);
	}

	return (
		<section>
			<div className="mb-5">
				<h1 className="text-2xl font-bold text-center">
					Today Lectures{" "}
					{todaySectionsData?.data && todaySectionsData?.data.length > 0
						? `(${todaySectionsData?.data.length})`
						: "(0)"
					}
				</h1>
			</div>
			{todaySectionsData?.data &&
			Array.isArray(todaySectionsData?.data) &&
			todaySectionsData?.data.length > 0 ? (
				<div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
					{todaySectionsData.data.map((item) => (
						<LectureCard key={item.section._id} lecture={item} />
					))}
				</div>
			) : (
				<div className="flex w-full h-full items-center justify-center p-6 md:p-10">
					<span className="flex flex-col gap-4 items-center *:text-lg *:font-semibold">
						<p>No timetables found for today :)</p>
						<AlarmClockOff width={30} height={30} />
					</span>
				</div>
			)}
			
		</section>
	);
};

export default StudentsAttendence_Teachers;
