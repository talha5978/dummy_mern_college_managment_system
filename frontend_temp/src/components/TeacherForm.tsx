import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { closeDialoge, setTeacherDialogeData, stateDialogeBoxes } from "../store/uiSlice";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {useAddTeacherMutation, useUpdateTeacherBasicDetailsMutation, useUpdateTeacherSalaryMutation } from "../services/users.api";
import { isApiError, isEmptyObject, mutationToastError } from "../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "./Loaders";
import { ChevronDown, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDepartmentsQuery } from "../services/academics.api";
import { Combobox, ComboboxAnchor, ComboboxBadgeItem, ComboboxBadgeList, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxTrigger } from "@/components/ui/combobox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { warningToastOptions } from "./ui/sonner";
import { ApiError } from "../types/global";

// 🎯 Define Validation Schema using Zod
const teacherBaseSchema = z.object({
	fullName: z.string().min(1, "Full Name is required"),
	email: z.string().email("Invalid email"),
	password: z.string().min(1, "Password is required"),
	contactNumber: z
		.union([z.number().positive("Phn. Number must be positive").max(999999999999), z.undefined()])
		.refine((val) => val != undefined, { message: "Phn. Number is required" }),
	gender: z.enum(["Male", "Female"], { message: "Gender is required" }),
	dob: z.string().min(1, "Date of Birth is required"),
	address: z.string().min(1, "Address is required"),
	departments: z.array(z.string()).min(1, "Department is required"),
	subjectSpecialization: z.string().min(1, "Subject Specialization is required"),
	salaryDetails: z.object({
		baseSalary: z.number().min(1, "Base Salary is required"),
		bonuses: z.array(
			z.object({
				amount: z.number().min(1, "Amount is required"),
				reason: z.string().min(1, "Reason is required"),
				date: z.string().min(1, "Date is required"),
			})
		).optional(),
		deductions: z.array(
			z.object({
				amount: z.number().min(1, "Amount is required"),
				reason: z.string().min(1, "Reason is required"),
				date: z.string().min(1, "Date is required"),
			})
		).optional()
	}),
	status: z.enum(["Active", "Inactive"], {
		message: "Status is required",
	}),
})

const updateBasicDetailsSchema = z
	.object({
		fullName: z.string().min(1, "Full name is required"),
		contactNumber: z
			.number().positive("Phn. Number must be positive").max(999999999999)
			.refine((val) => val != undefined, { message: "Phn. Number is required" }),
		status: z.enum(["Active", "Inactive", "Alumni"]),
		password: z.string().min(1, "Password is required"),
		address: z.string().min(1, "Address is required"),
		classId: z.string().min(1, "Class is required"), // Class is optional overall
		sectionId: z.string().min(1, "Section is required"), // Section is optional by default
		program: z.string().min(1, "Programme is required"),
	})

const updateTeacherSalarySchema = z.object({
	baseSalary: z.number().min(0, "Base salary must be non-negative").optional(),
	bonusesToAdd: z
		.array(
			z.object({
				amount: z.number().positive("Amount must be positive"),
				reason: z.string().min(1, "Reason is required"),
				date: z.string().refine((val) => !isNaN(Date.parse(val)), {
					message: "Invalid date",
				}),
			})
		)
		.optional(),
	bonusesToRemove: z.array(z.string()).optional(),
	deductionsToAdd: z
		.array(
			z.object({
				amount: z.number().positive("Amount must be positive"),
				reason: z.string().min(1, "Reason is required"),
				date: z.string().refine((val) => !isNaN(Date.parse(val)), {
					message: "Invalid date",
				}),
			})
		)
		.optional(),
	deductionsToRemove: z.array(z.string()).optional(),
});

type UpdateTeacherSalaryFormData = z.infer<typeof updateTeacherSalarySchema>;


const updateTeacherSchema = z.object({
	fullName: z.string().min(1, "Full name is required").optional(),
	address: z.string().min(1, "Address is required").optional(),
	contactNumber: z
		.number().positive("Phn. Number must be positive").max(999999999999)
		.refine((val) => val != undefined, { message: "Phn. Number is required" }),
	password: z
		.string()
		.min(1, "Password is required"),
	status: z.enum(["Active", "Inactive"]),
	departments: z.array(z.string()).optional(),
});

