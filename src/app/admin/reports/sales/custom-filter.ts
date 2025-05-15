import { FilterFn } from '@tanstack/react-table';

export const includesArrayString: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);
  return filterValue.includes(value);
};
