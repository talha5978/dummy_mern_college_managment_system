import { useForm } from "react-hook-form";
import { DialogBoxProps, ProgrammeType } from "../types/global";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreateProgrammeMutation, useUpdateProgrammeMutation } from "../services/academics.api";
import { toast } from "sonner";
import { mutationToastError } from "../utils/helpers";
import { SpinnerLoader } from "./Loaders";
import { closeDialoge, stateDialogeBoxes } from "../store/uiSlice";
import React from "react";
import { addProgramme } from "../store/academicsSlice";

const ProgrammeDialogForm: React.FC<{ defaultData?: ProgrammeType }> = ({ defaultData }: { defaultData?: ProgrammeType }) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		watch
	} = useForm<ProgrammeType>({
		defaultValues: {
			name: !defaultData ? "" : defaultData?.name,
		}
	});
    
	const dispatch = useDispatch();
	const [createProgramme, { isLoading: isCreatingProgramme }] = useCreateProgrammeMutation();
	const [updatePrpogramme, { isLoading: isUpdatingProgramme }] = useUpdateProgrammeMutation();

    const formData = watch();

    const hasChanges = () => {
		if (!defaultData) return true;
		if (formData.name.trim() !== defaultData.name) return true;
		return false;
	};

	const handleFormSubmittion = async (data: { name: string }) => {
		try {
			const response = defaultData != undefined
				? await updatePrpogramme({ id: defaultData._id, name: data.name.trim() }).unwrap()
				: await createProgramme({ name: data.name.trim() }).unwrap();

			if (response?.success) {
				toast.success(response.message);
				if (defaultData != undefined) {
					dispatch(addProgramme(response.data as ProgrammeType));
				}
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: defaultData != undefined ? "Updation Failed" : "Creation Failed",
				description: error?.data?.message,
			});
		}

		dispatch(closeDialoge(stateDialogeBoxes.programmeDialogeBoxOpen));
	};

	return (
		<form
			className="grid items-start gap-4 max-h-[42rem] overflow-y-auto"
			onSubmit={handleSubmit(handleFormSubmittion)}
		>
			<div className="grid gap-2">
				<Label htmlFor="name">Programme name</Label>
				<Input
					id="name"
					placeholder="Programme name"
					maxLength={70}
					{...register("name", {
						required: !defaultData && "Name is required",
					})}
				/>
				{errors.name && (
					<Label
						className="text-destructive mt-1 text-xs"
						htmlFor="name"
					>
						{errors.name.message}
					</Label>
				)}
			</div>
			<Button
				type="submit"
				className="cursor-pointer"
				disabled={isCreatingProgramme || isUpdatingProgramme || !hasChanges()}
			>
				Save Changes{" "}
				{(isCreatingProgramme || isUpdatingProgramme) && (
					<SpinnerLoader />
				)}
			</Button>
		</form>
	);
}

const ProgrammeDialogeBox = ({ data }: DialogBoxProps<ProgrammeType>) => {
    const dispatch = useDispatch();
    const programmeDialogeBoxOpen = useSelector((state: any) => state.ui.dialogeBoxes.programmeDialogeBoxOpen);

    return (
        <Dialog open={programmeDialogeBoxOpen} onOpenChange={() => dispatch(closeDialoge(stateDialogeBoxes.programmeDialogeBoxOpen))}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{data == undefined ? "Create Programme" : "Update Programme"}</DialogTitle>
                    <DialogDescription>{data == undefined ? "Create a new Programme" : "Update Programme details"}</DialogDescription>
                </DialogHeader>
                <ProgrammeDialogForm defaultData={data ? data : undefined}/>
            </DialogContent>
        </Dialog>
    );
}

export default ProgrammeDialogeBox