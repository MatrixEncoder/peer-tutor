// Converts a session status string into a styled badge pill

interface Props {
  status: string;
}

const statusMap: Record<string, string> = {
  PENDING: "badge-pending",
  CONFIRMED: "badge-confirmed",
  COMPLETED: "badge-completed",
  CANCELLED: "badge-cancelled",
};

export default function StatusBadge({ status }: Props) {
  const className = statusMap[status] || "badge-pending";
  return <span className={className}>{status}</span>;
}
