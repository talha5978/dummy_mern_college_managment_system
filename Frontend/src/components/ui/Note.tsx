import React from "react";
import { Lightbulb, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NoteProps {
	heading: string;
	text: string;
	className?: string;
}

// Map headings to icons
const getIconForHeading = (heading: string) => {
	switch (heading.toUpperCase().trim()) {
		case "TIP":
			return <Lightbulb className={`text-${getColor(heading)}`} width={17} height={17} />;
		case "WARNING":
			return <AlertTriangle className={`text-${getColor(heading)}`} width={17} height={17} />;
		case "INFO":
			return <Info className={`text-${getColor(heading)}`} width={17} height={17} />;
		case "SUCCESS":
			return <CheckCircle className={`text-${getColor(heading)}`} width={17} height={17} />;
		default:
			return <Info className={`text-${getColor(heading)}`} width={17} height={17} />;
	}
};

// Map headings to color
const getColor = (heading: string): string => {
	switch (heading.toUpperCase().trim()) {
		case "TIP":
			return "green-500";
		case "WARNING":
			return "red-500";
		case "INFO":
			return "blue-500";
		case "SUCCESS":
			return "green-500";
		default:
			return "gray-500";
	}
};

export const Note: React.FC<NoteProps> = ({ heading, text, className }) => {
	return (
		<Card
			className={`
        relative border-l-7 border-${getColor(heading) as string} rounded-md py-3 overflow-hidden
        ${className}
      `}
		>
			<CardContent className="sm:px-6 px-3">
				<div className="grid grid-cols-[auto_1fr] gap-2">
					{/* Icon */}
					<span>{getIconForHeading(heading)}</span>
					{/* Content */}
					<div>
						<h3 className={`text-sm font-semibold text-${getColor(heading) as string}`}>{heading}</h3>
						<p className="text-sm">{text}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
