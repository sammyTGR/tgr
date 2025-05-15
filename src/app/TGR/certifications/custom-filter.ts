// src/app/TGR/certifications/custom-filter.ts
import { FilterFn } from '@tanstack/react-table';

export const includesArrayString: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  if (typeof value === 'string') {
    return value.toLowerCase().includes(filterValue.toLowerCase());
  }
  return false;
};
