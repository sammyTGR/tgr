"use client";

import { useEffect, useState } from "react";
import { AddClassPopover } from "./AddClassPopover";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ChevronRightIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";

interface ClassSchedule {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export default function Component() {
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClassSchedule[] | null>(
    null
  );

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
    // console.log("handleAddClass triggered with data:", updates);

    const { data, error } = await supabase
      .from("class_schedules")
      .insert([{ ...updates }]);

    // console.log("Supabase insert response:", { data, error }); // Debugging line

    if (error) {
      console.error("Error adding class:", error);
    } else {
      // console.log("Class added successfully, updating state...");
      setClassSchedules((prev) => [...prev, ...(data || [])]);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Available Classes</h1>
      <AddClassPopover
        onSubmit={handleAddClass}
        buttonText="Add A Class"
        placeholder="Enter class details"
        setClassSchedules={setClassSchedules} // Pass the state setter function here
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Calendar</h2>
            <div className="flex items-center space-x-4">
              <button className="hover:focus:outline-none" title="Next Month">
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
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
                  <Link
                    className="bg-primary-500 rounded-lg px-4 py-2 hover:bg-primary-600 focus:outline-none"
                    href="#"
                  >
                    Pay Now
                  </Link>
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