// For api
export type TeacherFormDataType = {
	fullName: string;
	email: string;
	contactNumber: string;
	gender: "Male" | "Female";
	dob: string;
	address: string;
	departments: string[];
	subjectSpecialization: string;
	salaryDetails: {
		baseSalary: number;
		bonuses: {
			amount: number;
			reason: string;
			date: string;
		}[] | [];
		deductions: {
			amount: number;
			reason: string;
			date: string;
		}[] | [];
	}
	status: "Active" | "Inactive";
}

type TeacherFormData = z.infer<typeof teacherBaseSchema>;
export type UpdateBasicDetailsFormData = z.infer<typeof updateBasicDetailsSchema>;
type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

const ErrorTxt = (field: any) => {
	return (
		<Label className="text-destructive mt-1 text-xs" htmlFor={field}>
			{field.message}
		</Label>
	);
}

function getTeacherData() {
	let teacherData = useSelector((state: any) => state.ui.teacherDialogData);

	if (!teacherData) {
		console.error("Teacher data not found", teacherData);
		toast.error("Teacher data not found");
		return (
			<div className="flex w-full items-center justify-center p-6 md:p-10">
				<p className="font-semibold text-destructive">Teacher data not found</p>
			</div>
		);
	}

	return teacherData;
}

export function handleDepartmentsFetchingError(departmentsFetchingError: ApiError) {
	if (isApiError(departmentsFetchingError)) {
		console.error(departmentsFetchingError.data.message);
		toast.error(departmentsFetchingError.data.message);
		return (
			<div className="flex w-full items-center justify-center p-6 md:p-10">
				<p className="font-semibold text-destructive">{departmentsFetchingError.data.message}</p>
			</div>
		);
	}
}

export function getDepartments() {
	const {
		data: fetchedDepartments,
		isLoading: isFetchingDepartments,
		error: departmentsFetchingError,
	} = useGetDepartmentsQuery({ limit: 50, page: 1 });
	// limit set to 50 to fetch max possible data

	return {
		fetchedDepartments: fetchedDepartments || null,
		isFetchingDepartments,
		departmentsFetchingError
	}
}

