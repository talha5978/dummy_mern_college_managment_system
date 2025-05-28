import { Separator } from "@/components/ui/separator";
import { ShieldX } from "lucide-react";
import { useRouteError } from "react-router-dom";

export default function ErrorPage(): React.ReactElement {
	const error: any = useRouteError();

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className="grid place-items-center gap-2 *:w-fit">
					<ShieldX width={28} height={28} className="text-destructive" />
					<p className="text-lg font-semibold">{error?.message || "Something went wrong"}</p>
                    {error && <Separator />}
					{error instanceof Error && (
						<p className="text-sm text-muted-foreground">
							{error.stack || "Please try again later"}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
