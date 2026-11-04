import { DashboardAccess } from "@/components/dashboard/dashboard-access";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAccess>{children}</DashboardAccess>;
}
