import React, { useEffect, useState } from "react";
import { FilterEmptyObjectFields, isApiError } from "../../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../../components/Loaders";
import {
	useGetAllStudentsAttendanceQuery
} from "../../services/attendance.api";
import { ArrowRight, CircleFadingPlus, Copy, Settings2 } from "lucide-react";
import {
	ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { StudentAttendanceTableEntry } from "../../types/global";
import DataTable, { DataTableViewOptionsProps } from "../../components/ComplexDataTable";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setStudentsAttendanceFilter } from "../../store/uiSlice";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DropdownMenuCheckboxItem } from "../../components/ui/dropdown-menu";
import { useGetClassesQuery } from "../../services/academics.api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router";

function DataTableViewOptions({
	table,
	disabled,
	dispatch,
}: DataTableViewOptionsProps<StudentAttendanceTableEntry>) {
	const { data: sections, isLoading: isLoadingSections } = useGetClassesQuery();
	
	const filter = useSelector((state: any) => state.ui.studentsAttendanceFiltersState);
	// console.log(filter);

	useEffect(() => {
		if (!isLoadingSections && sections?.data && !filter.sectionId) {
			if (sections.data.length >= 3) {
				const thirdClass = sections.data[2];
				if (thirdClass.sections.length >= 2) {
					const secondSectionId = thirdClass.sections[1]._id;
					dispatch(setStudentsAttendanceFilter({ sectionId: secondSectionId }));
				}
			}
		}
	}, [isLoadingSections, sections, filter.sectionId, dispatch]);

	const onSectionChange = (id: string) => {
		dispatch(setStudentsAttendanceFilter({ sectionId: id }));
	};

	return (
		<div className="flex gap-2">
			<div>
				<Select
					onValueChange={onSectionChange}
					value={filter.sectionId || ""}
					className="*:w-full"
					disabled={isLoadingSections || disabled}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select section" />
					</SelectTrigger>
					<SelectContent>
						{sections?.data
							?.filter((classItem) => classItem.sections.length > 0)
							.flatMap((classItem) =>
								classItem.sections.map((section) => (
									<SelectItem key={section._id} value={section._id}>
										{`${classItem.name} - ${section.name}`}
									</SelectItem>
								))
							)}
					</SelectContent>
				</Select>
			</div>
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

const StudentsAttendence_forAdmin: React.FC = () => {
	const $ = useSelector((state: RootState) => state.ui.studentsAttendanceFiltersState);

	const filters = FilterEmptyObjectFields($);
	const page = filters.page;
	const shouldSkipQuery = !filters.sectionId;
	
	const {
		data: attendanceData,
		isLoading: isFetchingAttendance,
		error: fetchError,
	} = useGetAllStudentsAttendanceQuery(
		{
			page: page as number,
			limit: filters.limit as number,
			sectionId: filters.sectionId as string,
		},
		{
			skip: shouldSkipQuery,
		}
	);

	const dispatch = useDispatch();
	const navigate = useNavigate();

	if (isApiError(fetchError)) {
		console.error(fetchError.data.message);
		toast.error(fetchError.data.message);
	}

	const tableColumns: ColumnDef<StudentAttendanceTableEntry, unknown>[] = [
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
			id: "Roll No.",
			enableHiding: false,
			accessorKey: "rollNumber",
			cell: (info: any) => (
				<div>
					<div
						className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
						onClick={() => {
							navigator.clipboard.writeText(info.row.original.rollNumber);
							toast.success("Student roll number copied", {
								description: info.row.original.rollNumber,
							});
						}}
					>
						<Copy strokeWidth={1.65} width={13} className="self-center" />
						<span>{info.row.original.rollNumber}</span>
					</div>
				</div>
			),
			header: () => "Roll No.",
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
			id: "actions",
			cell: ({ row }) => {
				const stdRow: StudentAttendanceTableEntry = row.original;

				return (
					<div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigate("/dashboard/admin/attendance/student/" + stdRow._id)}
							className="flex gap-2 m-0"
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
		data: (attendanceData?.data?.data as StudentAttendanceTableEntry[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
	});

	const handlePageChange = (newPage: number) => {
		dispatch(setStudentsAttendanceFilter({ page: Number(newPage) }));
	};

	const handleLimitChange = (limitVal: number) => {
		dispatch(setStudentsAttendanceFilter({ limit: Number(limitVal) }));
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
				<DataTableViewOptions table={table} disabled={isFetchingAttendance} dispatch={dispatch} />
			)}
		/>
	);
};

export default StudentsAttendence_forAdmin;
