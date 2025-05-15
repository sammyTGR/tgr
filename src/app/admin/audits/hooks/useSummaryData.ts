import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

const isDrosTransaction = (sale: any) => {
  // A transaction counts as a DROS if:
  // 1. It's in the Dros Fee description
  return sale.Desc?.toLowerCase() === 'Dros Fee'.toLowerCase();
};

export const useSummaryData = (
  selectedLanid: string | null,
  showAllEmployees: boolean,
  selectedDate: Date | null
) => {
  return useQuery({
    queryKey: ['summaryData', selectedLanid, showAllEmployees, selectedDate],
    enabled: !!selectedDate,
    queryFn: async () => {
      if (!selectedDate) return [];

      // Use date-fns to handle date boundaries properly
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      // Format dates for database query
      const formattedStartDate = format(startDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      const formattedEndDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

      // Fetch all required data
      let employeesQuery = supabase.from('employees').select('lanid, department');

      let salesQuery = supabase
        .from('detailed_sales_data')
        .select('*')
        .gte('SoldDate', formattedStartDate)
        .lte('SoldDate', formattedEndDate)
        .eq('Desc', 'Dros Fee');

      let auditQuery = supabase
        .from('Auditsinput')
        .select('*')
        .gte('audit_date', format(startDate, 'yyyy-MM-dd'))
        .lte('audit_date', format(endDate, 'yyyy-MM-dd'));

      const pointsQuery = supabase.from('points_calculation').select('*');

      if (!showAllEmployees && selectedLanid) {
        salesQuery = salesQuery.eq('Lanid', selectedLanid);
        auditQuery = auditQuery.eq('salesreps', selectedLanid);
      }

      const [
        { data: employeesData, error: employeesError },
        { data: salesData, error: salesError },
        { data: auditData, error: auditError },
        { data: pointsCalculation, error: pointsError },
      ] = await Promise.all([employeesQuery, salesQuery, auditQuery, pointsQuery]);

      if (employeesError || salesError || auditError || pointsError) {
        throw new Error('Error fetching data');
      }

      // Get unique lanids from audit data
      const auditLanids = new Set(auditData?.map((audit) => audit.salesreps));

      // Filter sales data to only include employees with audits
      const relevantSalesData = salesData?.filter((sale) => {
        try {
          const saleDate = new Date(sale.SoldDate);
          return !isNaN(saleDate.getTime()); // Validate date
        } catch {
          console.error(`Invalid date for sale:`, sale);
          return false;
        }
      });

      // Get unique lanids from filtered sales data
      const lanids = showAllEmployees
        ? Array.from(new Set(relevantSalesData.map((sale) => sale.Lanid)))
        : [selectedLanid];

      const employeeDepartments = new Map(
        employeesData?.map((emp) => [emp.lanid, emp.department]) || []
      );

      // Calculate summary data
      const summary = lanids.map((lanid) => {
        const employeeSalesData = relevantSalesData.filter((sale) => sale.Lanid === lanid);
        const employeeAuditData = auditData?.filter((audit) => audit.salesreps === lanid);

        const totalDros = employeeSalesData.filter(isDrosTransaction).length;

        let pointsDeducted = 0;

        // Calculate points deducted from cancelled DROS
        employeeSalesData.forEach((sale) => {
          if (sale.dros_cancel === 'Yes') {
            pointsDeducted += 5;
          }
        });

        // Calculate points deducted from audit errors
        employeeAuditData?.forEach((audit) => {
          const auditDate = new Date(audit.audit_date);
          if (auditDate <= selectedDate) {
            pointsCalculation?.forEach((point: PointsCalculation) => {
              if (audit.error_location === point.error_location) {
                pointsDeducted += point.points_deducted;
              } else if (
                point.error_location === 'dros_cancel_field' &&
                audit.dros_cancel === 'Yes'
              ) {
                pointsDeducted += point.points_deducted;
              }
            });
          }
        });

        const totalPoints = 300 - pointsDeducted;
        const errorRate = totalDros > 0 ? (pointsDeducted / totalDros) * 100 : 0;
        const department = employeeDepartments.get(lanid);
        const isOperations = department?.toString() === 'Operations';
        const isQualified = !isOperations && totalDros >= 20;

        return {
          Lanid: lanid,
          Department: department || 'Unknown',
          TotalDros: totalDros,
          PointsDeducted: pointsDeducted,
          TotalPoints: totalPoints,
          ErrorRate: parseFloat(errorRate.toFixed(2)),
          Qualified: isQualified,
          DisqualificationReason: !isQualified
            ? isOperations
              ? 'Not Qualified (Operations Department)'
              : totalDros < 20
                ? 'Not Qualified (< 20 DROS)'
                : 'Not Qualified'
            : 'Qualified',
        };
      });

      // Sort the summary data
      const qualifiedEmployees = summary
        .filter((emp) => emp.Qualified)
        .sort((a, b) => a.ErrorRate - b.ErrorRate);

      const unqualifiedEmployees = summary
        .filter((emp) => !emp.Qualified)
        .sort((a, b) => a.ErrorRate - b.ErrorRate);

      return [...qualifiedEmployees, ...unqualifiedEmployees];
    },
  });
};
