import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { closeDialoge, setTimetableFormData, stateDialogeBoxes } from "../store/uiSlice";
import { RootState } from "../store/store";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetClassesQuery } from "../services/academics.api";
import { useGetTeachersQuery } from "../services/users.api";
import { SpinnerLoader } from "./Loaders";
import moment from "moment";
import { Button } from "@/components/ui/button";
import {
	TimeTableCreateData,
	TimeTableUpdateData,
	useCreateTimetableMutation,
	useUpdateTimetableEventMutation,
} from "../services/timetables.api";
import { mutationToastError } from "../utils/helpers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { generateTimeOptions } from "../lib/utils";
import { warningToastOptions } from "./ui/sonner";

// Zod schema (unchanged)
const formSchema = z
	.object({
		subject: z.string().min(1, "Subject is required"),
		teacher: z.string().min(1, "Teacher ID is required"),
		section: z.string().min(1, "Section ID is required"),
		start: z
			.string()
			.min(1, "Start time is required")
			.regex(/^\d{1,2}:\d{2}\s(?:AM|PM)$/, "Invalid time format"),
		end: z
			.string()
			.min(1, "End time is required")
			.regex(/^\d{1,2}:\d{2}\s(?:AM|PM)$/, "Invalid time format"),
		day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
	})
	.refine((data) => data.start.length > 0 && data.end.length > 0, {
		message: "Both start and end times are required",
		path: ["end"],
	})
	// Ensure end > start by parsing with moment:
	.refine(
		(data) => {
			const mStart = moment(data.start, "hh:mm A");
			const mEnd = moment(data.end, "hh:mm A");
			return mEnd.isAfter(mStart);
		},
		{
			message: "End time must be after start time",
			path: ["end"],
		}
	);

const findSectionId = (arr, dataToUpdate) => {
	return arr?.data
		?.map((item) => item.sections)
		.find((sec) => sec.find((s) => s.name === dataToUpdate.section))?.[0]._id ?? ""
}

