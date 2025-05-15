import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PopoverForm, SubmitFormData } from '../submit/PopoverForm';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { auditData, Task } from '../review/data-schema';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onAuditUpdated: () => void;
}

export function DataTableRowActions<TData>({
  row,
  onAuditUpdated,
}: DataTableRowActionsProps<TData>) {
  const parsedAudit = auditData.parse(row.original);
  const audit: Task = {
    ...parsedAudit,
    audits_id: parsedAudit.audits_id || parsedAudit.id || null,
  };

  const handleSubmit = async (formData: SubmitFormData) => {
    // console.log("Form submitted:", formData);

    const auditId = formData.audits_id;
    // console.log("Attempting to update audit with ID:", auditId);

    if (!auditId) {
      //console.("No valid audit ID found");
      toast.error('Failed to update audit: Invalid ID');
      return;
    }

    try {
      const updatePayload = {
        dros_number: formData.drosNumber,
        salesreps: formData.salesRep,
        trans_date: formData.transDate,
        audit_date: formData.auditDate,
        dros_cancel: formData.drosCancel,
        audit_type: formData.auditType,
        error_location: formData.errorLocation,
        error_details: formData.errorDetails,
        error_notes: formData.errorNotes,
      };
      // console.log("Update payload:", updatePayload);

      const { data, error } = await supabase
        .from('Auditsinput')
        .update(updatePayload)
        .eq('audits_id', auditId)
        .select();

      // ... rest of the function ...
    } catch (error) {
      //console.("Error updating audit:", error);
      toast.error('Failed to update audit');
    }
  };

  const handleDelete = async () => {
    if (!audit.audits_id) {
      //console.("No valid audit ID found");
      toast.error('Failed to delete audit: Invalid ID');
      return;
    }

    try {
      const { error } = await supabase
        .from('Auditsinput')
        .delete()
        .eq('audits_id', audit.audits_id);

      if (error) throw error;

      toast.success('Audit deleted successfully');
      onAuditUpdated();
    } catch (error) {
      //console.("Error deleting audit:", error);
      toast.error('Failed to delete audit');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <PopoverForm onSubmit={handleSubmit} audit={audit} placeholder="Edit" />
        <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
