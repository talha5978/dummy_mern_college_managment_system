import React, { useState } from "react";
import { isApiError, mutationToastError } from "../../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../../components/Loaders";
import { useGetStudentsForAttendanceMarkingQuery, useMarkStudentsAttendanceMutation } from "../../services/attendance.api";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { StudentMarkingData } from "../../types/global";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentListProps {
	students: StudentMarkingData[];
	subject: string;
	sectionId: string;
}

const StudentsList = ({ students, subject, sectionId }: StudentListProps) => {
	// State to track updated attendance statuses
	const [attendanceUpdates, setAttendanceUpdates] = useState<
		{ studentId: string; status: "A" | "L" | "P" | "H" }[]
	>(
		students.map((student) => ({
			studentId: student._id,
			status: student.attendanceStatus,
		}))
	);

	const [markStudentAttendanece, { isLoading: isSavingAttendance }] = useMarkStudentsAttendanceMutation();

	// Handle attendance status change for a student
	const handleStatusChange = (studentId: string, value: "A" | "L" | "P" | "H") => {
		setAttendanceUpdates((prev) =>
			prev.map((update) => (update.studentId === studentId ? { ...update, status: value } : update))
		);
	};

	// Handle saving attendance updates via API
	const handleSaveAttendance = async () => {
		if (!students || !sectionId || !subject) {
			toast.error("Failed to save attendance");
			return null;
		}
		try {
			const response = await markStudentAttendanece({
				attendenceData: attendanceUpdates,
				subject: subject,
				sectionId: sectionId,
			}).unwrap();

			if (response?.success) {
				toast.success("Attendance saved successfully");
			}
		} catch (error: any) {
			console.error("Failed to save attendance", error);
			mutationToastError({
				error,
				message: "Failed to save attendance",
				description: error?.data?.message,
			});
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
			<CardHeader className="p-4 border-b border-muted-foreground">
				<CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
					<BookOpen className="w-4 h-4 text-primary" />
					Students List
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4">
				<div className="flex flex-col gap-3">
					{students.map((student) => (
						<div
							key={student._id}
							className="flex items-center justify-between py-2 border-b border-muted-foreground last:border-b-0"
						>
							<div className="flex flex-col">
								<p className="text-sm font-medium text-primary">{student.fullName}</p>
								<p className="text-xs text-muted-foreground">Roll: {student.rollNumber}</p>
							</div>
							<Select
								value={
									attendanceUpdates.find((update) => update.studentId === student._id)
										?.status
								}
								onValueChange={(value: "A" | "L" | "P" | "H") =>
									handleStatusChange(student._id, value as "A" | "L" | "P" | "H")
								}
							>
								<SelectTrigger className=" dark:border-muted-foreground text-primary text-sm">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="P">Present</SelectItem>
									<SelectItem value="A">Absent</SelectItem>
									<SelectItem value="L">Leave</SelectItem>
									<SelectItem value="H">Holiday</SelectItem>
								</SelectContent>
							</Select>
						</div>
					))}
					<Button
						onClick={handleSaveAttendance}
						className="mt-4 w-full text-white/90 hover:text-white/90 dark:hover:text-white/90 flex items-center justify-center gap-2 text-sm font-medium bg-blue-500 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-500"
						variant="outline"
						disabled={!students || isSavingAttendance}
					>
						<span>{isSavingAttendance ? "Saving..." : "Save Attendance"}</span>
						{isSavingAttendance ? <SpinnerLoader /> : <Save width={20} height={20} />}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

const MarkStudentsAttendancePage: React.FC = () => {
	const { sectionId, subject } = useParams();
	const shouldSkipQuery = !sectionId;

	const {
		data: stdAttendance,
		isLoading: isFetchingStudents,
		error: fetchStdError,
	} = useGetStudentsForAttendanceMarkingQuery(sectionId ?? "", { skip: shouldSkipQuery });
	
	const navigate = useNavigate();

	if (isApiError(fetchStdError)) {
		console.error(fetchStdError.data.message);
		toast.error(fetchStdError.data.message);
	}

	if (isFetchingStudents) {
		return (
			<div className="flex w-full h-full items-center justify-center p-6 md:p-10">
				<SpinnerLoader />
			</div>
		);
	}

	return (
		<>
			<section className="flex flex-col gap-6">
				<div>
					<span className="cursor-pointer" onClick={() => navigate(-1)}>
						<ArrowLeft height={24} width={24} />
					</span>
					<h1 className="text-3xl font-bold text-center">
						Student's Attendance for {moment(Date.now()).format("YYYY-MM-DD")}
					</h1>
				</div>
				<div>
					{stdAttendance && stdAttendance.data.length > 0 && (
						<StudentsList students={stdAttendance.data} subject={subject ?? ""} sectionId={sectionId ?? ""} />
					)}
				</div>
			</section>
		</>
	);
};

export default MarkStudentsAttendancePage;
