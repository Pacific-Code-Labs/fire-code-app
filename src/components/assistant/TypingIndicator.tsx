import { useLang } from "@/contexts/LangContext";
import { AssistantAvatar } from "./AssistantAvatar";

/** Animated "the agent is thinking" bubble shown while a request is in flight. */
export function TypingIndicator() {
  const { tr } = useLang();
  return (
    <div className="flex items-end gap-2 duration-300 animate-in fade-in-50">
      <AssistantAvatar />
      <div className="rounded-2xl rounded-bl-sm border border-border bg-secondary/60 px-3.5 py-3">
        <span className="sr-only">{tr.typingLabel}</span>
        <span className="flex gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
        </span>
      </div>
    </div>
  );
}
