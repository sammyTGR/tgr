import { FC, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SickTimeUsage {
  request_id: number;
  hours_used: number;
  date_used: string;
  start_date: string;
  end_date: string;
}

interface YearlyHistory {
  year: number;
  total_hours_used: number;
  requests_count: number;
  details: SickTimeUsage[];
}

interface SickTimeReport {
  employee_id: number;
  name: string;
  sick_time_history: YearlyHistory[];
}

interface SickTimeTableProps {
  data: SickTimeReport[];
  isAllExpanded: boolean;
  onExpandCollapseAll: () => void;
}

export const SickTimeTable: FC<SickTimeTableProps> = ({
  data,
  isAllExpanded,
  onExpandCollapseAll,
}) => {
  const queryClient = useQueryClient();

  // Use useQuery for reading the expanded state
  const { data: expandedRows = {} } = useQuery({
    queryKey: ['sickTimeExpandedRows'],
    queryFn: () => ({}) as Record<number, boolean>,
    initialData: {},
  });

  // Use useMutation for updating the expanded state
  const setExpandedRows = useMutation({
    mutationFn: (newState: Record<number, boolean>) => {
      return Promise.resolve(queryClient.setQueryData(['sickTimeExpandedRows'], newState));
    },
  });

  // Update the toggle function
  const toggleExpand = (employee_id: number) => {
    setExpandedRows.mutate({
      ...expandedRows,
      [employee_id]: !expandedRows[employee_id],
    });
  };

  // Effect to handle isAllExpanded prop
  useEffect(() => {
    if (isAllExpanded) {
      const expandAll = data.reduce(
        (acc, row) => {
          acc[row.employee_id] = true;
          return acc;
        },
        {} as Record<number, boolean>
      );
      setExpandedRows.mutate(expandAll);
    } else {
      setExpandedRows.mutate({});
    }
  }, [isAllExpanded, data]);

  // Calculate remaining hours (40 - used hours for current year)
  const getCurrentYearRemaining = (history: YearlyHistory[]) => {
    const currentYear = new Date().getFullYear();
    const currentYearUsage = history.find((h) => h.year === currentYear)?.total_hours_used || 0;
    return Math.max(0, 40 - currentYearUsage);
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Available Sick Time</TableHead>
            <TableHead>Used This Year</TableHead>
            <TableHead>Total Requests</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const currentYear = new Date().getFullYear();
            const currentYearData = row.sick_time_history.find((h) => h.year === currentYear);
            const availableHours = getCurrentYearRemaining(row.sick_time_history);

            return (
              <>
                <TableRow
                  key={row.employee_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpand(row.employee_id)}
                >
                  <TableCell>
                    {expandedRows[row.employee_id] ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{availableHours.toFixed(2)} hours</TableCell>
                  <TableCell>
                    {currentYearData?.total_hours_used.toFixed(2) || '0.00'} hours
                  </TableCell>
                  <TableCell>{currentYearData?.requests_count || 0} request(s)</TableCell>
                </TableRow>
                {expandedRows[row.employee_id] &&
                  row.sick_time_history.map((yearData) => (
                    <>
                      <TableRow key={`${row.employee_id}-${yearData.year}`} className="bg-muted/30">
                        <TableCell></TableCell>
                        <TableCell colSpan={4}>
                          <strong>{yearData.year}</strong> - {yearData.total_hours_used.toFixed(2)}{' '}
                          hours used across {yearData.requests_count} requests
                        </TableCell>
                      </TableRow>
                      {yearData.details.map((usage, index) => (
                        <TableRow
                          key={`${row.employee_id}-${yearData.year}-${index}`}
                          className="text-sm"
                        >
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            {format(new Date(usage.start_date), 'MM/dd/yyyy')}
                            {usage.start_date !== usage.end_date &&
                              ` - ${format(new Date(usage.end_date), 'MM/dd/yyyy')}`}
                          </TableCell>
                          <TableCell>{usage.hours_used.toFixed(2)} hours</TableCell>
                          <TableCell>{format(new Date(usage.date_used), 'MM/dd/yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
