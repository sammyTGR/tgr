"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auditData } from "./data-schema";
import { useState } from "react";
import { PopoverForm } from "../submit/PopoverForm";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

interface AuditData {
  id: string;
  dros_number: string;
  sales_rep: string;
  trans_date: string;
  audit_date: string;
  dros_cancel: boolean;
  audit_type: string;
  error_location: string;
  error_details: string;
  error_notes?: string;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);
  const parsedAudit = auditData.parse(row.original);
  const audit: AuditData = {
    id: parsedAudit.id ?? "",
    dros_number: parsedAudit.dros_number,
    sales_rep: parsedAudit.salesreps,
    trans_date: parsedAudit.trans_date,
    audit_date: parsedAudit.audit_date,
    dros_cancel: parsedAudit.dros_cancel === "true",
    audit_type: parsedAudit.audit_type,
    error_location: parsedAudit.error_location,
    error_details: parsedAudit.error_details,
    error_notes: parsedAudit.error_notes ?? undefined,
  };

  const handleSubmit = (formData: any) => {
    // Handle form submission
    console.log("Form submitted:", formData);
    setIsEditPopoverOpen(false);
  };

  const handleDelete = () => {
    // Handle delete action
    console.log("Delete audit:", audit.id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onSelect={() => setIsEditPopoverOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isEditPopoverOpen && (
        <PopoverForm
          onSubmit={handleSubmit}
          buttonText="Edit Audit"
          placeholder="Edit Audit Details"
          salesRepOptions={[]}
          auditTypeOptions={[]}
          errorLocationOptions={[]}
          errorDetailsOptions={[]}
          audit={audit}
        />
      )}
    </>
  );
}
