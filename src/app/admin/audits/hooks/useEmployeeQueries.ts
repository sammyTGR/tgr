import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';

export const useFilteredEmployees = () => {
  return useQuery({
    queryKey: ['filteredEmployees'],
    queryFn: async () => {
      // Get all audit data first
      const { data: auditData, error: auditError } = await supabase
        .from('Auditsinput')
        .select('salesreps')
        .not('salesreps', 'is', null);

      if (auditError) throw auditError;

      // Get employees with department info
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('lanid, department');

      if (employeesError) throw employeesError;

      // Create a map of employee departments
      const employeeDepartments = new Map(
        employeesData?.map((emp) => [emp.lanid, emp.department]) || []
      );

      // Get unique salesreps from audit data
      const uniqueSalesReps = Array.from(new Set(auditData.map((audit) => audit.salesreps)));

      // Filter and transform the data
      return uniqueSalesReps
        .map((lanid) => ({
          lanid,
          department: employeeDepartments.get(lanid),
        }))
        .filter((emp) => emp.department !== 'Operations')
        .sort((a, b) => a.lanid.localeCompare(b.lanid));
    },
  });
};
