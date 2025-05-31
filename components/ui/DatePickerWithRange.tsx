"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  value?: DateRange; // The selected date range (controlled prop)
  onChange: (range: DateRange | undefined) => void; // Callback for when the range changes (controlled prop)
  initialMonth?: Date; // Optional initial month for the calendar
  className?: string; // Optional className for styling
}

// Accept value and onChange props
export function DatePickerWithRange({
  className,
  value,
  onChange,
  initialMonth,
}: DatePickerWithRangeProps) {
  // Removed internal state: const [date, setDate] = React.useState<DateRange | undefined>(...);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          {/* Use the 'value' prop for display */}
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[250px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />{" "}
            {/* Added margin to icon */}
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={initialMonth || value?.from || new Date()} // Use prop or value for default month
            selected={value} // Use the 'value' prop
            onSelect={onChange} // Use the 'onChange' prop
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
// --- END OF FILE DatePickerWithRange.tsx ---
