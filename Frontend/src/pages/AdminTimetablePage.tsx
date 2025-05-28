import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isApiError, mutationToastError } from "../utils/helpers";
import { toast } from "sonner";
import { closeDialoge, openDialog, setTimetableFormData, stateDialogeBoxes } from "../store/uiSlice";
import { SpinnerLoader } from "../components/Loaders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileUploadInputForm } from "../components/ui/BulkTimetablesFileInput";
import { useDelAllTimetablesMutation, useDelTimetableMutation, useGetAllTimetablesQuery } from "../services/timetables.api";
import { TimetableType } from "../types/global";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2 } from "lucide-react";
import TimetableFormDialoge from "../components/TimetableForm";
import TimetableCards from "../components/TimetableCards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { warningToastOptions } from "../components/ui/sonner";

function BulkAddTimetableDialoge() {
	const dispatch = useDispatch();
	const dialogOpen = useSelector((state: any) => state.ui.dialogeBoxes.bulkAddTimetableDialogue);

	return (
		<Dialog
			open={dialogOpen}
			onOpenChange={() => dispatch(closeDialoge(stateDialogeBoxes.bulkAddTimetableDialogue))}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add timetables in bulk</DialogTitle>
					<DialogDescription>
						Format properly and upload file to add bulk timetables
					</DialogDescription>
				</DialogHeader>
				<FileUploadInputForm />
			</DialogContent>
		</Dialog>
	);
}

const TimetableHeaderButtons = () => {
	const dispatch = useDispatch();

	const handleAddClick = () => {
		dispatch(openDialog(stateDialogeBoxes.timetableAddDialoge));
	}

	const handleBulkAddClick = () => {
		dispatch(openDialog(stateDialogeBoxes.bulkAddTimetableDialogue))
	}

	const handleDelClick = () => {
		dispatch(openDialog(stateDialogeBoxes.allTimetablesDelDialogue));
	}
	
	return (
		<section>
			<div className="flex gap-2 w-fit ml-auto">
				<div>
					<Button
						variant="destructive"
						size="sm"
						className="cursor-pointer"
						onClick={handleDelClick}
					>
						<Trash2 width={20} height={20} />
						<span className="hidden md:inline">Delete All Timetables</span>
					</Button>
				</div>
				<div className="hidden md:block">
					<Button
						variant="outline"
						size="sm"
						className="cursor-pointer dark:hover:bg-muted"
						onClick={handleBulkAddClick}
					>
						<PlusIcon />
						<span>Bulk Add Timetable</span>
					</Button>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="cursor-pointer dark:hover:bg-muted"
					onClick={handleAddClick}
					// disabled={disabled}
				>
					<PlusIcon />
					<span className="hidden md:inline">Add Timetable</span>
				</Button>
			</div>
		</section>
	);
};

const AllTimeTableDeleteDialoge = () => {
	const dispatch = useDispatch();
	const dialogOpen = useSelector((state: any) => state.ui.dialogeBoxes.allTimetablesDelDialogue);

	const [delAllTimetables, { isLoading: isDeletingAllTimetables }] = useDelAllTimetablesMutation();

	if (isDeletingAllTimetables) {
		toast.warning("Deleting all timetables...", warningToastOptions);
	}

	const handleDelAllTimetables = async () => {
		try {
			const res = await delAllTimetables().unwrap();
			if (res && res.success) {
				toast.success(res.message);
				dispatch(closeDialoge(stateDialogeBoxes.allTimetablesDelDialogue));
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Failed to delete timetables",
				description: error?.data?.message,
			});
		}
	}

	return (
		<AlertDialog
			open={!!dialogOpen}
			onOpenChange={(open: boolean) =>
				!open && dispatch(closeDialoge(stateDialogeBoxes.allTimetablesDelDialogue))
			}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action will delete all timetables from the database and only recommended when you
						want to bulk add the tiemtables for the whole week.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => dispatch(closeDialoge(stateDialogeBoxes.allTimetablesDelDialogue))}
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction 
						variant="destructive" 
						onClick={handleDelAllTimetables}
					>
						Ok, I understand
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const TimeTablePage: React.FC = () => {
	const {
		data: timetables,
		isLoading: isFetchingTTs,
		error: TT_FetchingError,
	} = useGetAllTimetablesQuery();

	if (isApiError(TT_FetchingError)) {
		console.error(TT_FetchingError.data.message);
		toast.error(TT_FetchingError.data.message);
	}

	const [delTimetable, { isLoading: isDeletingTimetable }] = useDelTimetableMutation();

	const emptyState = { openState: false, id: "" };
	const [delState, setDelState] = useState<{ openState: boolean, id: string }>(emptyState);

	const dispatch = useDispatch();

	const onUpdateEvent = (entry: TimetableType) => {
		dispatch(setTimetableFormData(entry));
		dispatch(openDialog(stateDialogeBoxes.timetableUpdateDialoge));
	};

	const handleDelete = (id: string) => {
		setDelState({
			openState: true,
			id,
		});
	};

	async function DelAllTimetables () {
		if (delState.id === "") {
			toast.warning("No timetables selected", warningToastOptions);
			setDelState(emptyState);
			return;
		}

		try {
			const res = await delTimetable(delState.id).unwrap();
			if (res && res.success) {
				toast.success(res?.message);
				setDelState(emptyState);
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Failed to delete timetables",
				description: error?.data?.message,
			});
		}
	}

	if(isDeletingTimetable) {
		toast.warning("Deleting all timetables...", warningToastOptions);
	}

	if (isFetchingTTs) {
		return (
			<div className="flex w-full h-full items-center justify-center p-6 md:p-10">
				<SpinnerLoader />
			</div>
		);
	}
	
	return (
		<>
			<TimetableFormDialoge />
			<BulkAddTimetableDialoge />
			<AllTimeTableDeleteDialoge />
			<section className="space-y-4">
				<TimetableHeaderButtons />
				{timetables?.data && Array.isArray(timetables?.data) && (
					<TimetableCards
						data={timetables?.data}
						handleUpdate={onUpdateEvent}
						onDelete={handleDelete}
					/>
				)}
			</section>
			{delState.openState && (
				<AlertDialog
					open={!!delState.openState}
					onOpenChange={(open: boolean) => !open && setDelState(emptyState)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently the timetable!
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={() => setDelState(emptyState)}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								variant="destructive"
								disabled={false}
								onClick={DelAllTimetables}
							>
								Proceed
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
};

export default TimeTablePage;
