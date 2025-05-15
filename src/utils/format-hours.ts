export const formatHoursAndMinutes = (decimalHours: string | number | null) => {
  if (decimalHours === null || decimalHours === '') return '';
  const value = typeof decimalHours === 'string' ? parseFloat(decimalHours) : decimalHours;
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};
