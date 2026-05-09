"use client";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Native <select> dropdowns inherit OS styling for the option list,
// which paints a white background on most browsers and breaks the
// dark theme. DarkSelect wraps Radix's Select primitive so the
// trigger AND the dropdown both render in the app's dark palette.

export interface DarkSelectOption {
  value: string;
  label: ReactNode;
  // textValue is used for typeahead and for the trigger's display text
  // when label is rich React content. Defaults to label if it's a string.
  textValue?: string;
}

export interface DarkSelectGroup {
  label: string;
  options: DarkSelectOption[];
}

interface DarkSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options?: DarkSelectOption[];
  groups?: DarkSelectGroup[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
}

export function DarkSelect({
  value,
  onValueChange,
  options,
  groups,
  placeholder,
  ariaLabel,
  disabled,
  triggerClassName,
  contentClassName,
}: DarkSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex items-center justify-between gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          triggerClassName,
        )}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-white/50 shrink-0">
          <ChevronDown size={12} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={cn(
            "rounded-lg border border-white/10 shadow-2xl overflow-hidden z-50",
            contentClassName,
          )}
          style={{
            background: "rgba(12, 12, 22, 0.97)",
            backdropFilter: "blur(8px)",
            minWidth: "var(--radix-select-trigger-width)",
          }}
          position="popper"
          sideOffset={4}>
          <Select.Viewport className="p-1 max-h-[340px]">
            {options &&
              options.map((o) => <DarkSelectItem key={o.value} option={o} />)}
            {groups &&
              groups.map((g, gi) => (
                <Select.Group key={`${g.label}-${gi}`}>
                  <Select.Label className="px-2.5 pt-2 pb-1 text-[9px] uppercase tracking-widest font-bold text-white/35">
                    {g.label}
                  </Select.Label>
                  {g.options.map((o) => (
                    <DarkSelectItem key={o.value} option={o} />
                  ))}
                </Select.Group>
              ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function DarkSelectItem({ option }: { option: DarkSelectOption }) {
  return (
    <Select.Item
      value={option.value}
      textValue={
        option.textValue ?? (typeof option.label === "string" ? option.label : undefined)
      }
      className="flex items-center justify-between gap-2 text-[12px] font-medium text-white/80 px-2.5 py-1.5 rounded outline-none cursor-pointer data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[state=checked]:text-purple-300 data-[state=checked]:bg-purple-500/15">
      <Select.ItemText>{option.label}</Select.ItemText>
      <Select.ItemIndicator>
        <Check size={12} />
      </Select.ItemIndicator>
    </Select.Item>
  );
}
