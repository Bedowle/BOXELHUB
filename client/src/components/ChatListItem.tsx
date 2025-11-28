import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChatListItemProps {
  userId: string;
  userName: string | undefined;
  userImage: string | undefined;
  lastMessage: string | undefined;
  lastMessageTime: string | undefined;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
  projectName?: string;
  designName?: string;
  projectImage?: string;
  designImage?: string;
  isProjectDeleted?: boolean;
  isDesignDeleted?: boolean;
  projectId?: string;
  designId?: string;
  projectStatus?: string;
}

export function ChatListItem({
  userId,
  userName = "Usuario",
  userImage,
  lastMessage = "Sin mensajes",
  lastMessageTime,
  unreadCount,
  isActive,
  onClick,
  projectName,
  designName,
  projectImage,
  designImage,
  isProjectDeleted = false,
  isDesignDeleted = false,
  projectId,
  designId,
  projectStatus,
}: ChatListItemProps) {
  const [, setLocation] = useLocation();
  const userInitial = userName?.[0].toUpperCase() || "U";
  const isUnread = unreadCount > 0;
  const contextName = projectName || designName;
  const contextImage = projectImage || designImage;
  const contextInitial = contextName?.[0]?.toUpperCase() || "C";
  const isDeleted = isProjectDeleted || isDesignDeleted;
  const isCompleted = projectStatus === "completed";
  const isDimmed = isDeleted || isCompleted;

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) {
      setLocation(`/user/${userId}`);
    }
  };

  const handleViewProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectId && !isProjectDeleted) {
      setLocation(`/project/${projectId}`);
    } else if (designId && !isDesignDeleted) {
      setLocation(`/marketplace-design/${designId}`);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 border-b cursor-pointer transition-colors ${
        isDimmed
          ? "opacity-50 bg-muted/30 hover:bg-muted/40"
          : isActive
          ? "bg-primary/10 border-primary/30"
          : "hover:bg-muted/50 border-border/50"
      }`}
      data-testid={`chat-list-item-${userId}`}
    >
      {/* Product/Project Avatar */}
      {contextName && (
        <Avatar className={`flex-shrink-0 h-8 w-8 ${isDimmed ? "opacity-60" : ""}`}>
          <AvatarImage src={contextImage} />
          <AvatarFallback className="text-xs bg-muted">
            {contextInitial}
          </AvatarFallback>
        </Avatar>
      )}

      {/* User Avatar */}
      <Avatar className={`flex-shrink-0 ${isUnread ? "ring-2 ring-primary" : ""}`}>
        <AvatarImage src={userImage} />
        <AvatarFallback>{userInitial}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <button
              onClick={handleViewProfile}
              className={`font-semibold truncate hover:text-primary hover-elevate cursor-pointer transition-colors block text-left ${isUnread ? "font-bold" : ""}`}
              data-testid="button-view-user-profile"
            >
              {userName}
            </button>
            {contextName && (
              <button
                onClick={handleViewProject}
                className={`text-xs font-medium hover-elevate transition-colors inline-block ${
                  isDimmed
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="button-view-project"
              >
                {contextName}
              </button>
            )}
          </div>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(lastMessageTime), "HH:mm", { locale: es })}
            </span>
          )}
        </div>
        <p className={`text-sm line-clamp-1 ${
          isDimmed 
            ? "text-muted-foreground italic"
            : isUnread
            ? "text-foreground font-medium"
            : "text-muted-foreground"
        }`}>
          {lastMessage || "Sin mensajes aún"}
        </p>
        {isDimmed && (
          <p className="text-xs text-muted-foreground/60 italic">
            {isCompleted ? "(Completado)" : "(Eliminado)"}
          </p>
        )}
      </div>

      {isUnread && (
        <Badge className="ml-2 flex-shrink-0 bg-primary">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
}
