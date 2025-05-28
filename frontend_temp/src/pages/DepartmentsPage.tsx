import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FilterEmptyObjectFields, isApiError, mutationToastError } from '../utils/helpers';
import { toast } from 'sonner';
import { ColumnDef, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import DataTable, { DataTableViewOptionsProps } from '../components/ComplexDataTable';
import {  DepartmentType } from '../types/global';
import { Copy,  Hotel,  MoreHorizontal, PlusIcon, Settings2 } from 'lucide-react';
import { openDialog, setDepartmentDialogeData, setDepartmentsPagination, stateDialogeBoxes } from '../store/uiSlice';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { DropdownMenuCheckboxItem } from '../components/ui/dropdown-menu';
import { useDeleteDepartmentMutation, useGetDepartmentsQuery } from '../services/academics.api';
import DepartmentFormDialogueBox from '../components/DepartmentsForm';
import StatsCard from '../components/StatsCard';
import { SpinnerLoader } from '../components/Loaders';

function DataTableViewOptions({ table, disabled, dispatch }: DataTableViewOptionsProps<DepartmentType>) {
    const handleAddClick = () => {
        dispatch(setDepartmentDialogeData(null));
        dispatch(openDialog(stateDialogeBoxes.departmentsAddDialogeBoxOpen));
    };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                className="cursor-pointer dark:hover:bg-muted"
                onClick={handleAddClick}
            >
                <PlusIcon />
                <span className="hidden md:inline">Add Department</span>
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

const DepartmentsPage: React.FC = () => {
    const dispatch = useDispatch();
    const page = useSelector((state: any) => state.ui.departmentsFilerState.page);
    const $ = useSelector((state: any) => state.ui.departmentsFilerState);

    const filters = FilterEmptyObjectFields($);
    
    const {
		data: departments,
		isLoading: isFetchingDepartments,
		error: departmentsFetchingError,
	} = useGetDepartmentsQuery(filters);
    
    if (isApiError(departmentsFetchingError) ) {
        console.error(departmentsFetchingError.data.message);
        toast.error(departmentsFetchingError.data.message);
    }
   
    const [deleteDepartment, { isLoading: isDeletingDepartment }] = useDeleteDepartmentMutation();

    const handleDepartmentUpdateClick = async (rowData: DepartmentType) => {
        dispatch(setDepartmentDialogeData(rowData));
        dispatch(openDialog(stateDialogeBoxes.departmentsAddDialogeBoxOpen));
    };

    const handleDeleteDepartmentClick = async (rowData: DepartmentType) => {
        try {
            const resp = await deleteDepartment(rowData._id).unwrap();
            if (resp?.success) {
                toast.success(resp?.message);
            } 
        } catch (error: any) {
            console.log(error);
            
            mutationToastError({
                error,
                message: error?.data?.message || "Failed to delete department",
                description: "Please try again",
            })
        }
    };
    
    const departmentsTableColumns: ColumnDef<DepartmentType, unknown>[] = [
 
        {
            accessorKey: "ID",
            header: "ID",
            cell: (info: any) => (
                <div>
                    <div
                        className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
                        onClick={() => {
                            navigator.clipboard.writeText(info.row.original._id);
                            toast.success("Department id copied", {
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
            id: "Name",
            enableHiding: false,
            accessorKey: "name",
            cell: (info: any) => info.row.original.name,
            header: () => "Name",
        },
        {
            id: "Head of Department",
            accessorKey: "headOfDepartment",
            cell: (info: any) => {
                if (info.row.original.headOfDept === null) {
                    return "None";
                } else {
                    return "Prof. " + info.row.original.headOfDept.fullName;
                }
            },
            header: () => "Head of Department",
        },
        {
			id: "actions",
			cell: ({ row }) => {
				const deptRow: DepartmentType = row.original;
                
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
									onClick={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        handleDepartmentUpdateClick(deptRow);
                                    }}
								>
									Update
								</DropdownMenuItem>
								<DropdownMenuItem
                                    variant="destructive"
                                    disabled={isDeletingDepartment}
                                    onClick={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        handleDeleteDepartmentClick(deptRow);
                                    }}
                                    className="flex justify-between"
								>
									<p>Delete</p>
                                    {isDeletingDepartment &&  <SpinnerLoader color='red'/>}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
    ];

    const handlePageChange = (newPage: number) => {
        dispatch(setDepartmentsPagination({ page: Number(newPage) }));
    };

    const handleLimitChange = (limitVal: number) => {
        dispatch(setDepartmentsPagination({ limit: Number(limitVal) }));
    }

    const table = useReactTable({
		data: (departments?.data.departments as DepartmentType[]) ?? [],
		columns: departmentsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
	});
    
    return (
		<>
			<section className="space-y-6">
				<DepartmentFormDialogueBox />
                <StatsCard 
                    icon={Hotel}
                    iconColor="text-green-500"
                    title="Total Departments"
                    value={departments?.data.pagination.totalDocs as number}
                    description="Total number of Departments"
                />
				<div className="p-4 border-2 border-muted shadow-sm">
					<DataTable
						tableTitle="Departments"
						columns={departmentsTableColumns}
						loadingState={isFetchingDepartments}
						NoOfSkeletonRows={8}
                        table={table}
						pagination={{
							currentPage: page,
							totalPages: departments?.data.pagination.totalPages as number,
							onPageChange: handlePageChange,
							limit: departments?.data.pagination.limit as number,
							onLimitChange: handleLimitChange,
							hasNextPage: departments?.data.pagination.hasNextPage as boolean,
							hasPrevPage: departments?.data.pagination.hasPrevPage as boolean,
						}}
                        DataTableViewOptions={() => (
                            <DataTableViewOptions
                                table={table}
                                disabled={isFetchingDepartments}
                                dispatch={dispatch}
                            />
                        )}
					/>

				</div>
			</section>
		</>
	);
}

export default DepartmentsPage;
