'use client';

import { createColumnHelper } from '@tanstack/react-table';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import { Suspense, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import DOMPurify from 'dompurify';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DataTableProfile } from './contest/data-table-profile';
import { unstable_cache } from 'next/cache';
// Component imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import SubmitAuditForm from './submit/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SupportNavMenu from '@/components/ui/SupportNavMenu';
import { DataTable } from '@/components/ui/data-table';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Pencil1Icon, TrashIcon, PlusIcon } from '@radix-ui/react-icons';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  WeightedScoringCalculator,
  type SalesData as CalculatorSalesData,
  type AuditData as CalculatorAuditData,
} from './contest/WeightedScoringCalculator';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { ModalStateProvider, useModalState } from '@/context/ModalStateContext';
import AuditChart from './AuditChart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditAuditForm, { AuditData } from './submit/edit-audit-form';
import { HistoricalAuditChart } from './HistoricalAuditChart';
import type { ColumnDef } from '@tanstack/react-table';
import type { CSSProperties } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { CategoryForm } from './components/CategoryForm';
import { ChevronUp } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { CustomCalendarDashboard } from '@/components/ui/calendar';
import type { AuditData as FormAuditData } from './submit/edit-audit-form';
import ApprovedDevices from '@/app/TGR/dros/guide/_components/ApprovedDevices';
import OemFsd from '@/app/TGR/dros/guide/_components/OemFsd';

// Type definitions
interface OptionType {
  label: string;
  value: string;
}

interface ExpandableCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

interface CellProps {
  value: any;
  row: {
    original: {
      Qualified: boolean;
      isDivider?: boolean;
      [key: string]: any;
    };
  };
}

interface DataTableColumn {
  Header: string;
  accessor: string;
  Cell?: (props: { value: any; row: { original: any } }) => JSX.Element;
}

interface DataTableProps {
  columns: Array<{
    Header: string;
    accessor: string;
    Cell?: (props: { value: any; row: { original: any } }) => JSX.Element;
  }>;
  data: any[];
  styles?: Record<string, string>;
}

interface DeleteDialogState {
  isOpen: boolean;
  auditId: string | null;
}

interface DataRow {
  salesreps?: string;
  audits_id?: string;
  dros_number?: string;
  audit_type?: string;
  trans_date?: string;
  audit_date?: string;
  error_location?: string;
  error_details?: string;
  error_notes?: string;
  dros_cancel?: string | boolean;
}

interface Employee {
  lanid: string;
  department?: string;
  role?: string;
  status?: string;
  contact_info?: string;
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
  error_type: string;
  description?: string;
}

interface Audit {
  audits_id: string;
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
  dros_cancel: string;
  created_at?: string;
  updated_at?: string;
}

interface SummaryRowData {
  Lanid: string;
  TotalDros: number | null;
  MinorMistakes: number | null;
  MajorMistakes: number | null;
  CancelledDros: number | null;
  WeightedErrorRate: number | null;
  TotalWeightedMistakes: number | null;
  Qualified: boolean;
  DisqualificationReason: string;
  isDivider?: boolean;
  Department?: string;
}

interface SalesData extends CalculatorSalesData {
  Date: string;
  dros_number: string;
  status: string;
  cancelled_dros: number;
  Department?: string;
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  lanid?: string;
  auditType?: string;
}

interface PageParams {
  tab?: string;
  lanid?: string;
  date?: string;
  showAll?: string;
  search?: string; // Add this
}

interface TableMeta<T> {
  updateMutation: UseMutationResult<any, Error, { auditId: string; data: Partial<Audit> }>;
  deleteMutation: UseMutationResult<any, Error, string>;
}

export interface ModalState {
  isOpen: boolean;
  selectedAudit: Audit | null;
}

interface AuditCategory {
  id: string;
  name: string;
  guidelines: string;
  created_at?: string;
  updated_at?: string;
}

const MODAL_KEY = ['edit-modal-state'] as const;
const AUDITS_KEY = ['audits'] as const;
const DELETE_DIALOG_KEY = ['delete-dialog-state'] as const;
const CACHE_TAGS = {
  EMPLOYEES: 'employees',
  AUDITS: 'audits',
  POINTS_CALCULATION: 'points-calculation',
  SALES_DATA: 'sales-data',
} as const;

// Create Query Client with configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy loaded components with proper types
const LazyDataTable = dynamic<any>(
  () =>
    import('@/components/ui/data-table').then((mod) => ({
      default: mod.DataTable,
    })),
  {
    loading: () => <div className="animate-pulse bg-muted h-64 w-full rounded-md" />,
    ssr: false,
  }
);

const LazyDataTableProfile = dynamic<any>(
  () =>
    import('./contest/data-table-profile').then((mod) => ({
      default: mod.DataTableProfile,
    })),
  {
    loading: () => <div className="animate-pulse bg-muted h-64 w-full rounded-md" />,
    ssr: false,
  }
);

