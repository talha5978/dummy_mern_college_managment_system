import { toast } from "sonner";
import { useDeleteClassMutation, useDeleteProgrammeMutation, useGetClassesQuery, useGetProgrammesQuery } from "../services/academics.api";
import { isApiError } from "../utils/helpers";
import { ApiError, ClassType, ProgrammeType } from "../types/global";
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
//@ts-ignore
import { cn } from "@/lib/utils"
import { ArrowUpDown, BookOpen, Copy, Hotel, MoreHorizontal, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertDialogFooter, AlertDialogHeader } from "../components/ui/alert-dialog";
import DataTable from "../components/SimpleDataTable";
import { Badge } from "@/components/ui/badge";
import { pushClasses, pushProgrammes, removeClass, removeProgramme } from "../store/academicsSlice";
import { useDispatch, useSelector } from "react-redux";
import StatsCard from "../components/StatsCard";
import DashboardActionCard from "../components/DashboardAction-Card";
import RenderClassDialogBox from "../components/ClassDialogeBox";
import { mutationToastError } from "../utils/helpers";
import ProgrammeDialogeBox from "../components/ProgrammeDialogeBox";
import { openDialog, stateDialogeBoxes } from "../store/uiSlice";

const ClassesPage: React.FC = () => {
	const dispatch = useDispatch();
    const { data: classes, isLoading: isFetchingClasses, isSuccess: isSuccessClasses, error: classFetchingError } = useGetClassesQuery();
    const { data: programmes, isLoading: isFetchingProgrammes, isSuccess: isSuccessProgrammes, error: programmesFetchingError } = useGetProgrammesQuery();

    if (isApiError(classFetchingError)) {
        console.error(classFetchingError.data.message);
        toast.error(classFetchingError.data.message);
    }

	if (isApiError(programmesFetchingError)) {
		console.error(programmesFetchingError.data.message);
		toast.error(programmesFetchingError.data.message);
	}

	useEffect(() => {
        if (isSuccessClasses && classes.data.length > 0) {
            dispatch(pushClasses(classes.data));
        }
    }, [classes, isSuccessClasses, dispatch]); 

	useEffect(() => {
        if (isSuccessProgrammes && programmes.data.length > 0) {
            dispatch(pushProgrammes(programmes.data));
        }
    }, [programmes, isSuccessProgrammes, dispatch]); 

    const [deleteClass, { isLoading: isDeletingClass }] = useDeleteClassMutation();
	const [deleteProgramme, { isLoading: isDeletingProgramme }] = useDeleteProgrammeMutation();
    const [selectedEntity, setselectedEntity] = useState<{ id: string; name: string; type: "class" | "programme" } | null>(null);

	const classDialogBoxOpen = useSelector((state: any) => state.ui.dialogeBoxes.classDialogBoxOpen);
	const programmeDialogeBoxOpen = useSelector((state: any) => state.ui.dialogeBoxes.programmeDialogeBoxOpen);

	const [isEditMode, setIsEditMode] = useState<"create" | "update" | "none">("update");
	const [dialogBoxData, setDialogBoxData] = useState<ClassType | null | ProgrammeType | undefined>(null);

    const handleClassDeletion = async (id: string) => {
        try {
            const res = await deleteClass(id).unwrap();
            if (res && res.success) {
				dispatch(removeClass(id));
                toast.success(res.message);
            }
        } catch (error: ApiError | any) {
			mutationToastError({ error, message: "Class deletion failed", description: error?.data?.message });
        }
    }

    const handleProgrammeDeletion = async (id: string) => {
        try {
            const res = await deleteProgramme(id).unwrap();
            if (res && res.success) {
				dispatch(removeProgramme(id));
                toast.success(res.message);
            }
        } catch (error: ApiError | any) {
			mutationToastError({ error, message: "Section deletion failed", description: error?.data?.message });
        }
    }

	const handleDetailsClick = (inputClassData: ClassType) => {
		setDialogBoxData(inputClassData);
		dispatch(openDialog(stateDialogeBoxes.classDialogBoxOpen));
		setIsEditMode("none");
	};

	const handleClassUpdateClick = (inputClassData: ClassType) => {
		setDialogBoxData(inputClassData);
		dispatch(openDialog(stateDialogeBoxes.classDialogBoxOpen));
		setIsEditMode("update"); // Set isEditMode to upadate for updation mode
	};

	const handleProgrammeUpdateClick = (input: ProgrammeType) => {
		setDialogBoxData(input);
		dispatch(openDialog(stateDialogeBoxes.programmeDialogeBoxOpen));
	};
	
	const handleClassCreateClick = () => {
		dispatch(openDialog(stateDialogeBoxes.classDialogBoxOpen));
		setIsEditMode("create"); // Set isEditMode to create for creation mode
	};

	const isClassTypeData = (data: any): data is ClassType => {
		return (
			"_id" in data &&
			"name" in data &&
			"sections" in data &&
			typeof data._id === "string" &&
			typeof data.name === "string" &&
			Array.isArray(data.sections)
		);
	}

	// check if dialogBoxData is of type ClassType and mode is updation
	const classCheck = classDialogBoxOpen && dialogBoxData && isClassTypeData(dialogBoxData) && isEditMode !== "create";

	const isProgrammeTypeData = (data: any): data is ProgrammeType => {
		return (
			"_id" in data &&
			"name" in data &&
			typeof data._id === "string" &&
			typeof data.name === "string"
		);
	}

	// check if dialogBoxData is of type ProgrammeType
	const programmesCheck = programmeDialogeBoxOpen && dialogBoxData && isProgrammeTypeData(dialogBoxData);
	
    const classTableColumns: ColumnDef<ClassType, unknown>[] = [
		{
			id: "Sr",
			header: "Sr. No.",
			cell: (info: any) => info.row.index + 1,
		},
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info: any) => (
				<div>
					<div
						className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
						onClick={() => {
							navigator.clipboard.writeText(info.row.original._id);
							toast.success("Class id copied", {
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
			id: "Class Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info: any) => info.row.original.name,
			header: ({ column }) => {
				return (
					<div
						className="cursor-pointer flex gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Class Name
						<ArrowUpDown className="ml-2 h-4 w-4 p-0 self-center" />
					</div>
				);
			},
		},
		{
			accessorKey: "sections",
			cell: (info: any) => info.row.original.sections.length,
			enableHiding: false,
			header: ({ column }) => {
				return (
					<div
						className="cursor-pointer flex gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						No. of Sections
						<ArrowUpDown className="ml-2 h-4 w-4 p-0 self-center" />
					</div>
				);
			},
		},
		{
			id: "Sections",
			accessorKey: "sections",
			cell: (info: any) => (
				<section className="flex gap-1 flex-col">
					{info.row.original.sections.length > 0 ? info.row.original.sections.map((section: any) => (
						<Badge variant="outline" key={section._id}>
							{section.name}
						</Badge>
					)) : <p className="text-destructive">None</p> }
				</section>
			),
			header: ({ column }) => {
				return (
					<div
						className="cursor-pointer flex gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Sections
						<ArrowUpDown className="ml-2 h-4 w-4 p-0 self-center" />
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const dataClass: ClassType = row.original;

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
									onClick={() =>
										handleDetailsClick(dataClass)
									}
								>
									See Details
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleClassUpdateClick(dataClass)}
								>
									Update
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() =>
										setselectedEntity({
											id: dataClass._id,
											name: dataClass.name,
											type: "class"
										})
									}
									disabled={isDeletingClass}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
	];

	const programmeTableColumns: ColumnDef<ProgrammeType, unknown>[] = [
		{
			id: "Sr",
			header: "Sr. No.",
			cell: (info: any) => info.row.index + 1,
		},
		{
			accessorKey: "ID",
			header: "ID",
			cell: (info: any) => (
				<div>
					<div
						className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
						onClick={() => {
							navigator.clipboard.writeText(info.row.original._id);
							toast.success("Programme id copied", {
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
			id: "Programme Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info: any) => info.row.original.name,
			header: ({ column }) => {
				return (
					<div
						className="cursor-pointer flex gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Programme Name
						<ArrowUpDown className="ml-2 h-4 w-4 p-0 self-center" />
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const programmeData: ProgrammeType = row.original;

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
									onClick={() => handleProgrammeUpdateClick(programmeData)}
								>
									Update
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() =>
										setselectedEntity({
											id: programmeData._id,
											name: programmeData.name,
											type: "programme"
										})
									}
									disabled={isDeletingProgramme}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
	]
	
    return (
		<>
			{/* Alert Dialog to confirm class deletion */}
			<AlertDialog
				open={!!selectedEntity}
				onOpenChange={(open: boolean) =>
					!open && setselectedEntity(null)
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently
							delete the {selectedEntity?.type}{" "}
							<b>"{selectedEntity?.name}"</b>.{" "}
							{selectedEntity?.type === "class" && "But first make sure there are no students in this class and this class has no sections."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setselectedEntity(null)}
							className="cursor-pointer"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="cursor-pointer"
							disabled={isDeletingClass || isDeletingProgramme}
							onClick={() => {
								if (selectedEntity) {
									selectedEntity.type === "class" 
										? handleClassDeletion(selectedEntity.id) 
										: handleProgrammeDeletion(selectedEntity.id);
									setselectedEntity(null);
								}
							}}
						>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog for class creation and updation */}
			<RenderClassDialogBox
				dialogBoxData={classCheck ? dialogBoxData : null}
				dialogBoxOpen={Boolean(classDialogBoxOpen)}
				isEditMode={isEditMode}
			/>

			{/* Dialog for programme creation and updation */}
			<ProgrammeDialogeBox
				data={programmesCheck ? dialogBoxData : undefined}
			/>

			<section className="flex flex-col gap-6">
				<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					<StatsCard
						title="Classes"
						description="Total number of classes in city campus"
						value={4}
						icon={Hotel}
						iconColor="text-yellow-600"
					/>
					<StatsCard
						title="Classes' Sections"
						description="Total number of sections in all classes"
						value={20}
						icon={Hotel}
						iconColor="text-purple-600"
					/>
					<StatsCard
						title="Programmes"
						description="Total number of programmes available"
						value={10}
						icon={BookOpen}
						iconColor="text-green-600"
					/>
				</div>

				{/* Data Table for classes and sections */}
				<div className="p-4 border-2 border-muted shadow-sm">
					<DataTable
						tableTitle="Classes"
						columns={classTableColumns}
						data={classes?.data as ClassType[]}
						loadingState={isFetchingClasses}
						NoOfSkeletonRows={5}
					/>
				</div>

				{/* Data Table for programmes */}
				<div className="p-4 border-2 border-muted shadow-sm">
					<DataTable
						tableTitle="Academic Programmes"
						columns={programmeTableColumns}
						data={programmes?.data as ProgrammeType[]}
						loadingState={isFetchingProgrammes}
						NoOfSkeletonRows={5}
					/>
				</div>

				<div className="grid gap-4 mb-4 sm:grid-cols-1 md:grid-cols-2">
					<DashboardActionCard
						title="Add new class"
						description="Add a new class and section at once"
						icon={Plus}
						actionLabel="Add class"
						onClick={handleClassCreateClick}
					/>
					<DashboardActionCard
						title="Add new programme"
						description="Define a new educational programme"
						icon={Plus}
						actionLabel="Add programme"
						onClick={() => {
							setDialogBoxData(undefined);
							dispatch(
								openDialog(
									stateDialogeBoxes.programmeDialogeBoxOpen
								)
							);
						}}
					/>
				</div>
			</section>
		</>
	);
}

export default ClassesPage;