const TimetableForm = () => {
	const { data: sections, isLoading: isLoadingSections } = useGetClassesQuery();
	const { data: teachers, isLoading: isLoadingTeachers } = useGetTeachersQuery({ limit: 50 });
	const [createTimetable, { isLoading: isAdding }] = useCreateTimetableMutation();
	const [updateTimetable, { isLoading: isUpdating }] = useUpdateTimetableEventMutation();
	const dataToUpdate = useSelector((state: RootState) => state.ui.timetableFormData);
	const dispatch = useDispatch();
	
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			subject: dataToUpdate == null ? "" : dataToUpdate.subject,
			teacher:
				dataToUpdate == null
					? ""
					: teachers?.data.teachers.find((t) => t.fullName === dataToUpdate.teacher)?._id ?? "",
			section:
				dataToUpdate == null
					? ""
					: findSectionId(sections, dataToUpdate),
			start: dataToUpdate == null ? "" : dataToUpdate.timeslot.start,
			end: dataToUpdate == null ? "" : dataToUpdate.timeslot.end,
			day:
				dataToUpdate == null
					? "Monday"
					: (dataToUpdate.day as
							| "Monday"
							| "Tuesday"
							| "Wednesday"
							| "Thursday"
							| "Friday"
							| "Saturday"
							| "Sunday"),
		},
	});

	const { control, handleSubmit, setValue } = form;
	
	// 3c) Watch `start` and clear `end` whenever the user actually changes "start"
	const watchedStart = useWatch({ control, name: "start" });
	const firstWatch = useRef(true);
	useEffect(() => {
		if (firstWatch.current) {
			firstWatch.current = false;
			return;
		}
		if (watchedStart) {
			setValue("end", "");
		}
	}, [watchedStart, setValue]);

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		const formattedData = {
			subject: data.subject.trim(),
			teacherId: data.teacher,
			sectionId: data.section,
			startTime: data.start,
			endTime: data.end,
			day: data.day,
		};

		if (dataToUpdate) {
			const updatedFields: Partial<TimeTableCreateData> = {};

			// Compare each field and include only the ones that have changed
			if (formattedData.subject !== dataToUpdate.subject) {
				updatedFields.subject = formattedData.subject;
			}
			if (formattedData.teacherId !== teachers?.data.teachers.find((t) => t.fullName === dataToUpdate.teacher)?._id) {
				updatedFields.teacherId = formattedData.teacherId;
			}
			if (formattedData.sectionId !== findSectionId(sections, dataToUpdate)) {
				updatedFields.sectionId = formattedData.sectionId;
			}
			if (formattedData.startTime !== dataToUpdate.timeslot.start) {
				updatedFields.startTime = formattedData.startTime;
			}
			if (formattedData.endTime !== dataToUpdate.timeslot.end) {
				updatedFields.endTime = formattedData.endTime;
			}
			if (formattedData.day !== dataToUpdate.day) {
				updatedFields.day = formattedData.day;
			}

			// Only proceed with the update if there are changed fields
			if (Object.keys(updatedFields).length > 0) {
				try {
					// console.log(updatedFields);
					// return;
					const res = await updateTimetable({
						_id: dataToUpdate._id,
						data: updatedFields,
					}).unwrap();
					if (res?.success) {
						toast.success(res.message);
						dispatch(closeDialoge(stateDialogeBoxes.timetableUpdateDialoge));
						dispatch(setTimetableFormData(null));
					}
				} catch (error: any) {
					mutationToastError({
						error,
						message: "Please try again",
						description: error?.data?.message,
					})
				}
			} else {
				// No changes detected
				toast.warning("No changes to update.", warningToastOptions);
				dispatch(closeDialoge(stateDialogeBoxes.timetableUpdateDialoge));
			}
		} else {
			try {
				const res = await createTimetable(formattedData).unwrap();
				if (res?.success) {
					toast.success(res.message);
					dispatch(closeDialoge(stateDialogeBoxes.timetableAddDialoge));
				}
			} catch (error: any) {
				mutationToastError({
					error,
					message: "Please try again",
					description: error?.data?.message,
				})
			}
		}
	};

	if (isLoadingSections || isLoadingTeachers || !sections || !teachers) {
		return (
			<div className="flex w-full items-center justify-center p-4 md:p-10">
				<div className="flex flex-col justify-center gap-4">
					<p>We are seting up things for you so please be patient...</p>
					<SpinnerLoader />
				</div>
			</div>
		);
	}

	return (
		<section>
			<Form {...form}>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					<FormField
						control={control}
						name="subject"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Subject</FormLabel>
								<FormControl>
									<Input placeholder="Enter subject" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="section"
						render={({ field }) => (
							<FormItem className="*:w-full">
								<FormLabel>Section</FormLabel>
								<FormControl>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										className="*:w-full"
									>
										<SelectTrigger>
											<SelectValue placeholder="Select section" />
										</SelectTrigger>
										<SelectContent>
											{sections?.data
												?.filter((s) => s.sections.length > 0)
												.map(
													(item) =>
														item.sections?.map((section) => (
															<SelectItem key={section._id} value={section._id}>
																{section.name}
															</SelectItem>
														)) || []
												) || []}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="teacher"
						render={({ field }) => (
							<FormItem className="*:w-full">
								<FormLabel>Teacher</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select teacher" />
										</SelectTrigger>
										<SelectContent>
											{teachers?.data.teachers.map((teacher) => (
												<SelectItem key={teacher._id} value={teacher._id}>
													{teacher.fullName}
												</SelectItem>
											)) || []}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex gap-4 w-full *:w-full">
						<FormField
							control={control}
							name="start"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Start Time</FormLabel>
									<FormControl>
										<Select
											onValueChange={(val: string) => field.onChange(val)}
											value={field.value}
										>
											<SelectTrigger className="font-normal focus:ring-0 w-[120px] focus:ring-offset-0">
												<SelectValue placeholder="Select time" />
											</SelectTrigger>
											<SelectContent>
												<ScrollArea className="h-[15rem]">
													{generateTimeOptions().map((option) => (
														<SelectItem
															key={option.display}
															value={option.display}
														>
															{option.display}
														</SelectItem>
													))}
												</ScrollArea>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="end"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>End Time</FormLabel>
									<FormControl>
										<Select
											onValueChange={(val: string) => field.onChange(val)}
											value={field.value}
										>
											<SelectTrigger className="font-normal focus:ring-0 w-[120px] focus:ring-offset-0">
												<SelectValue placeholder="Select time" />
											</SelectTrigger>
											<SelectContent>
												<ScrollArea className="h-[15rem]">
													{generateTimeOptions().map((option) => (
														<SelectItem
															key={option.display}
															value={option.display}
														>
															{option.display}
														</SelectItem>
													))}
												</ScrollArea>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={control}
						name="day"
						render={({ field }) => (
							<FormItem className="*:w-full">
								<FormLabel>Day</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select day" />
										</SelectTrigger>
										<SelectContent>
											{[
												"Monday",
												"Tuesday",
												"Wednesday",
												"Thursday",
												"Friday",
												"Saturday",
												"Sunday",
											].map((day) => (
												<SelectItem key={day} value={day}>
													{day}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="cursor-pointer w-full"
						disabled={isAdding || isUpdating || isLoadingTeachers || isLoadingSections}
					>
						{dataToUpdate ? "Update" : "Save"}
						{(isAdding || isUpdating) && <SpinnerLoader />}
					</Button>
				</form>
			</Form>
		</section>
	);
};

const TimetableFormDialoge = () => {
	const dispatch = useDispatch();
	const forAdd = useSelector((state: RootState) => state.ui.dialogeBoxes.timetableAddDialoge);
	const forUpdate = useSelector((state: RootState) => state.ui.dialogeBoxes.timetableUpdateDialoge);

	const dataToUpdate = useSelector((state: RootState) => state.ui.timetableFormData);

	const onCloseClick = () => {
		if (forAdd) {
			dispatch(closeDialoge(stateDialogeBoxes.timetableAddDialoge));
		} else if (forUpdate) {
			dispatch(closeDialoge(stateDialogeBoxes.timetableUpdateDialoge));
			dispatch(setTimetableFormData(null));
		}
	};
	return (
		<Dialog open={forAdd || forUpdate} onOpenChange={onCloseClick}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{dataToUpdate == null ? "Add Timetable" : "Update Timetable"}</DialogTitle>
					<DialogDescription>
						{dataToUpdate == null
							? "Add a new timetable"
							: `Update timetable for ${dataToUpdate.day}`}
					</DialogDescription>
				</DialogHeader>
				<TimetableForm />
			</DialogContent>
		</Dialog>
	);
};

export default TimetableFormDialoge;
