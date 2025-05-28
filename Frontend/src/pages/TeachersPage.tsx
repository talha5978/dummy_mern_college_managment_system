import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetTeachersQuery, useLazyGetStudentQuery, useLazyGetTeacherQuery } from '../services/users.api';
import { FilterEmptyObjectFields, giveFilterLimitandPage, isApiError, mutationToastError } from '../utils/helpers';
import { toast } from 'sonner';
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import DataTable, { DataTableViewOptionsProps } from '../components/ComplexDataTable';
import {  TeacherType } from '../types/global';
import { ArrowUpDown, Copy, Filter, MoreHorizontal, PlusIcon, Settings2 } from 'lucide-react';
import { closeDialoge, openDialog, setStudentDialogeData, setTeacherDialogeData, setTeachersPagination, stateDialogeBoxes } from '../store/uiSlice';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { SpinnerLoader } from '../components/Loaders';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuCheckboxItem } from '../components/ui/dropdown-menu';
import TeacherFormDialogueBox from '../components/TeacherForm';
import { pushTeachers } from '../store/academicsSlice';
import TeacherFilterDialogeBox from '../components/TeacherFilterDialogeBox';

function DataTableViewOptions({ table, disabled, dispatch }: DataTableViewOptionsProps<TeacherType>) {
    const $ = useSelector((state: any) => state.ui.teachersFiltersState);
    const filters = giveFilterLimitandPage($);
    delete filters.filterType;
    const activeFiltersCount = Object.values(filters).filter((val) => val != "" && val != null).length;

    const handleFilterClick = () => {
        dispatch(openDialog(stateDialogeBoxes.teacherFilterDialogeBoxOpen));
    };

    const handleAddClick = () => {
        dispatch(setStudentDialogeData(null));
        dispatch(openDialog(stateDialogeBoxes.addTeacherDialogeBoxOpen));
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
                onClick={handleAddClick}
                disabled={disabled}
            >
                <PlusIcon />
                <span className="hidden md:inline">Add Teacher</span>
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

const TeachersPage: React.FC = () => {
    const dispatch = useDispatch();

    const page = useSelector((state: any) => state.ui.teachersFiltersState.page);
    const $ = useSelector((state: any) => state.ui.teachersFiltersState);

    const filters = FilterEmptyObjectFields($);
    
    const {
		data: teachers,
		isLoading: isFetchingTeachers,
		error: teachersFetchingError,
	} = useGetTeachersQuery(filters);
    
    if (isApiError(teachersFetchingError) ) {
        console.error(teachersFetchingError.data?.message);
        toast.error(teachersFetchingError.data?.message);
    }

    if (teachers?.data.teachers.length !== 0) {
        dispatch(pushTeachers(teachers?.data.teachers || []));
    }
    
    const [triggerGetTeacher, { isLoading: isFetchingTeacher }] = useLazyGetTeacherQuery();

    const handleTeacherUpdateClick = async (rowData: TeacherType) => {
        try {
            const teacher = await triggerGetTeacher(rowData._id).unwrap();
    
            if (teacher?.success) {
                dispatch(setTeacherDialogeData(teacher.data));
                dispatch(openDialog(stateDialogeBoxes.addTeacherDialogeBoxOpen));
            }
        } catch (error: any) {
            mutationToastError({
                error,
                message: "Process failed",
                description: error?.data?.message,
            });
        }
    };
    
    const teachersTableColumns: ColumnDef<TeacherType, unknown>[] = [
 
        {
            accessorKey: "ID",
            header: "ID",
            cell: (info: any) => (
                <div>
                    <div
                        className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
                        onClick={() => {
                            navigator.clipboard.writeText(info.row.original._id);
                            toast.success("Teacher id copied", {
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
            id: "Email",
            accessorKey: "email",
            cell: (info: any) => info.row.original.email,
            header: () => "Email",
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
            id: "Subject Specialization",
            accessorKey: "subjectSpecialization",
            cell: (info: any) => info.row.original.subjectSpecialization,
            header: () => "Subject Specialization",
        },
        {
            id: "Total Salary",
            accessorKey: "totalSalary",
            cell: (info: any) => info.row.original.totalSalary,
            header: () => "Total Salary (Rs.)",
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
				const teacherRow: TeacherType = row.original;
                
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
									// 	handleDetailsClick(teacherRow)
									// }
								>
									See Details
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleTeacherUpdateClick(teacherRow)}
                                    disabled={isFetchingTeacher || isFetchingTeachers}
								>
									Update
                                    {isFetchingTeacher && <SpinnerLoader />}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
    ];

    const handlePageChange = (newPage: number) => {
        dispatch(setTeachersPagination({ page: Number(newPage) }));
    };

    const handleLimitChange = (limitVal: number) => {
        dispatch(setTeachersPagination({ limit: Number(limitVal) }));
    }

    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data: (teachers?.data.teachers as TeacherType[]) ?? [],
        columns: teachersTableColumns,
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
                <TeacherFilterDialogeBox />
				<TeacherFormDialogueBox />
            
				<div className="p-4 border-2 border-muted shadow-sm">
					<DataTable
						tableTitle="Teachers"
						columns={teachersTableColumns}
						loadingState={isFetchingTeachers}
						NoOfSkeletonRows={10}
                        table={table}
						pagination={{
							currentPage: page,
							totalPages: teachers?.data.pagination.totalPages as number,
							onPageChange: handlePageChange,
							limit: teachers?.data.pagination.limit as number,
							onLimitChange: handleLimitChange,
							hasNextPage: teachers?.data.pagination.hasNextPage as boolean,
							hasPrevPage: teachers?.data.pagination.hasPrevPage as boolean,
						}}
                        DataTableViewOptions={() => (
                            <DataTableViewOptions
                                table={table}
                                disabled={isFetchingTeachers}
                                dispatch={dispatch}
                            />
                        )}
					/>
				</div>
			</section>
		</>
	);
}

export default TeachersPage;
