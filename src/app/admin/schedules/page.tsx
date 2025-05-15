'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/utils/supabase/client';
import { useRole } from '@/context/RoleContext';
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
} from '@tanstack/react-table';
import { SchedulePagination } from './schedule-pagination';
import { PopoverForm } from './PopoverForm';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { DataTable } from './DataTable';
import { TimesheetDataTable } from './TimesheetDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';
import { TimesheetPagination } from './TimesheetPagination';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import AddTimesheetForm from './AddTimesheetForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatHoursAndMinutes } from '@/utils/format-hours';
import { ChevronUp } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimesheetData, ScheduleData } from './data-schema';
import { User } from '@supabase/supabase-js';
import { useSidebar } from '@/components/ui/sidebar';

interface Schedule {
  employee_id: number;
  start_time: string | null;
  end_time: string | null;
  // Add other fields as necessary
}

interface Employee {
  employee_id: number;
  name: string;
}

interface ReferenceScheduleResponse {
  schedules: any[];
  employees: Employee[];
}

interface ActualScheduleResponse {
  schedules: any[];
  employees: Employee[];
}

interface ScheduleGenerationResponse {
  schedules_created: number;
  employees_processed: number;
}

interface GenerateSchedulesResponse {
  schedules_created: number;
  employees_processed: number;
}

type PopoverState = boolean;

const timeZone = 'America/Los_Angeles'; // Define the timezone

const scheduleColumns: ColumnDef<ScheduleData>[] = [
  {
    accessorKey: 'employee_name',
    header: 'Employee Name',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'day_of_week',
    header: 'Day of Week',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'start_time',
    header: 'Start Time',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'end_time',
    header: 'End Time',
    cell: (info) => info.getValue(),
  },
];