// API Functions
const api = {
  fetchEmployees: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from('employees')
      .select('lanid,department,role,status,contact_info')
      .eq('status', 'active')
      .order('lanid', { ascending: true });

    if (error) throw new Error(`Error fetching employees: ${error.message}`);
    return data || [];
  },

  fetchAudits: async (filters?: AuditFilters): Promise<Audit[]> => {
    let query = supabase.from('Auditsinput').select('*').order('trans_date', { ascending: false });

    if (filters) {
      if (filters.startDate) {
        // Set to start of day in UTC
        const startDate = new Date(filters.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        query = query.gte('trans_date', startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate) {
        // Set to end of day in UTC
        const endDate = new Date(filters.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        query = query.lte('trans_date', endDate.toISOString().split('T')[0]);
      }
      if (filters.lanid) query = query.eq('salesreps', filters.lanid);
      if (filters.auditType) query = query.eq('audit_type', filters.auditType);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error fetching audits: ${error.message}`);

    return data || [];
  },

  fetchHistoricalAuditData: async (lanid: string) => {
    const { data, error } = await supabase
      .from('Auditsinput')
      .select('*')
      .eq('salesreps', lanid)
      .order('audit_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  fetchPointsCalculation: async (): Promise<PointsCalculation[]> => {
    const { data, error } = await supabase
      .from('points_calculation')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw new Error(`Error fetching points calculation: ${error.message}`);
    return data || [];
  },

  fetchSalesData: async (
    startDate: string,
    endDate: string,
    lanid?: string,
    showAllEmployees?: boolean
  ): Promise<SalesData[]> => {
    let query = supabase
      .from('detailed_sales_data')
      .select('*')
      .gte('SoldDate', `${startDate}T00:00:00Z`) // Use UTC time
      .lte('SoldDate', `${endDate}T23:59:59Z`) // Use UTC time
      .eq('Desc', 'Dros Fee');

    if (!showAllEmployees && lanid) {
      query = query.eq('Lanid', lanid);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error fetching sales data: ${error.message}`);

    return (data || [])
      .filter((sale) => {
        const saleDate = new Date(sale.SoldDate);
        return !isNaN(saleDate.getTime());
      })
      .map((sale) => ({
        ...sale,
        SoldDate: format(new Date(sale.SoldDate), 'yyyy-MM-dd HH:mm:ss'),
        Date: format(new Date(sale.SoldDate), 'yyyy-MM-dd'),
        cancelled_dros: sale.cancelled_dros || 0,
      }));
  },

  updateAudit: async (auditId: string, updateData: Partial<Audit>): Promise<Audit> => {
    const { data, error } = await supabase
      .from('Auditsinput')
      .update({
        ...updateData,
        dros_cancel: updateData.dros_cancel ? 'True' : '',
      })
      .eq('audits_id', auditId)
      .select()
      .single();

    if (error) throw new Error(`Error updating audit: ${error.message}`);
    return data;
  },

  deleteAudit: async (auditId: string): Promise<void> => {
    const { error } = await supabase.from('Auditsinput').delete().eq('audits_id', auditId);

    if (error) throw new Error(`Error deleting audit: ${error.message}`);
  },

  fetchAuditCategories: async (): Promise<AuditCategory[]> => {
    const { data, error } = await supabase
      .from('audit_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  createAuditCategory: async (category: Omit<AuditCategory, 'id'>): Promise<AuditCategory> => {
    const { data, error } = await supabase
      .from('audit_categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateAuditCategory: async (
    id: string,
    category: Partial<AuditCategory>
  ): Promise<AuditCategory> => {
    const { data, error } = await supabase
      .from('audit_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteAuditCategory: async (id: string): Promise<void> => {
    const { error } = await supabase.from('audit_categories').delete().eq('id', id);

    if (error) throw error;
  },
};

const useDeleteDialogState = () => {
  const queryClient = useQueryClient();

  const { data: deleteDialogState } = useQuery<DeleteDialogState>({
    queryKey: ['delete-dialog-state'],
    queryFn: () => ({ isOpen: false, auditId: null }),
    staleTime: Infinity,
  });

  const setDeleteDialogState = (newState: DeleteDialogState) => {
    queryClient.setQueryData(['delete-dialog-state'], newState);
  };

  return {
    deleteDialogState: deleteDialogState || { isOpen: false, auditId: null },
    setDeleteDialogState,
  };
};

// Utility Functions
const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'span', 'div', 'br'],
    ALLOWED_ATTR: ['class', 'style'],
    ADD_TAGS: [], // Required to avoid type error
    ADD_ATTR: [], // Required to avoid type error
    USE_PROFILES: { html: true }, // Required to enable HTML sanitization
  });
};

const calculateSummaryData = (
  salesData: SalesData[],
  auditData: FormAuditData[],
  pointsCalculation: PointsCalculation[],
  dateRange: { startDate: string; endDate: string },
  employeesData: Employee[] // Add this parameter
) => {
  try {
    // console.log('Date Range:', dateRange);
    // console.log('Total Sales Data:', salesData.length);
    // console.log('Total Audit Data:', auditData.length);

    // Create a map of employee departments
    const employeeDepartmentMap = new Map<string, { department: string; isOperations: boolean }>();

    employeesData.forEach((employee) => {
      const department = employee.department?.toLowerCase() || '';
      const isOperations = department === 'operations';

      employeeDepartmentMap.set(employee.lanid, {
        department: employee.department || '',
        isOperations,
      });

      // console.log(`Employee ${employee.lanid}: Department=${employee.department}, IsOperations=${isOperations}`);
    });

    // Create a map to store employee data
    const employeeData = new Map<
      string,
      {
        sales: SalesData[];
        audits: CalculatorAuditData[];
        department: string;
        isOperations: boolean;
      }
    >();

    // Process sales data first
    salesData.forEach((sale) => {
      if (!sale.Lanid) return;

      // Get department info from employees table, not sales data
      const employeeInfo = employeeDepartmentMap.get(sale.Lanid);
      const department = employeeInfo?.department || '';
      const isOperations = employeeInfo?.isOperations || false;

      // console.log('Processing sale:', {
      //   lanid: sale.Lanid,
      //   department: department,
      //   isOperations: isOperations
      // });

      const existingData = employeeData.get(sale.Lanid) || {
        sales: [],
        audits: [],
        department: department,
        isOperations: isOperations,
      };

      // Transform sale data to match WeightedScoringCalculator.SalesData type
      const transformedSale: SalesData = {
        ...sale,
        dros_cancel: sale.cancelled_dros?.toString() || '0',
        Desc: sale.Desc || '',
        SoldDate: format(new Date(sale.SoldDate), 'yyyy-MM-dd HH:mm:ss'),
      };

      existingData.sales.push(transformedSale);
      employeeData.set(sale.Lanid, existingData);
    });

    // Process audit data
    auditData.forEach((audit) => {
      if (!audit.salesreps) return;

      // Get or create employee data entry
      const employeeInfo = employeeDepartmentMap.get(audit.salesreps);
      const existingData = employeeData.get(audit.salesreps) || {
        sales: [],
        audits: [],
        department: employeeInfo?.department || '',
        isOperations: employeeInfo?.isOperations || false,
      };

      // Transform audit data to match WeightedScoringCalculator.AuditData type
      const transformedAudit: CalculatorAuditData = {
        id: audit.audits_id,
        salesreps: audit.salesreps,
        error_location: audit.error_location || '',
        audit_date: audit.audit_date || '',
        dros_cancel: audit.dros_cancel || '',
      };

      existingData.audits.push(transformedAudit);
      employeeData.set(audit.salesreps, existingData);
    });

    // Calculate metrics for each employee
    const summaryData = Array.from(employeeData.entries()).map(([lanid, data]) => {
      // console.log(`\nProcessing employee: ${lanid}`);
      // console.log('Total sales before filtering:', data.sales.length);
      // console.log('Total audits before filtering:', data.audits.length);
      // console.log('Department:', data.department);
      // console.log('Is Operations:', data.isOperations);

      // Filter sales data to include only transactions from start of month up to selected date
      const filteredSalesData = data.sales.filter((sale) => {
        const saleDate = new Date(sale.SoldDate);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        // Set time to end of day for endDate to include the entire selected day
        endDate.setHours(23, 59, 59, 999);
        return saleDate >= startDate && saleDate <= endDate;
      });

      // console.log('Filtered sales:', filteredSalesData.length);

      // Filter audit data to include only audits for transactions from start of month up to selected date
      const filteredAuditData = data.audits.filter((audit) => {
        // Find the corresponding sale for this audit
        const sale = data.sales.find((s) => s.dros_number === audit.dros_number);
        if (!sale) return false;

        // Use the transaction date from the sale
        const transDate = new Date(sale.SoldDate);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        // Set time to end of day for endDate to include the entire selected day
        endDate.setHours(23, 59, 59, 999);
        return transDate >= startDate && transDate <= endDate;
      });

      // console.log('Filtered audits:', filteredAuditData.length);

      const calculator = new WeightedScoringCalculator({
        salesData: filteredSalesData,
        auditData: filteredAuditData,
        pointsCalculation,
        isOperations: data.isOperations, // Use the correct isOperations flag
      });

      const metrics = calculator.metrics;
      // console.log('Calculated metrics:', {
      //   TotalDros: metrics.TotalDros,
      //   MinorMistakes: metrics.MinorMistakes,
      //   MajorMistakes: metrics.MajorMistakes,
      //   CancelledDros: metrics.CancelledDros,
      //   WeightedErrorRate: metrics.WeightedErrorRate,
      //   DisqualificationReason: metrics.DisqualificationReason,
      //   IsOperations: data.isOperations,
      // });

      return {
        ...metrics,
        Department: data.department, // Add department to the returned metrics
      };
    });

    // Sort by qualification status and error rate
    return summaryData.sort((a, b) => {
      if (a.Qualified === b.Qualified) {
        return (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0);
      }
      return a.Qualified ? -1 : 1;
    });
  } catch (error) {
    console.error('Error calculating summary data:', error);
    return [];
  }
};

const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

const getMonthDateRange = (date: Date): { startDate: string; endDate: string } => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

// Export Function
const exportToExcel = (
  data: SummaryRowData[],
  selectedDate: Date,
  showAllEmployees: boolean,
  selectedLanid: string | null
): void => {
  const exportData = data
    .filter((row) => !row.isDivider)
    .map((row) => ({
      'Sales Rep': sanitizeHtml(row.Lanid),
      Department: sanitizeHtml(row.Department || ''),
      'Total DROS': row.TotalDros ?? '',
      'Minor Mistakes': row.MinorMistakes ?? '',
      'Major Mistakes': row.MajorMistakes ?? '',
      'Cancelled DROS': row.CancelledDros ?? '',
      'Weighted Error Rate': row.WeightedErrorRate ? `${row.WeightedErrorRate.toFixed(2)}%` : '',
      'Total Weighted Mistakes': row.TotalWeightedMistakes ?? '',
      Status: sanitizeHtml(row.DisqualificationReason),
    }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Contest Results');

  // Format headers
  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center' },
    fill: { fgColor: { rgb: 'CCCCCC' } },
  };

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    ws[address].s = headerStyle;
  }

  // Auto-size columns
  const colWidths = exportData.reduce((widths: number[], row) => {
    Object.values(row).forEach((value, i) => {
      const width = String(value).length;
      widths[i] = Math.max(widths[i] || 0, width);
    });
    return widths;
  }, []);

  ws['!cols'] = colWidths.map((width) => ({ width }));

  const dateStr = format(selectedDate, 'MMM_yyyy');
  const suffix = showAllEmployees ? '_all_employees' : selectedLanid ? `_${selectedLanid}` : '';

  XLSX.writeFile(wb, `Sales_Contest_Results_${dateStr}${suffix}.xlsx`);
};
// Column Definitions and Table Configurations

// Column Helper with proper typing
const columnHelper = createColumnHelper<SummaryRowData>();

// Modal handler for edit operations
const openEditModal = async (audit: Audit): Promise<Partial<Audit> | null> => {
  // Implementation would go here - for now returning null
  // This would typically open your modal UI component
  return null;
};

// Audit action handlers
const handleEditAudit = async (audit: Audit, updateMutation: any): Promise<void> => {
  try {
    const updatedData = await openEditModal(audit);
    if (updatedData) {
      await updateMutation.mutateAsync({
        auditId: audit.audits_id,
        data: updatedData,
      });
      toast.success('Audit updated successfully');
    }
  } catch (error) {
    toast.error(
      `Failed to edit audit: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Summary Table Columns
const summaryColumns: ColumnDef<SummaryRowData>[] = [
  {
    header: 'Sales Rep',
    accessorKey: 'Lanid',
    cell: ({ row: { original } }) => (
      <div className={`text-left align-left ${!original.Qualified ? 'text-gray-400 italic' : ''}`}>
        {sanitizeHtml(original.Lanid)}
      </div>
    ),
  },
  // {
  //   header: "Department",
  //   accessorKey: "Department",
  //   cell: ({ row: { original } }) => (
  //     <div
  //       className={`text-left align-left ${
  //         !original.Qualified ? "text-gray-400 italic" : ""
  //       }`}
  //     >
  //       {sanitizeHtml(original.Department || "")}
  //     </div>
  //   ),
  // },
  {
    header: 'Total DROS',
    accessorKey: 'TotalDros',
    cell: ({ row: { original } }) => (
      <div className={`text-left align-left ${!original.Qualified ? 'text-gray-400 italic' : ''}`}>
        {original.TotalDros === null ? '' : original.TotalDros}
      </div>
    ),
  },
  {
    header: 'Minor Mistakes',
    accessorKey: 'MinorMistakes',
    cell: ({ row: { original } }) => (
      <div className={`text-left align-left ${!original.Qualified ? 'text-gray-400 italic' : ''}`}>
        {original.MinorMistakes === null ? '' : original.MinorMistakes}
      </div>
    ),
  },
  {
    header: 'Major Mistakes',
    accessorKey: 'MajorMistakes',
    cell: ({ row: { original } }) => (
      <div className={`text-left align-left ${!original.Qualified ? 'text-gray-400 italic' : ''}`}>
        {original.MajorMistakes === null ? '' : original.MajorMistakes}
      </div>
    ),
  },
  {
    header: 'Cancelled DROS',
    accessorKey: 'CancelledDros',
    cell: ({ row: { original } }) => (
      <div className={`text-left align-left ${!original.Qualified ? 'text-gray-400 italic' : ''}`}>
        {original.CancelledDros === null ? '' : original.CancelledDros}
      </div>
    ),
  },
  {
    header: 'Weighted Error Rate',
    accessorKey: 'WeightedErrorRate',
    cell: ({ row: { original } }) => (
      <div className={`text-left align-left ${!original.Qualified ? 'text-gray-400 italic' : ''}`}>
        {original.isDivider
          ? ''
          : original.WeightedErrorRate === null
            ? ''
            : `${original.WeightedErrorRate.toFixed(2)}%`}
      </div>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'DisqualificationReason',
    cell: ({ row: { original } }) => (
      <div
        className={`text-left align-left ${
          !original.Qualified ? 'text-red-500' : 'text-green-500'
        }`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(original.DisqualificationReason, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            ALLOW_ARIA_ATTR: false,
            ALLOW_DATA_ATTR: false,
            USE_PROFILES: { html: false },
          }),
        }}
      />
    ),
  },
];

// Update to be a function that takes mutations as parameters
const getAuditColumns = (
  updateAuditMutation: UseMutationResult<any, Error, { auditId: string; data: Partial<Audit> }>,
  deleteAuditMutation: UseMutationResult<any, Error, string>,
  handleDeleteAudit: (auditId: string) => Promise<void>,
  setModalState: (state: ModalState) => void
): ColumnDef<Audit>[] => [
  {
    id: 'dros_number',
    header: 'DROS Number',
    accessorKey: 'dros_number',
    cell: ({ row }) => sanitizeHtml(row.original.dros_number),
  },
  {
    id: 'salesreps',
    header: 'Sales Rep',
    accessorKey: 'salesreps',
    cell: ({ row }) => sanitizeHtml(row.original.salesreps),
  },
  {
    id: 'audit_type',
    header: 'Audit Type',
    accessorKey: 'audit_type',
    cell: ({ row }) => sanitizeHtml(row.original.audit_type),
  },
  {
    id: 'trans_date',
    header: 'Transaction Date',
    accessorKey: 'trans_date',
    cell: ({ row }) => {
      // Create date in UTC to avoid timezone shifts
      const date = new Date(row.original.trans_date + 'T12:00:00Z');
      return format(date, 'MM/dd/yyyy');
    },
  },
  {
    id: 'audit_date',
    header: 'Audit Date',
    accessorKey: 'audit_date',
    cell: ({ row }) => {
      // Create date in UTC to avoid timezone shifts
      const date = new Date(row.original.audit_date + 'T12:00:00Z');
      return format(date, 'MM/dd/yyyy');
    },
  },
  {
    id: 'error_location',
    header: 'Error Location',
    accessorKey: 'error_location',
    cell: ({ row }) => sanitizeHtml(row.original.error_location),
  },
  {
    id: 'error_details',
    header: 'Error Details',
    accessorKey: 'error_details',
    cell: ({ row }) => (
      <div className="max-w-md whitespace-normal">{sanitizeHtml(row.original.error_details)}</div>
    ),
  },
  {
    id: 'error_notes',
    header: 'Notes',
    accessorKey: 'error_notes',
    cell: ({ row }) => (
      <div className="max-w-md whitespace-normal">{sanitizeHtml(row.original.error_notes)}</div>
    ),
  },
  {
    id: 'dros_cancel',
    header: 'DROS Cancel',
    accessorKey: 'dros_cancel',
    cell: ({ row }) => {
      const value = row.original.dros_cancel;
      // Only show "True" if the value is explicitly "True", otherwise show empty string
      return value === 'Yes' ? 'Yes' : '';
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <AuditActions row={row} />,
  },
];

// Profile Table Columns
const profileTableColumns: ColumnDef<SummaryRowData>[] = [
  {
    id: 'TotalDros',
    header: 'Total DROS',
    accessorKey: 'TotalDros',
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.TotalDros === null ? '' : row.original.TotalDros}
      </div>
    ),
  },
  {
    id: 'MinorMistakes',
    header: 'Minor Mistakes',
    accessorKey: 'MinorMistakes',
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.MinorMistakes === null ? '' : row.original.MinorMistakes}
      </div>
    ),
  },
  {
    id: 'MajorMistakes',
    header: 'Major Mistakes',
    accessorKey: 'MajorMistakes',
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.MajorMistakes === null ? '' : row.original.MajorMistakes}
      </div>
    ),
  },
  {
    id: 'WeightedErrorRate',
    header: 'Error Rate',
    accessorKey: 'WeightedErrorRate',
    cell: ({ row }) => (
      <div className="text-center font-semibold text-lg">
        {row.original.WeightedErrorRate === null
          ? ''
          : `${row.original.WeightedErrorRate.toFixed(2)}%`}
      </div>
    ),
  },
];

