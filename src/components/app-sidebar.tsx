import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, Route as RouteIcon, Boxes, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  match?: string;
};

const items: NavItem[] = [
  { title: "Dispatch Cockpit", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Manual Indents", url: "/indents", icon: ClipboardList },
  { title: "Lane Analysis", url: "/lanes/HRD-DEL-SURF", icon: RouteIcon, match: "/lanes" },
  { title: "Stock Analyser", url: "/stock", icon: Boxes },
  { title: "Admin Console", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.url;
    if (item.match) return pathname.startsWith(item.match);
    return pathname === item.url || pathname.startsWith(item.url + "/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold shrink-0">
            I
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-sidebar-foreground truncate">IDIE</div>
              <div className="text-3xs uppercase tracking-wider text-sidebar-foreground/60 truncate">
                Dispatch Engine
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Planning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-3xs text-sidebar-foreground/60">
          {!collapsed ? "v1.0 · MVP prototype" : "v1"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
