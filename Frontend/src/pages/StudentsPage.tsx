import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetStudentsQuery, useLazyGetStudentQuery } from '../services/users.api';
import { FilterEmptyObjectFields, giveFilterLimitandPage, isApiError, mutationToastError } from '../utils/helpers';
import { toast } from 'sonner';
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import DataTable, { DataTableViewOptionsProps } from '../components/ComplexDataTable';
import { StudentType } from '../types/global';
import { ArrowUpDown, Badge, Copy, Filter, MoreHorizontal, PlusIcon, Settings2 } from 'lucide-react';
import { closeDialoge, openDialog, setStudentDialogeData, setStudentsPagination, stateDialogeBoxes } from '../store/uiSlice';
import StudentFilterDialogeBox from '../components/StudentFilterDialogeBox';
import StudentFormDialogueBox from '../components/StudentForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { SpinnerLoader } from '../components/Loaders';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { FileUploadInputForm } from '../components/ui/BulkStudentsFileInput';
import StudentStats from '../components/StudentsStats';
import { DropdownMenuCheckboxItem } from '../components/ui/dropdown-menu';

function BulkAddStudentDialoge() {
    const dispatch = useDispatch();
    const dialogOpen = useSelector((state: any) => state.ui.dialogeBoxes.bulkAddStudentDialogeBoxOpen);

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={() =>
                dispatch(
                    closeDialoge(stateDialogeBoxes.bulkAddStudentDialogeBoxOpen)
                )
            }
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add students in bulk</DialogTitle>
                    <DialogDescription>
                        Format properly and upload file to add bulk students
                    </DialogDescription>
                </DialogHeader>
                <FileUploadInputForm />
            </DialogContent>
        </Dialog>
    );
}

function DataTableViewOptions({ table, disabled, dispatch }: DataTableViewOptionsProps<StudentType>) {
    const $ = useSelector((state: any) => state.ui.studentsFiltersState);
    const filters = giveFilterLimitandPage($);
    const activeFiltersCount = Object.values(filters).filter((val) => val != "").length;

    const handleFilterClick = () => {
        dispatch(openDialog(stateDialogeBoxes.studentFilterDialogeBoxOpen));
    };

    const handleAddClick = () => {
        dispatch(setStudentDialogeData(null));
        dispatch(openDialog(stateDialogeBoxes.addStudentDialogeBoxOpen));
    };

    const handleBulkAddClick = () => {
        dispatch(openDialog(stateDialogeBoxes.bulkAddStudentDialogeBoxOpen));
    };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                className="cursor-pointer dark:hover:bg-muted relative"
                onClick={handleFilterClick}
                disabled={disabled}
            >
                <Filter />
                <span className="hidden md:inline">Filters</span>
                {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-3 -right-2 text-[0.6rem] px-2">{activeFiltersCount}</Badge>
                )}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="cursor-pointer dark:hover:bg-muted"
                onClick={handleBulkAddClick}
                disabled={disabled}
            >
                <PlusIcon />
                <span className="hidden md:inline">Bulk Add Student</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="cursor-pointer dark:hover:bg-muted"
                onClick={handleAddClick}
                disabled={disabled}
            >
                <PlusIcon />
                <span className="hidden md:inline">Add Student</span>
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
                        .filter((column: any) => typeof column.accessorFn !== "undefined" && column.getCanHide())
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