// Create a function that returns the columns with access to showDecimalHours
const createTimesheetColumns = (showDecimalHours: boolean): ColumnDef<TimesheetData>[] => [
  {
    accessorKey: 'employee_name',
    header: 'Employee Name',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'event_date',
    header: 'Date',
    cell: (info) =>
      info.getValue()
        ? formatTZ(
            toZonedTime(new Date(`${info.getValue()}T00:00:00`), 'America/Los_Angeles'),
            'M/dd/yyyy',
            { timeZone: 'America/Los_Angeles' }
          )
        : 'N/A',
  },
  {
    accessorKey: 'start_time',
    header: 'Start Time',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'lunch_start',
    header: 'Lunch Start',
    cell: (info) => {
      const row = info.row.original;
      const startTime = row.start_time;
      const lunchStart = row.lunch_start;

      if (!startTime || !lunchStart) {
        return lunchStart || '';
      }

      try {
        const parseTimeString = (timeStr: string) => {
          const [time, meridiem] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (meridiem === 'PM' && hours !== 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        const startMinutes = parseTimeString(startTime);
        const lunchStartMinutes = parseTimeString(lunchStart);

        // Handle case where lunch start is on the next day
        const adjustedLunchStartMinutes =
          lunchStartMinutes < startMinutes ? lunchStartMinutes + 24 * 60 : lunchStartMinutes;

        // Calculate hours difference
        const hoursDifference = (adjustedLunchStartMinutes - startMinutes) / 60;

        let colorClass = '';
        if (hoursDifference < 5.5) {
          colorClass = 'text-green-500';
        } else if (hoursDifference < 6.5) {
          colorClass = 'text-orange-500';
        } else if (hoursDifference < 7.0) {
          colorClass = 'text-yellow-500';
        } else {
          colorClass = 'text-red-500';
        }

        return (
          <span
            className={`${colorClass} font-medium`}
            title={`${hoursDifference.toFixed(2)} hours after start time`}
          >
            {lunchStart}
          </span>
        );
      } catch (error) {
        console.error('Error calculating lunch start time difference:', error);
        return lunchStart;
      }
    },
  },
  {
    accessorKey: 'lunch_end',
    header: 'Lunch End',
    cell: (info) => {
      const row = info.row.original;
      const lunchStart = row.lunch_start;
      const lunchEnd = row.lunch_end;

      if (!lunchStart || !lunchEnd) {
        return lunchEnd || '';
      }

      try {
        const parseTimeString = (timeStr: string) => {
          const [time, meridiem] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);

          if (meridiem === 'PM' && hours !== 12) {
            hours += 12;
          }
          if (meridiem === 'AM' && hours === 12) {
            hours = 0;
          }

          return { hours, minutes };
        };

        const start = parseTimeString(lunchStart);
        const end = parseTimeString(lunchEnd);

        // Calculate total minutes
        const startTotalMinutes = start.hours * 60 + start.minutes;
        const endTotalMinutes = end.hours * 60 + end.minutes;

        // Handle case where lunch end is on the next day
        const adjustedEndTotalMinutes =
          endTotalMinutes < startTotalMinutes ? endTotalMinutes + 24 * 60 : endTotalMinutes;

        // Calculate duration
        const durationInMinutes = adjustedEndTotalMinutes - startTotalMinutes;

        return (
          <span
            className={
              durationInMinutes >= 30 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'
            }
            title={`Duration: ${durationInMinutes} minutes`}
          >
            {lunchEnd}
          </span>
        );
      } catch (error) {
        console.error('Error calculating lunch duration:', error, {
          lunchStart,
          lunchEnd,
        });
        return lunchEnd || '';
      }
    },
  },
  {
    accessorKey: 'end_time',
    header: 'End Time',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'sick_time',
    header: 'Sick Time',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'vto',
    header: 'VTO',
    cell: ({ row }) => {
      const vtoType = row.original.vto_type;
      const vtoHours = row.original.vto_hours;

      if (!vtoType || !['called_out', 'no_call_no_show'].includes(vtoType)) {
        return null;
      }

      let formattedHours;
      try {
        if (vtoHours) {
          // Handle PostgreSQL interval format "HH:MM:SS"
          const intervalMatch = String(vtoHours).match(/(\d+):(\d+):(\d+)/);
          if (intervalMatch) {
            const [_, hours, minutes] = intervalMatch;
            if (showDecimalHours) {
              const decimalHours = parseInt(hours) + parseInt(minutes) / 60;
              formattedHours = `${decimalHours.toFixed(2)} hrs`;
            } else {
              formattedHours = `${parseInt(hours)}:${minutes.padStart(2, '0')}`;
            }
          } else if (typeof vtoHours === 'string' && vtoHours.includes(':')) {
            // Handle "HH:MM" format
            const [hours, minutes] = vtoHours.split(':').map(Number);
            if (showDecimalHours) {
              const decimalHours = hours + minutes / 60;
              formattedHours = `${decimalHours.toFixed(2)} hrs`;
            } else {
              formattedHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
            }
          } else {
            // Try to parse as a number
            const numericHours = parseFloat(String(vtoHours));
            if (!isNaN(numericHours)) {
              if (showDecimalHours) {
                formattedHours = `${numericHours.toFixed(2)} hrs`;
              } else {
                const hours = Math.floor(numericHours);
                const minutes = Math.round((numericHours - hours) * 60);
                formattedHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
              }
            }
          }
        }

        if (!formattedHours) {
          formattedHours = showDecimalHours ? '8.00 hrs' : '8:00';
        }
      } catch (error) {
        console.error('Error formatting VTO hours:', error, 'Raw value:', vtoHours);
        formattedHours = showDecimalHours ? '8.00 hrs' : '8:00';
      }

      const colorClass = vtoType === 'called_out' ? 'text-yellow-600' : 'text-red-500';
      const typeLabel = vtoType === 'called_out' ? 'Called Out' : 'No Call No Show';

      return (
        <span className={`font-medium ${colorClass}`} title={typeLabel}>
          {formattedHours}
        </span>
      );
    },
  },
  {
    accessorKey: 'total_hours',
    header: 'Total Hours',
    cell: (info) => {
      const totalHours = info.getValue();
      if (!totalHours) return '';

      try {
        // Handle PostgreSQL interval format "HH:MM:SS"
        const intervalStr = totalHours.toString();
        let hours = 0;
        let minutes = 0;

        if (intervalStr.includes(':')) {
          const [h, m] = intervalStr.split(':');
          hours = parseInt(h);
          minutes = parseInt(m);
        } else {
          // Handle other formats if necessary
          const numericValue = parseFloat(intervalStr);
          if (!isNaN(numericValue)) {
            hours = Math.floor(numericValue);
            minutes = Math.round((numericValue - hours) * 60);
          }
        }

        const decimalHours = hours + minutes / 60;

        return (
          <span
            className={decimalHours > 8 ? 'text-red-500 font-medium' : ''}
            title={`Total Hours: ${decimalHours}`}
          >
            {showDecimalHours
              ? `${decimalHours.toFixed(2)} hrs`
              : `${hours}:${minutes.toString().padStart(2, '0')}`}
          </span>
        );
      } catch (error) {
        console.error('Error parsing total hours:', error);
        return String(totalHours);
      }
    },
  },
];

const ManageSchedules = () => {
  const { state } = useSidebar();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'generate-single-schedule': false,
    'generate-all-schedules': false,
    'add-schedule': false,
    'update-schedule': false,
    'clear-schedule': false,
    'add-timesheet': false,
  });
  const queryClient = useQueryClient();
  const { role } = useRole();

  const [addSchedulePopoverOpen, setAddSchedulePopoverOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'employee_name', desc: false }]);
  const [updateSchedulePopoverOpen, setUpdateSchedulePopoverOpen] = useState(false);
  const [showDecimalHours, setShowDecimalHours] = useState(false);

  // Add user query
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  useEffect(() => {
    fetchActualSchedules();
    fetchEmployees();
    fetchTimesheets();
  }, []);

  const popoverQuery = useQuery({
    queryKey: ['popoverState'],
    queryFn: () => false, // default closed
    staleTime: Infinity, // Prevent automatic refetching
  });

  // Add the useQuery hook
  const { data: actualSchedules = [] } = useQuery({
    queryKey: ['actualSchedules'],
    queryFn: async () => {
      const [schedulesResponse, employeesResponse] = await Promise.all([
        fetch('/api/fetchSchedules?type=actual'),
        fetch('/api/fetchEmployees'),
      ]);

      if (!schedulesResponse.ok || !employeesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const schedules = await schedulesResponse.json();
      const employees = await employeesResponse.json();

      const dayOrder = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const sortedSchedules = schedules.sort((a: any, b: any) => {
        const employeeA = employees.find((emp: Employee) => emp.employee_id === a.employee_id);
        const employeeB = employees.find((emp: Employee) => emp.employee_id === b.employee_id);

        const nameA = employeeA?.name || 'Unknown';
        const nameB = employeeB?.name || 'Unknown';

        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }

        return (
          dayOrder[a.day_of_week as keyof typeof dayOrder] -
          dayOrder[b.day_of_week as keyof typeof dayOrder]
        );
      });

      return sortedSchedules.map((schedule: any) => {
        const employee = employees.find(
          (emp: Employee) => emp.employee_id === schedule.employee_id
        );

        return {
          id: schedule.id,
          employee_id: schedule.employee_id,
          employee_name: employee ? employee.name : 'Unknown',
          day_of_week: schedule.day_of_week || '',
          user_uuid: schedule.user_uuid || '',
          start_time: schedule.start_time ? formatTime(schedule.start_time) : '',
          end_time: schedule.end_time ? formatTime(schedule.end_time) : '',
        };
      });
    },
    // Add stale time and cache time for better performance
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: referenceSchedules = [] } = useQuery({
    queryKey: ['referenceSchedules'],
    queryFn: async () => {
      const response = await fetch('/api/fetchReferenceSchedules');
      if (!response.ok) {
        throw new Error('Failed to fetch reference schedules');
      }

      const { schedules, employees }: ReferenceScheduleResponse = await response.json();

      // Define day order for consistent sorting
      const dayOrder = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      // Sort by employee name first, then by day of week
      const sortedSchedules = schedules.sort((a: any, b: any) => {
        const employeeA = employees.find((emp: Employee) => emp.employee_id === a.employee_id);
        const employeeB = employees.find((emp: Employee) => emp.employee_id === b.employee_id);

        const nameA = employeeA?.name || 'Unknown';
        const nameB = employeeB?.name || 'Unknown';

        // First compare by employee name
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }

        // If same employee, sort by day of week
        return (
          dayOrder[a.day_of_week as keyof typeof dayOrder] -
          dayOrder[b.day_of_week as keyof typeof dayOrder]
        );
      });

      return sortedSchedules.map((schedule: any) => {
        const employee = employees.find(
          (emp: Employee) => emp.employee_id === schedule.employee_id
        );

        return {
          id: schedule.schedule_id || schedule.id,
          employee_id: schedule.employee_id,
          employee_name: employee ? employee.name : 'Unknown',
          day_of_week: schedule.day_of_week || '',
          user_uuid: schedule.user_uuid || '',
          start_time: schedule.start_time
            ? formatTZ(
                toZonedTime(new Date(`1970-01-01T${schedule.start_time}`), timeZone),
                'hh:mma',
                { timeZone }
              )
            : '',
          end_time: schedule.end_time
            ? formatTZ(
                toZonedTime(new Date(`1970-01-01T${schedule.end_time}`), timeZone),
                'hh:mma',
                { timeZone }
              )
            : '',
        };
      });
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/fetchEmployees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    },
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const [clockEventsResponse, vtoEventsResponse] = await Promise.all([
        fetch('/api/fetchTimesheets?payTypes=hourly,salary'),
        fetch('/api/fetchVTOEvents'),
      ]);

      if (!clockEventsResponse.ok) {
        throw new Error('Failed to fetch timesheets');
      }
      if (!vtoEventsResponse.ok) {
        throw new Error('Failed to fetch VTO events');
      }

      const clockEvents = await clockEventsResponse.json();
      const vtoEvents = await vtoEventsResponse.json();

      // Combine the events, with VTO events taking precedence
      const combinedEvents = clockEvents.map((clockEvent: any) => {
        const vtoEvent = vtoEvents.find(
          (vto: any) =>
            vto.employee_id === clockEvent.employee_id && vto.event_date === clockEvent.event_date
        );

        if (vtoEvent) {
          return {
            ...clockEvent,
            vto_hours: vtoEvent.total_hours,
            vto_type: vtoEvent.vto_type,
            total_hours:
              vtoEvent.vto_type === 'called_out' || vtoEvent.vto_type === 'no_call_no_show'
                ? null
                : clockEvent.total_hours,
          };
        }

        return clockEvent;
      });

      // Also add any VTO events that don't have corresponding clock events
      vtoEvents.forEach((vtoEvent: any) => {
        const exists = combinedEvents.some(
          (event: any) =>
            event.employee_id === vtoEvent.employee_id && event.event_date === vtoEvent.event_date
        );

        if (!exists) {
          combinedEvents.push({
            employee_id: vtoEvent.employee_id,
            employee_name: vtoEvent.employee_name,
            event_date: vtoEvent.event_date,
            vto_hours: vtoEvent.total_hours,
            vto_type: vtoEvent.vto_type,
            total_hours: null,
          });
        }
      });

      return combinedEvents;
    },
  });

  const scheduleQuery = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await fetch('/api/fetchSchedules');
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      return response.json();
    },
  });

  // Keep fetchActualSchedules as a function that triggers a refetch
  const fetchActualSchedules = async () => {
    await queryClient.invalidateQueries({ queryKey: ['actualSchedules'] });
  };

  const fetchReferenceSchedules = async () => {
    await queryClient.invalidateQueries({ queryKey: ['referenceSchedules'] });
  };

  // Helper function to format schedules (used for both reference and actual schedules)
  const formatSchedules = (schedules: any) => {
    return schedules.map((schedule: any) => {
      const employee = employees.find((emp: Employee) => emp.employee_id === schedule.employee_id);

      return {
        ...schedule,
        employee_name: employee ? employee.name : 'Unknown',
        start_time: formatTime(schedule.start_time),
        end_time: formatTime(schedule.end_time),
      };
    });
  };

  const formatTime = (time: string | null): string => {
    if (!time) return '';
    try {
      const date = parseISO(`1970-01-01T${time}`);
      const zonedDate = toZonedTime(date, timeZone);
      return format(zonedDate, 'h:mm a');
    } catch (error) {
      //console.("Error formatting time:", error);
      return '';
    }
  };

  const fetchEmployees = async () => {
    await queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const fetchTimesheets = async () => {
    await queryClient.invalidateQueries({ queryKey: ['timesheets'] });
  };

  // Define mutations for data modifications
  const editTimesheetMutation = useMutation({
    mutationFn: async ({
      id,
      lunch_start,
      lunch_end,
    }: {
      id: number;
      lunch_start: string | null;
      lunch_end: string | null;
    }) => {
      const { error } = await supabase
        .from('employee_clock_events')
        .update({ lunch_start, lunch_end })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: fetchTimesheets,
  });

  const addTimesheetMutation = useMutation({
    mutationFn: async (data: {
      employeeId: number;
      date: string;
      startTime: string;
      lunchStart: string | null;
      lunchEnd: string | null;
      endTime: string | null;
    }) => {
      const employee = employees.find((emp: Employee) => emp.employee_id === data.employeeId);
      if (!employee) throw new Error('Employee not found');

      const formattedDate = format(parseISO(data.date), 'yyyy-MM-dd');
      const formatTime = (time: string | null): string | null => {
        if (!time) return null;
        return time.length === 5 ? `${time}:00` : time;
      };

      const timesheetData = {
        employee_id: data.employeeId,
        employee_name: employee.name,
        event_date: formattedDate,
        start_time: formatTime(data.startTime),
        lunch_start: formatTime(data.lunchStart),
        lunch_end: formatTime(data.lunchEnd),
        end_time: formatTime(data.endTime),
      };

      const { data: existingEntry } = await supabase
        .from('employee_clock_events')
        .select()
        .match({
          employee_id: data.employeeId,
          event_date: formattedDate,
        })
        .single();

      if (existingEntry) {
        const { error } = await supabase
          .from('employee_clock_events')
          .update(timesheetData)
          .match({ id: existingEntry.id });

        if (error) throw error;
        return { updated: true };
      }

      const { error } = await supabase.from('employee_clock_events').insert(timesheetData);

      if (error) throw error;
      return { inserted: true };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast.success(
        result.updated
          ? 'Timesheet entry updated successfully'
          : 'Timesheet entry added successfully'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add/update timesheet entry');
    },
  });

  const clearScheduleMutation = useMutation({
    mutationFn: async (employeeName: string) => {
      const response = await fetch('/api/clearSchedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear schedule');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referenceSchedules'] });
      toast.success('Schedule cleared successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateSchedulesMutation = useMutation({
    mutationFn: async (weeks: string | undefined) => {
      const response = await fetch('/api/generateSchedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeks: parseInt(weeks || '0', 10) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate schedules');
      }

      const data = await response.json();

      return {
        schedulesGenerated: data.schedules_created,
        employeesProcessed: data.employees_processed,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referenceSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['actualSchedules'] });
      toast.success(
        `Successfully generated ${data.schedulesGenerated} schedules for ${data.employeesProcessed} employees`
      );
    },
    onError: (error: Error) => {
      console.error('Generation Error:', error);
      toast.error(`Failed to generate schedules: ${error.message}`);
    },
  });

  const addScheduleMutation = useMutation({
    mutationFn: async ({
      employeeName,
      date,
      startTime,
      endTime,
    }: {
      employeeName: string;
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      const response = await fetch('/api/addSchedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeName,
          date,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add schedule');
      }

      const data = await response.json();

      // Send email notification
      try {
        const employee = employees.find((emp: Employee) => emp.name === employeeName);
        if (employee?.contact_info?.email) {
          const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
          const emailResponse = await fetch('/api/send_email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: employee.contact_info.email,
              subject: 'New Schedule Added',
              templateName: 'CustomStatus',
              templateData: {
                name: employeeName,
                date: formattedDate,
                status: `New Shift Added: ${startTime} - ${endTime}`,
              },
            }),
          });

          if (!emailResponse.ok) {
            console.error('Failed to send email notification');
          }
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actualSchedules'] });
      queryClient.setQueryData(['popoverState'], false); // Close popover
      toast.success('Schedule added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({
      employeeId,
      date,
      startTime,
      endTime,
    }: {
      employeeId: number;
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      const response = await fetch('/api/updateSchedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          date,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update schedule');
      }

      const data = await response.json();

      // Send email notification
      try {
        const employee = employees.find((emp: Employee) => emp.employee_id === employeeId);
        if (employee?.contact_info?.email) {
          const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
          const emailResponse = await fetch('/api/send_email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: employee.contact_info.email,
              subject: 'Schedule Update Notification',
              templateName: 'CustomStatus',
              templateData: {
                name: employee.name,
                date: formattedDate,
                status: `Schedule Updated: ${startTime} - ${endTime}`,
              },
            }),
          });

          if (!emailResponse.ok) {
            console.error('Failed to send email notification');
          }
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referenceSchedules'] });
      setUpdateSchedulePopoverOpen(false);
      toast.success('Schedule updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update schedule');
    },
  });

  // Update the handlers to use mutations
  const handleEditTimesheet = (
    id: number,
    lunch_start: string | null,
    lunch_end: string | null
  ) => {
    editTimesheetMutation.mutate({ id, lunch_start, lunch_end });
  };

  const handleAddTimeSheetEntry = async (timesheet: TimesheetData) => {
    await queryClient.invalidateQueries({ queryKey: ['timesheets'] });
  };

  const handleGenerateSingleSchedule = async (employeeName: string, weeks?: string) => {
    const employee = employees.find((emp: Employee) => emp.name === employeeName);
    if (!employee) {
      //console.("Employee not found:", employeeName);
      return;
    }

    const { error } = await supabase.rpc('generate_schedules_for_employees_by_name', {
      employee_name: employeeName,
      weeks: parseInt(weeks || '0', 10),
    });

    // Add the name field to the schedule
    if (!error) {
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ name: employee.name })
        .eq('employee_id', employee.employee_id);
      if (updateError) {
        // console.error(
        //   "Error updating employee name in schedules:",
        //   updateError
        // );
      } else {
        // console.log("Schedules generated successfully.");
        fetchReferenceSchedules();
      }
    } else {
      //console.("Error generating schedules:", error);
    }
  };

  const handleGenerateAllSchedules = (weeks?: string) => {
    // Default to 1 week if no value is provided
    const parsedWeeks = parseInt(weeks || '1', 10);

    // Validate the input
    if (isNaN(parsedWeeks) || parsedWeeks < 1) {
      toast.error('Please enter a valid number of weeks (minimum 1)');
      return;
    }

    toast.loading('Generating schedules...', { id: 'generating-schedules' });

    generateSchedulesMutation.mutate(parsedWeeks.toString(), {
      // Pass parsedWeeks as a string
      onSuccess: () => {
        toast.dismiss('generating-schedules');
      },
      onError: () => {
        toast.dismiss('generating-schedules');
      },
    });
  };

  const handleClearSchedule = (employeeName: string) => {
    clearScheduleMutation.mutate(employeeName);
  };

  const handleAddSchedule = (
    employeeName: string,
    _: string | undefined,
    date?: string,
    startTime?: string,
    endTime?: string
  ) => {
    if (!date || !startTime || !endTime) {
      toast.error('Date, Start Time, and End Time are required');
      return;
    }

    addScheduleMutation.mutate({
      employeeName,
      date,
      startTime,
      endTime,
    });
  };

  const handleUpdateSchedule = (
    employeeName: string,
    _: string | undefined,
    date?: string,
    startTime?: string,
    endTime?: string
  ) => {
    const employee = employees.find((emp: Employee) => emp.name === employeeName);
    if (!employee || !date || !startTime || !endTime) {
      toast.error('Missing required information for updating schedule');
      return;
    }

    const formattedDate = format(parseISO(date), 'yyyy-MM-dd');

    updateScheduleMutation.mutate({
      employeeId: employee.employee_id,
      date: formattedDate,
      startTime,
      endTime,
    });
  };

  const fetchSchedule = async (employeeId: number, date: string) => {
    try {
      const response = await fetch(
        `/api/fetchScheduleByDate?employeeId=${employeeId}&date=${date}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return null;
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  interface ExpandableCardProps {
    id: string;
    title: string;
    children: React.ReactNode;
  }

  const ExpandableCard: React.FC<ExpandableCardProps> = ({ id, title, children }) => {
    const isExpanded = expandedCards[id] ?? false;

    return (
      <Card className={`relative ${isExpanded ? 'h-[200px]' : 'h-[140px]'}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCardExpansion(id)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent
          className={`
            ${isExpanded ? 'h-[100px] overflow-y-auto pr-4' : ''}
            space-y-2
          `}
        >
          {children}
        </CardContent>
      </Card>
    );
  };

  // Use the function to create columns with access to showDecimalHours
  const timesheetColumns = createTimesheetColumns(showDecimalHours);

  return (
    <RoleBasedWrapper allowedRoles={['admin', 'ceo', 'super admin', 'dev']}>
      <Card
        className={`relative w-full ml-6 md:w-[calc(100vw-15rem)] md:ml-6 lg:w-[calc(100vw-20rem)] lg:ml-6 h-full overflow-hidden flex-1 transition-all duration-300`}
      >
        <CardHeader className="bg-muted dark:bg-muted px-6 py-4 border-b rounded-t-lg border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Manage Employee Schedules</h1>
        </CardHeader>
        <Tabs defaultValue="scheduling" className="w-full">
          <TabsList className="border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduling">
            <div className="space-y-6 p-4">
              {/* Schedule Generation Section */}
              <div>
                <h3 className="text-lg font-bold">Schedule Generation</h3>
                <h4 className="text-sm text-muted-foreground mb-4">
                  Ensure The Employee&apos;s Work Schedule Is Set Correctly First By Checking The
                  Work Schedules Table Below
                </h4>
                <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <ExpandableCard id="generate-single-schedule" title="Generate A Single Schedule">
                    <CardContent>
                      <PopoverForm
                        onSubmit={(employeeName: string, weeks?: string) =>
                          handleGenerateSingleSchedule(employeeName, weeks)
                        }
                        buttonText="Select Employee"
                        placeholder="Enter employee name and weeks"
                        formType="generate"
                      />
                    </CardContent>
                  </ExpandableCard>

                  <ExpandableCard id="generate-all-schedules" title="Generate All Schedules">
                    <CardContent>
                      <PopoverForm
                        onSubmit={(_, weeks?: string) => {
                          generateSchedulesMutation.mutate(weeks || '1');
                        }}
                        buttonText="Select # Of Weeks"
                        placeholder="Enter number of weeks"
                        formType="generateAll"
                      />
                    </CardContent>
                  </ExpandableCard>
                </div>
              </div>

              {/* Schedule Management Section */}
              <div>
                <h3 className="text-lg font-bold mb-4">Schedule Management</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ExpandableCard id="add-schedule" title="Add A Shift">
                    <CardContent>
                      <PopoverForm
                        onSubmit={handleAddSchedule}
                        buttonText="Add Unscheduled Shift"
                        placeholder="Enter employee name and details"
                        formType="addSchedule"
                        open={popoverQuery.data ?? false}
                        onOpenChange={(open) => {
                          queryClient.setQueryData<PopoverState>(['popoverState'], open);
                        }}
                      />
                    </CardContent>
                  </ExpandableCard>

                  <ExpandableCard id="update-schedule" title="Update A Shift">
                    <CardContent>
                      <PopoverForm
                        onSubmit={handleUpdateSchedule}
                        buttonText="Update An Existing Shift"
                        placeholder="Enter employee name and details"
                        formType="updateSchedule"
                        fetchSchedule={fetchSchedule}
                        open={updateSchedulePopoverOpen}
                        onOpenChange={setUpdateSchedulePopoverOpen}
                      />
                    </CardContent>
                  </ExpandableCard>

                  <ExpandableCard id="clear-schedule" title="Clear A Schedule">
                    <CardContent>
                      <PopoverForm
                        onSubmit={(employeeName: string) => handleClearSchedule(employeeName)}
                        buttonText="Select Employee"
                        placeholder="Enter employee name"
                        formType="clearSchedule"
                      />
                    </CardContent>
                  </ExpandableCard>
                </div>
              </div>

              {/* Schedule Display Section */}
              <div>
                <h3 className="text-lg font-bold mb-4">Work Schedules</h3>
                <Card>
                  <CardContent>
                    <DataTable
                      columns={scheduleColumns}
                      data={referenceSchedules}
                      sorting={sorting}
                      onSortingChange={setSorting}
                      fetchReferenceSchedules={fetchReferenceSchedules}
                      fetchActualSchedules={fetchActualSchedules}
                      showPagination={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timesheets">
            {/* <Card>
              <CardContent className="px-1 sm:px-6"> */}
            <div className="grid p-2 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <ExpandableCard id="add-timesheet" title="Add Timesheet Entry">
                <AddTimesheetForm onTimesheetAdded={handleAddTimeSheetEntry} />
              </ExpandableCard>
            </div>

            <div className="w-full overflow-hidden">
              <TimesheetDataTable
                columns={timesheetColumns}
                data={timesheets}
                fetchTimesheets={fetchTimesheets}
                showDecimalHours={showDecimalHours}
                onShowDecimalHoursChange={setShowDecimalHours}
              />
            </div>
            {/* </CardContent>
            </Card> */}
          </TabsContent>
        </Tabs>
      </Card>
    </RoleBasedWrapper>
  );
};

export default ManageSchedules;
