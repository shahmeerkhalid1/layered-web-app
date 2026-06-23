import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExerciseSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Associates the input with an external `<Label htmlFor>` */
  id?: string;
  placeholder?: string;
}

export function ExerciseSearch({
  value,
  onChange,
  id,
  placeholder = "Search by exercise name or description…",
}: ExerciseSearchProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-background shadow-none transition-[box-shadow,border-color] duration-150 hover:border-ring/70 hover:ring-2 hover:ring-ring/30 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 has-[input:not(:placeholder-shown)]:bg-(--field-filled)/30">
      <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-0 bg-transparent pr-11 pl-11 text-sm shadow-none ring-0 hover:ring-0 focus-visible:ring-0 data-filled:bg-transparent[&:not(:placeholder-shown)]:bg-transparent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          type="button"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
