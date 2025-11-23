import { Badge } from "@/components/ui/badge";
import type { Project } from "@shared/schema";

interface StatusBadgeProps {
  status: Project["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    active: { variant: "default" as const, label: "Activo", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800" },
    reserved: { variant: "default" as const, label: "Reservado", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800" },
    completed: { variant: "secondary" as const, label: "Completado", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800" },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={`${config.className} rounded-full`} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}
