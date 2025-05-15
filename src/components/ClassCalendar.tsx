import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { ClassSchedule } from '@/app/public/classes/page';
import { isSameDay, format } from 'date-fns';

interface ClassCalendarProps {
  currentMonth: Date;
  classSchedules: ClassSchedule[];
  onDateClick: (day: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function ClassCalendar({
  currentMonth,
  classSchedules,
  onDateClick,
  onPreviousMonth,
  onNextMonth,
}: ClassCalendarProps) {
  const hasEvents = (day: Date) => {
    return classSchedules.some((event) => isSameDay(new Date(event.start_time), day));
  };

  return (
    <Calendar
      mode="single"
      selected={undefined}
      onSelect={(day) => day && onDateClick(day)}
      className="rounded-md border shadow"
      classNames={{
        day_today: 'bg-accent text-accent-foreground',
        day: 'h-12 w-12 p-0 font-normal aria-selected:opacity-100',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        cell: 'relative',
      }}
      components={{
        Day: ({ date, ...props }) => (
          <button {...props} className="relative w-full h-full">
            {format(date, 'd')}
            {hasEvents(date) && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
            )}
          </button>
        ),
      }}
      showOutsideDays={true}
      fixedWeeks={true}
      month={currentMonth}
      onMonthChange={(month) => {
        if (month < currentMonth) {
          onPreviousMonth();
        } else {
          onNextMonth();
        }
      }}
    />
  );
}
