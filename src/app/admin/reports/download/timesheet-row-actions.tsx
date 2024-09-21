import { FC, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimesheetReport } from "./TimesheetTable";
import { ReconcileDialogForm } from "./reconcile-popoverform";

interface TimesheetRowActionsProps {
  row: TimesheetReport;
  onReconcile: (row: TimesheetReport, hours: number) => void;
}

export const TimesheetRowActions: FC<TimesheetRowActionsProps> = ({
  row,
  onReconcile,
}) => {
  const [showReconcileForm, setShowReconcileForm] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowReconcileForm(true)}>
            Reconcile Hours
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {showReconcileForm && (
        <ReconcileDialogForm
          row={row}
          availableSickTime={row.available_sick_time}
          onReconcile={(hours) => {
            onReconcile(row, hours);
            setShowReconcileForm(false);
          }}
          onClose={() => setShowReconcileForm(false)}
          isOpen={showReconcileForm}
        />
      )}
    </>
  );
};
