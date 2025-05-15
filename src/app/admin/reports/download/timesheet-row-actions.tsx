import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimesheetReport } from './TimesheetTable';
import { ReconcileDialogForm } from './reconcile-popoverform';

interface TimesheetRowActionsProps {
  row: TimesheetReport;
  onReconcile: (row: TimesheetReport, hours: number) => void;
}

export function TimesheetRowActions({ row, onReconcile }: TimesheetRowActionsProps) {
  const [isReconcileDialogOpen, setIsReconcileDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsReconcileDialogOpen(true)}>
            Reconcile Hours
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReconcileDialogForm
        row={row}
        onReconcile={onReconcile}
        onClose={() => setIsReconcileDialogOpen(false)}
        isOpen={isReconcileDialogOpen}
      />
    </>
  );
}
