import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExerciseSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExerciseSearch({ value, onChange }: ExerciseSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search exercises..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          type="button"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
