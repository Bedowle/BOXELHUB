import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { STLViewer } from "./STLViewer";
import { Calendar, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project & { bidCount?: number };
  onClick?: () => void;
  showBidCount?: boolean;
}

export function ProjectCard({ project, onClick, showBidCount = true }: ProjectCardProps) {
  return (
    <Card 
      className="hover-elevate active-elevate-2 cursor-pointer transition-all duration-300" 
      onClick={onClick}
      data-testid={`card-project-${project.id}`}
    >
      <CardHeader className="space-y-0 pb-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold line-clamp-2" data-testid={`text-project-name-${project.id}`}>
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
      </CardHeader>
      <CardContent className="py-3 px-0">
        <div className="px-6 py-3">
          <STLViewer stlFileName={project.stlFileName} width={280} height={160} />
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
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: es })}
        </span>
        <Button size="sm" variant="ghost" className="h-8" onClick={onClick} data-testid={`button-view-details-${project.id}`}>
          Ver detalles
        </Button>
      </CardFooter>
    </Card>
  );
}
