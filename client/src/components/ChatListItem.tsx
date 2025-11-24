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
}: ChatListItemProps) {
  const userInitial = userName?.[0].toUpperCase() || "U";
  const isUnread = unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 border-b cursor-pointer transition-colors ${
        isActive
          ? "bg-primary/10 border-primary/30"
          : "hover:bg-muted/50 border-border/50"
      }`}
      data-testid={`chat-list-item-${userId}`}
    >
      <Avatar className={isUnread ? "ring-2 ring-primary" : ""}>
        <AvatarImage src={userImage} />
        <AvatarFallback>{userInitial}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className={`font-semibold truncate ${isUnread ? "font-bold" : ""}`}>
            {userName}
          </p>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(lastMessageTime), "HH:mm", { locale: es })}
            </span>
          )}
        </div>
        <p className={`text-sm line-clamp-1 ${
          isUnread
            ? "text-foreground font-medium"
            : "text-muted-foreground"
        }`}>
          {lastMessage || "Sin mensajes aún"}
        </p>
      </div>

      {isUnread && (
        <Badge className="ml-2 flex-shrink-0 bg-primary">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
}
