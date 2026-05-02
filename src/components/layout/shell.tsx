import { AppSidebar } from "@/components/layout/app-sidebar"

type ShellProps = {
  children: React.ReactNode
}

export const AppShell = ({ children }: ShellProps) => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
