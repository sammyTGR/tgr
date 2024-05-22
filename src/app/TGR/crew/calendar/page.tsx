"use client";
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface CalendarEvent {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface EmployeeCalendar {
    name: string;
    events: CalendarEvent[];
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Component() {
    const [calendarData, setCalendarData] = useState<EmployeeCalendar[]>([]);

    useEffect(() => {
        const fetchCalendarData = async () => {
            try {
                const response = await fetch('/api/calendar');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCalendarData(data);
            } catch (error: any) {
                console.error("Failed to fetch calendar data:", error.message);
            }
        };

        fetchCalendarData();
    }, []);

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(Number(hours), Number(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).replace(' ', '');
    };

    const renderEmployeeRow = (employee: EmployeeCalendar) => {
        const eventsByDay: { [key: string]: CalendarEvent[] } = {};
        daysOfWeek.forEach(day => {
            eventsByDay[day] = employee.events.filter(event => event.day_of_week === day);
        });

        return (
            <div key={employee.name} className="grid grid-cols-8 items-center divide-y divide-gray-200 dark:divide-gray-800">
                <div className="py-3 px-4 font-medium">{employee.name}</div>
                {daysOfWeek.map(day => (
                    <div key={day} className="py-3 px-4">
                        {eventsByDay[day].map((event, index) => {
                            const [startHours, startMinutes] = event.start_time.split(':');
                            const startTime = new Date();
                            startTime.setHours(Number(startHours), Number(startMinutes));
                            const compareTime = new Date();
                            compareTime.setHours(11, 30);
                            const textColor = startTime <= compareTime ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400';
                            return (
                                <div key={index} className={textColor}>
                                    {`${formatTime(event.start_time)}  ${formatTime(event.end_time)}`}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Team Calendar</h1>
                <div className="flex items-center space-x-4">
                    <Button variant="outline">
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous Week
                    </Button>
                    <Button variant="outline">
                        Next Week
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md overflow-hidden">
                <div className="grid grid-cols-8 text-sm font-medium border-b border-gray-200 dark:border-gray-800">
                    <div className="py-3 px-4 bg-gray-100 dark:bg-gray-900 dark:text-gray-300">Name</div>
                    {daysOfWeek.map(day => (
                        <div key={day} className="py-3 px-4 bg-gray-100 dark:bg-gray-900 dark:text-gray-300">{day}</div>
                    ))}
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {calendarData.map(employee => renderEmployeeRow(employee))}
                </div>
            </div>
        </div>
    );
}
