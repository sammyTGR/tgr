"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Order, createColumns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { OrderTableToolbar } from "./order-table-toolbar";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import { statuses } from "./data";
import { useSidebar } from "@/components/ui/sidebar";

const title = "Review Submissions";

export default function OrdersReviewPage() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>(["not_contacted"]); // Default filter
  const { user } = useRole();
  const { state } = useSidebar();

  const fetchOrderData = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, employee_email")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }
    return data as Order[];
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchOrderData();
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [fetchOrderData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter((order) => {
      // If the filter includes "not_contacted" and it's the only filter, exclude "contacted"
      if (statusFilter.includes("not_contacted") && statusFilter.length === 1) {
        return order.status !== "contacted";
      }
      return statusFilter.includes(order.status);
    });
  }, [data, statusFilter]);

  const sendEmail = async (templateName: string, templateData: any) => {
    try {
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: templateData.recipientEmail,
          subject: templateData.subject,
          templateName: templateName,
          templateData: templateData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  };

  const getEmployeeName = async (employeeEmail: string) => {
    const { data, error } = await supabase
      .from("employees")
      .select("name")
      .eq("contact_info", employeeEmail)
      .single();

    if (error) {
      console.error("Error fetching employee name:", error);
      return "Unknown Employee";
    }

    return data?.name || "Unknown Employee";
  };

  const markAsContacted = async (orderId: number) => {
    const order = data.find((o) => o.id === orderId);
    if (order) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ contacted: true, status: "contacted", is_read: true })
          .eq("id", orderId);

        if (error) throw error;

        setData((currentData) =>
          currentData.map((o) =>
            o.id === orderId
              ? { ...o, contacted: true, status: "contacted", is_read: true }
              : o
          )
        );

        const employeeName = await getEmployeeName(order.employee_email);
        // console.log("Marking as contacted. User name:", userName);

        // Send email to the employee
        const response = await fetch("/api/send_email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: order.employee_email, // Use the new employee_email field
            subject: `${order.customer_name} Contacted for Special Order ${order.id}`,
            templateName: "OrderCustomerContacted",
            templateData: {
              id: order.id,
              customerName: order.customer_name,
              contactedBy: employeeName,
              item: order.item,
              details: order.details,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send email");
        }

        toast.success(
          "Customer marked as contacted and email sent to employee."
        );
      } catch (error) {
        console.error("Error marking as contacted:", error);
        toast.error("Failed to mark as contacted and send email notification.");
      }
    }
  };

  const setStatus = async (orderId: number, status: string) => {
    const order = data.find((o) => o.id === orderId);
    if (order) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ status, is_read: true })
          .eq("id", orderId);

        if (error) throw error;

        setData((currentData) =>
          currentData.map((o) =>
            o.id === orderId ? { ...o, status, is_read: true } : o
          )
        );

        const employeeName = await getEmployeeName(order.employee_email);
        const statusLabel =
          statuses.find((s) => s.value === status)?.label || status;

        // Send email to the employee
        const response = await fetch("/api/send_email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: order.employee_email, // Use the new employee_email field
            subject: `Order Status Updated for ${order.customer_name}`,
            templateName: "OrderSetStatus",
            templateData: {
              id: order.id,
              customerName: order.customer_name,
              newStatus: statusLabel,
              updatedBy: employeeName,
              item: order.item,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send email");
        }

        toast.success("Order status updated and email sent to employee.");
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status and send email notification.");
      }
    }
  };
  const columns = createColumns(setStatus, markAsContacted);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    const OrdersTableSubscription = supabase
      .channel("custom-all-orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((currentData) => [payload.new as Order, ...currentData]);
          } else if (payload.eventType === "UPDATE") {
            setData((currentData) =>
              currentData.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              )
            );
          } else if (payload.eventType === "DELETE") {
            setData((currentData) =>
              currentData.filter((order) => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(OrdersTableSubscription);
    };
  }, [fetchData]);

  const statusOptions = [
    { label: "Ordered", value: "ordered" },
    { label: "Back Ordered", value: "back_ordered" },
    { label: "Needs Payment", value: "needs_payment" },
    { label: "Arrived", value: "arrived" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Complete", value: "complete" },
    { label: "Contacted", value: "contacted" },
    { label: "Tried To Contact", value: "try_contacted" },
  ];

  return (
    <RoleBasedWrapper allowedRoles={["admin", "ceo", "super admin", "dev"]}>
      <div
        className={`relative w-full ml-6 md:w-[calc(100vw-15rem)] md:ml-6 lg:w-[calc(100vw-15rem)] lg:ml-6 h-full overflow-hidden flex-1 transition-all duration-300`}
      >
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                <TextGenerateEffect words={title} />
              </h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4">
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statusOptions}
              table={table}
              onFilterChange={setStatusFilter}
            />
            <div className="rounded-md flex-1 flex flex-col">
              <div
                className={`relative w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-15rem)] h-full overflow-hidden flex-1 transition-all duration-300`}
              >
                {loading ? <p></p> : <DataTable table={table} />}
              </div>
            </div>
          </div>
        </section>
      </div>
    </RoleBasedWrapper>
  );
}
