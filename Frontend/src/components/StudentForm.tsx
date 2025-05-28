import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { closeDialoge, setStudentDialogeData, stateDialogeBoxes } from "../store/uiSlice";
import { ClassType, ProgrammeType, RefinedData } from "../types/global";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router";
import { useAddStudentMutation, useUpdateStdBasicDetailsMutation, useUpdateStdFeeStructureMutation } from "../services/users.api";
import { mutationToastError } from "../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "./Loaders";
import { CheckCheck, CircleDollarSign, CircleDotDashed, HandCoins, Percent, Plus, TriangleAlert, Wallet, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Note } from "@/components/ui/Note";

// 🎯 Define Validation Schema using Zod
const studentSchema = z.object({
	fullName: z.string().min(1, "Full Name is required"),
	email: z.string().email("Invalid email"),
	contactNumber: z
		.union([z.number().positive("Phn. Number must be positive").max(999999999999), z.undefined()])
		.refine((val) => val != undefined, { message: "Phn. Number is required" }),
	gender: z.enum(["Male", "Female"], { message: "Gender is required" }),
	dob: z.string().min(1, "Date of Birth is required"),
	address: z.string().min(1, "Address is required"),
	classId: z.string({ required_error: "Class is required" }),
	sectionId: z.string({ required_error: "Section is required" }),
	program: z.string({ required_error: "Program is required" }),

	sessionYears_s: z.string({ required_error: "Start year is required" }),
	sessionYears_e: z.string({ required_error: "End year is required" }),

	totalMarks: z
		.union([z.number().positive("Total marks must be positive"), z.undefined()])
		.refine((val) => val != undefined, { message: "Total marks are required" }),
	obtainedMarks: z
		.union([z.number().positive("Obtained marks must be positive"), z.undefined()])
		.refine((val) => val != undefined, { message: "Obtained marks are required" }),
	totalFee: z
		.union([z.number().positive("Total fee must be positive"), z.undefined()])
		.refine((val) => val != undefined, { message: "Total fee is required" }),
	status: z.enum(["Active", "Inactive", "Alumni"], {
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
	.refine(
		(data) => {
			// If classId is present, sectionId must also be present
			if (data.classId && !data.sectionId) {
				return false;
			}
			return true;
		},
		{
			message: "Section is required when a class is selected",
			path: ["sectionId"], // Point the error to the sectionId field
		}
	);

const individualFeeSchema = z.object({
	semester: z.string().min(1, "Semester is required"),
	totalFee: z.number().min(1, "Total Fee is required"),
	status: z.string().min(1, "Status is required"),
	_id: z.string().optional(), // Optional for new fees
	dueDate: z.string().min(1, "Due date is required"),
	isTutionFee: z.boolean({ required_error: "Tution fee is required" }),
});

const updateStdFeeSchema = z.object({
	scholorShip: z.number().min(0, "Scholarship is required"),
	semesterFees: z.array(individualFeeSchema), // For existing fees to update
	extraSemFees: z.array(individualFeeSchema).optional(), // For new fees
});

// For api
export type StudentFormDataType = {
	fullName: string;
	email: string;
	contactNumber: number;
	gender: "Male" | "Female";
	dob: string;
	address: string;
	classId: string;
	sectionId: string;
	program: string;
	sessionYears_s: string;
	sessionYears_e: string;
	totalMarks: number;
	obtainedMarks: number;
	totalFee: number;
	status: "Active" | "Inactive" | "Alumni";
}

type StudentFormData = z.infer<typeof studentSchema>;
export type UpdateBasicDetailsFormData = z.infer<typeof updateBasicDetailsSchema>;
type UpdateStdFeeFormData = z.infer<typeof updateStdFeeSchema>;

const ErrorTxt = (field: any) => {
	return (
		<Label className="text-destructive mt-1 text-xs" htmlFor={field}>
			{field.message}
		</Label>
	);
}

const getBadgeVariant = (status: string) => {
	switch (status) {
		case "Paid":
			return "success"; // Green badge
		case "Unpaid":
			return "destructive"; // Red badge
		case "InActive":
			return "warning"; // Gray badge
		default:
			return "default"; // Fallback style
	}
};

const StudentAdditionForm = () => {
	const {
		register,
		handleSubmit,
        control,
		formState: { errors },
	} = useForm<StudentFormData>({
		resolver: zodResolver(studentSchema),
	});

	const classes: ClassType[] = useSelector((state: any) => state.academics.classes);
	const programs: ProgrammeType[] = useSelector((state: any) => state.academics.programmes);

	const watchedClassValue = useWatch({ control, name: "classId" });
	const watchedStartYrValue = useWatch({ control, name: "sessionYears_s" });

	const [addStudent, { isLoading: isAdding }] = useAddStudentMutation();
	
    const onFormSubmit = async (data: StudentFormData) => {
		const parts = data.dob.split("-");
		const reversedDob = `${parts[1]}-${parts[2]}-${parts[0]}`;

		let refinedData : RefinedData = {
			...data,
			dob: reversedDob,
			contactNumber: `+${data.contactNumber}`,
			sessionYears: `${data.sessionYears_s}-${data.sessionYears_e}`,
		}

		delete refinedData.sessionYears_s;
		delete refinedData.sessionYears_e;

		for (let field in refinedData) {
			if (typeof refinedData[field] === "string") {
				refinedData[field] = refinedData[field].trim();
			}
		}
		
		try {
			const res = await addStudent({
				...(refinedData as StudentFormDataType),
			}).unwrap();

			if (res?.success) {
				toast.success(
					`Roll number ${res.data.rollNumber} added successfully`
				);
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Process failed",
				description: error?.data?.message,
			});
		}
    }
	
	return (
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
					<Input
						id="email"
						type="email"
						{...register("email")}
						placeholder="Enter email"
					/>
					{errors.email && ErrorTxt(errors.email)}
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
					<Input
						id="dob"
						type="date"
						{...register("dob")}
						className="cursor-pointer"
					></Input>
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

				{/* Class */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="classId">Class</Label>
					<Controller
						name="classId"
						control={control}
						rules={{ required: "Class is required" }}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue placeholder="Select class" />
									</SelectTrigger>
									<SelectContent>
										{classes.length > 0 ? (
											classes.map((classItem) => (
												<SelectItem
													key={classItem._id}
													value={classItem._id}
												>
													{classItem.name}
												</SelectItem>
											))
										) : (
											<p className="text-sm p-1 text-destructive">
												No classes found
											</p>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>

				{/* Section */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="sectionId">Section</Label>
					<Controller
						name="sectionId"
						control={control}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={!watchedClassValue}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select section" />
									</SelectTrigger>
									<SelectContent>
										{(
											classes.find(
												(classItem) => classItem._id === watchedClassValue
											)?.sections ?? []
										).length > 0 ? (
											(
												classes.find(
													(classItem) =>
														classItem._id === watchedClassValue
												)?.sections ?? []
											).map((section) => (
												<SelectItem key={section._id} value={section._id}>
													{section.name}
												</SelectItem>
											))
										) : (
											<Link to="/dashboard/admin/classes">
												<p className="text-sm p-1 text-destructive hover:underline underline-offset-2">
													No sections found
												</p>
											</Link>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>

				{/* Programme */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="program">Programme</Label>
					<Controller
						name="program"
						control={control}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue placeholder="Select programme" />
									</SelectTrigger>
									<SelectContent>
										{programs.length > 0 ? (
											programs.map((program) => (
												<SelectItem key={program._id} value={program._id}>
													{program.name}
												</SelectItem>
											))
										) : (
											<p className="text-sm p-1 text-destructive">
												No programmes found
											</p>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="sessionYears">Session Years</Label>
					<div className="flex gap-2 w-full *:w-full" id="sessionYears">
						<Controller
							name="sessionYears_s"
							control={control}
							render={({ field, fieldState }) => (
								<div className="*:w-full grid gap-2">
									<Select
										value={field.value ? String(field.value) : undefined}
										onValueChange={(value: any) =>
											field.onChange(String(value))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select start year">
												{field.value || "Select end year"}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{Array.from({ length: 36 }, (_, i) => 2020 + i).map(
												(year) => (
													<SelectItem key={year} value={year}>
														{year}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
									{fieldState.error && ErrorTxt(fieldState.error)}
								</div>
							)}
						/>
						<Controller
							name="sessionYears_e"
							control={control}
							render={({ field, fieldState }) => (
								<div className="*:w-full grid gap-2">
									<Select
										value={field.value ? String(field.value) : undefined}
										onValueChange={(value: string) => field.onChange(value)}
										disabled={!watchedStartYrValue}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select end year">
												{field.value || "Select end year"}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{watchedStartYrValue &&
												Array.from({ length: 36 }, (_, i) => {
													const baseYear = Number(watchedStartYrValue);
													if (isNaN(baseYear)) return null;
													const year = baseYear + i + 1;

													return (
														<SelectItem
															key={`end-year-${year}`}
															value={String(year)}
														>
															{year}
														</SelectItem>
													);
												}).filter(Boolean)}
										</SelectContent>
									</Select>
									{fieldState.error && ErrorTxt(fieldState.error)}
								</div>
							)}
						/>
					</div>
				</div>

				{/* Total Marks */}
				<div className="grid gap-2">
					<Label htmlFor="totalMarks">Total Marks</Label>
					<Input
						id="totalMarks"
						type="number"
						placeholder="Enter total marks"
						{...register("totalMarks", {
							setValueAs: (val) => (val === "" ? undefined : Number(val)),
						})}
					/>
					{errors.totalMarks && ErrorTxt(errors.totalMarks)}
				</div>

				{/* Obtained Marks */}
				<div className="grid gap-2">
					<Label htmlFor="obtainedMarks">Obtained Marks</Label>
					<Input
						id="obtainedMarks"
						type="number"
						placeholder="Enter obtained marks"
						{...register("obtainedMarks", {
							setValueAs: (val) => (val === "" ? undefined : Number(val)),
						})}
					/>
					{errors.obtainedMarks && ErrorTxt(errors.obtainedMarks)}
				</div>

				{/* Total Fee */}
				<div className="grid gap-2">
					<Label htmlFor="totalFee">Total Fee</Label>
					<Input
						id="totalFee"
						type="number"
						placeholder="Enter total fee"
						{...register("totalFee", {
							setValueAs: (val) => (val === "" ? undefined : Number(val)),
						})}
					/>
					{errors.totalFee && ErrorTxt(errors.totalFee)}
				</div>

				{/* Status */}
				<div className="*:w-full grid gap-2">
					<Label>Status</Label>
					<Controller
						name="status"
						control={control}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Active">Active</SelectItem>
										<SelectItem value="Inactive">Inactive</SelectItem>
										<SelectItem value="Alumni">Alumni</SelectItem>
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>
			</div>
			<Button type="submit" className="cursor-pointer w-full" disabled={isAdding}>
				Add Student
				{isAdding && <SpinnerLoader />}
			</Button>
		</form>
	);
};

const UpdateBasicDetailsForm = () => {
	let dataToUpdate = useSelector((state: any) => state.ui.studentDialogData);

	dataToUpdate = {
		...dataToUpdate,
		contactNumber: Number(dataToUpdate?.contactNumber?.replace('+', '')) || 0
	}

	const classes: ClassType[] = useSelector((state: any) => state.academics.classes);
	const programs: ProgrammeType[] = useSelector((state: any) => state.academics.programmes);

	const getDefaultProgramId = () => {
		const p = programs.find((program: ProgrammeType) => program.name === dataToUpdate?.program);
		return p?._id ?? "";
	}

	const getDefaultClassId = () => {
		const c = classes.find((classItem: ClassType) => classItem.name === dataToUpdate?.class);
		return c?._id ?? "";
	}

	const getDefaultSectionId = () => {
		const defaultClassId = getDefaultClassId();
		if (defaultClassId) {
			const defaultClass = classes.find(
				(classItem) => classItem._id === defaultClassId
			);
			const defaultSection = defaultClass?.sections.find(
				(section) => section.name === dataToUpdate?.section
			);
			return defaultSection?._id ?? "";
		}
		return "";
	};

	const initialValues = {
		fullName: dataToUpdate?.fullName ?? "",
		contactNumber: dataToUpdate?.contactNumber ?? 0,
		status: dataToUpdate?.status ?? "Active",
		password: dataToUpdate?.password ?? "",
		address: dataToUpdate?.address ?? "",
		classId: getDefaultClassId(),
		sectionId: getDefaultSectionId(),
		program: getDefaultProgramId(),
	}
	
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setValue,
	} = useForm<UpdateBasicDetailsFormData>({
		resolver: zodResolver(updateBasicDetailsSchema),
		defaultValues: initialValues,
	});

	const watchedClassValue = useWatch({ control, name: "classId" });
	const watchedSectionValue = useWatch({ control, name: "sectionId" });

	const [updateBasicDetails, { isLoading: isUpdating }] = useUpdateStdBasicDetailsMutation();
	const dispatch = useDispatch();
	
	useEffect(() => {
		if (watchedClassValue) {
			const selectedClass = classes.find(
				(classItem) => classItem._id === watchedClassValue
			);
			const isValidSection = selectedClass?.sections.some(
				(section) => section._id === watchedSectionValue
			);
			if (!isValidSection && watchedSectionValue) {
				setValue("sectionId", "");
			}
		}
	}, [watchedClassValue, watchedSectionValue, classes, setValue]);

	const onFormSubmit = async (data: UpdateBasicDetailsFormData) => {
		let changedData: RefinedData = Object.fromEntries(
			Object.entries(data).filter(
				([key, value]) => value !== initialValues[key as keyof typeof initialValues]
			)
		);

		for (let field in changedData) {
			if (typeof changedData[field] === "string") {
				changedData[field] = changedData[field].trim();
			}
		}

		if (changedData.contactNumber != undefined) {
			changedData.contactNumber = `+${changedData.contactNumber}`
		}
		// console.log(changedData);
		// return
		try {
			const res = await updateBasicDetails({
				id: dataToUpdate?._id,
				data: changedData,
			}).unwrap();

			if (res?.success) {
				toast.success(res.message);
				dispatch(closeDialoge(stateDialogeBoxes.addStudentDialogeBoxOpen));
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
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Full Name */}
				<div className="grid *:w-full gap-2">
					<Label htmlFor="fullName">Full Name</Label>
					<Input
						id="fullName"
						{...register("fullName")}
						placeholder="Enter fullName"
					/>
					{errors.fullName && ErrorTxt(errors.fullName)}
				</div>

				{/* Contact Number */}
				<div className="grid *:w-full gap-2">
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
					{errors.contactNumber && ErrorTxt(errors.contactNumber)}
				</div>

				{/* Address */}
				<div className="grid gap-2 md:col-span-2">
					<Label htmlFor="address">Address</Label>
					<Textarea
						id="address"
						maxLength={200}
						{...register("address")}
						placeholder="Enter home address"
					/>
					{errors.address && ErrorTxt(errors.address)}
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
					{errors.password && ErrorTxt(errors.password)}
				</div>

				{/* Status */}
				<div className="grid gap-2">
					<Label htmlFor="status">Status</Label>
					<Controller
						name="status"
						control={control}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select
									onValueChange={field.onChange}
									value={field.value}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Active">
											Active
										</SelectItem>
										<SelectItem value="Inactive">
											Inactive
										</SelectItem>
										<SelectItem value="Alumni">
											Alumni
										</SelectItem>
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>

				{/* Class */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="classId">Class</Label>
					<Controller
						name="classId"
						control={control}
						rules={{ required: "Class is required" }}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select
									onValueChange={field.onChange}
									value={field.value}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select class" />
									</SelectTrigger>
									<SelectContent>
										{classes.length > 0 ? (
											classes.map((classItem) => (
												<SelectItem
													key={classItem._id}
													value={classItem._id}
												>
													{classItem.name}
												</SelectItem>
											))
										) : (
											<p className="text-sm p-1 text-destructive">
												No classes found
											</p>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>

				{/* Section */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="sectionId">Section</Label>
					<Controller
						name="sectionId"
						control={control}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={!watchedClassValue}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select section" />
									</SelectTrigger>
									<SelectContent>
										{(
											classes.find(
												(classItem) => classItem._id === watchedClassValue
											)?.sections ?? []
										).length > 0 ? (
											(
												classes.find(
													(classItem) => classItem._id === watchedClassValue
												)?.sections ?? []
											).map((section) => (
												<SelectItem
													key={section._id}
													value={section._id}
												>
													{section.name}
												</SelectItem>
											))
										) : (
											<Link to="/dashboard/admin/classes">
												<p className="text-sm p-1 text-destructive hover:underline underline-offset-2">
													No sections found
												</p>
											</Link>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>

				{/* Program */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="program">Programme</Label>
					<Controller
						name="program"
						control={control}
						render={({ field, fieldState }) => (
							<div className="*:w-full grid gap-2">
								<Select
									onValueChange={field.onChange}
									value={field.value}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select programme" />
									</SelectTrigger>
									<SelectContent>
										{programs.length > 0 ? (
											programs.map((program) => (
												<SelectItem
													key={program._id}
													value={program._id}
												>
													{program.name}
												</SelectItem>
											))
										) : (
											<p className="text-sm p-1 text-destructive">
												No programmes found
											</p>
										)}
									</SelectContent>
								</Select>
								{fieldState.error && ErrorTxt(fieldState.error)}
							</div>
						)}
					/>
				</div>
			</div>
			<Button
				type="submit"
				className="cursor-pointer w-full"
				disabled={isUpdating}
			>
				Update
				{isUpdating && <SpinnerLoader />}
			</Button>
		</form>
	);
}

function FormatInputDate(date: string) {
	// expected input : year-month-day -- this is from pure date input
	const parts = date.split("-");
	return date = `${parts[1]}-${parts[2]}-${parts[0]}`;
}

function FormatInitialDate(date: string) {
	// expected input : day-month-year -- this is initial value coming from backend
	const parts = date.split("-");
	return date = `${parts[2]}-${parts[1]}-${parts[0]}`;
}

const UpdateFeeStructureForm = () => {
	const dataToUpdate = useSelector((state: any) => state.ui.studentDialogData);
	const feeStatuses = ["Paid", "Unpaid", "InActive"];
	// console.log(dataToUpdate.feeDetails);
	
	// Set default values
	const initialValues: UpdateStdFeeFormData = {
		scholorShip: dataToUpdate?.feeDetails?.scholorShip ?? 0,
		semesterFees: dataToUpdate?.feeDetails?.semesterFees?.length
			? dataToUpdate.feeDetails.semesterFees.map((fee: any) => ({
					semester: fee.semester || "",
					totalFee: fee.totalFee || 0,
					status: fee.status || "",
					_id: fee._id || "",
					dueDate: FormatInitialDate(fee.dueDate) || "",
					isTutionFee: fee.isTutionFee || false,
			  }))
			: [
					{
						semester: "",
						totalFee: 0,
						status: "",
						_id: "",
						dueDate: "",
						isTutionFee: false,
					},
			  ],
		extraSemFees: [],
	};

	// Initialize form
	const {
		register,
		handleSubmit,
		control,
		formState: { errors }
	} = useForm<UpdateStdFeeFormData>({
		resolver: zodResolver(updateStdFeeSchema),
		defaultValues: initialValues
	});

	// Manage semesterFees and extraSemFees arrays
	const { fields: semesterFeeFields } = useFieldArray({
		control,
		name: "semesterFees",
	});

	const {
		fields: extraSemFeeFields,
		append: appendExtraSemFee,
		remove: removeExtraSemFee,
	} = useFieldArray({
		control,
		name: "extraSemFees",
	});
	
	const dispatch = useDispatch();
	const [updateFee, { isLoading: isUpdating }] = useUpdateStdFeeStructureMutation();

	// Form submission handler
	const onFormSubmit = async (data: UpdateStdFeeFormData) => {
		// Filter changed fields
		const changedData = {
			scholorShip: data.scholorShip !== initialValues.scholorShip ? data.scholorShip : undefined,
			semesterFees: data.semesterFees
				.map((fee, index) =>
					JSON.stringify(fee) !== JSON.stringify(initialValues.semesterFees[index]) ? fee : undefined
				)
				.filter(Boolean),
			extraSemFees: data.extraSemFees?.length ? data.extraSemFees : undefined,
		};

		// Clean up undefined fields
		let filteredData = Object.fromEntries(
			Object.entries(changedData).filter(([index, value]) => {
				if (index === "scholorShip") {
					return value !== undefined;
				} else {
					if (Array.isArray(value)) {
						return value.length > 0;
					}
				}
			})
		);

		if (Array.isArray(filteredData?.semesterFees) && filteredData.semesterFees != undefined) {
			filteredData?.semesterFees?.forEach((fee: any) => {
				fee.semester = fee.semester?.trim();
				return fee.dueDate = FormatInputDate(fee.dueDate);
			});
		}

		if (Array.isArray(filteredData?.extraSemFees) && filteredData.extraSemFees != undefined) {
			filteredData?.extraSemFees?.forEach((fee: any) => {
				fee.semester = fee.semester?.trim();
				return fee.dueDate = FormatInputDate(fee.dueDate);
			});
		}

		// console.log("Changed data submitted:\n", filteredData);
		// return;
		try {
			const res = await updateFee({
				id: dataToUpdate._id,
				data: {
					...dataToUpdate,
					...(filteredData.scholorShip && { scholorShip: filteredData.scholorShip }),
					...(filteredData.semesterFees && { semToUpdate: filteredData.semesterFees }),
					...(filteredData.extraSemFees && { extraSemFee: filteredData.extraSemFees }),
				}
			}).unwrap();

			if (res?.success) {
				toast.success(res.message);
				dispatch(closeDialoge(stateDialogeBoxes.addStudentDialogeBoxOpen));
			}
		} catch (error: any) {
			console.log(error);
			
			mutationToastError({
				error,
				message: "Failed to update student fee",
				description: error?.data?.message,
			});
		}
	};
	
	return (
		<section className="mt-2">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="transition-all hover:shadow-md">
					<CardContent className="grid grid-cols-[1fr_auto]">
						<div>
							<h4 className="font-semibold text-muted-foreground">Total Fee</h4>
							<p className="text-xl font-semibold">{dataToUpdate.feeDetails.totalFee} /Rs</p>
						</div>
						<CircleDollarSign className="place-self-center" color="grey" />
					</CardContent>
				</Card>
				<Card className="transition-all hover:shadow-md">
					<CardContent className="grid grid-cols-[1fr_auto]">
						<div>
							<h4 className="font-semibold text-muted-foreground">Paid Fee</h4>
							<p className="text-xl font-semibold">{dataToUpdate.feeDetails.paidFee} /Rs</p>
						</div>
						<Wallet className="place-self-center" color="green" />
					</CardContent>
				</Card>
				<Card className="transition-all hover:shadow-md">
					<CardContent className="grid grid-cols-[1fr_auto]">
						<div>
							<h4 className="font-semibold text-muted-foreground">Due Fee</h4>
							<p className="text-xl font-semibold">{dataToUpdate.feeDetails.dueFee} /Rs</p>
						</div>
						<HandCoins className="place-self-center" color="red" />
					</CardContent>
				</Card>
			</div>
			<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-4">
				{/* Scholarship */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor="scholorShip">Scholarship</Label>
						<div className="flex gap-2 w-full">
							<Input
								id="scholorShip"
								type="number"
								{...register("scholorShip", {
									setValueAs: (val) => (val === "" ? 0 : Number(val)),
								})}
								className="w-full"
								placeholder="Enter scholarship amount"
							/>
							<span className="self-center">
								<Percent width={18} height={18} />
							</span>
						</div>
						{errors.scholorShip && <ErrorTxt>{errors.scholorShip.message}</ErrorTxt>}
					</div>
				</div>
				{/* NOTE: -- */}
				<Note heading="Info" text="Scholorship only applies on the tution fees and not on extra fees." />
				{/* Existing Semester Fees */}
				<div className="space-y-4 border-t pt-4">
					<h3 className="text-lg font-semibold">Update Semester Fees</h3>
					{semesterFeeFields.map((field, index) => (
						<div key={field.id} className="space-y-4 border p-4 rounded-md relative">
							<div className="flex justify-end">
								<Badge variant={getBadgeVariant(field.status)}>
									<div className="flex gap-2">
										{field.status === feeStatuses[0] ? (
											<CheckCheck className="self-center" width={17} height={17} />
										) : field.status === feeStatuses[1] ? (
											<TriangleAlert className="self-center" width={17} height={17} />
										) : (
											<CircleDotDashed className="self-center" width={17} height={17} />
										)}
										<p className="text-[.9rem]">
											{field.status === feeStatuses[2] ? "Inactive" : field.status}
										</p>
									</div>
								</Badge>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Semester */}
								<div className="grid gap-2">
									<Label htmlFor={`semesterFees.${index}.semester`}>Semester Name</Label>
									<Input
										id={`semesterFees.${index}.semester`}
										{...register(`semesterFees.${index}.semester`)}
										placeholder="Enter semester name"
									/>
									{errors.semesterFees?.[index]?.semester?.message && (
										ErrorTxt(errors.semesterFees[index].semester.message)
									)}
								</div>
								{/* Total Fee */}
								<div className="grid gap-2">
									<Label htmlFor={`semesterFees.${index}.totalFee`}>Total Fee</Label>
									<Input
										id={`semesterFees.${index}.totalFee`}
										type="number"
										{...register(`semesterFees.${index}.totalFee`, {
											setValueAs: (val) => (val === "" ? 0 : Number(val)),
										})}
										placeholder="Enter total fee"
									/>
									{errors.semesterFees?.[index]?.totalFee && (
										<ErrorTxt>{errors.semesterFees[index].totalFee.message}</ErrorTxt>
									)}
								</div>
								{/* Status */}
								<div className="grid gap-2">
									<Label htmlFor={`semesterFees.${index}.status`}>Status</Label>
									<Controller
										name={`semesterFees.${index}.status`}
										control={control}
										render={({ field, fieldState }) => (
											<div className="*:w-full grid gap-2">
												<Select onValueChange={field.onChange} value={field.value}>
													<SelectTrigger>
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
													<SelectContent>
														{feeStatuses.map((status) => (
															<SelectItem key={status} value={status}>
																{status}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{fieldState.error && (
													<ErrorTxt>{fieldState.error.message}</ErrorTxt>
												)}
											</div>
										)}
									/>
								</div>
								{/* Due Date */}
								<div className="grid gap-2">
									<Label htmlFor={`semesterFees.${index}.dueDate`}>Due Date</Label>
									<Input
										id={`semesterFees.${index}.dueDate`}
										type="date"
										className="cursor-pointer"
										{...register(`semesterFees.${index}.dueDate`)}
									/>
									{errors.semesterFees?.[index]?.dueDate && (
										<ErrorTxt>{errors.semesterFees[index].dueDate.message}</ErrorTxt>
									)}
								</div>
								{/* Is Tuition Fee */}
								<div className="grid gap-2">
									<div className="flex flex-wrap gap-4 bg-secondary py-3 px-4 rounded-xl">
										<Label htmlFor={`semesterFees.${index}.isTutionFee`}>
											Is Tuition Fee?
										</Label>
										<Controller
											name={`semesterFees.${index}.isTutionFee`}
											control={control}
											render={({ field }) => (
												<Checkbox
													id={`semesterFees.${index}.isTutionFee`}
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											)}
										/>
									</div>
									{errors.semesterFees?.[index]?.isTutionFee && (
										<ErrorTxt>{errors.semesterFees[index].isTutionFee.message}</ErrorTxt>
									)}
								</div>
								{/* Hidden _id */}
								<Input type="hidden" {...register(`semesterFees.${index}._id`)} />
							</div>
						</div>
					))}
				</div>
				{/* Extra Semester Fees */}
				<div className="space-y-4 border-t pt-4">
					<h3 className="text-lg font-semibold">Extra Semester Fees</h3>
					{extraSemFeeFields.length === 0 ? (
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								appendExtraSemFee({
									semester: "",
									totalFee: 0,
									status: "",
									dueDate: "",
									isTutionFee: false,
								})
							}
						>
							<p>Add Extra Fee</p> <Plus />
						</Button>
					) : (
						extraSemFeeFields.map((field, index) => (
							<div key={field.id} className="space-y-4 border p-4 rounded-md">
								<div className="flex w-full justify-end">
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={() => removeExtraSemFee(index)}
									>
										<p>Remove</p>
										<X />
									</Button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Semester */}
									<div className="grid gap-2">
										<Label htmlFor={`extraSemFees.${index}.semester`}>Semester</Label>
										<Input
											id={`extraSemFees.${index}.semester`}
											{...register(`extraSemFees.${index}.semester`)}
											placeholder="Enter semester name"
										/>
										{errors.extraSemFees?.[index]?.semester && (
											<ErrorTxt>{errors.extraSemFees[index].semester.message}</ErrorTxt>
										)}
									</div>
									{/* Total Fee */}
									<div className="grid gap-2">
										<Label htmlFor={`extraSemFees.${index}.totalFee`}>Total Fee</Label>
										<Input
											id={`extraSemFees.${index}.totalFee`}
											type="number"
											{...register(`extraSemFees.${index}.totalFee`, {
												setValueAs: (val) => (val === "" ? 0 : Number(val)),
											})}
											placeholder="Enter total fee"
										/>
										{errors.extraSemFees?.[index]?.totalFee && (
											<ErrorTxt>{errors.extraSemFees[index].totalFee.message}</ErrorTxt>
										)}
									</div>
									{/* Status */}
									<div className="grid gap-2">
										<Label htmlFor={`extraSemFees.${index}.status`}>Status</Label>
										<Controller
											name={`extraSemFees.${index}.status`}
											control={control}
											render={({ field, fieldState }) => (
												<div className="*:w-full grid gap-2">
													<Select onValueChange={field.onChange} value={field.value}>
														<SelectTrigger>
															<SelectValue placeholder="Select status" />
														</SelectTrigger>
														<SelectContent>
															{feeStatuses.map((status) => (
																<SelectItem key={status} value={status}>
																	{status}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{fieldState.error && (
														<ErrorTxt>{fieldState.error.message}</ErrorTxt>
													)}
												</div>
											)}
										/>
									</div>
									{/* Due Date */}
									<div className="grid gap-2">
										<Label htmlFor={`extraSemFees.${index}.dueDate`}>Due Date</Label>
										<Input
											id={`extraSemFees.${index}.dueDate`}
											type="date"
											className="cursor-pointer"
											{...register(`extraSemFees.${index}.dueDate`)}
										/>
										{errors.extraSemFees?.[index]?.dueDate && (
											<ErrorTxt>{errors.extraSemFees[index].dueDate.message}</ErrorTxt>
										)}
									</div>
									{/* Is Tuition Fee */}
									<div className="grid gap-2">
										<div className="flex flex-wrap gap-4 bg-secondary py-2 px-3 rounded-xl">
											<Label htmlFor={`extraSemFees.${index}.isTutionFee`}>
												Is Tuition Fee?
											</Label>
											<Controller
												name={`extraSemFees.${index}.isTutionFee`}
												control={control}
												render={({ field }) => (
													<Checkbox
														id={`extraSemFees.${index}.isTutionFee`}
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												)}
											/>
										</div>
										{errors.extraSemFees?.[index]?.isTutionFee && (
											<ErrorTxt>{errors.extraSemFees[index].isTutionFee.message}</ErrorTxt>
										)}
									</div>
								</div>
							</div>
						))
					)}
					{extraSemFeeFields.length > 0 && (
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								appendExtraSemFee({
									semester: "",
									totalFee: 0,
									status: "",
									dueDate: "",
									isTutionFee: false,
								})
							}
						>
							Add Another Extra Fee
						</Button>
					)}
				</div>
				{/* Submit Button */}
				<Button type="submit" className="w-full" disabled={isUpdating}>
					Update
					{isUpdating && <SpinnerLoader />}
				</Button>
			</form>
		</section>
	);
};

const UpdationForm = () => {
	return (
		<Tabs defaultValue="basic" className="w-full">
			<TabsList>
				<TabsTrigger value="basic">Basic Details</TabsTrigger>
				<TabsTrigger value="fee">Fee Structure</TabsTrigger>
			</TabsList>

			<TabsContent value="basic">
				<UpdateBasicDetailsForm />
			</TabsContent>

			<TabsContent value="fee">
				<UpdateFeeStructureForm />
			</TabsContent>
		</Tabs>
	);
};


const StudentFormDialogueBox = () => {
	const dispatch = useDispatch();
	const stdFormDilgOpen = useSelector((state: any) => state.ui.dialogeBoxes.addStudentDialogeBoxOpen);
	const dialogData = useSelector((state: any) => state.ui.studentDialogData);
	
	return (
		<Dialog
			open={stdFormDilgOpen}
			onOpenChange={() => {
				dispatch(closeDialoge(stateDialogeBoxes.addStudentDialogeBoxOpen))
				dispatch(setStudentDialogeData(null))
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{dialogData == undefined ? "Add Student" : "Update Student"}
					</DialogTitle>
					<DialogDescription>
						{dialogData == undefined
							? "Add a new Student and save when you're done"
							: "Carefully update the student details as changes are hard to undo"}
					</DialogDescription>
				</DialogHeader>
				{dialogData == undefined ? <StudentAdditionForm /> : <UpdationForm />}
			</DialogContent>
		</Dialog>
	);
};

export default StudentFormDialogueBox;