// Table Configuration Options
const tableOptions = {
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  enableRowSelection: false,
  enableColumnResizing: true,
  enableAutoResetPage: true,
  manualPagination: false,
  globalFilterFn: 'contains',
  getRowId: (row: any) => row.audits_id || row.Lanid,
};

const profileTableOptions = {
  ...tableOptions,
  enablePagination: false,
  enableFiltering: false,
  enableColumnResizing: false,
};

// Custom Table Styles
const tableStyles = {
  table: 'w-full border-collapse',
  thead: 'bg-gray-100',
  th: 'px-4 py-2 text-left font-semibold text-gray-600',
  tr: 'border-b border-gray-200 hover:bg-gray-50',
  td: 'px-4 py-2',
} as const;

const profileTableStyles = {
  ...tableStyles,
  table: 'w-full border-collapse text-center',
  th: 'px-4 py-2 text-center font-semibold text-gray-600',
} as const;
// TanStack Query Hooks

const usePageParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tab = searchParams.get('tab') || 'submit';
  const selectedLanid = searchParams.get('lanid') || null;
  const showAllEmployees = searchParams.get('showAll') === 'true';
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam ? new Date(dateParam + 'T00:00:00') : null;
  const searchText = searchParams.get('search') || '';

  const setParams = useCallback(
    (params: Partial<PageParams>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          current.delete(key);
        } else {
          current.set(key, value.toString());
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    tab,
    selectedLanid,
    showAllEmployees,
    selectedDate,
    searchText,
    setParams,
  };
};

