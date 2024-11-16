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
  const query: QueryType<Employee[]> = {
    queryKey: ['employees'],
    queryFn: () => {
      return Promise.resolve(
        supabase
          .from('employees')
          .select('*')
          .order('lanid')
      ).then(({ data, error }) => {
        if (error) throw error;
        return data?.map((emp: Employee) => ({
          ...emp,
          lanid: DOMPurify.sanitize(emp.lanid)
        })) || [];
      });
    }
  };

  return useQuery<Employee[], Error>(query);
};

export const usePointsCalculation = () => {
  const query: QueryType<PointsCalculation[]> = {
    queryKey: ['pointsCalculation'],
    queryFn: () => {
      return Promise.resolve(
        supabase
          .from('points_calculation')
          .select('*')
      ).then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      });
    }
  };

  return useQuery<PointsCalculation[], Error>(query);
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
  selectedDate: Date | null
) => {
  const query: QueryType<SummaryData[]> = {
    queryKey: ['summaryData', selectedLanid || 'all', showAllEmployees.toString(), selectedDate?.toISOString() || 'none'],
    queryFn: () => {
      if (!selectedDate) return Promise.resolve([]);

      const startDate = format(selectedDate, 'yyyy-MM-01');
      const endDate = format(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
        'yyyy-MM-dd'
      );

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
              Department: employeeDepartments.get(lanid) || 'Unknown'
            } as SummaryData;
          });

        return [
          ...summaryData.filter(emp => emp.Qualified)
            .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0)),
          ...summaryData.filter(emp => !emp.Qualified)
            .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0))
        ];
      });
    },
    enabled: !!selectedDate
  };

  return useQuery<SummaryData[], Error>(query);
};

interface MutationError {
  message: string;
}

export const useAuditMutations = () => {
  const queryClient = useQueryClient();

  const submitAudit = useMutation<AuditData, MutationError, Partial<AuditData>>({
    mutationFn: (auditData) => {
      return Promise.resolve(
        supabase
          .from('Auditsinput')
          .insert([auditData])
          .select()
          .single()
      ).then(({ data, error }) => {
        if (error) throw { message: error.message };
        return data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });

  const updateAudit = useMutation<AuditData, MutationError, { id: string; updates: Partial<AuditData> }>({
    mutationFn: ({ id, updates }) => {
      return Promise.resolve(
        supabase
          .from('Auditsinput')
          .update(updates)
          .eq('audits_id', id)
          .select()
          .single()
      ).then(({ data, error }) => {
        if (error) throw { message: error.message };
        return data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });

  const deleteAudit = useMutation<void, MutationError, string>({
    mutationFn: (id) => {
      return Promise.resolve(
        supabase
          .from('Auditsinput')
          .delete()
          .eq('audits_id', id)
      ).then(({ error }) => {
        if (error) throw { message: error.message };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });

  return {
    submitAudit,
    updateAudit,
    deleteAudit
  };
};