const StudentsPage: React.FC = () => {
    const dispatch = useDispatch();

    const page = useSelector((state: any) => state.ui.studentsFiltersState.page);
    const $ = useSelector((state: any) => state.ui.studentsFiltersState);

    const filters = FilterEmptyObjectFields($);
    
    const {
		data: students,
		isLoading: isFetchingStudents,
		error: studentsFetchingError,
	} = useGetStudentsQuery(filters);
    
    if (isApiError(studentsFetchingError) ) {
        console.error(studentsFetchingError.data.message);
        toast.error(studentsFetchingError.data.message);
    }
   
    const [triggerGetStudent, { isLoading: isFetchingStudent }] = useLazyGetStudentQuery();

    const handleStdUpdateClick = async (rowData: StudentType) => {
        try {
            const student = await triggerGetStudent(rowData._id).unwrap();
    
            if (student?.success) {
                dispatch(setStudentDialogeData(student.data));
                dispatch(openDialog(stateDialogeBoxes.addStudentDialogeBoxOpen));
            }
        } catch (error: any) {
            mutationToastError({
                error,
                message: error?.data?.message || "Failed to get student",
                description: "Please try again",
            });
        }
    };
    
    
    const studentsTableColumns: ColumnDef<StudentType, unknown>[] = [
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
                        <Copy
                            strokeWidth={1.65}
                            width={13}
                            className="self-center"
                        />
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
                        <Copy
                            strokeWidth={1.65}
                            width={13}
                            className="self-center"
                        />
                        <span>{info.row.original.rollNumber}</span>
                    </div>
                </div>
            ),
            header: () => "Roll No.",
        },
        {
            id: "Gender",
            accessorKey: "gender",
            cell: (info: any) => info.row.original.gender,
            header: ({ column }) => {
                return (
                    <div
                        className="cursor-pointer flex gap-1"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Gender
                        <ArrowUpDown className="ml-2 h-4 w-4 p-0 self-center" />
                    </div>
                );
            }
        },
        {
            id: "Class",
            accessorKey: "class",
            cell: (info: any) => info.row.original.class,
            header: () => "Class"
        },
        {
            id: "Section",
            accessorKey: "section",
            cell: (info: any) => info.row.original.section,
            header: () => "Section"
        },
        {
            id: "Program",
            accessorKey: "program",
            cell: (info: any) => info.row.original.program,
            header: () => "Programme"
        },
        {
            id: "Session",
            accessorKey: "sessionYears",
            cell: (info: any) => info.row.original.sessionYears,
            header: () => "Session"
        },
        {
            id: "DOB",
            accessorKey: "dob",
            cell: (info: any) => info.row.original.dob,
            header: () => "DOB."
        },
        {
            id: "Status",
            accessorKey: "status",
            cell: (info: any) => info.row.original.status,
            header: ({ column }) => {
                return (
                    <div
                        className="cursor-pointer flex gap-1"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4 p-0 self-center" />
                    </div>
                );
            }
        },
        {
            id: "Added At",
            accessorKey: "createdAt",
            cell: (info: any) => info.row.original.createdAt,
            header: () => "Added At"
        },
        {
			id: "actions",
			cell: ({ row }) => {
				const stdRow: StudentType = row.original;
                
				return (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="h-8 w-8 p-0 cursor-pointer"
								>
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									// onClick={() =>
									// 	handleDetailsClick(stdRow)
									// }
								>
									See Details
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleStdUpdateClick(stdRow)}
								>
									Update
                                    {isFetchingStudent && <SpinnerLoader />}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
    ];

    const handlePageChange = (newPage: number) => {
        dispatch(setStudentsPagination({ page: Number(newPage) }));
    };

    const handleLimitChange = (limitVal: number) => {
        dispatch(setStudentsPagination({ limit: Number(limitVal) }));
    }
    
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
		data: (students?.data.students as StudentType[]) ?? [],
		columns: studentsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
		state: {
			sorting,
		},
	});

    return (
		<>
			<section className="space-y-6">
				<StudentFilterDialogeBox />
				<StudentFormDialogueBox />
                <BulkAddStudentDialoge />
                <StudentStats />
				<div className="p-4 border-2 border-muted shadow-sm">
					<DataTable
						tableTitle="Students"
						loadingState={isFetchingStudents}
						NoOfSkeletonRows={10}
                        columns={studentsTableColumns}
                        table={table}
						pagination={{
							currentPage: page,
							totalPages: students?.data.pagination.totalPages as number,
							onPageChange: handlePageChange,
							limit: students?.data.pagination.limit as number,
							onLimitChange: handleLimitChange,
							hasNextPage: students?.data.pagination.hasNextPage as boolean,
							hasPrevPage: students?.data.pagination.hasPrevPage as boolean,
						}}
                        DataTableViewOptions={() => (
                            <DataTableViewOptions
                                table={table}
                                disabled={isFetchingStudents}
                                dispatch={dispatch}
                            />
                        )}
					/>
				</div>
			</section>
		</>
	);
}

export default StudentsPage;
