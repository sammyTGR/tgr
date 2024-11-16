// utils.ts
import { format } from 'date-fns';
import { SummaryData } from './types';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';

export const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeData(value)])
    );
  }
  return data;
};

export const exportToExcel = (
  data: SummaryData[],
  showAllEmployees: boolean,
  selectedLanid: string | null,
  selectedDate: Date | null
): void => {
  const exportData = data
    .filter(row => !row.isDivider)
    .map(row => ({
      'Sales Rep': DOMPurify.sanitize(row.Lanid),
      'Total DROS': row.TotalDros ?? '',
      'Minor Mistakes': row.MinorMistakes ?? '',
      'Major Mistakes': row.MajorMistakes ?? '',
      'Cancelled DROS': row.CancelledDros ?? '',
      'Weighted Error Rate': row.WeightedErrorRate ? `${row.WeightedErrorRate}%` : '',
      'Status': DOMPurify.sanitize(row.DisqualificationReason)
    }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Contest Results');

  const dateStr = format(selectedDate || new Date(), 'MMM_yyyy');
  const suffix = showAllEmployees 
    ? '_all_employees' 
    : selectedLanid 
      ? `_${selectedLanid}` 
      : '';

  const fileName = `Sales_Contest_Results_${dateStr}${suffix}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getDateRange = (date: Date) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

export const filterEmployees = (
  employees: Array<{ lanid: string }>, 
  searchText: string
): Array<{ lanid: string }> => {
  return employees.filter(emp => 
    emp.lanid?.toLowerCase().includes(searchText.toLowerCase())
  );
};

export const calculateWeightedErrorRate = (
  minorMistakes: number,
  majorMistakes: number,
  totalDros: number
): number => {
  if (totalDros === 0) return 0;
  return Number(((minorMistakes + (majorMistakes * 2)) / totalDros * 100).toFixed(2));
};

export const processAuditData = (
  data: any[],
  selectedLanid: string | null,
  showAllEmployees: boolean
) => {
  if (!showAllEmployees && selectedLanid) {
    return data.filter(item => item.salesreps === selectedLanid);
  }
  return data;
};

export const validateAuditData = (data: any): boolean => {
  const requiredFields = [
    'dros_number',
    'salesreps',
    'audit_type',
    'trans_date',
    'audit_date',
    'error_location'
  ];

  return requiredFields.every(field => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });
};

export const formatAuditForDisplay = (audit: any) => {
  return {
    ...audit,
    trans_date: format(new Date(audit.trans_date), 'MM/dd/yyyy'),
    audit_date: format(new Date(audit.audit_date), 'MM/dd/yyyy'),
    error_details: DOMPurify.sanitize(audit.error_details || ''),
    error_notes: DOMPurify.sanitize(audit.error_notes || '')
  };
};