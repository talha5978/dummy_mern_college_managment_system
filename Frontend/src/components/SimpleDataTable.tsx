import { useState } from "react";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
	
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { DropdownMenuCheckboxItem } from "./ui/dropdown-menu";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	loadingState?: Boolean;
    NoOfSkeletonRows?: number;
	tableTitle?: string;
}

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>;
    disabled: boolean;
}

function DataTableViewOptions<TData>({ table, disabled }: DataTableViewOptionsProps<TData>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto h-8 flex cursor-pointer select-none dark:hover:bg-muted"
                    disabled={disabled}
				>
					<Settings2 />
					View
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[150px]">
				<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{table
					.getAllColumns()
					.filter(
						(column: any) =>
							typeof column.accessorFn !== "undefined" &&
							column.getCanHide()
					)
					.map((column: any) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="cursor-pointer"
								checked={column.getIsVisible()}
								onCheckedChange={(value) =>
									column.toggleVisibility(!!value)
								}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function DataTable<TData, TValue>({
	tableTitle,
	columns,
	data,
	loadingState,
    NoOfSkeletonRows = 8
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data: data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			
		},
	});

	return (
		<section className="rounded-md flex flex-col gap-4">
			<div className="flex justify-between gap-4 flex-wrap">
				<h2 className="text-2xl font-semibold">{tableTitle}</h2>
				<DataTableViewOptions
					table={table}
					disabled={Boolean(loadingState)}
				/>
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead
										key={header.id}
										className="bg-muted"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.header,
													header.getContext()
											  )}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{loadingState ? (
						Array.from(
							{ length: NoOfSkeletonRows },
							(_, i) => i + 1
						).map((i) => (
							<TableRow key={i}>
								{table.getHeaderGroups().map((headerGroup) =>
									headerGroup.headers.map((header) => {
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
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center select-none"
							>
								No results found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
				
			</Table>
		</section>
	);
}

export default DataTable;
