// src/app/sales/orderreview/order-table-row-actions.tsx

"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Order } from "./columns";
import { statuses } from "./data";

interface OrderTableRowActionsProps<TData> {
  row: Row<TData>;
  markAsContacted: (id: number) => void;
  undoMarkAsContacted: (id: number) => void;
  setStatus: (id: number, status: string) => void;
}

export function OrderTableRowActions<TData>({
  row,
  markAsContacted,
  undoMarkAsContacted,
  setStatus,
}: OrderTableRowActionsProps<TData>) {
  const order = row.original as Order;

  return (
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
        <DropdownMenuItem onClick={() => markAsContacted(order.id)}>
          Mark as Contacted
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => undoMarkAsContacted(order.id)}>
          Undo Mark As Contacted
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={order.status}
              onValueChange={(status) => setStatus(order.id, status)}
            >
              {statuses.map((status) => (
                <DropdownMenuRadioItem key={status.value} value={status.value}>
                  {status.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setStatus(order.id, "")}>
          Clear Status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
