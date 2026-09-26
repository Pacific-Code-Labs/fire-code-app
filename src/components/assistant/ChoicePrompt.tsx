import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface ChoiceOption {
  label: string;
  value: string;
}

interface Props {
  prompt: string;
  options: ChoiceOption[];
  onChoose: (value: string) => void;
}

/**
 * FCR-100: a guided-demo quick-reply prompt (Sí / No style). Once the user
 * picks, the buttons lock so the chat history stays readable.
 */
export function ChoicePrompt({ prompt, options, onChoose }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-sm">{prompt}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <Button
            key={o.value}
            size="sm"
            variant={chosen ? (chosen === o.value ? "default" : "outline") : i === 0 ? "default" : "outline"}
            disabled={chosen !== null}
            onClick={() => {
              setChosen(o.value);
              onChoose(o.value);
            }}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
