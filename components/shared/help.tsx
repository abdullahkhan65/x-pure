"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { HELP, type HelpTopic } from "@/lib/help-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function HelpBody({ topic }: { topic: HelpTopic }) {
  return (
    <div className="space-y-5">
      {topic.sections.map((section) => (
        <div key={section.heading} className="space-y-2">
          <h3 className="text-sm font-semibold">{section.heading}</h3>
          {section.body ? <p className="text-sm text-muted-foreground">{section.body}</p> : null}
          {section.steps ? (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {section.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          ) : null}
          {section.bullets ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {section.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface HelpButtonProps {
  /** Key into the HELP map (e.g. "overview", "orders"). Falls back to "overview". */
  topicKey: string;
  /** Optional label — omit for an icon-only button. */
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export function HelpButton({ topicKey, label, variant = "ghost" }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const topic = HELP[topicKey] ?? HELP.overview;
  if (!topic) return null;

  return (
    <>
      <Button
        variant={variant}
        size={label ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={label ?? "Help for this page"}
        title={label ?? "What is this page?"}
      >
        <HelpCircle className={label ? "mr-2 h-4 w-4" : "h-5 w-5"} />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{topic.title}</DialogTitle>
            <DialogDescription>{topic.intro}</DialogDescription>
          </DialogHeader>
          <HelpBody topic={topic} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Icon-only help button that picks its topic from the current URL. Lives in the topbar. */
export function PageHelpButton() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";
  const topicKey = pathname === "/" ? "overview" : segment.replace(/-/g, "_");
  return <HelpButton topicKey={topicKey} />;
}
