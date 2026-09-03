import { useEffect, useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Member } from "@/components/members/member-data";
import { useMemberSearchQuery } from "@/components/members/use-members";
import { cn } from "@/lib/utils";

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

type CheckInComboboxProps = {
  value: Member | null;
  onChange: (member: Member) => void;
  disabled?: boolean;
};

export function CheckInCombobox({ value, onChange, disabled }: CheckInComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  // cmdk's own filtering is off: the server already decided what matches.
  const { data: members = [], isFetching } = useMemberSearchQuery(debouncedSearch);
  const hasTerm = debouncedSearch.trim().length > 0;

  const statusMessage = !hasTerm
    ? "Start typing to find a member."
    : isFetching
      ? "Searching…"
      : members.length === 0
        ? "No members found."
        : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="flex-1 justify-between bg-secondary border-border font-normal"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? `${value.name} · ${value.membershipId}` : "Search member by name or ID..."}
          </span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border-border" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Name, email, NIC or member ID..." value={search} onValueChange={setSearch} />
          <CommandList>
            {statusMessage ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{statusMessage}</div>
            ) : (
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.id}
                    onSelect={() => {
                      onChange(member);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value?.id === member.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.membershipId} · {member.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
