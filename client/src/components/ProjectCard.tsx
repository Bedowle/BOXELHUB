import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { STLViewer } from "./STLViewer";
import { Calendar, MessageSquare, Box } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useCallback } from "react";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project & { bidCount?: number };
  onClick?: () => void;
  showBidCount?: boolean;
  unreadBidCount?: number;
}

export const ProjectCard = memo(function ProjectCard({ project, onClick, showBidCount = true, unreadBidCount = 0 }: ProjectCardProps) {
  const handleClick = useCallback(() => onClick?.(), [onClick]);
  return (
    <Card 
      className="border-2 border-amber-300/50 bg-gradient-to-br from-amber-50/30 to-transparent dark:from-amber-950/20 dark:to-transparent hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 relative" 
      onClick={handleClick}
      data-testid={`card-project-${project.id}`}
    >
      {unreadBidCount > 0 && (
        <div className="absolute -top-2 -right-2 z-50 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-lg" data-testid={`badge-unread-${project.id}`}>
            {unreadBidCount > 9 ? '9+' : unreadBidCount}
          </div>
        </div>
      )}
      <CardHeader className="space-y-0 pb-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold line-clamp-2" data-testid={`text-project-name-${project.id}`}>
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
      </CardHeader>
      <CardContent className="py-3 px-0 flex items-center justify-center">
        <div>
          <STLViewer projectId={project.id} width={280} height={160} />
        </div>
      </CardContent>
      <CardContent className="space-y-3 pt-3">
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-project-description-${project.id}`}>
          {project.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
            {project.material}
          </span>
          {showBidCount && (
            <span className="flex items-center gap-1.5 text-muted-foreground" data-testid={`text-bid-count-${project.id}`}>
              <MessageSquare className="h-4 w-4" />
              {project.bidCount || 0} ofertas
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Box className="h-3.5 w-3.5" />
            {project.stlFileNames?.length || 1} STL
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
        <Button size="sm" variant="ghost" className="h-8" onClick={handleClick} data-testid={`button-view-details-${project.id}`}>
          Ver detalles
        </Button>
      </CardFooter>
    </Card>
  );
});
