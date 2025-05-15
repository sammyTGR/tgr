export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDateForInput(date: string): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return 'Start date cannot be after end date';
  }

  if (end > new Date()) {
    return 'End date cannot be in the future';
  }

  return null;
}
