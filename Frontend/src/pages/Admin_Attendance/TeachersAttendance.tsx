import React from "react";
import { FilterEmptyObjectFields, isApiError } from "../../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../../components/Loaders";
import {
	useGetAllTeachersAttendanceQuery
} from "../../services/attendance.api";
import { ArrowRight, CircleFadingPlus, Copy, Settings2 } from "lucide-react";
import {
	ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { TeacherAttendanceTableEntry } from "../../types/global";
import DataTable, { DataTableViewOptionsProps } from "../../components/ComplexDataTable";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setTeachersAttendanceFilter } from "../../store/uiSlice";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem } from "../../components/ui/dropdown-menu";
import { useNavigate } from "react-router";

function DataTableViewOptions({
	table,
	disabled,
	dispatch,
}: DataTableViewOptionsProps<TeacherAttendanceTableEntry>) {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.auth.userData);
	const handleMarkAttendanceClick = () => {
		navigate("/dashboard/admin/attendance/teachers/mark-attendance");
	};
	
	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				size="sm"
				className="cursor-pointer dark:hover:bg-muted"
				onClick={handleMarkAttendanceClick}
				disabled={disabled || currentUser?.role !== "admin"}
			>
				<CircleFadingPlus />
				<span className="hidden md:inline">
					Mark Attedance
				</span>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
						disabled={disabled}
					>
						<Settings2 />
						<span className="hidden md:inline">View</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[150px]">
					<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{table
						.getAllColumns()
						.filter(
							(column: any) => typeof column.accessorFn !== "undefined" && column.getCanHide()
						)
						.map((column: any) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="cursor-pointer"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

const TeachersAttendance_forAdmin: React.FC = () => {
	const $ = useSelector((state: RootState) => state.ui.studentsAttendanceFiltersState);

	const filters = FilterEmptyObjectFields($);
	const page = filters.page;
	
	const {
		data: attendanceData,
		isLoading: isFetchingAttendance,
		error: fetchError,
	} = useGetAllTeachersAttendanceQuery({
		page: page as number,
		limit: filters.limit as number,
	});

	const dispatch = useDispatch();
	const navigate = useNavigate();

	if (isApiError(fetchError)) {
		console.error(fetchError.data.message);
		toast.error(fetchError.data.message);
	}

	const tableColumns: ColumnDef<TeacherAttendanceTableEntry, unknown>[] = [
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
			id: "Attendence",
			accessorKey: "attendence",
			enableHiding: false,
			cell: (info: any) => info.row.original.attendence,
			header: () => "Attendence",
		},
		{
            id: "Subject Specialization",
            accessorKey: "subjectSpecialization",
            cell: (info: any) => info.row.original.subjectSpecialization,
            header: () => "Subject Specialization",
        },
		{
			id: "Departments",
			accessorKey: "departments",
			cell: (info: any) => info.row.original.departments.map((dep: string) => dep).join(", "),
			header: () => "Departments",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const teacherRow: TeacherAttendanceTableEntry = row.original;

				return (
					<div>
						<Button
							variant="outline"
							className="flex gap-2 m-0"
							size="sm"
							onClick={() => navigate("/dashboard/admin/attendance/teacher/" + teacherRow._id)}
						>
							<span>See Details</span>
							<ArrowRight strokeWidth={1.65} width={13} className="self-center" />
						</Button>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: (attendanceData?.data?.data as TeacherAttendanceTableEntry[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
	});

	const handlePageChange = (newPage: number) => {
		dispatch(setTeachersAttendanceFilter({ page: Number(newPage) }));
	};

	const handleLimitChange = (limitVal: number) => {
		dispatch(setTeachersAttendanceFilter({ limit: Number(limitVal) }));
	};

	if (isFetchingAttendance) {
		return (
			<div className="flex w-full h-full items-center justify-center p-6 md:p-10">
				<SpinnerLoader />
			</div>
		);
	}

	return (
		<DataTable
			tableTitle="Attendence"
			loadingState={isFetchingAttendance}
			NoOfSkeletonRows={10}
			columns={tableColumns}
			table={table}
			pagination={{
				currentPage: page as number,
				totalPages: attendanceData?.data.pagination.totalPages as number,
				onPageChange: handlePageChange,
				limit: attendanceData?.data.pagination.limit as number,
				onLimitChange: handleLimitChange,
				hasNextPage: attendanceData?.data.pagination.hasNextPage as boolean,
				hasPrevPage: attendanceData?.data.pagination.hasPrevPage as boolean,
			}}
			DataTableViewOptions={() => (
				<DataTableViewOptions
					table={table}
					disabled={isFetchingAttendance}
					dispatch={dispatch}
				/>
			)}
		/>
	);
};

export default TeachersAttendance_forAdmin;
