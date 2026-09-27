import { useEffect } from "react";
import { events } from "aws-amplify/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";

export const EVENTS_HTTP_URL = import.meta.env.VITE_EVENTS_HTTP_URL ?? "";

interface Hint {
  eventType?: string;
  data?: { ticketId?: string; subject?: string; status?: string };
}

/**
 * One socket per signed-in user (AppSync Events, events.sokol.jcampos.dev), subscribed to
 * the user's own channels: /support/{sub} (ticket updates) and /notifications/{sub} (support
 * replies). Hints carry ids only: each one refetches the support queries. AppSync doesn't
 * buffer, so every (re)connect refetches too; while disconnected the hooks poll every 60 s.
 */
export function useRealtimeEvents(userId?: string) {
  const client = useQueryClient();
  const { tr } = useLang();

  useEffect(() => {
    if (!userId || !EVENTS_HTTP_URL) return;
    let disposed = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closers: (() => void)[] = [];

    const refetchSupport = () => void client.invalidateQueries({ queryKey: ["support", userId] });
    const handlers: Record<string, (hint: Hint) => void> = {
      [`/support/${userId}`]: refetchSupport,
      [`/notifications/${userId}`]: (hint) => {
        refetchSupport();
        if (hint.eventType === "SUPPORT_REPLY") toast.info(tr.support_reply_toast);
      },
    };

    const disconnect = () => {
      closers.forEach((close) => close());
      closers = [];
    };
    const reconnect = () => {
      disconnect();
      if (!disposed) timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts++));
    };
    const connect = async () => {
      try {
        for (const [path, handle] of Object.entries(handlers)) {
          const channel = await events.connect(path);
          if (disposed) return channel.close();
          const sub = channel.subscribe({ next: (message: unknown) => handle((message ?? {}) as Hint), error: reconnect });
          closers.push(() => {
            sub.unsubscribe();
            channel.close();
          });
        }
        attempts = 0;
        refetchSupport();
      } catch {
        reconnect();
      }
    };
    void connect();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      disconnect();
    };
  }, [userId, client, tr]);
}
