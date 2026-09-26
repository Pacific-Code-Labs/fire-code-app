import { Drawer as Vaul } from "vaul";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Right-anchored, full-height assistant drawer (FCR-113). Portaled to <body> by
 * vaul, so it escapes any `transform`ed ancestor (e.g. the `.page-enter` page
 * wrapper) that would otherwise capture a `position: fixed` child and break the
 * scroll viewport. Full-width on mobile, 420px on ≥sm. The child (ChatPanel) is a
 * `h-full flex-col` with the messages scrolling and the input pinned at the
 * footer — shared by the dashboard GlobalAssistant and the public demo on mobile.
 */
export function AssistantDrawer({ open, onOpenChange, title, children }: Props) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} direction="right" shouldScaleBackground={false}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Vaul.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-background shadow-2xl outline-none sm:w-[420px]"
        >
          <Vaul.Title className="sr-only">{title}</Vaul.Title>
          {children}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
