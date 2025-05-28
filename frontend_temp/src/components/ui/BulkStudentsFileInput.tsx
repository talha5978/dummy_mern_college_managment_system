import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadList,
	FileUploadTrigger,
} from "@/components/ui/file-upload";
import { useAddStudentsInBulkMutation } from "../../services/users.api";
import { mutationToastError } from "../../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../Loaders";

const XLSX_FILE_FORMAT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Updated schema for a single file
const formSchema = z.object({
	file: z
		.custom<File | null>((val) => val instanceof File || val == null, "Please select a file")
		.refine((file) => file != null, "A file is required")
		.refine((file) => file.size <= 10 * 1024 * 1024, {
			message: "File size must be less than 10MB",
			path: ["file"],
		})
		.refine((file) => file.type === XLSX_FILE_FORMAT, {
			message: "Only Excel file (.xlsx) are allowed",
			path: ["file"],
		}),
});

type FormValues = z.infer<typeof formSchema>;

export function FileUploadInputForm() {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			file: undefined,
		},
	});

	const [addStudentsInBulk, { isLoading: isAdding }] = useAddStudentsInBulkMutation();

	const onSubmit = async (data: FormValues) => {
		console.log("Submitted data:", data.file);

		const formData = new FormData();
		formData.append("studentsData", data.file);

		try {
			const res = await addStudentsInBulk(formData).unwrap();
			if (res?.success) {
				toast.success(res.message);
			}
		} catch (error: any) {
			mutationToastError({
				error,
				message: "Failed to upload data file",
				description: "Please try again!",
			});
		}
	};

	const handleDownload = () => {
		window.open('/api/user/bulk/sample', "_blank");
	};

	return (
		<Form {...form}>
			{/* @ts-ignore */}
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col">
				<FormField
					control={form.control}
					name="file"
					render={({ field } : any) => (
						<FormItem>
							<div className="flex justify-between">
								<FormLabel>Data File</FormLabel>
								<Button variant="link" className="text-xs p-0" onClick={handleDownload}>
									Get Sample File
								</Button>
							</div>
							<FormControl>
								<FileUpload
									value={field.value ? [field.value] : []} // Convert single file to array for FileUpload
									onValueChange={(file : File[]) => {
										field.onChange(file.length > 0 ? file[0] : null);
									}}
									accept={XLSX_FILE_FORMAT}
									maxFiles={1}
									maxSize={10 * 1024 * 1024}
									onFileReject={(_ : any, message : string) => {
										form.setError("file", { message });
									}}
									multiple={false} // Enforce single file upload
									className="cursor-pointer"
								>
									<FileUploadDropzone className="flex-row border-dotted">
										<CloudUpload className="size-4" />
										<FileUploadTrigger asChild>
											<p>Drag and drop or choose a file to upload</p>
										</FileUploadTrigger>
									</FileUploadDropzone>
									<FileUploadList>
										{field.value && (
											<FileUploadItem value={field.value}>
												<FileUploadItemPreview />
												<FileUploadItemMetadata />
												<FileUploadItemDelete asChild>
													<Button variant="ghost" size="icon" className="size-7">
														<X />
														<span className="sr-only">Delete</span>
													</Button>
												</FileUploadItemDelete>
											</FileUploadItem>
										)}
									</FileUploadList>
								</FileUpload>
							</FormControl>
							<FormDescription>Upload only 1 file with max. 10MB size.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="mt-4 self-end" disabled={isAdding}>
					Submit
					{isAdding && <SpinnerLoader />}
				</Button>
			</form>
		</Form>
	);
}
