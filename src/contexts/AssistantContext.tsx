import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { type Msg } from "@/components/ChatPanel";
import { BuildingType } from "@/services/fireCodeApi";

export interface AssistantInput {
  buildingType?: BuildingType;
  usage?: string;
  areaM2?: number;
  floors?: number;
  occupants?: number;
  ceilingHeight?: number;
  volume?: number;
}

export interface PageContext {
  page: "dashboard" | "projects" | "project_detail" | "evaluation" | "other";
  payload?: Record<string, unknown>;
}

interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  messages: Msg[];
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>;
  input: AssistantInput;
  setInput: (i: AssistantInput) => void;
  pageContext: PageContext;
  setPageContext: (c: PageContext) => void;
}

const AssistantCtx = createContext<Ctx | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState<AssistantInput>({});
  const [pageContext, setPageContext] = useState<PageContext>({ page: "other" });

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <AssistantCtx.Provider
      value={{ open, setOpen, toggle, messages, setMessages, input, setInput, pageContext, setPageContext }}
    >
      {children}
    </AssistantCtx.Provider>
  );
}

export function useAssistant() {
  const c = useContext(AssistantCtx);
  if (!c) throw new Error("useAssistant outside provider");
  return c;
}
