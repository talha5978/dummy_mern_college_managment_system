import { LoaderCircle } from "lucide-react";

type SpinnerLoaderProps = React.ComponentProps<"div"> & {
    className?: string;
	color?: string;
    width?: number;
    height?: number;
};

export const SpinnerLoader = ({ className, color, width=28, height=28 }: SpinnerLoaderProps) => {
	return (
		<div className={`flex flex-col items-center justify-center ${className}`}>
			<span className={`animate-spin animate-duration-1000 animate-iteration-count-infinite rounded-4xl`}>
				<LoaderCircle width={width} height={height} color={color}/>
			</span>
		</div>
	);
}