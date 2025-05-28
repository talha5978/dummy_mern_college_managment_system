import { ChevronRight, type LucideIcon } from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, NavLink } from "react-router";

interface Items {
    title: string;
    url: string | "#";
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }
}

export function NavMain({ items }: { items: Items[] }) {
	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						asChild
						defaultOpen={item.isActive}
					> 
						<SidebarMenuItem>
								<SidebarMenuButton asChild tooltip={item.title} className="hover:bg-muted-dark dark:hover:bg-muted duration-100 ease-in-out">
									{/* i think We can apply prefetching here 🤔  */}
									<NavLink to={item.url} >
										<item.icon />
										<span>{item.title}</span>
									</NavLink>
								</SidebarMenuButton>
						
							{Array.isArray(item.items) && item.items?.length ? (
								<>
									<CollapsibleTrigger asChild>
										<SidebarMenuAction className="data-[state=open]:rotate-90">
											<ChevronRight />
											<span className="sr-only">
												Toggle
											</span>
										</SidebarMenuAction>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{Array.isArray(item.items) && item.items?.map((subItem) => (
												<SidebarMenuSubItem
													key={subItem.title}
												>
													<SidebarMenuSubButton
														asChild
													>
														<Link to={subItem.url} >
															{subItem.title}
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</>
							) : null}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
