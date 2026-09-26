import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { AssistantDrawer } from "@/components/assistant/AssistantDrawer";
import { useAssistant } from "@/contexts/AssistantContext";
import { useLang } from "@/contexts/LangContext";
import { BuildingType } from "@/services/fireCodeApi";

/**
 * Dashboard floating launcher + assistant drawer (FCR-113).
 *
 * The FAB is portaled to <body> (createPortal) so its `position: fixed` resolves
 * against the viewport, not the `.page-enter` transformed page wrapper (that was
 * the "FAB in the page corner, not the screen corner" bug). The panel is the
 * shared AssistantDrawer (also portaled), which fixes the mobile scroll bug.
 */
export function GlobalAssistant() {
  const { open, setOpen, messages, setMessages, input, pageContext } = useAssistant();
  const { tr } = useLang();

  const fab =
    !open && typeof document !== "undefined"
      ? createPortal(
          <button
            onClick={() => setOpen(true)}
            aria-label={tr.assistant}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden text-sm font-semibold sm:inline">{tr.assistant}</span>
          </button>,
          document.body,
        )
      : null;

  return (
    <>
      {fab}
      <AssistantDrawer open={open} onOpenChange={setOpen} title={tr.assistant}>
        <ChatPanel
          buildingType={input.buildingType ?? BuildingType.comercial}
          usage={input.usage ?? ""}
          areaM2={input.areaM2}
          floors={input.floors}
          occupants={input.occupants}
          ceilingHeight={input.ceilingHeight}
          volume={input.volume}
          onClose={() => setOpen(false)}
          messages={messages}
          setMessages={setMessages}
          pageContext={pageContext}
        />
      </AssistantDrawer>
    </>
  );
}
