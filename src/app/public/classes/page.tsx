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
} from "date-fns";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { EditClassPopover } from "./EditClassPopover";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    updates: Partial<ClassSchedule>
  ) => {
    const { data, error } = await supabase
      .from("class_schedules")
      .insert([
        {
          title: updates.title,
          description: updates.description,
          start_time: updates.start_time,
          end_time: updates.end_time,
          price: updates.price,
          stripe_product_id: updates.stripe_product_id,
          stripe_price_id: updates.stripe_price_id,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding class:", error);
    } else {
      setClassSchedules((prev) => [...prev, ...(data as ClassSchedule[])]);
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

  const handlePayNow = async (classId: number) => {
    try {
      console.log("Initiating payment for class:", classId);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Response not OK:", response.status, data);
        throw new Error(data.error || "Failed to create checkout session");
      }

      console.log("Checkout session created:", data.sessionId);
      router.push(`/checkout?session_id=${data.sessionId}`);
    } catch (error) {
      console.error("Detailed error in handlePayNow:", error);
      toast.error("Failed to initiate payment. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Available Classes</h1>
      {isAdmin && (
        <AddClassPopover
          onSubmit={handleAddClass}
          buttonText="Add A Class"
          placeholder="Enter class details"
          // setClassSchedules={setClassSchedules}
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
          <div className="grid grid-cols-7 gap-4">
            {daysInMonth.map((day) => {
              const eventsForDay = classSchedules.filter((event) =>
                isSameDay(new Date(event.start_time), day)
              );

              return (
                <div
                  key={format(day, "yyyy-MM-dd")}
                  className="text-center w-8 h-8 leading-8 cursor-pointer relative"
                  onClick={() => handleDateClick(day)}
                >
                  <span className="font-bold">{format(day, "d")}</span>
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
            <div className="relative">
              <Input
                className="pr-10"
                placeholder="Search by class name"
                type="search"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" />
            </div>
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
                    <Button
                      onClick={() => handlePayNow(event.id)}
                      className=" px-4 py-2"
                      variant="outline"
                    >
                      Purchase A Seat
                    </Button>
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
