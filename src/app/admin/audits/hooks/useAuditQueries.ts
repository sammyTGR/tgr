import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Employee, PointsCalculation, AuditData, SummaryData } from '../types';
import { format } from 'date-fns';
import { WeightedScoringCalculator } from '../contest/WeightedScoringCalculator';
import DOMPurify from 'dompurify';

type QueryType<T> = {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
};

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // First, get all employees who have sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select('Lanid')
        .not('subcategory_label', 'is', null)
        .not('subcategory_label', 'eq', '')
        .order('Lanid');

      if (salesError) {
        console.error('Sales data error:', salesError);
        throw salesError;
      }

      // Get all employees who have audit data
      const { data: auditData, error: auditError } = await supabase
        .from('Auditsinput')
        .select('salesreps')
        .order('salesreps');

      if (auditError) {
        console.error('Audit data error:', auditError);
        throw auditError;
      }

      // Get all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('lanid, department')
        .not('department', 'eq', 'Operations')
        .order('lanid');

      if (employeesError) {
        console.error('Employees error:', employeesError);
        throw employeesError;
      }

      // Create sets of lanids from sales and audits
      const salesLanids = new Set(salesData?.map(sale => sale.Lanid.toLowerCase()) || []);
      const auditLanids = new Set(auditData?.map(audit => audit.salesreps.toLowerCase()) || []);

      // Filter employees who have either sales or audit data
      const filteredEmployees = employeesData?.filter(emp => {
        const lowerLanid = emp.lanid.toLowerCase();
        return salesLanids.has(lowerLanid) || auditLanids.has(lowerLanid);
      }) || [];

      // Add some console logs for debugging
      console.log('Sales Lanids count:', salesLanids.size);
      console.log('Audit Lanids count:', auditLanids.size);
      console.log('Filtered Employees count:', filteredEmployees.length);

      return filteredEmployees;
    },
    staleTime: 300000, // Cache for 5 minutes
  });
};

export const usePointsCalculation = () => {
  return useQuery({
    queryKey: ['pointsCalculation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_calculation")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAudits = () => {
  const query: QueryType<AuditData[]> = {
    queryKey: ['audits'],
    queryFn: () => {
      return Promise.resolve(
        supabase
          .from('Auditsinput')
          .select('*')
          .order('audit_date', { ascending: false })
      ).then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((audit: AuditData) => ({
          ...audit,
          dros_number: DOMPurify.sanitize(audit.dros_number),
          salesreps: DOMPurify.sanitize(audit.salesreps),
          error_details: DOMPurify.sanitize(audit.error_details),
          error_notes: DOMPurify.sanitize(audit.error_notes)
        }));
      });
    }
  };

  return useQuery<AuditData[], Error>(query);
};

interface DatabaseEmployee {
  lanid: string;
  department: string;
}

interface DatabaseSale {
  Lanid: string;
  [key: string]: any;
}

interface DatabaseAudit {
  salesreps: string;
  [key: string]: any;
}

export const useSummaryData = (
  selectedLanid: string | null, 
  showAllEmployees: boolean, 
  selectedDate: Date | null,
  options = {}
) => {
  return useQuery({
    queryKey: ['summaryData', selectedLanid, showAllEmployees, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const queries = [
        supabase.from('employees').select('lanid,department'),
        supabase.from('sales_data')
          .select('*')
          .gte('Date', startDate)
          .lte('Date', endDate)
          .not('subcategory_label', 'is', null),
        supabase.from('Auditsinput')
          .select('*')
          .gte('audit_date', startDate)
          .lte('audit_date', endDate),
        supabase.from('points_calculation').select('*')
      ];

      if (!showAllEmployees && selectedLanid) {
        queries[1] = queries[1].eq('Lanid', selectedLanid);
        queries[2] = queries[2].eq('salesreps', selectedLanid);
      }

      return Promise.all(queries as any).then(([
        { data: employeesData }, 
        { data: salesData },
        { data: auditData },
        { data: pointsData }
      ]) => {
        if (!salesData || !auditData || !employeesData || !pointsData) {
          return [];
        }

        const employeeDepartments = new Map<string, string>(
          (employeesData as DatabaseEmployee[]).map((emp) => [emp.lanid, emp.department])
        );

        const lanidSet = new Set((salesData as DatabaseSale[]).map(sale => sale.Lanid));
        const lanids = showAllEmployees
          ? Array.from(lanidSet)
          : [selectedLanid];

        const summaryData = lanids
          .filter((lanid): lanid is string => Boolean(lanid))
          .map((lanid: string) => {
            const employeeSalesData = (salesData as DatabaseSale[]).filter(
              sale => sale.Lanid === lanid
            );
            const employeeAuditData = (auditData as DatabaseAudit[]).filter(
              audit => audit.salesreps === lanid
            );
            const calculator = new WeightedScoringCalculator({
              salesData: employeeSalesData.map(sale => ({
                ...sale,
                id: sale.id || '',
                subcategory_label: sale.subcategory_label || '',
                dros_cancel: sale.dros_cancel || false
              })),
              auditData: employeeAuditData.map(audit => ({
                ...audit,
                id: audit.id || '',
                error_location: audit.error_location || '',
                audit_date: audit.audit_date || '',
                dros_cancel: audit.dros_cancel || false
              })),
              pointsCalculation: pointsData,
              isOperations: false,
              minimumDros: 20
            });

            return {
              ...calculator.metrics,
              Department: employeeDepartments.get(lanid) || 'Unknown',
              isDivider: false
            } satisfies SummaryData;
          });

        return [
          ...summaryData.filter(emp => emp.Qualified)
            .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0)),
          ...summaryData.filter(emp => !emp.Qualified)
            .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0))
        ];
      });
    },
    enabled: !!selectedDate,
    staleTime: 30000, // Consider data fresh for 30 seconds
    ...options
  });
};

interface MutationError {
  message: string;
}

export const useAuditMutations = () => {
  const queryClient = useQueryClient();

  const submitAudit = useMutation({
    mutationFn: async (formData: any) => {
      const { data, error } = await supabase
        .from('Auditsinput')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });

  const updateAudit = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('Auditsinput')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });

  const deleteAudit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('Auditsinput')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });

  return {
    submitAudit,
    updateAudit,
    deleteAudit,
  };
};

export const useActiveTab = () => {
  return useQuery({
    queryKey: ['activeTab'],
    queryFn: () => 'submit', // default value
    staleTime: Infinity, // Tab state shouldn't go stale
    gcTime: Infinity,
  });
};

export const useUpdateActiveTab = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newTab: string) => Promise.resolve(newTab),
    onSuccess: (newTab) => {
      queryClient.setQueryData(['activeTab'], newTab);
    },
  });
};