import { useForm, useWatch } from "react-hook-form";
import { ClassType, SingleResponseClassType } from "../types/global";
import { useDispatch } from "react-redux";
import { useCreateClassMutation, useCreateSectionMutation, useDeleteSectionMutation, useUpdateClassMutation, useUpdateSectionsMutation } from "../services/academics.api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addClass } from "../store/academicsSlice";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SpinnerLoader } from "./Loaders";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutationToastError } from "../utils/helpers";
import { closeDialoge, stateDialogeBoxes } from "../store/uiSlice";


const SectionDeleteButton = ({  onDelete }: { onDelete: () => void }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    }

    return (
        <span
            className={`${!isDeleting ? "cursor-pointer" : "cursor-not-allowed"} pl-2 grid place-content-center w-fit`}
            onClick={handleDelete}
        >
            {!isDeleting ? <Trash2 strokeWidth={1.5} /> : (
                <SpinnerLoader width={24} height={24} />
            )}
        </span>
    )
}

function ClassDialogFor({
	isUpdateMode,
	data
}: {
	isUpdateMode: Boolean;
	data?: ClassType;
}) {
	const {
		register,
		handleSubmit,
		getValues,
		watch,
		formState: { errors },
	} = useForm<ClassType>({
		defaultValues: {
			name: isUpdateMode ? data?.name : "",
			sections: isUpdateMode ? data?.sections : [{ name: "" }],
		},
	});
	//console.log(data);
	
	const dispatch = useDispatch();
	const [deleteSection] = useDeleteSectionMutation();
	const [hasChangesState, setHasChangesState] = useState(false);
	const [createSectionMutation, { isLoading: isCreatingSection }] = useCreateSectionMutation();
	const [createClassMutation, { isLoading: isCreatingClass }] = useCreateClassMutation();
	const [newSections, setNewSections] = useState<Array<{ name: string }>>([]);
	const [primarySections, setPrimarySections] = useState< Array<{ name: string; _id: string }>
	>([]);
	const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
	const [updateSections, { isLoading: isUpdatingSection }] = useUpdateSectionsMutation();
	type changeDataType = { name?: string; sections?: any };
	let changedData: changeDataType = { name: "", sections: [] };

	useEffect(() => {
		if (primarySections.length == null || !isUpdateMode) return;
		setPrimarySections(data ? data.sections : []);
	}, [data]);

	const formData = watch();
	// const formData = useWatch(control);
	// console.log(formData);
	
	const hasChanges = () => {
		if (isUpdateMode == false) return true; // Always allow submission in create mode

		if (data && formData.name.trim() !== data.name) return true;

		const existingSectionsChanged =
			data &&
			formData.sections.some(
				(section, index) =>
					section.name.trim() !== data.sections[index]?.name.trim()
			);

		if (existingSectionsChanged || newSections.length > 0) return true;

		return false;
	};

	

	useEffect(() => {
		if (hasChangesState) return;
		setHasChangesState(hasChanges());
	}, [formData, data]);

	const handleSectionDeletion = async (sectionId: string) => {
		if (!sectionId) return;

		try {
			const res = await deleteSection(sectionId).unwrap();
			if (res && res.success) {
				toast.success(res.message);
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Failed to delete section",
				description: "Please try again",
			});
		}
	};

	const handleUpdate = async () => {
		if (isUpdateMode && data != undefined) {
			const updatedData: any = getValues(); // <------ FORM DATA
			const originalData: ClassType = data;

			Object.keys(updatedData).forEach((key) => {
				if (key === "sections") {
					let updatedSections = updatedData[key];
					let originalSections = originalData[key];

					if (updatedSections.length !== originalSections.length) {
						changedData[key] = updatedSections;
					} else {
						const updatedSectionNames = updatedSections.map(
							(section: any) => section.name.trim()
						);
						const originalSectionNames = originalSections.map(
							(section) => section.name.trim()
						);

						updatedSectionNames.forEach(
							(name: string, index: number) => {
								if (name !== originalSectionNames[index]) {
									changedData.sections[index] =
										updatedSections[index];
								}
							}
						);
					}
				} else {
					// @ts-ignore
					if (updatedData[key] !== originalData[key]) {
						changedData[key as keyof changeDataType] =
							updatedData[key];
					}
				}
			});

			// Updating class name
			if (
				changedData.name?.trim() !== "" &&
				changedData.name !== undefined
			) {
				try {
					const res = await updateClass({
						id: data._id,
						name: changedData.name.trim(),
					}).unwrap();
					if (res && res.success) {
						toast.success("Class name updated successfully");
					}
				} catch (error: any) {
					mutationToastError({
						error,
						message: "Class name Updation failed",
						description: error?.data?.message,
					});
				}
			}

			// Updating sections
			if (changedData.sections && changedData.sections.length > 0) {
				const updatedSections = changedData.sections.map(
					(section: any, index: number) => {
						return {
							...data.sections[index],
							...section,
							name: section.name.trim(),
						};
					}
				);

				try {
					const res = await updateSections(updatedSections).unwrap();
					if (res && res.success) {
						toast.success("Sections updated successfully");
					}
				} catch (error: any) {
					mutationToastError({
						error,
						message: "Section Updation failed",
						description: error?.data?.message,
					});
				}
			}

			// creating new sections
			const filteredSections = newSections.filter(
				(section) => section.name.trim() !== ""
			);
			if (filteredSections.length > 0) {
				filteredSections.forEach(async (section: any) => {
					try {
						const res = await createSectionMutation({
							name: section.name.trim(),
							classId: data._id,
						}).unwrap();

						if (res && res.success) {
							toast.success(
								`${section.name} section created successfully`
							);
						}
					} catch (error: any) {
						mutationToastError({
							error,
							message: "Section Creation failed",
							description: error?.data?.message,
						});
					}
				});
			}
		} else {
			const dataToCreate = {
				name: formData.name.trim(),
				sections: newSections.filter(
					(section: { name: string }) => section.name.trim() !== ""
				),
			};

			console.log(dataToCreate);

			try {
				if (dataToCreate.name !== "") {
					const classResponse = (await createClassMutation(
						dataToCreate
					).unwrap()) as SingleResponseClassType;

					if (classResponse && classResponse.success) {
						toast.success("Class added successfully");
						if (dataToCreate.sections.length > 0) {
							const classId = classResponse.data._id as string;
							try {
								for (
									let i = 0;
									i < dataToCreate.sections.length;
									i++
								) {
									const section = dataToCreate.sections[i];
									const sectionResponse =
										await createSectionMutation({
											name: section.name.trim(),
											classId: classId,
										}).unwrap();

									if (
										sectionResponse &&
										sectionResponse.success
									) {
										toast.success(
											`${section.name} section created successfully`
										);

										dispatch(
											addClass({
												_id: classId,
												name: classResponse.data.name,
												sections:
													classResponse.data.sections,
											})
										);
									}
								}
							} catch (error: any) {
								mutationToastError({
									error,
									message: "Section Creation failed",
									description: error?.data?.message,
								});
							}
						}
					}
				}
			} catch (error: any) {
				mutationToastError({
					error,
					message: "Class Creation failed",
					description: error?.data?.message,
				});
			}
		}

		dispatch(closeDialoge(stateDialogeBoxes.classDialogBoxOpen));
	};

	return (
		<form
			className="grid items-start gap-4 max-h-[42rem] overflow-y-auto"
			onSubmit={handleSubmit(handleUpdate)}
		>
			<div className="grid gap-2">
				<Label htmlFor="name">Class name</Label>
				<Input
					id="name"
					placeholder="Class name"
					maxLength={70}
					{...register("name", {
						required: !isUpdateMode && "Class name is required",
					})}
				/>
				{errors.name && (
					<Label className="text-destructive mt-1 text-xs" htmlFor="name">
						{errors.name.message}
					</Label>
				)}
			</div>
			<div className="grid gap-2 mb-1">
				<Label htmlFor="sections">Sections</Label>

				{/* Pre added sections for updation only */}
				{Boolean(isUpdateMode) ? (
					<div className="w-full flex flex-col gap-2">
						{primarySections.map((section, index) => (
							<span
								key={section._id}
								id="individual-section"
								className="flex justify-between overflow-x-hidden"
							>
								<Input
									id={`section-${index}`}
									placeholder={`Section ${index + 1}`}
									maxLength={70}
									{...register(`sections.${index}.name`, {
										required: "Section name is required",
									})}
								/>
								<SectionDeleteButton
									onDelete={async () => {
										await handleSectionDeletion(
											section._id
										);
										const updatedPrimarySections = [
											...primarySections,
										];
										setPrimarySections(
											updatedPrimarySections.filter(
												(s) => s._id !== section._id
											)
										);
									}}
								/>
							</span>
						))}
					</div>
				) : null}

				{/* New sectionst to be added */}
				{newSections.length > 0 && (
					<div className="w-full flex flex-col gap-2">
						{newSections.map((section, index) => (
							<span
								className="flex justify-between overflow-x-hidden"
								key={index + 32}
							>
								<Input
									placeholder={`New Section ${index + 1}`}
									maxLength={70}
									value={section.name}
									onChange={(
										e: React.ChangeEvent<HTMLInputElement>
									) => {
										const updatedNewSections = [
											...newSections,
										];
										updatedNewSections[index].name =
											e.target.value;
										setNewSections(updatedNewSections);
									}}
								/>
								<span
									className="cursor-pointer pl-2 grid place-content-center"
									onClick={() => {
										const updatedNewSections = [
											...newSections,
										];
										updatedNewSections.splice(index, 1);
										setNewSections(updatedNewSections);
									}}
								>
									<X strokeWidth={1.5} />
								</span>
							</span>
						))}
					</div>
				)}
				<Button
					type="button"
					className="cursor-pointer"
					onClick={() =>
						setNewSections((prevSections) => [
							...prevSections,
							{ name: "" },
						])
					}
					variant="outline"
				>
					{isUpdateMode ? "Add new section" : "Add section"} <Plus />
				</Button>
			</div>
			<Button
				type="submit"
				className="cursor-pointer"
				disabled={
					isUpdatingClass ||
					isUpdatingSection ||
					isCreatingSection ||
					(newSections.length === 0 && !hasChanges()) ||
					(newSections.length > 0 &&
						newSections.filter(
							(section) => section.name.trim() !== ""
						).length == 0 &&
						!hasChanges())
				}
			>
				{isUpdateMode ? "Save changes" : "Add class"}
				{(isUpdatingClass ||
					isUpdatingSection ||
					isCreatingSection ||
					isCreatingClass) && <SpinnerLoader />}
			</Button>
		</form>
	);
}


