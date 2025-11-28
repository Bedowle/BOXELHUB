import { ChatInterface } from "@/components/ChatInterface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@shared/schema";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUser: User;
  currentUserId: string;
  projectId?: string;
}

export function ChatDialog({ open, onOpenChange, otherUser, currentUserId, projectId }: ChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-background to-primary/5 dark:to-primary/10">
        <DialogHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-lg border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Conversación</DialogTitle>
              <DialogDescription>
                Comunícate con <span className="font-semibold text-foreground">{otherUser?.username || otherUser?.email || "el usuario"}</span>
              </DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
              data-testid="button-close-chat"
            >
              ✕
            </button>
          </div>
        </DialogHeader>
        <ChatInterface
          otherUserId={otherUser.id}
          otherUser={otherUser}
          currentUserId={currentUserId}
          projectId={projectId}
        />
      </DialogContent>
    </Dialog>
  );
}
