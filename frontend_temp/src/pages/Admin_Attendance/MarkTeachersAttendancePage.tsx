import React, { useEffect, useState } from "react";
import { isApiError, mutationToastError } from "../../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../../components/Loaders";
import {
    useGetTeachersForAttendanceQuery,
    useMarkTeachersAttendanceMutation
} from "../../services/attendance.api";
import { ArrowLeft, Copy, Save } from "lucide-react";
import {
    ColumnDef,
} from "@tanstack/react-table";
import { TeacherAttendanceMarkData, TeacherFORAttendance } from "../../types/global";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router";
import DataTable from "../../components/SimpleDataTable";
import moment from "moment";

const MarkTeachersAttendancePage: React.FC = () => {   
    const {
        data: attendanceData,
        isLoading: isFetchingAttendance,
        error: fetchError,
    } = useGetTeachersForAttendanceQuery();

    const navigate = useNavigate();

    if (isApiError(fetchError)) {
        console.error(fetchError.data.message);
        toast.error(fetchError.data.message);
    }

        // State to hold selected attendance statuses
    const [selectedAttendances, setSelectedAttendances] = useState<TeacherAttendanceMarkData[]>([]);
    const defaultSelectedStatus = "A";

    const [saveAttendance, { isLoading: isSavingAttendance }] = useMarkTeachersAttendanceMutation();

    // Initialize selectedAttendances with data from the current page
    useEffect(() => {
        if (attendanceData?.data) {
            const initialAttendances = attendanceData.data.map((teacher: TeacherFORAttendance) => ({
                teacherId: teacher._id,
                status: teacher.attendanceStatus || defaultSelectedStatus
            }));
            
            setSelectedAttendances(initialAttendances);
        }
    }, [attendanceData]);
    
    const tableColumns: ColumnDef<TeacherFORAttendance, unknown>[] = [
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info: any) => (
				<div>
					<div
						className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
						onClick={() => {
							navigator.clipboard.writeText(info.row.original._id);
							toast.success("Student id copied", {
								description: info.row.original._id,
							});
						}}
					>
						<Copy strokeWidth={1.65} width={13} className="self-center" />
						<span>{info.row.original._id}</span>
					</div>
				</div>
			),
		},
		{
			id: "Full Name",
			enableHiding: false,
			accessorKey: "fullName",
			cell: (info: any) => info.row.original.fullName,
			header: () => "Full Name",
		},
		{
			id: "Status",
			accessorKey: "status",
			cell: (info: any) => info.row.original.status,
			header: () => "Status",
		},
		{
			id: "Departments",
			accessorKey: "departments",
			cell: (info: any) => info.row.original.departments.map((dep: string) => dep).join(", "),
			header: () => "Departments",
		},
		{
			id: "Subject Specialization",
			accessorKey: "subjectSpecialization",
			cell: (info: any) => info.row.original.subjectSpecialization,
			header: () => "Subject Specialization",
		},
		{
            id: "actions",
            header: "Mark",
			cell: ({ row }) => {
				const teacherRow: TeacherFORAttendance = row.original;
				const attendanceEntry = selectedAttendances.find((att) => att.teacherId === teacherRow._id);

                let currentStatus = "";
                const redFlag = teacherRow.status != "Active";

                if (redFlag) {
                    currentStatus = defaultSelectedStatus
                } else {
                    currentStatus =  attendanceEntry
                        ? attendanceEntry.status
                        : teacherRow.attendanceStatus || defaultSelectedStatus;
                }

				const handleStatusChange = (newStatus: TeacherAttendanceMarkData["status"]) => {
					setSelectedAttendances((prev) =>
						prev.map((att) =>
							att.teacherId === teacherRow._id ? { ...att, status: newStatus } : att
						)
					);
				};

				return (
					<Select value={currentStatus} onValueChange={handleStatusChange} disabled={redFlag}>
						<SelectTrigger className="w-[100px]">
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="P">Present</SelectItem>
							<SelectItem value="A">Absent</SelectItem>
							<SelectItem value="L">Leave</SelectItem>
							<SelectItem value="H">Holiday</SelectItem>
						</SelectContent>
					</Select>
				);
			},
		},
	];

    const handleAttedanceSave = async () => {
        if (!attendanceData) {
            toast.error("Failed to save attendance");
            return null;
        }

        const changedAttendances = selectedAttendances.filter((selected) => {
            const original = attendanceData.data.find(
                (orig) => orig._id === selected.teacherId
            );
            return original && selected.status !== original.attendanceStatus;
        });

        console.log(changedAttendances);

        if (changedAttendances.length === 0) {
            toast.error("Please upload attendance data first");
            return null;
        }

        try {
            const response = await saveAttendance({ attendenceData: changedAttendances }).unwrap();
            if (response?.success) {
                toast.success("Attendance saved successfully");
            }
        } catch (error:any) {
            console.error(error);
            mutationToastError({
				error,
				message: "Failed to save attendance",
				description: error?.data?.message,
			});
        }
    };

    if (isFetchingAttendance) {
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
						Teachers Attendance for{" "}
						{moment(attendanceData?.data[0].date).format("YYYY-MM-DD") ||
							moment(Date.now()).format("YYYY-MM-DD")}
					</h1>
				</div>
				<DataTable
					tableTitle={`Teachers (${attendanceData?.data.length})`}
					columns={tableColumns as any}
					data={attendanceData?.data as TeacherFORAttendance[]}
					loadingState={isFetchingAttendance}
					NoOfSkeletonRows={20}
				/>
				{/* Save Button */}
				<div className="flex justify-end">
					<Button
						onClick={handleAttedanceSave}
						disabled={isSavingAttendance || isFetchingAttendance}
						size="sm"
						className="flex gap-2"
					>
						<span>{isSavingAttendance ? "Saving..." : "Save Attendance"}</span>
						{isSavingAttendance ? <SpinnerLoader /> : <Save width={20} height={20} />}
					</Button>
				</div>
			</section>
		</>
	);
};

export default MarkTeachersAttendancePage;
