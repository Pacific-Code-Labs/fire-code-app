interface Props { text: string; }

export function TextMessage({ text }: Props) {
  return <div className="whitespace-pre-wrap text-sm">{text}</div>;
}
