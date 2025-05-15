import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const EmployeeDropdown = ({ employees }: { employees: any[] }) => {
  const router = useRouter();

  const handleEmployeeSelect = (employeeId: string) => {
    router.push(`/TGR/crew/profile/${employeeId}`);
  };

  return (
    <Select onValueChange={handleEmployeeSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select Employee" />
      </SelectTrigger>
      <SelectContent>
        {employees.map((employee) => (
          <SelectItem key={employee.employee_id} value={employee.employee_id}>
            {employee.name} ({employee.role})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EmployeeDropdown;