const MetricCard = ({
  title,
  value,
  accessor,
  formatter = (val: any) => val,
}: {
  title: string;
  value: any;
  accessor: string;
  formatter?: (val: any) => any;
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-center">
          <div className="font-semibold text-2xl">
            {value !== null && value !== undefined ? formatter(value) : '-'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Then add the MetricsSection component
const MetricsSection = ({
  metricsData,
  showAllEmployees,
  selectedLanid,
  selectedDate,
}: {
  metricsData: SummaryRowData[];
  showAllEmployees: boolean;
  selectedLanid: string | null;
  selectedDate: Date | null;
}) => {
  if (showAllEmployees || !selectedLanid || !selectedDate || !metricsData?.length) {
    return null;
  }

  const metrics = metricsData[0];

  return (
    <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <MetricCard title="Total # Of DROS" value={metrics?.TotalDros} accessor="TotalDros" />

      <MetricCard title="Minor Mistakes" value={metrics?.MinorMistakes} accessor="MinorMistakes" />

      <MetricCard title="Major Mistakes" value={metrics?.MajorMistakes} accessor="MajorMistakes" />

      <MetricCard title="Cancelled DROS" value={metrics?.CancelledDros} accessor="CancelledDros" />

      <MetricCard
        title="Error Rate"
        value={metrics?.WeightedErrorRate}
        accessor="WeightedErrorRate"
        formatter={(value) => `${Number(value).toFixed(2)}%`}
      />
    </div>
  );
};

const calculateDailyMetrics = (
  salesData: SalesData[],
  auditData: Audit[],
  pointsCalculation: PointsCalculation[],
  employeesData: Employee[],
  selectedLanid: string,
  selectedDate: Date
): SummaryRowData[] => {
  // Format the selected date to YYYY-MM-DD for comparison
  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter sales data for the specific day and employee
  const dailySalesData = salesData.filter((sale) => {
    // Format the sale date to YYYY-MM-DD for comparison
    const saleDateStr = format(new Date(sale.Date), 'yyyy-MM-dd');
    const matches = saleDateStr === targetDateStr && sale.Lanid === selectedLanid;

    return matches;
  });

  // Filter audit data for the specific day and employee
  const dailyAuditData = auditData.filter((audit) => {
    // Format the audit date to YYYY-MM-DD for comparison
    const auditDateStr = format(new Date(audit.audit_date), 'yyyy-MM-dd');
    const matches = auditDateStr === targetDateStr && audit.salesreps === selectedLanid;

    return matches;
  });

  const employeeDepartment = employeesData.find((emp) => emp.lanid === selectedLanid)?.department;

  try {
    const calculator = new WeightedScoringCalculator({
      salesData: dailySalesData.map((sale) => ({
        ...sale,
        Desc: sale.Desc || '', // Use direct field name from DB
        SoldDate: sale.SoldDate || '', // Use direct field name from DB
        dros_cancel: sale.cancelled_dros?.toString() || '0',
        Lanid: sale.Lanid,
        id: sale.id,
      })),
      auditData: dailyAuditData.map((audit) => ({
        ...audit,
        id: audit.audits_id,
      })),
      pointsCalculation,
      isOperations: employeeDepartment?.toLowerCase() === 'operations',
      minimumDros: 0,
    });

    const metrics = {
      ...calculator.metrics,
      Department: employeeDepartment || 'Unknown',
      Lanid: selectedLanid,
      TotalWeightedMistakes: calculator.metrics.TotalWeightedMistakes || 0,
    };

    // Debug calculated metrics
    // console.log("Calculated Metrics:", metrics);

    return [metrics];
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return [
      {
        Lanid: selectedLanid,
        Department: employeeDepartment || 'Unknown',
        TotalDros: dailySalesData.length,
        MinorMistakes: 0,
        MajorMistakes: 0,
        CancelledDros: dailySalesData.filter((sale) => sale.cancelled_dros > 0).length,
        WeightedErrorRate: 0,
        TotalWeightedMistakes: 0,
        Qualified: true,
        DisqualificationReason: '',
      },
    ];
  }
};

// Update the useAuditsPageQueries hook
const useAuditsPageQueries = (pageParams: ReturnType<typeof usePageParams>) => {
  const { selectedDate, selectedLanid, showAllEmployees } = pageParams;
  const queryClient = useQueryClient();

  const getDateRangeFromTimeRange = useCallback((timeRange: string, date: Date | null) => {
    if (!date) return null;

    switch (timeRange) {
      case '7d':
        const sevenDaysAgo = new Date(date);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
          startDate: format(sevenDaysAgo, 'yyyy-MM-dd'),
          endDate: format(date, 'yyyy-MM-dd'),
        };
      case '30d':
        const thirtyDaysAgo = new Date(date);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return {
          startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
          endDate: format(date, 'yyyy-MM-dd'),
        };
      case '90d':
        const ninetyDaysAgo = new Date(date);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return {
          startDate: format(ninetyDaysAgo, 'yyyy-MM-dd'),
          endDate: format(date, 'yyyy-MM-dd'),
        };
      default:
        // Default to current month view
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        return {
          startDate: format(startOfMonth, 'yyyy-MM-dd'),
          endDate: format(date, 'yyyy-MM-dd'),
        };
    }
  }, []);

  const timeRangeQuery = useQuery({
    queryKey: ['timeRange'],
    queryFn: () => '90d', // default value
    staleTime: Infinity,
  });

  const reviewAuditsQuery = useQuery({
    queryKey: ['audits', 'review'],
    queryFn: () => api.fetchAudits(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: pageParams.tab === 'review',
  });

  // Base queries
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: api.fetchEmployees,
    staleTime: Infinity,
  });

  const pointsCalculationQuery = useQuery({
    queryKey: ['pointsCalculation'],
    queryFn: api.fetchPointsCalculation,
    staleTime: Infinity,
  });

  // Date range calculation
  const dateRange = useMemo(() => {
    if (!selectedDate) return null;

    // Work with the selected date directly in UTC
    const targetDate = new Date(selectedDate);

    // Create start date (first day of month) - keep it simple
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);

    // Create end date (selected date) - keep it simple
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    // console.log('Date Range Calculation:', {
    //   selectedDate: selectedDate.toISOString(),
    //   startDate: startDate.toISOString(),
    //   endDate: endDate.toISOString(),
    //   formattedStartDate: format(startDate, 'yyyy-MM-dd'),
    //   formattedEndDate: format(endDate, 'yyyy-MM-dd'),
    // });

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  }, [selectedDate]);

  // Queries
  const salesDataQuery = useQuery({
    queryKey: [
      'salesData',
      dateRange?.startDate,
      dateRange?.endDate,
      selectedLanid,
      showAllEmployees,
    ],
    queryFn: async () => {
      if (!dateRange) return [];
      return api.fetchSalesData(
        dateRange.startDate,
        dateRange.endDate,
        selectedLanid || undefined,
        showAllEmployees
      );
    },
    enabled: !!dateRange,
  });

  const contestAuditsQuery = useQuery({
    queryKey: ['audits', 'contest', dateRange?.startDate, dateRange?.endDate, selectedLanid],
    queryFn: async () => {
      if (!dateRange) return [];
      return api.fetchAudits({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        lanid: selectedLanid || undefined,
      });
    },
    enabled: pageParams.tab === 'contest' && !!dateRange,
  });

  const auditsData = useMemo(() => {
    if (pageParams.tab === 'review') {
      return reviewAuditsQuery.data;
    }
    return contestAuditsQuery.data;
  }, [pageParams.tab, reviewAuditsQuery.data, contestAuditsQuery.data]);

  // Use this for loading states
  const isLoadingAudits =
    pageParams.tab === 'review' ? reviewAuditsQuery.isLoading : contestAuditsQuery.isLoading;

  // Mutations
  const updateAuditMutation = useMutation({
    mutationFn: async ({ auditId, data }: { auditId: string; data: Partial<Audit> }) => {
      const { error } = await supabase.from('Auditsinput').update(data).eq('audits_id', auditId);
      if (error) throw error;
    },
    onMutate: async ({ auditId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['audits'] });

      // Snapshot the previous value
      const previousAudits = queryClient.getQueryData(['audits', 'review']);

      // Optimistically update to the new value
      queryClient.setQueryData(['audits', 'review'], (old: Audit[] = []) => {
        return old.map((audit) => (audit.audits_id === auditId ? { ...audit, ...data } : audit));
      });

      return { previousAudits };
    },
    onError: (err, { auditId }, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['audits', 'review'], context?.previousAudits);
      toast.error(
        `Failed to update audit: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit updated successfully');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });

  const deleteAuditMutation = useMutation({
    mutationFn: api.deleteAudit,
    onMutate: async (auditId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['audits'] });

      // Snapshot the previous value
      const previousAudits = queryClient.getQueryData(['audits', 'review']);

      // Optimistically update to the new value
      queryClient.setQueryData(['audits', 'review'], (old: Audit[] = []) => {
        return old.filter((audit) => audit.audits_id !== auditId);
      });

      return { previousAudits };
    },
    onError: (err, auditId, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['audits', 'review'], context?.previousAudits);
      toast.error(`Error deleting audit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit deleted successfully');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });

  const salesDataMutation = useMutation({
    mutationFn: async (data: SalesData) => {
      const { error } = await supabase.from('sales_data').upsert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      toast.success('Sales data updated successfully');
    },
    onError: (error) => {
      toast.error(
        `Failed to update sales data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    },
  });

  const auditMutation = useMutation({
    mutationFn: async (data: Audit) => {
      const { error } = await supabase.from('Auditsinput').upsert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit data updated successfully');
    },
    onError: (error) => {
      toast.error(
        `Failed to update audit data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    },
  });

  const pointsCalculationMutation = useMutation({
    mutationFn: async (data: PointsCalculation) => {
      const { error } = await supabase.from('points_calculation').upsert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointsCalculation'] });
      toast.success('Points calculation updated successfully');
    },
    onError: (error) => {
      toast.error(
        `Failed to update points calculation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    },
  });

  // Handle delete audit
  const handleDeleteAudit = async (auditId: string) => {
    try {
      await deleteAuditMutation.mutateAsync(auditId);
    } catch (error) {
      // Error handled by mutation's onError
    }
  };

  // Computed summary data
  // Computed summary data
  const summaryData = useMemo(() => {
    if (
      !salesDataQuery.data ||
      !contestAuditsQuery.data ||
      !pointsCalculationQuery.data ||
      !employeesQuery.data || // Add this check
      !dateRange
    ) {
      return [];
    }

    const { startDate, endDate } = dateRange as { startDate: string; endDate: string };

    return calculateSummaryData(
      salesDataQuery.data,
      contestAuditsQuery.data as FormAuditData[],
      pointsCalculationQuery.data,
      { startDate, endDate },
      employeesQuery.data // Add this parameter
    );
  }, [
    salesDataQuery.data,
    contestAuditsQuery.data,
    pointsCalculationQuery.data,
    employeesQuery.data, // Add this dependency
    dateRange,
  ]);

  // Update metricsData to pass selectedDate
  const metricsData = useMemo(() => {
    if (
      !selectedDate ||
      !selectedLanid ||
      showAllEmployees ||
      !salesDataQuery.data ||
      !contestAuditsQuery.data ||
      !pointsCalculationQuery.data ||
      !employeesQuery.data
    )
      return [];

    return calculateDailyMetrics(
      salesDataQuery.data,
      contestAuditsQuery.data,
      pointsCalculationQuery.data,
      employeesQuery.data,
      selectedLanid,
      selectedDate
    );
  }, [
    selectedDate,
    selectedLanid,
    showAllEmployees,
    salesDataQuery.data,
    contestAuditsQuery.data,
    pointsCalculationQuery.data,
    employeesQuery.data,
  ]);

  // Update summaryTableData to always use monthly data
  const summaryTableData = useMemo(() => {
    if (!summaryData) return [];
    return summaryData;
  }, [summaryData]);

  // Event handlers that update URL params
  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        pageParams.setParams({ date: undefined });
        return;
      }

      // Create a clean date without time components to avoid timezone issues
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      // Create date in local timezone at midnight
      const cleanDate = new Date(year, month, day);

      // console.log('handleDateChange:', {
      //   inputDate: date.toISOString(),
      //   cleanDate: cleanDate.toISOString(),
      //   formattedDate: format(cleanDate, 'yyyy-MM-dd'),
      // });

      // Format the date
      const formattedDate = format(cleanDate, 'yyyy-MM-dd');
      pageParams.setParams({ date: formattedDate });

      // Invalidate queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['salesData'] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
    [pageParams.setParams, queryClient]
  );

  const handleEmployeeChange = useCallback(
    (lanid: string) => {
      pageParams.setParams({
        lanid,
        showAll: 'false',
      });
    },
    [pageParams.setParams]
  );

  const handleShowAllChange = useCallback(
    (checked: boolean) => {
      // Always reset the query cache when toggling view
      queryClient.invalidateQueries({
        queryKey: ['salesData'],
      });

      pageParams.setParams({
        showAll: checked.toString(),
        lanid: undefined, // Clear the selected lanid when showing all employees
      });
    },
    [pageParams.setParams, queryClient]
  );

  const handleReset = useCallback(() => {
    pageParams.setParams({
      date: undefined,
      lanid: undefined,
      showAll: undefined,
      search: undefined,
    });
  }, [pageParams.setParams]);

  const handleExport = useCallback(() => {
    if (selectedDate) {
      exportToExcel(summaryData, selectedDate, showAllEmployees, selectedLanid);
    } else {
      toast.error('Please select a date before exporting');
    }
  }, [summaryData, selectedDate, showAllEmployees, selectedLanid]);

  const handleTabChange = useCallback(
    (value: string) => {
      pageParams.setParams({ tab: value });
    },
    [pageParams.setParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      pageParams.setParams({ search: value || undefined });
    },
    [pageParams.setParams]
  );

  const handleTimeRangeChange = useCallback(
    (value: string) => {
      queryClient.setQueryData(['timeRange'], value);
    },
    [queryClient]
  );

  // Inside useAuditsPage hook, add these queries and mutations
  const categoriesQuery = useQuery({
    queryKey: ['audit-categories'],
    queryFn: api.fetchAuditCategories,
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createCategoryMutation = useMutation({
    mutationFn: api.createAuditCategory,
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['audit-categories'] });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<AuditCategory[]>(['audit-categories']);

      // Optimistically update to the new value
      queryClient.setQueryData<AuditCategory[]>(['audit-categories'], (old = []) => {
        return [...old, { ...newCategory, id: `temp-${Date.now()}` }];
      });

      return { previousCategories };
    },
    onError: (err, newCategory, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['audit-categories'], context?.previousCategories);
      toast.error(`Failed to create category: ${err.message}`);
    },
    onSuccess: (newCategory) => {
      // Update the cache with the actual server response
      queryClient.setQueryData<AuditCategory[]>(['audit-categories'], (old = []) => {
        return [...old.filter((cat) => !cat.id.startsWith('temp-')), newCategory];
      });
      toast.success('Category created successfully');
      setIsAddDialogOpen(false);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['audit-categories'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AuditCategory> }) => {
      return api.updateAuditCategory(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['audit-categories'] });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<AuditCategory[]>(['audit-categories']);

      // Optimistically update to the new value
      queryClient.setQueryData<AuditCategory[]>(['audit-categories'], (old = []) => {
        return old.map((cat) => (cat.id === id ? { ...cat, ...data } : cat));
      });

      return { previousCategories };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['audit-categories'], context?.previousCategories);
      toast.error(`Failed to update category: ${err.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-categories'] });
      toast.success('Category updated successfully');
    },
    onSettled: () => {
      // Always close the dialog after the mutation settles
      setIsEditDialogOpen(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('audit_categories').delete().eq('id', categoryId);

      if (error) throw error;
      return categoryId;
    },
    onMutate: async (categoryId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['audit-categories'] });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<AuditCategory[]>(['audit-categories']);

      // Optimistically update to the new value
      queryClient.setQueryData<AuditCategory[]>(['audit-categories'], (old = []) => {
        return old.filter((category) => category.id !== categoryId);
      });

      return { previousCategories };
    },
    onError: (err, categoryId, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['audit-categories'], context?.previousCategories);
      toast.error(`Failed to delete category: ${err.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['audit-categories'] });
    },
  });

  return {
    // Queries
    employeesQuery,
    pointsCalculationQuery,
    contestAuditsQuery,
    reviewAuditsQuery,
    salesDataQuery,

    // Mutations
    updateAuditMutation,
    deleteAuditMutation,
    handleDeleteAudit,

    // Computed data
    summaryData,
    summaryTableData,
    metricsData,

    // Loading states
    isLoading:
      employeesQuery.isLoading ||
      pointsCalculationQuery.isLoading ||
      contestAuditsQuery.isLoading ||
      salesDataQuery.isLoading,

    isError:
      employeesQuery.isError ||
      pointsCalculationQuery.isError ||
      contestAuditsQuery.isError ||
      salesDataQuery.isError,

    error:
      employeesQuery.error ||
      pointsCalculationQuery.error ||
      contestAuditsQuery.error ||
      salesDataQuery.error,

    // Handlers
    timeRangeQuery,
    handlers: {
      handleDateChange,
      handleEmployeeChange,
      handleShowAllChange,
      handleReset,
      handleExport,
      handleTabChange,
      handleSearchChange,
      handleTimeRangeChange,
    },

    // New queries and mutations
    categoriesQuery,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
  };
};

// Realtime subscription hook
const useRealtimeSubscription = () => {
  const queryClient = useQueryClient();

  const subscription = useQuery({
    queryKey: ['realtime-subscription'],
    queryFn: () => {
      const channel = supabase
        .channel('Auditsinput_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Auditsinput',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['audits'] });
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => channel.unsubscribe();
    },
    gcTime: Infinity,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return subscription;
};

// Export combined hook for component use
const useAuditsPage = () => {
  const pageParams = usePageParams();
  const queries = useAuditsPageQueries(pageParams);
  const queryClient = useQueryClient();
  useRealtimeSubscription();

  // Prefetch common data on mount
  useEffect(() => {
    // Prefetch employees data
    queryClient.prefetchQuery({
      queryKey: ['employees'],
      queryFn: api.fetchEmployees,
      staleTime: Infinity,
    });

    // Prefetch points calculation data
    queryClient.prefetchQuery({
      queryKey: ['pointsCalculation'],
      queryFn: api.fetchPointsCalculation,
      staleTime: Infinity,
    });

    // Prefetch audit categories
    queryClient.prefetchQuery({
      queryKey: ['audit-categories'],
      queryFn: api.fetchAuditCategories,
    });

    // Prefetch common audit data
    queryClient.prefetchQuery({
      queryKey: ['audits', 'review'],
      queryFn: () => api.fetchAudits(),
      staleTime: 0,
    });
  }, [queryClient]);

  return {
    ...pageParams,
    ...queries,
  };
};

const AuditActions = ({ row }: { row: { original: Audit } }) => {
  const { setModalState } = useModalState();
  const queryClient = useQueryClient();

  // Get the current user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Use the fetchEmployees API and handle role checking
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee'],
    queryFn: async () => {
      const employees = await api.fetchEmployees();
      if (!user?.email) return null;

      // Match against contact_info instead of lanid
      return employees.find((emp) => emp.contact_info?.toLowerCase() === user.email?.toLowerCase());
    },
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit deleted successfully');
    },
  });

  // Debug logs
  // console.log("Auth User:", user?.email);
  // console.log("Employee Record:", employee);

  const canEditRoles = ['auditor', 'admin', 'super admin', 'dev'];
  const userCanEdit = employee?.role && canEditRoles.includes(employee.role.toLowerCase());

  // console.log("Role Check:", {
  //   userRole: employee?.role,
  //   canEdit: userCanEdit,
  //   allowedRoles: canEditRoles,
  // });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-muted h-4 w-16 rounded" />
      </div>
    );
  }

  // Only render actions if user has permission
  if (!userCanEdit) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setModalState({
            isOpen: true,
            selectedAudit: row.original,
          });
        }}
      >
        <Pencil1Icon className="h-4 w-4" />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={deleteMutation.isPending}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(row.original.audits_id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Add this new query function
const fetchHistoricalAuditData = async (lanid: string | null = null) => {
  let query = supabase.from('Auditsinput').select('*').order('audit_date', { ascending: true });

  if (lanid) {
    query = query.eq('salesreps', lanid);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Main Component Implementation
function AuditsPage() {
  const { modalState, setModalState } = useModalState();
  const {
    // URL Params
    tab,
    selectedLanid,
    showAllEmployees,
    selectedDate,
    searchText,

    // Queries
    employeesQuery,
    pointsCalculationQuery,
    contestAuditsQuery,
    salesDataQuery,
    reviewAuditsQuery,

    // Mutations
    updateAuditMutation,
    deleteAuditMutation,
    handleDeleteAudit,

    // Computed data
    summaryData,
    summaryTableData,
    metricsData,

    // Loading states
    isLoading,
    isError,
    error,

    // Handlers
    timeRangeQuery,
    handlers: {
      handleDateChange,
      handleEmployeeChange,
      handleShowAllChange,
      handleReset,
      handleExport,
      handleTabChange,
      handleSearchChange,
      handleTimeRangeChange,
    },

    // New queries and mutations
    categoriesQuery,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
  } = useAuditsPage();

  // Add edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ auditId, data }: { auditId: string; data: Partial<Audit> }) => {
      return api.updateAudit(auditId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setModalState({ isOpen: false, selectedAudit: null });
      toast.success('Audit updated successfully');
    },
  });

  // Add a separate query for historical data
  const historicalAuditsQuery = useQuery({
    queryKey: ['historicalAudits', selectedLanid],
    queryFn: () => fetchHistoricalAuditData(selectedLanid),
    enabled: !!selectedLanid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Error boundary
  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {error instanceof Error ? error.message : 'An error occurred while loading the page'}
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const ExpandableCard: React.FC<ExpandableCardProps> = ({ id, title, children }) => {
    const isExpanded = expandedCards[id];

    return (
      <Card className={`relative ${isExpanded ? 'h-auto' : 'h-[200px]'}`}>
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
          ${isExpanded ? '' : 'h-[100px] overflow-y-auto pr-4'}
          space-y-2
        `}
        >
          {children}
        </CardContent>
      </Card>
    );
  };

  return (
    <RoleBasedWrapper allowedRoles={['auditor', 'admin', 'ceo', 'super admin', 'dev']}>
      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mb-10 my-8">
          <SupportNavMenu />
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <Tabs value={tab} onValueChange={handleTabChange}>
            <div className="flex items-center space-x-2">
              <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
                <TabsTrigger
                  value="submit"
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Submit Audits
                </TabsTrigger>
                <TabsTrigger
                  value="review"
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Review Audits
                </TabsTrigger>
                <TabsTrigger
                  value="contest"
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Sales Performance
                </TabsTrigger>
                <TabsTrigger
                  value="guidelines"
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Auditing Guidelines
                </TabsTrigger>
                <TabsTrigger
                  value="approved-devices"
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Approved Devices
                </TabsTrigger>
                <TabsTrigger
                  value="fsd-info"
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  OEM FSD Info
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="submit">
              <Card>
                <CardContent className="pt-6">
                  <SubmitAuditForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review">
              <Card>
                <CardContent className="pt-6">
                  {reviewAuditsQuery.isLoading ? (
                    <div className="animate-pulse bg-muted h-64 w-full rounded-md" />
                  ) : reviewAuditsQuery.data ? (
                    <>
                      <DataTable
                        columns={getAuditColumns(
                          updateAuditMutation,
                          deleteAuditMutation,
                          handleDeleteAudit, // Add this parameter
                          setModalState
                        )}
                        data={reviewAuditsQuery.data}
                      />
                      <Dialog
                        open={modalState.isOpen}
                        onOpenChange={(open) =>
                          setModalState({
                            isOpen: open,
                            selectedAudit: open ? modalState.selectedAudit : null,
                          })
                        }
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Audit</DialogTitle>
                          </DialogHeader>
                          {modalState.selectedAudit && (
                            <EditAuditForm
                              audit={modalState.selectedAudit}
                              handleSubmit={(data: Partial<AuditData>) => {
                                const auditData: Partial<Audit> = {
                                  dros_number: data.dros_number || '',
                                  salesreps: data.salesreps || '',
                                  trans_date: data.trans_date || '',
                                  audit_date: data.audit_date || '',
                                  dros_cancel: data.dros_cancel || '',
                                  audit_type: data.audit_type || '',
                                  error_location: data.error_location || '',
                                  error_details: data.error_details || '',
                                  error_notes: data.error_notes || '',
                                };

                                editMutation.mutate({
                                  auditId: modalState.selectedAudit!.audits_id,
                                  data: auditData,
                                });
                              }}
                              handleClose={() =>
                                setModalState({
                                  isOpen: false,
                                  selectedAudit: null,
                                })
                              }
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contest">
              <h1 className="text-xl font-bold mb-2 ml-2">
                <TextGenerateEffect words="Monthly Sales" />
              </h1>

              {/* Controls Grid */}
              <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {/* Employee Selection Card */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Sales Rep</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full">
                      <Select
                        value={selectedLanid || ''}
                        onValueChange={handleEmployeeChange}
                        disabled={showAllEmployees}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <Input
                            placeholder="Search Employee..."
                            value={searchText}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full px-3 py-2"
                          />
                          {employeesQuery.data
                            ?.filter((emp) =>
                              emp.lanid?.toLowerCase().includes(searchText.toLowerCase())
                            )
                            .map((emp) => (
                              <SelectItem key={emp.lanid} value={emp.lanid}>
                                {emp.lanid}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Switch
                        id="show-all"
                        checked={showAllEmployees}
                        onCheckedChange={handleShowAllChange}
                      />
                      <Label htmlFor="show-all">
                        {showAllEmployees ? 'Show Individual Employee' : 'Show All Employees'}
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Date Selection Card */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Select A Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal mb-2"
                        >
                          {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CustomCalendarDashboard
                          selectedDate={selectedDate}
                          onDateChange={(date) => {
                            console.log('Calendar date selected:', date?.toISOString());
                            handleDateChange(date);
                          }}
                          disabledDays={() => false}
                        />
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Mistake Definitions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-primary mb-2">Minor Mistakes</h3>
                      <p className="text-sm text-muted-foreground">
                        Correctable mistakes that can be resolved during pickup without requiring
                        the customer to return.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Mistake Definitions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-primary mb-2">Major Mistakes</h3>
                      <p className="text-sm text-muted-foreground">
                        Serious errors that require the customer to make an additional trip back
                        after pickup to resolve the issue.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <Button variant="destructive" className="w-full" onClick={handleReset}>
                        Clear All Selections
                      </Button>
                      <Button onClick={handleExport} className="w-full" disabled={!selectedDate}>
                        Export to Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Metrics Grid - Only shown for individual employee view */}
              {/* {!showAllEmployees && selectedLanid && (
                <MetricsSection
                  metricsData={metricsData}
                  showAllEmployees={showAllEmployees}
                  selectedLanid={selectedLanid}
                  selectedDate={selectedDate}
                />
              )} */}

              {/* Summary Table */}
              <Card>
                <CardContent>
                  {selectedDate && (
                    <div className="text-left">
                      <DataTableProfile
                        columns={summaryColumns.map((col) => ({
                          Header: col.header as string,
                          accessor: col.id as string,
                          Cell: col.cell as any,
                        }))}
                        data={summaryTableData} // Use summaryTableData for the table
                        {...tableOptions}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Audit Chart */}
              {/* <Card>
                <CardContent> */}
              {selectedDate && (
                <AuditChart
                  data={contestAuditsQuery.data || []}
                  isLoading={contestAuditsQuery.isLoading || salesDataQuery.isLoading}
                  showTimeRangeSelector={false} // This will hide the time range selector
                />
              )}
              {/* </CardContent>
              </Card> */}

              {/* Historical Audit Chart */}
              {/* <Card>
                <CardContent> */}
              {selectedLanid && (
                <HistoricalAuditChart
                  data={historicalAuditsQuery.data || []}
                  selectedLanid={selectedLanid}
                />
              )}
              {/* </CardContent>
              </Card> */}
            </TabsContent>

            <TabsContent value="guidelines">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Auditing Guidelines</CardTitle>
                    <Dialog
                      open={isAddDialogOpen}
                      onOpenChange={(open) => setIsAddDialogOpen(open)}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Guideline
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] w-[90vw]">
                        <DialogHeader>
                          <DialogTitle>Add Guideline</DialogTitle>
                        </DialogHeader>
                        <CategoryForm
                          onSubmit={async (data) => {
                            await createCategoryMutation.mutateAsync(data);
                          }}
                          onCancel={() => setIsAddDialogOpen(false)}
                          isSubmitting={createCategoryMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {categoriesQuery.isLoading ? (
                      <div className="animate-pulse bg-muted h-64 w-full rounded-md" />
                    ) : categoriesQuery.data?.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No categories found. Add your first category to get started.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                        {categoriesQuery.data?.map((category) => (
                          <ExpandableCard key={category.id} id={category.id} title={category.name}>
                            <div className="flex justify-end gap-2 mb-4">
                              <Dialog
                                open={editingCategoryId === category.id}
                                onOpenChange={(open) => {
                                  if (!open) setEditingCategoryId(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingCategoryId(category.id)}
                                  >
                                    <Pencil1Icon className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[800px] w-[90vw]">
                                  <DialogHeader>
                                    <DialogTitle>Edit Category</DialogTitle>
                                  </DialogHeader>
                                  <CategoryForm
                                    category={category}
                                    onSubmit={async (data) => {
                                      await updateCategoryMutation.mutateAsync({
                                        id: category.id,
                                        data,
                                      });
                                      setEditingCategoryId(null); // Close dialog after successful update
                                    }}
                                    onCancel={() => setEditingCategoryId(null)}
                                    isSubmitting={updateCategoryMutation.isPending}
                                  />
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this category? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        try {
                                          await deleteCategoryMutation.mutateAsync(category.id);
                                          toast.success('Category deleted successfully');
                                        } catch (error) {
                                          // Error will be handled by onError callback
                                        }
                                      }}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <div
                              className="prose dark:prose-invert max-w-none
                                [&>ul]:list-disc [&>ol]:list-decimal 
                                [&>ul]:ml-6 [&>ol]:ml-6 
                                [&>ul]:my-4 [&>ol]:my-4
                                [&>ul>li>ul]:list-[circle] [&_ol]:list-decimal
                                [&>ul>li>ul]:ml-6 [&_ol]:ml-6 
                                [&>ul>li>ul]:my-2 [&_ol]:my-2
                                [&>ul>li>ul>li>ul]:list-[square]
                                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 
                                [&_blockquote]:pl-4 [&_blockquote]:italic
                                [&_code]:bg-gray-100 [&_code]:p-1 [&_code]:rounded
                                dark:[&_code]:bg-gray-800
                                [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded
                                dark:[&_pre]:bg-gray-800
                                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4
                                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3
                                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(category.guidelines, {
                                  ALLOWED_TAGS: [
                                    'p',
                                    'br',
                                    'strong',
                                    'em',
                                    'u',
                                    'h1',
                                    'h2',
                                    'h3',
                                    'h4',
                                    'h5',
                                    'h6',
                                    'ul',
                                    'ol',
                                    'li',
                                    'blockquote',
                                    'code',
                                    'pre',
                                    'div',
                                    'span',
                                    'a',
                                    'img',
                                    'table',
                                    'thead',
                                    'tbody',
                                    'tr',
                                    'th',
                                    'td',
                                  ],
                                  ALLOWED_ATTR: [
                                    'href',
                                    'src',
                                    'class',
                                    'style',
                                    'target',
                                    'rel',
                                    'data-type',
                                    'data-align',
                                  ],
                                }),
                              }}
                            />
                          </ExpandableCard>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved-devices">
              <ApprovedDevices />
            </TabsContent>

            <TabsContent value="fsd-info">
              <OemFsd />
            </TabsContent>
          </Tabs>
        </Suspense>
      </main>
    </RoleBasedWrapper>
  );
}

// Export with Query Client Provider
const AuditsPageWithProvider = () => (
  <QueryClientProvider client={queryClient}>
    <ModalStateProvider>
      <AuditsPage />
    </ModalStateProvider>
  </QueryClientProvider>
);

export default AuditsPageWithProvider;
