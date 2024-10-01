"use client";

import { useEffect, useState } from "react";
import { AddClassPopover } from "./AddClassPopover";
import { Input } from "@/components/ui/input";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  getDay,
} from "date-fns";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { EditClassPopover } from "./EditClassPopover";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentButton } from "@/components/PaymentButton";

export interface ClassSchedule {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  price?: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Component() {
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ClassSchedule[] | null>(
    null
  );
  const { role } = useRole();
  const router = useRouter();

  const isAdmin = role === "admin" || role === "super admin";

  useEffect(() => {
    const fetchClassSchedules = async () => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .order("start_time");

      if (error) {
        console.error("Error fetching class schedules:", error);
      } else if (data) {
        setClassSchedules(data);
      }
    };
    fetchClassSchedules();
  }, []);

  const handleDateClick = (day: Date) => {
    const eventsForDay = classSchedules.filter((event) =>
      isSameDay(new Date(event.start_time), day)
    );

    setSelectedEvent(eventsForDay.length > 0 ? eventsForDay : null);
  };

  const handleAddClass = async (
    id: string,
    newClass: Partial<ClassSchedule>
  ) => {
    try {
      const { data, error } = await supabase
        .from("class_schedules")
        .insert([newClass])
        .select();

      if (error) {
        console.error("Error adding class:", error);
        toast.error("Failed to add class. Please try again.");
      } else if (data && data.length > 0) {
        setClassSchedules((prev) => [...prev, data[0] as ClassSchedule]);

        // Update selectedEvent if the new class is on the currently selected date
        const newClassDate = new Date(data[0].start_time);
        if (
          selectedEvent &&
          selectedEvent.length > 0 &&
          isSameDay(newClassDate, new Date(selectedEvent[0].start_time))
        ) {
          setSelectedEvent((prev) =>
            prev
              ? [...prev, data[0] as ClassSchedule]
              : [data[0] as ClassSchedule]
          );
        }

        toast.success("Class added successfully");
      }
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  const handleEditClass = async (
    updatedClass: ClassSchedule
  ): Promise<void> => {
    const { data, error } = await supabase
      .from("class_schedules")
      .update(updatedClass)
      .eq("id", updatedClass.id)
      .select();

    if (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class. Please try again.");
    } else {
      setClassSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule.id === updatedClass.id ? updatedClass : schedule
        )
      );
      setSelectedEvent((prevEvents) =>
        prevEvents
          ? prevEvents.map((event) =>
              event.id === updatedClass.id ? updatedClass : event
            )
          : null
      );
      setEditingClass(null);
      toast.success("Class updated successfully");
    }
  };

  const handleDeleteClass = async (classId: number) => {
    const { error } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", classId);

    if (error) {
      console.error("Error deleting class:", error);
    } else {
      setClassSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule.id !== classId)
      );
      setSelectedEvent((prevEvents) =>
        prevEvents ? prevEvents.filter((event) => event.id !== classId) : null
      );
    }
  };

  // Add these new functions and constants
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCalendarDays = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const calendarDays = getCalendarDays(currentMonth);

  const getCalendarCellClass = (day: Date) => {
    let classes = "text-center p-2 cursor-pointer relative";
    if (!isSameMonth(day, currentMonth)) {
      classes += " text-gray-400";
    }
    return classes;
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Available Classes</h1>
      {isAdmin && (
        <AddClassPopover
          onSubmit={handleAddClass}
          buttonText="Add A Class"
          placeholder="Enter class details"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar component */}
        <div className="rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              className="hover:focus:outline-none"
              title="Previous Month"
              onClick={goToPreviousMonth}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              className="hover:focus:outline-none"
              title="Next Month"
              onClick={goToNextMonth}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center font-bold">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const eventsForDay = classSchedules.filter((event) =>
                isSameDay(new Date(event.start_time), day)
              );

              return (
                <div
                  key={format(day, "yyyy-MM-dd")}
                  className={getCalendarCellClass(day)}
                  onClick={() => handleDateClick(day)}
                  style={{
                    gridColumnStart: index === 0 ? getDay(day) + 1 : undefined,
                  }}
                >
                  <span>{format(day, "d")}</span>
                  {eventsForDay.length > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Class details component */}
        <div className="rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Class Details</h2>
            {/* <div className="relative">
              <Input
                className="pr-10"
                placeholder="Search by class name"
                type="search"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" />
            </div> */}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {selectedEvent ? (
              selectedEvent.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-medium">
                      {event.title || "No title available"}
                    </h3>
                    <p>{event.description || "No description available"}</p>
                    <p>
                      {new Date(event.start_time).toLocaleDateString()} -{" "}
                      {new Date(event.start_time).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <PaymentButton classId={event.id} />
                    {isAdmin && (
                      <>
                        <EditClassPopover
                          classData={event}
                          onSubmit={handleEditClass}
                          onClose={() => setEditingClass(null)}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteClass(event.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>Select a date to see class details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
