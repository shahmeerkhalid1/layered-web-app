import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExerciseSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Associates the input with an external `<Label htmlFor>` */
  id?: string;
}

export function ExerciseSearch({ value, onChange, id }: ExerciseSearchProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-none">
      <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        placeholder="Search by exercise name or description…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-0 bg-transparent pr-11 pl-11 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          type="button"
          aria-label="Clear exercise search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
