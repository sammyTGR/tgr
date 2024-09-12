"use client";

import { useEffect, useState } from "react";
import { AddClassPopover } from "./AddClassPopover";
import { Input } from "@/components/ui/input";
import Link from "next/link";
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
import { PopoverTrigger } from "@/components/ui/popover";
import { useRole } from "@/context/RoleContext"; // Add this import
import { EditClassPopover } from "./EditClassPopover";

interface ClassSchedule {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export default function Component() {
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ClassSchedule[] | null>(
    null
  );
  const { role, loading } = useRole(); // Use the RoleContext

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
    // console.log("Updated class schedules:", classSchedules);
    fetchClassSchedules();
  }, [classSchedules]); // Add classSchedules to the dependency array

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
    // Remove the id from the updates object
    const { id: _, ...classData } = updates;

    // console.log("Data being sent to Supabase:", classData);

    const { data, error } = await supabase
      .from("class_schedules")
      .insert([classData])
      .select(); // Add .select() to return the inserted data

    if (error) {
      console.error("Error adding class:", error);
    } else {
      // console.log("Inserted data:", data);
      setClassSchedules((prev) => [...prev, ...(data || [])]);
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

  const handleEditClass = async (updatedClass: ClassSchedule) => {
    const { data, error } = await supabase
      .from("class_schedules")
      .update(updatedClass)
      .eq("id", updatedClass.id)
      .select();

    if (error) {
      console.error("Error updating class:", error);
    } else {
      // console.log("Updated data:", data);
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

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Available Classes</h1>
      {isAdmin && (
        <AddClassPopover
          onSubmit={handleAddClass}
          buttonText="Add A Class"
          placeholder="Enter class details"
          setClassSchedules={setClassSchedules}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              const eventsForDay = classSchedules.filter((event) => {
                const eventDate = new Date(event.start_time).setHours(
                  0,
                  0,
                  0,
                  0
                );
                return isSameDay(eventDate, day);
              });

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
                    <Link
                      className="bg-primary-500 rounded-lg px-4 py-2 hover:bg-primary-600 focus:outline-none"
                      href="#"
                    >
                      Pay Now
                    </Link>
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