export default function ClassDialogForm({ isUpdateMode, data }: { isUpdateMode: boolean; data?: ClassType }) {
	const {
		register,
		handleSubmit,
		getValues,
		formState: { errors },
	} = useForm<ClassType>({
		defaultValues: {
			name: isUpdateMode ? data?.name : "",
			sections: isUpdateMode ? data?.sections : [{ name: "" }],
		},
	});

	const dispatch = useDispatch();
	const [deleteSection] = useDeleteSectionMutation();
	const [hasChangesState, setHasChangesState] = useState(false);
	const [createSectionMutation, { isLoading: isCreatingSection }] = useCreateSectionMutation();
	const [createClassMutation, { isLoading: isCreatingClass }] = useCreateClassMutation();
	const [newSections, setNewSections] = useState<Array<{ name: string }>>([]);
	const [primarySections, setPrimarySections] = useState<Array<{ name: string; _id: string }>>(
		isUpdateMode && data ? data.sections : []
	);
	const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
	const [updateSections, { isLoading: isUpdatingSection }] = useUpdateSectionsMutation();

	type changeDataType = { name?: string; sections?: any };
	let changedData: changeDataType = { name: "", sections: [] };

	useEffect(() => {
		if (isUpdateMode && data) {
			setPrimarySections(data.sections);
		}
	}, [data, isUpdateMode]);

	// Function to check if form data has changed
	const hasChanges = () => {
		if (!isUpdateMode) return true; // Always allow submission in create mode

		const formData = getValues();
		if (!data) return false;

		// Check if class name changed
		if (formData.name.trim() !== data.name.trim()) return true;

		// Check if existing sections changed
		const existingSectionsChanged = formData.sections.some(
			(section, index) => section.name.trim() !== (data.sections[index]?.name.trim() || "")
		);

		// Check if sections length differs or new sections exist
		const sectionsLengthChanged = formData.sections.length !== data.sections.length || newSections.length > 0;

		return existingSectionsChanged || sectionsLengthChanged;
	};

	// Update hasChangesState when newSections changes
	useEffect(() => {
		setHasChangesState(hasChanges());
	}, [newSections]);

	// Handler to check changes on input blur
	const handleInputChange = () => {
		setHasChangesState(hasChanges());
	};

	const handleSectionDeletion = async (sectionId: string) => {
		if (!sectionId) return;

		try {
			const res = await deleteSection(sectionId).unwrap();
			if (res && res.success) {
				toast.success(res.message);
				const updatedPrimarySections = primarySections.filter((s) => s._id !== sectionId);
				setPrimarySections(updatedPrimarySections);
				setHasChangesState(hasChanges()); // Re-check changes after deletion
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Failed to delete section",
				description: "Please try again",
			});
		}
	};

	const handleUpdate = async () => {
		if (isUpdateMode && data) {
			const updatedData = getValues();
			const originalData: ClassType = data;

			Object.keys(updatedData).forEach((key) => {
				if (key === "sections") {
					let updatedSections = updatedData[key];
					let originalSections = originalData[key];

					if (updatedSections.length !== originalSections.length) {
						changedData[key] = updatedSections;
					} else {
						const updatedSectionNames = updatedSections.map((section: any) => section.name.trim());
						const originalSectionNames = originalSections.map((section) => section.name.trim());

						updatedSectionNames.forEach((name: string, index: number) => {
							if (name !== originalSectionNames[index]) {
								changedData.sections[index] = updatedSections[index];
							}
						});
					}
				} else {
					//@ts-ignore
					if (updatedData[key] !== originalData[key]) {
						//@ts-ignore
						changedData[key as keyof changeDataType] = updatedData[key];
					}
				}
			});

			// Updating class name
			if (changedData.name?.trim() !== "" && changedData.name !== undefined) {
				try {
					const res = await updateClass({
						id: data._id,
						name: changedData.name.trim(),
					}).unwrap();
					if (res && res.success) {
						toast.success("Class name updated successfully");
					}
				} catch (error: any) {
					mutationToastError({
						error,
						message: "Class name Updation failed",
						description: error?.data?.message,
					});
				}
			}

			// Updating sections
			if (changedData.sections && changedData.sections.length > 0) {
				const updatedSections = changedData.sections.map((section: any, index: number) => ({
					...data.sections[index],
					...section,
					name: section.name.trim(),
				}));

				try {
					const res = await updateSections(updatedSections).unwrap();
					if (res && res.success) {
						toast.success("Sections updated successfully");
					}
				} catch (error: any) {
					mutationToastError({
						error,
						message: "Section Updation failed",
						description: error?.data?.message,
					});
				}
			}

			// Creating new sections
			const filteredSections = newSections.filter((section) => section.name.trim() !== "");
			if (filteredSections.length > 0) {
				for (const section of filteredSections) {
					try {
						const res = await createSectionMutation({
							name: section.name.trim(),
							classId: data._id,
						}).unwrap();

						if (res && res.success) {
							toast.success(`${section.name} section created successfully`);
						}
					} catch (error: any) {
						mutationToastError({
							error,
							message: "Section Creation failed",
							description: error?.data?.message,
						});
					}
				}
			}
		} else {
			const dataToCreate = {
				name: getValues().name.trim(),
				sections: newSections.filter((section) => section.name.trim() !== ""),
			};

			try {
				if (dataToCreate.name !== "") {
					const classResponse = (await createClassMutation(dataToCreate).unwrap()) as any;

					if (classResponse && classResponse.success) {
						toast.success("Class added successfully");
						if (dataToCreate.sections.length > 0) {
							const classId = classResponse.data._id as string;
							try {
								for (const section of dataToCreate.sections) {
									const sectionResponse = await createSectionMutation({
										name: section.name.trim(),
										classId: classId,
									}).unwrap();

									if (sectionResponse && sectionResponse.success) {
										toast.success(`${section.name} section created successfully`);
									}

									dispatch(
										addClass({
											_id: classId,
											name: classResponse.data.name,
											sections: classResponse.data.sections,
										})
									);
								}
							} catch (error: any) {
								mutationToastError({
									error,
									message: "Section Creation failed",
									description: error?.data?.message,
								});
							}
						}
					}
				}
			} catch (error: any) {
				mutationToastError({
					error,
					message: "Class Creation failed",
					description: error?.data?.message,
				});
			}
		}

		dispatch(closeDialoge(stateDialogeBoxes.classDialogBoxOpen));
	};

	return (
		<form
			className="grid items-start gap-4 max-h-[42rem] overflow-y-auto"
			onSubmit={handleSubmit(handleUpdate)}
		>
			<div className="grid gap-2">
				<Label htmlFor="name">Class name</Label>
				<Input
					id="name"
					placeholder="Class name"
					maxLength={70}
					{...register("name", {
						required: !isUpdateMode && "Class name is required",
					})}
					onBlur={handleInputChange}
				/>
				{errors.name && (
					<Label className="text-destructive mt-1 text-xs" htmlFor="name">
						{errors.name.message}
					</Label>
				)}
			</div>
			<div className="grid gap-2 mb-1">
				<Label htmlFor="sections">Sections</Label>

				{/* Pre-added sections for update mode */}
				{isUpdateMode && (
					<div className="w-full flex flex-col gap-2">
						{primarySections.map((section, index) => (
							<span
								key={section._id}
								id="individual-section"
								className="flex justify-between overflow-x-hidden"
							>
								<Input
									id={`section-${index}`}
									placeholder={`Section ${index + 1}`}
									maxLength={70}
									{...register(`sections.${index}.name`, {
										required: "Section name is required",
									})}
									onBlur={handleInputChange}
								/>
								<SectionDeleteButton
									onDelete={async () => {
										await handleSectionDeletion(section._id);
									}}
								/>
							</span>
						))}
					</div>
				)}

				{/* New sections to be added */}
				{newSections.length > 0 && (
					<div className="w-full flex flex-col gap-2">
						{newSections.map((section, index) => (
							<span className="flex justify-between overflow-x-hidden" key={index + 32}>
								<Input
									placeholder={`New Section ${index + 1}`}
									maxLength={70}
									value={section.name}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const updatedNewSections = [...newSections];
										updatedNewSections[index].name = e.target.value;
										setNewSections(updatedNewSections);
									}}
									onBlur={handleInputChange}
								/>
								<span
									className="cursor-pointer pl-2 grid place-content-center"
									onClick={() => {
										const updatedNewSections = [...newSections];
										updatedNewSections.splice(index, 1);
										setNewSections(updatedNewSections);
									}}
								>
									<X strokeWidth={1.5} />
								</span>
							</span>
						))}
					</div>
				)}
				<Button
					type="button"
					className="cursor-pointer"
					onClick={() => setNewSections((prevSections) => [...prevSections, { name: "" }])}
					variant="outline"
				>
					{isUpdateMode ? "Add new section" : "Add section"} <Plus />
				</Button>
			</div>
			<Button
				type="submit"
				className="cursor-pointer"
				disabled={
					isUpdatingClass ||
					isUpdatingSection ||
					isCreatingSection ||
					(!isUpdateMode && !getValues().name.trim() && newSections.length === 0) ||
					(isUpdateMode && !hasChangesState)
				}
			>
				{isUpdateMode ? "Save changes" : "Add class"}
				{(isUpdatingClass || isUpdatingSection || isCreatingSection || isCreatingClass) && (
					<SpinnerLoader />
				)}
			</Button>
		</form>
	);
}