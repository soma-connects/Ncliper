"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-64 border-r bg-muted/20 flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {children}
    </aside>
  )
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-auto">{children}</div>
}

export function SidebarGroup({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-muted-foreground mb-4">{children}</div>
}

export function SidebarGroupContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1">{children}</ul>
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"
