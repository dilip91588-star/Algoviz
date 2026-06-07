import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CCodeDisplayProps {
  title: string;
  code: string;
}

const CCodeDisplay = ({ title, code }: CCodeDisplayProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/80">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">main.c</span>
        </div>
        <div className="max-h-[550px] overflow-y-auto overflow-x-auto">
          <pre className="p-6 text-sm font-mono leading-relaxed text-foreground whitespace-pre min-w-max">
            <code>{code}</code>
          </pre>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic">
        This is a read-only educational reference. No compilation or execution is performed.
      </p>
    </div>
  );
};

export default CCodeDisplay;
