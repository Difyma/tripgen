"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-gray-700",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 bg-gray-50/50 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center transition-colors",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-400 rounded-md w-10 font-normal text-[0.8rem] h-10 flex items-center justify-center",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-50",
          "first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
          "h-10 w-10 flex items-center justify-center"
        ),
        day: cn(
          "h-8 w-8 p-0 font-normal rounded-lg transition-colors",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/5",
          "aria-selected:bg-black aria-selected:text-white aria-selected:hover:bg-black/90"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-black text-white hover:bg-black/90 focus:bg-black focus:text-white",
        day_today: "bg-gray-50 text-gray-900 font-medium",
        day_outside:
          "text-gray-400 opacity-50 aria-selected:bg-gray-50/50 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-gray-50 aria-selected:text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-gray-600" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-gray-600" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
