import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { LayoutDashboard, Users, Server, DollarSign, Database, ArrowLeft } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center justify-between w-full">
                  <span>Ncliper Admin</span>
                  <a href="/dashboard" className="text-[10px] text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    App
                  </a>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Overview</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin/users">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Users</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin/modal">
                        <Server className="mr-2 h-4 w-4" />
                        <span>Modal Engine</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin/costs">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span>API Costs</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin/storage">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Storage</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-auto p-6 text-foreground bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
