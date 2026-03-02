"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Users,
  UserCog,
  Shield,
  HelpCircle,
  FileText,
  RotateCcw,
  LayoutDashboard,
  ExternalLink,
  Package,
  FolderTree,
  ShoppingBag,
  Tag,
  Trophy,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ADMIN_PATH } from "@/lib/constants";

const overviewItems = [{ href: ADMIN_PATH, label: "Dashboard", icon: LayoutDashboard }];

const contentItems = [
  { href: `${ADMIN_PATH}/products`, label: "Products", icon: ShoppingBag },
  { href: `${ADMIN_PATH}/categories`, label: "Categories", icon: FolderTree },
  { href: `${ADMIN_PATH}/teams`, label: "Teams", icon: Users },
  { href: `${ADMIN_PATH}/matches`, label: "Matches", icon: Trophy },
  { href: `${ADMIN_PATH}/faqs`, label: "FAQs", icon: HelpCircle },
  { href: `${ADMIN_PATH}/pages`, label: "Pages", icon: FileText },
];

const operationsItems = [
  { href: `${ADMIN_PATH}/orders`, label: "Orders", icon: Package },
  { href: `${ADMIN_PATH}/coupons`, label: "Coupons", icon: Tag },
  { href: `${ADMIN_PATH}/returns`, label: "Returns", icon: RotateCcw },
  { href: `${ADMIN_PATH}/users`, label: "Users", icon: Users },
  { href: `${ADMIN_PATH}/admins`, label: "Staff & Admins", icon: UserCog },
  { href: `${ADMIN_PATH}/roles`, label: "Roles & Permissions", icon: Shield },
  { href: `${ADMIN_PATH}/settings`, label: "Settings", icon: Settings },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="uppercase tracking-wider text-xs font-semibold text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.href === ADMIN_PATH ? pathname === ADMIN_PATH : pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          href={ADMIN_PATH}
          className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-90"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            T
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="font-bold text-sidebar-foreground truncate">Tawi Admin</p>
            <p className="text-xs text-muted-foreground truncate">Control panel</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-1 flex-col gap-2 p-2">
          <NavGroup label="Overview" items={overviewItems} pathname={pathname} />
          <SidebarSeparator className="my-2" />
          <NavGroup label="Content" items={contentItems} pathname={pathname} />
          <SidebarSeparator className="my-2" />
          <NavGroup label="Operations" items={operationsItems} pathname={pathname} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Back to site
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