function getSimpleDate(input:Date) {
	const date = new Date(input);
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

const TeacherAdditionForm = () => {
	const { fetchedDepartments, isFetchingDepartments, departmentsFetchingError } = getDepartments();
	
	if(departmentsFetchingError) {
		return handleDepartmentsFetchingError(departmentsFetchingError as ApiError);
	}

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<TeacherFormData>({
		resolver: zodResolver(teacherBaseSchema),
		defaultValues: {
			departments: [],
			salaryDetails: {
				baseSalary: 0,
				bonuses: [],
				deductions: [],
			},
		},
	});

	const {
		fields: bonusFields,
		append: appendBonus,
		remove: removeBonus,
	} = useFieldArray({
		control,
		name: "salaryDetails.bonuses",
	});

	const {
		fields: deductionFields,
		append: appendDeduction,
		remove: removeDeduction,
	} = useFieldArray({
		control,
		name: "salaryDetails.deductions",
	});

	// Prepare department options for MultiSelect
	const departmentOptions =
		fetchedDepartments?.data?.departments?.map((dept) => ({
			value: dept._id,
			label: dept.name,
		})) || [];

	const [addTeacher, { isLoading: isAdding }] = useAddTeacherMutation();

	const onFormSubmit = async (data:any) => {
		data.contactNumber = `+${data.contactNumber}`;

		for (const field in data) {
			if (typeof data[field] === "string") {
				data[field] = data[field].trim();
			}
		}

		try {
			const res = await addTeacher({
				...(data as TeacherFormDataType),
			}).unwrap();

			if (res?.success) {
				toast.success(`New teacher added successfully`);
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Process failed",
				description: error?.data?.message,
			});
		}
	};

	return (
		<section>
			{isFetchingDepartments ? (
				<div className="flex w-full items-center justify-center p-6 md:p-10">
					<div className="flex flex-col justify-center gap-4">
						<p>We are seting up the system so please be patient...</p>
						<SpinnerLoader />
						<Select></Select>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Full Name */}
						<div className="grid gap-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input id="fullName" {...register("fullName")} placeholder="Enter fullName" />
							{errors.fullName && ErrorTxt(errors.fullName)}
						</div>

						{/* Email */}
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" {...register("email")} placeholder="Enter email" />
							{errors.email && ErrorTxt(errors.email)}
						</div>

						{/* Email */}
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								{...register("password")}
								placeholder="Enter password"
							/>
							{errors.password && ErrorTxt(errors.password)}
						</div>

						{/* Contact Number */}
						<div className="grid gap-2">
							<Label htmlFor="contactNumber">Contact Number</Label>
							<div className="relative">
								<span className="absolute left-2 top-1/3 transform -translate-y-1/2">
									<Plus strokeWidth={1.5} width={18} className="self-center pt-[0.75rem]" />
								</span>
								<Input
									id="contactNumber"
									type="number"
									{...register("contactNumber", {
										setValueAs: (val) => (val === "" ? undefined : Number(val)),
									})}
									placeholder="Enter contact number"
									className="pl-8"
								/>
							</div>
							{errors.contactNumber && ErrorTxt(errors.contactNumber)}
						</div>

						{/* Date of Birth */}
						<div className="grid gap-2">
							<Label htmlFor="dob">Date of Birth</Label>
							<Input id="dob" type="date" {...register("dob")} className="cursor-pointer"></Input>
							{errors.dob && ErrorTxt(errors.dob)}
						</div>

						{/* Address */}
						<div className="grid gap-2">
							<Label htmlFor="address">Address</Label>
							<Textarea
								id="address"
								maxLength={200}
								{...register("address")}
								placeholder="Enter home address"
							/>
							{errors.address && ErrorTxt(errors.address)}
						</div>

						{/* Gender */}
						<div className="grid gap-2">
							<Label>Gender</Label>
							<Controller
								name="gender"
								control={control}
								rules={{ required: "Gender is required" }}
								render={({ field, fieldState }) => (
									<div>
										<RadioGroup
											value={field.value}
											onValueChange={field.onChange}
											className="flex space-x-4 mb-2"
										>
											<div className="flex gap-1 items-center">
												<RadioGroupItem value="Male" id="male" />
												<Label htmlFor="male">Male</Label>
											</div>
											<div className="flex gap-1 items-center">
												<RadioGroupItem value="Female" id="female" />
												<Label htmlFor="female">Female</Label>
											</div>
										</RadioGroup>
										{fieldState.error && ErrorTxt(fieldState.error)}
									</div>
								)}
							/>
						</div>

						{/* Departments (Multi-Select) */}
						<div className="grid gap-2">
							<Label htmlFor="departments">Departments</Label>
							<Controller
								name="departments"
								control={control}
								rules={{
									validate: (value) => value.length > 0 || "At least one department is required",
								}}
								render={({ field } : any) => (
									<Combobox
										value={field.value || []}
										onValueChange={field.onChange}
										multiple
										className="w-full" 
										disabled={isFetchingDepartments || isApiError(departmentsFetchingError)}
									>
										<ComboboxAnchor className="h-full min-h-10 flex-wrap px-3 py-2">
											<ComboboxBadgeList>
												{field.value.map((id) => {
													const option = departmentOptions.find((dept) => dept.value === id);

													if (!option) return null; // Skip if no matching option
													
													return (
														<ComboboxBadgeItem key={id} value={id}>
															{option.label}
														</ComboboxBadgeItem>
													);
												})}
											</ComboboxBadgeList>
											<ComboboxInput
												placeholder="Select departments..." // Same placeholder as MultiSelect
												className="h-auto min-w-20 flex-1 active:" // Flexible input styling
											/>
											<ComboboxTrigger className="absolute top-3 right-2">
												<ChevronDown className="h-4 w-4" /> {/* Dropdown icon */}
											</ComboboxTrigger>
										</ComboboxAnchor>
										<ComboboxContent>
											<ComboboxEmpty>No departments found.</ComboboxEmpty>
											{departmentOptions.map((dept) => (
												<ComboboxItem key={dept.value} value={dept.value}>
													{dept.label}
												</ComboboxItem>
											))}
										</ComboboxContent>
									</Combobox>
								)}
							/>
							{errors.departments && (
								<p className="text-destructive text-xs font-semibold">{errors.departments.message}</p>
							)}
						</div>

						{/* Subject Specialization */}
						<div className="grid gap-2">
							<Label htmlFor="subjectSpecialization">Subject Specialization</Label>
							<Input
								id="subjectSpecialization"
								{...register("subjectSpecialization")}
								placeholder="Enter subject specialization"
							/>
							{errors.subjectSpecialization && (
								<Label className="text-destructive text-xs">
									{errors.subjectSpecialization.message}
								</Label>
							)}
						</div>

						{/* Status */}
						<div className="*:w-full grid gap-2">
							<Label>Status</Label>
							<Controller
								name="status"
								control={control}
								render={({ field } : any) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Active">Active</SelectItem>
											<SelectItem value="Inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.status && (
								<Label className="text-destructive text-xs">{errors.status.message}</Label>
							)}
						</div>
					</div>

					{/* Salary Details Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Salary Details</h3>

						{/* Base Salary */}
						<div className="grid gap-2">
							<Label htmlFor="baseSalary">Base Salary</Label>
							<Input
								id="baseSalary"
								type="number"
								{...register("salaryDetails.baseSalary", {
									setValueAs: (val) => (val === "" ? undefined : Number(val)),
								})}
								placeholder="Enter base salary"
							/>
							{errors.salaryDetails?.baseSalary && (
								<Label className="text-destructive text-xs">
									{errors.salaryDetails.baseSalary.message}
								</Label>
							)}
						</div>

						{/* Bonuses */}
						<div>
							<h4 className="text-md font-medium">Bonuses</h4>
							{bonusFields.map((field, index) => (
								<div key={field.id} className="border p-4 rounded-md mt-2 flex flex-col gap-2">
									<Button
										type="button"
										variant="destructive"
										className="self-end"
										size="sm"
										onClick={() => removeBonus(index)}
									>
										<p>Remove</p>
										<X />
									</Button>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										{/* Amount */}
										<div className="grid gap-2">
											<Label htmlFor={`salaryDetails.bonuses.${index}.amount`}>Amount</Label>
											<Input
												id={`salaryDetails.bonuses.${index}.amount`}
												type="number"
												{...register(`salaryDetails.bonuses.${index}.amount`, {
													setValueAs: (val) => (val === "" ? undefined : Number(val)),
												})}
												placeholder="Enter amount"
											/>
											{errors.salaryDetails?.bonuses?.[index]?.amount && (
												<Label className="text-destructive text-xs">
													{errors.salaryDetails.bonuses[index].amount.message}
												</Label>
											)}
										</div>
										{/* Reason */}
										<div className="grid gap-2">
											<Label htmlFor={`salaryDetails.bonuses.${index}.reason`}>Reason</Label>
											<Input
												id={`salaryDetails.bonuses.${index}.reason`}
												{...register(`salaryDetails.bonuses.${index}.reason`)}
												placeholder="Enter reason"
											/>
											{errors.salaryDetails?.bonuses?.[index]?.reason && (
												<Label className="text-destructive text-xs">
													{errors.salaryDetails.bonuses[index].reason.message}
												</Label>
											)}
										</div>
										{/* Date */}
										<div className="grid gap-2">
											<Label htmlFor={`salaryDetails.bonuses.${index}.date`}>Date</Label>
											<Input
												id={`salaryDetails.bonuses.${index}.date`}
												type="date"
												{...register(`salaryDetails.bonuses.${index}.date`)}
											/>
											{errors.salaryDetails?.bonuses?.[index]?.date && (
												<Label className="text-destructive text-xs">
													{errors.salaryDetails.bonuses[index].date.message}
												</Label>
											)}
										</div>
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								className="mt-2"
								onClick={() => appendBonus({ amount: 0, reason: "", date: "" })}
							>
								Add Bonus
							</Button>
						</div>

						{/* Deductions */}
						<div>
							<h4 className="text-md font-medium">Deductions</h4>
							{deductionFields.map((field, index) => (
								<div key={field.id} className="border p-4 rounded-md mt-2 flex flex-col gap-2">
									<Button
										type="button"
										variant="destructive"
										className="self-end"
										size="sm"
										onClick={() => removeDeduction(index)}
									>
										<p>Remove</p>
										<X />
									</Button>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										{/* Amount */}
										<div className="grid gap-2">
											<Label htmlFor={`salaryDetails.deductions.${index}.amount`}>
												Amount
											</Label>
											<Input
												id={`salaryDetails.deductions.${index}.amount`}
												type="number"
												{...register(`salaryDetails.deductions.${index}.amount`, {
													setValueAs: (val) => (val === "" ? undefined : Number(val)),
												})}
												placeholder="Enter amount"
											/>
											{errors.salaryDetails?.deductions?.[index]?.amount && (
												<Label className="text-destructive text-xs">
													{errors.salaryDetails.deductions[index].amount.message}
												</Label>
											)}
										</div>
										{/* Reason */}
										<div className="grid gap-2">
											<Label htmlFor={`salaryDetails.deductions.${index}.reason`}>
												Reason
											</Label>
											<Input
												id={`salaryDetails.deductions.${index}.reason`}
												{...register(`salaryDetails.deductions.${index}.reason`)}
												placeholder="Enter reason"
											/>
											{errors.salaryDetails?.deductions?.[index]?.reason && (
												<Label className="text-destructive text-xs">
													{errors.salaryDetails.deductions[index].reason.message}
												</Label>
											)}
										</div>
										{/* Date */}
										<div className="grid gap-2">
											<Label htmlFor={`salaryDetails.deductions.${index}.date`}>Date</Label>
											<Input
												id={`salaryDetails.deductions.${index}.date`}
												type="date"
												{...register(`salaryDetails.deductions.${index}.date`)}
											/>
											{errors.salaryDetails?.deductions?.[index]?.date && (
												<Label className="text-destructive text-xs">
													{errors.salaryDetails.deductions[index].date.message}
												</Label>
											)}
										</div>
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								className="mt-2"
								onClick={() => appendDeduction({ amount: 0, reason: "", date: "" })}
							>
								Add Deduction
							</Button>
						</div>
					</div>
					<Button type="submit" className="cursor-pointer w-full" disabled={isAdding}>
						Add Teacher
						{isAdding && <SpinnerLoader />}
					</Button>
				</form>
			)}
		</section>
	);
};

const UpdateBasicDetailsForm = () => {
	let teacherData = getTeacherData();

	const { fetchedDepartments, isFetchingDepartments, departmentsFetchingError } = getDepartments();
	
	if(departmentsFetchingError) {
		return handleDepartmentsFetchingError(departmentsFetchingError as ApiError);
	}

	// Map departments to options format for Combobox
	const departmentOptions =
		fetchedDepartments?.data?.departments?.map((dept) => ({
			value: dept._id,
			label: dept.name,
		})) || [];

	// Map teacher's current department names to IDs
	const currentDepartmentIds = teacherData.departments
		.map((deptName: string) => {
			const dept = departmentOptions.find((option) => option.label === deptName);
			return dept ? dept.value : null;
		})
		.filter(Boolean);
		
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setValue
	} = useForm<UpdateTeacherFormData>({
		resolver: zodResolver(updateTeacherSchema),
		defaultValues: {
			fullName: teacherData.fullName,
			address: teacherData.address,
			password: teacherData.password,
			contactNumber: Number(teacherData?.contactNumber?.replace('+', '')) || 0,
			status: teacherData.status,
			departments: currentDepartmentIds, // Will be set dynamically below
		},
	});

	useEffect(() => {
		if(isFetchingDepartments) return;
		setValue("departments", currentDepartmentIds);
	}, [currentDepartmentIds]);

	const dispatch = useDispatch();

	const [updateTeacher, { isLoading: isUpdating }] = useUpdateTeacherBasicDetailsMutation();

	const onSubmit = async (data: UpdateTeacherFormData) => {
		// Prepare payload for backend
		const payload: any = {};

		// Add fields only if they have changed or are provided
		// Add fields only if they have changed or are provided
		if (data.fullName != undefined && data.fullName !== teacherData.fullName) {
			payload.fullName = data.fullName;
		}
		if (data.address != undefined && data.address !== teacherData.address) {
			payload.address = data.address;
		}
		if (data.password != undefined && data.password.trim() !== teacherData.password) {
			payload.password = data.password;
		}
		if (data.status != undefined && data.status !== teacherData.status) {
			payload.status = data.status;
		}

		// Compare departments arrays using Sets
		const currentSet = new Set(currentDepartmentIds);
		const updatedSet = new Set(data.departments || []);
		const departmentsChanged =
		currentSet.size !== updatedSet.size || ![...currentSet].every((id) => updatedSet.has(id));

		// Include departments in payload only if they have changed
		if (departmentsChanged) {
			payload.departments = data.departments;
		}
		
		if (data.contactNumber != undefined && data.contactNumber !== Number(teacherData?.contactNumber?.replace('+', ''))) {
			payload.contactNumber = `+${data.contactNumber}`
		}

		if (isEmptyObject(payload)) {
			toast.warning("No changes found", warningToastOptions);
			return;
		}

		for (let field in payload) {
			if (typeof payload[field] === "string") {
				payload[field] = payload[field].trim();
			}
		}
		
		try {
			const resp = await updateTeacher({ id: teacherData._id, data: payload }).unwrap();
			if (resp?.success) {
				toast.success("Teacher updated successfully");
				// reset();
				dispatch(closeDialoge(stateDialogeBoxes.addTeacherDialogeBoxOpen));
				dispatch(setTeacherDialogeData(null));
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Failed to update student",
				description: error?.data?.message,
			});
		}
	};

	return (
		<section>
			{isFetchingDepartments ? (
				<div className="flex w-full items-center justify-center p-6 md:p-10">
					<div className="flex flex-col justify-center gap-4">
						<p>We are seting up things for you so please be patient...</p>
						<SpinnerLoader />
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Full Name */}
						<div className="grid gap-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input id="fullName" {...register("fullName")} placeholder="Enter full name" />
							{errors.fullName && (
								<p className="text-destructive text-sm">{errors.fullName.message}</p>
							)}
						</div>

						{/* Address */}
						<div className="grid gap-2">
							<Label htmlFor="address">Address</Label>
							<Input id="address" {...register("address")} placeholder="Enter address" />
							{errors.address && (
								<p className="text-destructive text-sm">{errors.address.message}</p>
							)}
						</div>

						{/* Contact Number */}
						<div className="grid gap-2">
							<Label htmlFor="contactNumber">Contact Number</Label>
							<div className="relative">
								<span className="absolute left-2 top-1/3 transform -translate-y-1/2">
									<Plus
										strokeWidth={1.5}
										width={18}
										className="self-center pt-[0.75rem]"
									/>
								</span>
								<Input
									id="contactNumber"
									type="number"
									{...register("contactNumber", {
										setValueAs: (val) =>
											val === "" ? undefined : Number(val),
									})}
									placeholder="Enter contact number"
									className="pl-8"
								/>
							</div>
							{errors.contactNumber && (
								<p className="text-destructive text-sm">{errors.contactNumber.message}</p>
							)}
						</div>

						{/* Password */}
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								{...register("password")}
								placeholder="Enter new password"
							/>
							{errors.password && (
								<p className="text-destructive text-sm">{errors.password.message}</p>
							)}
						</div>

						{/* Status */}
						<div className="grid gap-2 *:w-full">
							<Label>Status</Label>
							<Controller
								name="status"
								control={control}
								render={({ field } : any) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Active">Active</SelectItem>
											<SelectItem value="Inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.status && <p className="text-destructive text-sm">{errors.status.message}</p>}
						</div>
					</div>

					{/* Departments Section */}
					<div className="space-y-2">
						<Label htmlFor="departments">Departments</Label>
						<div className="grid gap-2">
							<Controller
								name="departments"
								rules={{ required: "Please select at least one department" }}
								control={control}
								render={({ field } : any) => (
									<Combobox
										value={field.value || []}
										onValueChange={field.onChange}
										multiple
										className="w-full"
										disabled={isFetchingDepartments}
										
									>
										<ComboboxAnchor className="h-full min-h-10 flex-wrap px-3 py-2">
											<ComboboxBadgeList>
												{field?.value?.map((id) => {
													const option = departmentOptions.find(
														(dept) => dept.value === id
													);
													if (!option) return null;
													return (
														<ComboboxBadgeItem key={id} value={id}>
															{option.label}
														</ComboboxBadgeItem>
													);
												})}
											</ComboboxBadgeList>
											<ComboboxInput
												placeholder="Select departments..."
												className="h-auto min-w-20 flex-1"
											/>
											<ComboboxTrigger className="absolute top-3 right-2">
												<ChevronDown className="h-4 w-4" />
											</ComboboxTrigger>
										</ComboboxAnchor>
										<ComboboxContent>
											<ComboboxEmpty>No departments found.</ComboboxEmpty>
											{departmentOptions.map((dept) => (
												<ComboboxItem key={dept.value} value={dept.value}>
													{dept.label}
												</ComboboxItem>
											))}
										</ComboboxContent>
									</Combobox>
								)}
							/>
							{errors.departments && (
								<p className="text-destructive text-sm">{errors.departments.message}</p>
							)}
						</div>
					</div>

					<Button type="submit" className="w-full" disabled={isUpdating}>
						Update
						{isUpdating && <SpinnerLoader />}
					</Button>
				</form>
			)}
		</section>
	);
};

const UpdateTeacherSalaryForm = () => {
	let teacherData = getTeacherData();

	const form = useForm<UpdateTeacherSalaryFormData>({
		resolver: zodResolver(updateTeacherSalarySchema),
		defaultValues: {
			baseSalary: teacherData.salaryDetails.baseSalary,
			bonusesToAdd: [],
			bonusesToRemove: [],
			deductionsToAdd: [],
			deductionsToRemove: [],
		},
	});

	const {
		control,
		handleSubmit
	} = form;

	const {
		fields: bonusesFields,
		append: appendBonus,
		remove: removeBonus,
	} = useFieldArray({
		control,
		name: "bonusesToAdd",
	});

	const {
		fields: deductionsFields,
		append: appendDeduction,
		remove: removeDeduction,
	} = useFieldArray({
		control,
		name: "deductionsToAdd",
	});

	const dispatch = useDispatch();
	const [updateTeacherSalary, { isLoading: isUpdating }] = useUpdateTeacherSalaryMutation();

	const onSubmit = async (data: UpdateTeacherSalaryFormData) => {
		const payload: any = {};

		if (data.baseSalary != undefined && data.baseSalary !== teacherData.salaryDetails.baseSalary) {
			payload.baseSalary = data.baseSalary;
		}
		if (data.bonusesToAdd != undefined && data.bonusesToAdd?.length > 0) {
			data.bonusesToAdd.map((bonus) => (bonus.reason = bonus.reason.trim()));
			payload.bonusesToAdd = data.bonusesToAdd;
		}
		if (data.bonusesToRemove != undefined && data.bonusesToRemove?.length > 0) {
			payload.bonusesToRemove = data.bonusesToRemove;
		}
		if (data.deductionsToAdd != undefined && data.deductionsToAdd?.length > 0) {
			data.deductionsToAdd.map((bonus) => (bonus.reason = bonus.reason.trim()));
			payload.deductionsToAdd = data.deductionsToAdd;
		}
		if (data.deductionsToRemove != undefined && data.deductionsToRemove?.length > 0) {
			payload.deductionsToRemove = data.deductionsToRemove;
		}

		if (isEmptyObject(payload)) {
			toast.warning(`No changes made in salary of Prof. ${teacherData.fullName}`, warningToastOptions);
			return;
		}
		console.log(payload);

		try {
			const response = await updateTeacherSalary({
				teacherId: teacherData._id,
				data: payload,
			}).unwrap();

			if (response?.success) {
				dispatch(closeDialoge(stateDialogeBoxes.addTeacherDialogeBoxOpen));
				dispatch(setTeacherDialogeData(null));
				toast.success("Teacher salary details updated successfully");
			}
		} catch (error:any) {
			mutationToastError({
				error,
				message: "Process failed",
				description: error?.data?.message,
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Base Salary Section */}
				<Card>
					<CardHeader>
						<CardTitle>Base Salary</CardTitle>
					</CardHeader>
					<CardContent>
						<FormField
							control={control}
							name="baseSalary"
							render={({ field } : any) => (
								<FormItem>
									<FormLabel>Base Salary</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="Enter base salary"
											{...field}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseFloat(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Bonuses Section */}
				<Card>
					<CardHeader>
						<CardTitle>Bonuses</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Add New Bonuses */}
						<div className="space-y-2">
							<h3 className="text-md font-semibold">Add New Bonuses</h3>
							{bonusesFields.map((field, index) => (
								<div key={field.id} className="border p-4 rounded-md flex flex-col gap-2">
									<Button 
										type="button" 
										variant="destructive" 
										onClick={() => removeBonus(index)}
										size="sm"
										className="self-end"
									>
										Remove <X />
									</Button>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<FormField
											control={control}
											name={`bonusesToAdd.${index}.amount`}
											render={({ field } : any) => (
												<FormItem>
													<FormLabel>Amount</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="Enter amount"
															{...field}
															onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
																field.onChange(parseFloat(e.target.value))
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name={`bonusesToAdd.${index}.reason`}
											render={({ field } : any) => (
												<FormItem>
													<FormLabel>Reason</FormLabel>
													<FormControl>
														<Input placeholder="Enter reason" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name={`bonusesToAdd.${index}.date`}
											render={({ field } : any) => (
												<FormItem>
													<FormLabel>Date</FormLabel>
													<FormControl>
														<Input type="date" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								onClick={() => appendBonus({ amount: 0, reason: "", date: "" })}
							>
								Add Bonus
							</Button>
						</div>

						{/* Remove Existing Bonuses */}
						<div className="space-y-2">
							<h3 className="text-md font-semibold">Remove Existing Bonuses</h3>
							{teacherData.salaryDetails.bonuses.length > 0 ? (
								<FormField
									control={control}
									name="bonusesToRemove"
									render={({ field } : any) => (
										<FormItem>
											<div className="space-y-2">
												{teacherData.salaryDetails.bonuses.map((bonus) => (
													<div key={bonus._id} className="flex items-center gap-2">
														<Checkbox
															checked={field.value?.includes(bonus._id)}
															onCheckedChange={(checked) => {
																const updated = checked
																	? [...(field.value || []), bonus._id]
																	: field.value?.filter(
																			(id) => id !== bonus._id
																	  );
																field.onChange(updated);
															}}
														/>
														<span>{`${bonus.reason} - ${bonus.amount} /Rs - ${getSimpleDate(bonus.date)}`}</span>
													</div>
												))}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							) : (
								<p className="text-sm text-gray-500">No bonuses to remove</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Deductions Section */}
				<Card>
					<CardHeader>
						<CardTitle>Deductions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Add New Deductions */}
						<div className="space-y-2">
							<h3 className="text-md font-semibold">Add New Deductions</h3>
							{deductionsFields.map((field, index) => (
								<div key={field.id} className="border p-4 rounded-md flex flex-col gap-2">
									<Button
										type="button"
										variant="destructive"
										onClick={() => removeDeduction(index)}
										size="sm"
										className="self-end"
									>
										Remove <X />
									</Button>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<FormField
											control={control}
											name={`deductionsToAdd.${index}.amount`}
											render={({ field } : any) => (
												<FormItem>
													<FormLabel>Amount</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="Enter amount"
															{...field}
															onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
																field.onChange(parseFloat(e.target.value))
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name={`deductionsToAdd.${index}.reason`}
											render={({ field } : any) => (
												<FormItem>
													<FormLabel>Reason</FormLabel>
													<FormControl>
														<Input placeholder="Enter reason" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={control}
											name={`deductionsToAdd.${index}.date`}
											render={({ field } : any) => (
												<FormItem>
													<FormLabel>Date</FormLabel>
													<FormControl>
														<Input type="date" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								onClick={() => appendDeduction({ amount: 0, reason: "", date: "" })}
							>
								Add Deduction
							</Button>
						</div>

						{/* Remove Existing Deductions */}
						<div className="space-y-2">
							<h3 className="text-md font-semibold">Remove Existing Deductions</h3>
							{teacherData.salaryDetails.deductions.length > 0 ? (
								<FormField
									control={control}
									name="deductionsToRemove"
									render={({ field } : any) => (
										<FormItem>
											<div className="space-y-2">
												{teacherData.salaryDetails.deductions.map((deduction) => (
													<div key={deduction._id} className="flex items-center gap-2">
														<Checkbox
															checked={field.value?.includes(deduction._id)}
															onCheckedChange={(checked) => {
																const updated = checked
																	? [...(field.value || []), deduction._id]
																	: field.value?.filter(
																			(id) => id !== deduction._id
																	  );
																field.onChange(updated);
															}}
														/>
														<span>{`${deduction.reason} - ${deduction.amount} /Rs - ${getSimpleDate(deduction.date)}`}</span>
													</div>
												))}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							) : (
								<p className="text-sm text-gray-500">No deductions to remove</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Submit Button */}
				<Button type="submit" className="w-full" disabled={isUpdating}>
					Update
					{isUpdating && <SpinnerLoader />}
				</Button>
			</form>
		</Form>
	);
};

const UpdationForm = () => {
	return (
		<Tabs defaultValue="basic" className="w-full">
			<TabsList>
				<TabsTrigger value="basic">Basic Details</TabsTrigger>
				<TabsTrigger value="salary">Salary Structure</TabsTrigger>
			</TabsList>

			<TabsContent value="basic">
				<UpdateBasicDetailsForm />
			</TabsContent>

			<TabsContent value="salary">
				<UpdateTeacherSalaryForm />
			</TabsContent>
		</Tabs>
	);
};


const TeacherFormDialogueBox = () => {
	const dispatch = useDispatch();
	const formDilgOpen = useSelector((state: any) => state.ui.dialogeBoxes.addTeacherDialogeBoxOpen);
	const dialogData = useSelector((state: any) => state.ui.teacherDialogData);
		
	return (
		<Dialog
			open={formDilgOpen}
			onOpenChange={() => {
				dispatch(closeDialoge(stateDialogeBoxes.addTeacherDialogeBoxOpen))
				dispatch(setTeacherDialogeData(null))
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{dialogData == undefined ? "Add Teacher" : "Update Teacher"}
					</DialogTitle>
					<DialogDescription>
						{dialogData == undefined
							? "Add a new teacher and save when you're done"
							: "Carefully update the teacher details as changes are hard to undo"}
					</DialogDescription>
				</DialogHeader>
				{dialogData == undefined ? <TeacherAdditionForm /> : <UpdationForm />}
			</DialogContent>
		</Dialog>
	);
};

export default TeacherFormDialogueBox;
