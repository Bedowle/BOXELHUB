import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { STLViewer } from "./STLViewer";
import { Calendar, MessageSquare, Box, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project & { bidCount?: number };
  onClick?: () => void;
  showBidCount?: boolean;
  unreadBidCount?: number;
}

export const ProjectCard = memo(function ProjectCard({ project, onClick, showBidCount = true, unreadBidCount = 0 }: ProjectCardProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleClick = useCallback(() => onClick?.(), [onClick]);
  
  const handleDownloadSTL = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      console.log("[Card] Starting download for project:", project.id);
      
      const response = await fetch(`/api/projects/${project.id}/download-stl`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to download STL");
      }
      const data = await response.json();
      console.log("[Card] File info:", data);
      
      // Get actual STL content
      const stlResponse = await fetch(`/api/projects/${project.id}/stl-content`, {
        credentials: "include",
      });
      if (!stlResponse.ok) {
        throw new Error("Failed to get STL content");
      }
      
      const blob = await stlResponse.blob();
      console.log("[Card] Blob size:", blob.size);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName || `proyecto_${project.id}.stl`;
      console.log("[Card] Downloading as:", a.download);
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Descargado",
        description: `STL descargado: ${data.fileName}`,
      });
    } catch (error) {
      console.error("[Card] Download error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo descargar el STL",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [project.id, toast]);
  
  // Check if project can have STL downloaded (not deleted, not accepted)
  const canDownload = !project.deletedAt && project.status !== "completed";
  
  return (
    <Card 
      className="border-2 border-blue-300/50 bg-gradient-to-br from-blue-100 to-blue-50/50 dark:from-blue-900/40 dark:to-blue-950/20 hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 relative" 
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
      <CardFooter className="flex items-center justify-between pt-0 gap-2">
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
        <div className="flex gap-1.5">
          {canDownload && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2" 
              onClick={handleDownloadSTL}
              disabled={isDownloading}
              data-testid={`button-download-stl-card-${project.id}`}
              title="Descargar archivos STL"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8" onClick={handleClick} data-testid={`button-view-details-${project.id}`}>
            Ver detalles
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
