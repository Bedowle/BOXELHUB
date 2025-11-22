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
}

export function ChatDialog({ open, onOpenChange, otherUser, currentUserId }: ChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Conversación</DialogTitle>
              <DialogDescription>
                Comunícate directamente con {otherUser?.firstName ? `${otherUser.firstName}` : "el usuario"}
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
        />
      </DialogContent>
    </Dialog>
  );
}
