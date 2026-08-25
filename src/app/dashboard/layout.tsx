// Dashboard layout — no global Navbar here.
// The dashboard has its own sidebar and top bar built in.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
