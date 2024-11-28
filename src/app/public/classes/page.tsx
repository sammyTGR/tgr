"use client";

import { useState } from "react";
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
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { EditClassPopover } from "./EditClassPopover";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentButton } from "@/components/PaymentButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

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

const timeZone = "America/Los_Angeles";

export default function Component() {
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ClassSchedule[] | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { role } = useRole();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAdmin = role === "admin" || role === "super admin" || role === "dev";

  const {
    data: classSchedules,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classSchedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .order("start_time");

      if (error) throw error;
      return data as ClassSchedule[];
    },
  });

  const editClassMutation = useMutation({
    mutationFn: async (updatedClass: ClassSchedule) => {
      const formattedStartTime = formatTZ(
        toZonedTime(new Date(updatedClass.start_time), timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      );
      const formattedEndTime = formatTZ(
        toZonedTime(new Date(updatedClass.end_time), timeZone),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      );

      const { data, error } = await supabase
        .from("class_schedules")
        .update({
          ...updatedClass,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
        })
        .eq("id", updatedClass.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      // Fetch the class details to get Stripe IDs
      const { data: classData, error: fetchError } = await supabase
        .from("class_schedules")
        .select("stripe_product_id, stripe_price_id")
        .eq("id", classId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Stripe
      const stripeResponse = await fetch("/api/delete-stripe-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: classData.stripe_product_id,
          priceId: classData.stripe_price_id,
        }),
      });

      if (!stripeResponse.ok) {
        const errorText = await stripeResponse.text();
        throw new Error(errorText);
      }

      // Delete from Supabase
      const { error } = await supabase
        .from("class_schedules")
        .delete()
        .eq("id", classId);

      if (error) throw error;
    },
    onSuccess: (_, deletedClassId) => {
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
      // Update the selectedEvent state
      setSelectedEvent((prevEvents) =>
        prevEvents
          ? prevEvents.filter((event) => event.id !== deletedClassId)
          : null
      );
    },
  });

  const handleAddClass = async (id: string, newClass: Partial<ClassSchedule>) => {
    try {
      // Just invalidate the query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["classSchedules"] });
    } catch (error) {
      console.error("Error refreshing classes:", error);
    }
  };

  const handleEditClass = async (
    updatedClass: ClassSchedule
  ): Promise<void> => {
    try {
      await editClassMutation.mutateAsync(updatedClass);
      setEditingClass(null);
      toast.success("Class updated successfully");
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class. Please try again.");
    }
  };

  const handleDeleteClass = async (classId: number) => {
    try {
      await deleteClassMutation.mutateAsync(classId);
      toast.success("Class deleted successfully");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class. Please try again.");
    }
  };

  const handleDateClick = (day: Date) => {
    const eventsForDay = classSchedules?.filter((event) =>
      isSameDay(toZonedTime(new Date(event.start_time), timeZone), day)
    );

    setSelectedEvent(
      eventsForDay && eventsForDay.length > 0 ? eventsForDay : null
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth: Date) => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prevMonth: Date) => addMonths(prevMonth, 1));
  };

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

  const filterEvents = (events: ClassSchedule[] | null) => {
    if (!events) return null;
    if (!searchQuery.trim()) return events;

    return events.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (isLoading) return <div></div>;
  if (error) return <div>An error occurred: {error.message}</div>;

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
              const eventsForDay = classSchedules?.filter((event) =>
                isSameDay(
                  toZonedTime(new Date(event.start_time), timeZone),
                  day
                )
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
                  {eventsForDay && eventsForDay.length > 0 && (
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
            <div className="relative">
              <Input
                className="pr-10"
                placeholder="Search by class name"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {selectedEvent ? (
              filterEvents(selectedEvent)?.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-bold">
                      {event.title || "No title available"}
                    </h3>
                    <p className="text-muted-foreground p-1">
                      {event.description || "No description available"}
                    </p>
                    <p className="text-sm font-semibold">
                      {formatTZ(
                        toZonedTime(new Date(event.start_time), timeZone),
                        "M/dd/yy",
                        { timeZone }
                      )}{" "}
                      :{" "}
                      {formatTZ(
                        toZonedTime(new Date(event.start_time), timeZone),
                        "h:mm a",
                        { timeZone }
                      )}{" "}
                      -{" "}
                      {formatTZ(
                        toZonedTime(new Date(event.end_time), timeZone),
                        "h:mm a",
                        { timeZone }
                      )}
                    </p>
                    <p className="mt-2 font-semibold">
                      Price:{" "}
                      {event.price !== undefined
                        ? formatCurrency(event.price)
                        : "Free"}
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
            {selectedEvent && filterEvents(selectedEvent)?.length === 0 && (
              <p>No classes found matching &quot;{searchQuery}&quot;</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
