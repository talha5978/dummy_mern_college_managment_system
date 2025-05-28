import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import { DispatchType } from "../store/store";

interface DataTableProps<T> {
	loadingState?: boolean;
	NoOfSkeletonRows?: number;
	tableTitle?: string;
	columns: ColumnDef<T>[];
	table: Table<T>;
	onRowClick?: (row: T) => void;
	pagination?: {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
		limit: number;
		onLimitChange?: (limit: number) => void;
		hasPrevPage: boolean;
		hasNextPage: boolean;
	};
	DataTableViewOptions: () => React.JSX.Element;
}

export interface DataTableViewOptionsProps<T> {
	table: Table<T>;
	disabled: boolean;
	dispatch: DispatchType;
}
function DataTable<T>({
	tableTitle,
	loadingState,
	NoOfSkeletonRows = 8,
	pagination,
	table,
	columns,
	DataTableViewOptions,
}: DataTableProps<T>) {
	if (!table) {
		return <div>Table not initialized. Please check the data source.</div>;
	}

	return (
		<section className="rounded-md flex flex-col gap-4">
			<div className="flex justify-between gap-4 flex-wrap">
				<h2 className="text-2xl font-semibold">{tableTitle || ""}</h2>
				{DataTableViewOptions && DataTableViewOptions()}
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="bg-muted">
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{loadingState ? (
						Array.from({ length: NoOfSkeletonRows }, (_, i) => i + 1).map((i) => (
							<TableRow key={i}>
								{table.getHeaderGroups().map((headerGroup:any) =>
									headerGroup.headers.map((header:any) => {
										return (
											<TableCell key={header.id}>
												<Skeleton className="h-[30px] w-full bg-muted-dark dark:bg-muted" />
											</TableCell>
										);
									})
								)}
							</TableRow>
						))
					) : table.getRowModel().rows?.length > 0 ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center select-none">
								No results found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<section className="w-full flex justify-between md:flex-row flex-col-reverse gap-4 mt-2">
				{/* Limit... */}
				<div className="flex gap-2 md:w-fit md:m-0 ml-auto">
					<Label htmlFor="rows-per-page" className="text-sm font-medium">
						Rows per page
					</Label>
					<Select
						value={String(pagination?.limit)}
						onValueChange={(value: string) =>
							pagination?.onLimitChange && pagination.onLimitChange(Number(value))
						}
					>
						<SelectTrigger className="w-20 cursor-pointer" id="rows-per-page">
							<SelectValue>{pagination?.limit}</SelectValue>
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={String(pageSize)} className="cursor-pointer">
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* Pagination */}
				<div className="flex items-center sm:gap-8 sm:flex-row flex-col gap-3">
					<div className="flex w-fit items-center justify-center text-sm font-medium">
						Page {pagination?.currentPage} of {pagination?.totalPages}
					</div>
					<div className="flex items-center gap-2 md:ml-0">
						<Button
							variant="outline"
							className="cursor-pointer size-8"
							size="icon"
							onClick={() => pagination?.onPageChange(1)}
							disabled={!pagination?.hasPrevPage}
						>
							<ChevronsLeftIcon />
						</Button>
						<Button
							variant="outline"
							className="cursor-pointer size-8"
							size="icon"
							onClick={() => pagination?.onPageChange(Math.max(1, pagination?.currentPage - 1))}
							disabled={!pagination?.hasPrevPage}
						>
							<ChevronLeftIcon />
						</Button>
						<Button
							variant="outline"
							className="cursor-pointer size-8"
							size="icon"
							onClick={() =>
								pagination?.onPageChange(
									Math.min(pagination?.totalPages, pagination?.currentPage + 1)
								)
							}
							disabled={!pagination?.hasNextPage}
						>
							<ChevronRightIcon />
						</Button>
						<Button
							variant="outline"
							className="cursor-pointer size-8"
							size="icon"
							onClick={() => pagination?.onPageChange(pagination?.totalPages)}
							disabled={!pagination?.hasNextPage}
						>
							<ChevronsRightIcon />
						</Button>
					</div>
				</div>
			</section>
		</section>
	);
}

export default DataTable;
