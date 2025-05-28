import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { closeDialoge, setDepartmentDialogeData, stateDialogeBoxes } from "../store/uiSlice";
import { TeacherType } from "../types/global";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { mutationToastError } from "../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "./Loaders";
import { useAddDepartmentMutation, useUpadateDepartmentMutation } from "../services/academics.api";

// 🎯 Define Validation Schema using Zod
const departmentAddSchema = z.object({
	name: z.string().min(1, "Full name is required"),
	headOfDept: z.union([z.string(), z.undefined()])
});

export type DepartmentFormDataType = {
	name: string;
	headOfDept: string;
}

const updateBasicDetailsSchema = z.object({
	name: z.string().min(1, "Full name is required"),
	headOfDept: z.union([z.string(), z.undefined()])
})

type DepartmentFormData = z.infer<typeof departmentAddSchema>;
export type UpdateFormData = z.infer<typeof updateBasicDetailsSchema>;

const ErrorTxt = (field: any) => {
	return (
		<Label className="text-destructive mt-1 text-xs" htmlFor={field}>
			{field.message}
		</Label>
	);
}

const AddDeptForm = () => {
	const {
		register,
		handleSubmit,
        control,
		formState: { errors },
	} = useForm<DepartmentFormData>({
		resolver: zodResolver(departmentAddSchema),
	});
	const dispatch = useDispatch();
	const teachers: TeacherType[] = useSelector((state: any) => state.academics.teachers);


	const [addStudent, { isLoading: isAdding }] = useAddDepartmentMutation();
	
    const onFormSubmit = async (data: DepartmentFormData) => {
		data.name = data.name.trim();
		
		try {
			const res = await addStudent({
				...(data as DepartmentFormDataType),
			}).unwrap();

			if (res?.success) {
				toast.success(res?.message);
				dispatch(closeDialoge(stateDialogeBoxes.departmentsAddDialogeBoxOpen));
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: error?.data?.message ?? "Failed to add department",
				description: error?.data?.message,
			});
		}
    }
	
	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="grid *:w-full gap-2">
					<Label htmlFor="fullName">Name</Label>
					<Input id="fullName" {...register("name")} placeholder="Enter name" />
					{errors.name && ErrorTxt(errors.name)}
				</div>
				{/* Class */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="headOfDept">Head of Department</Label>
					<Controller
						name="headOfDept"
						control={control}
						rules={{ required: "HOD. is required" }}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue placeholder="Select HOD." />
									</SelectTrigger>
									<SelectContent>
										{teachers.length > 0 ? (
											teachers.map((teacher) => (
												<SelectItem key={teacher._id} value={teacher._id}>
													Prof. {teacher.fullName}
												</SelectItem>
											))
										) : (
											<p className="text-sm p-1 text-destructive">No teachers found</p>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>
			</div>
			<Button type="submit" className="cursor-pointer w-full" disabled={isAdding}>
				Add Department
				{isAdding && <SpinnerLoader />}
			</Button>
		</form>
	);
};


const UpdateDeptForm = () => {
	let dataToUpdate = useSelector((state: any) => state.ui.departmentDialogData);
	const teachers: TeacherType[] = useSelector((state: any) => state.academics.teachers);

	const setHodInitialValue = () => {
		const teacher = teachers.find((teacher) => teacher._id === dataToUpdate?.headOfDept?._id);
		return teacher?._id ?? "";
	};

	const initialValues = {
		name: dataToUpdate?.name ?? "",
		headOfDept: setHodInitialValue(),
	}
	
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<UpdateFormData>({
		resolver: zodResolver(updateBasicDetailsSchema),
		defaultValues: initialValues,
	});


	const [uadpateDepartment, { isLoading: isUpdating }] = useUpadateDepartmentMutation();
	const dispatch = useDispatch();


	const onFormSubmit = async (data: UpdateFormData) => {
		let changedData: { [key: string]: string } = Object.fromEntries(
			Object.entries(data).filter(
				([key, value]) => value !== initialValues[key as keyof typeof initialValues]
			)
		);

		if (changedData.name !== "" || changedData.name != null) {
			changedData.name = changedData.name.trim();
		}

		try {
			const res = await uadpateDepartment({
				id: dataToUpdate?._id,
				data: changedData,
			} as any).unwrap();

			if (res?.success) {
				toast.success(res.message);
				dispatch(closeDialoge(stateDialogeBoxes.departmentsAddDialogeBoxOpen));
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: error?.data?.message ?? "Failed to update department",
				description: error?.data?.message,
			});
		}
	};

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Full Name */}
				<div className="grid *:w-full gap-2">
					<Label htmlFor="fullName">Name</Label>
					<Input id="fullName" {...register("name")} placeholder="Enter name" />
					{errors.name && ErrorTxt(errors.name)}
				</div>
				{/* Class */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="headOfDept">Head of Department</Label>
					<Controller
						name="headOfDept"
						control={control}
						rules={{ required: "HOD. is required" }}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue placeholder="Select HOD." />
									</SelectTrigger>
									<SelectContent>
										{teachers.length > 0 ? (
											teachers.map((teacher) => (
												<SelectItem key={teacher._id} value={teacher._id}>
													Prof. {teacher.fullName}
												</SelectItem>
											))
										) : (
											<p className="text-sm p-1 text-destructive">No teachers found</p>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>
			</div>
			<Button type="submit" className="cursor-pointer w-full" disabled={isUpdating}>
				Update
				{isUpdating && <SpinnerLoader />}
			</Button>
		</form>
	);
};


const DepartmentFormDialogueBox = () => {
	const dispatch = useDispatch();
	const dialogeOpened = useSelector((state: any) => state.ui.dialogeBoxes.departmentsAddDialogeBoxOpen);
	const dialogData = useSelector((state: any) => state.ui.departmentDialogData);
	
	return (
		<Dialog
			open={dialogeOpened}
			onOpenChange={() => {
				dispatch(closeDialoge(stateDialogeBoxes.departmentsAddDialogeBoxOpen))
				dispatch(setDepartmentDialogeData(null))
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{dialogData == undefined ? "Add Department" : "Update Department"}
					</DialogTitle>
					<DialogDescription>
						{dialogData == undefined
							? "Add a new department and save when you're done"
							: "Carefully update the department details as changes are hard to undo"}
					</DialogDescription>
				</DialogHeader>
				{dialogData == undefined ? <AddDeptForm /> : <UpdateDeptForm />}
			</DialogContent>
		</Dialog>
	);
};

export default DepartmentFormDialogueBox;
