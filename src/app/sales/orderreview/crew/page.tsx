"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Order, createColumns } from "../crewcolumns";
import { DataTable } from "../crew-data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { OrderTableToolbar } from "../crew-order-table-toolbar";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const title = "Check Order Status";

export default function OrdersReviewPage() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderData = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
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

  const markAsRead = async (orderId: number) => {
    const { error } = await supabase
      .from("orders")
      .update({ is_read: true })
      .eq("id", orderId);

    if (error) {
      console.error("Error marking order as read:", error);
    } else {
      setData((currentData) =>
        currentData.map((order) =>
          order.id === orderId ? { ...order, is_read: true } : order
        )
      );
    }
  };

  const markAsContacted = async (orderId: number) => {
    console.log(`Marking order ${orderId} as contacted`);
    const { error } = await supabase
      .from("orders")
      .update({ contacted: true, is_read: true })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
    } else {
      setData((currentData) =>
        currentData.map((order) =>
          order.id === orderId
            ? { ...order, contacted: true, is_read: true }
            : order
        )
      );
    }
  };

  const undoMarkAsContacted = async (orderId: number) => {
    console.log(`Undo marking order ${orderId} as contacted`);
    const { error } = await supabase
      .from("orders")
      .update({ contacted: false, is_read: false })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
    } else {
      setData((currentData) =>
        currentData.map((order) =>
          order.id === orderId
            ? { ...order, contacted: false, is_read: false }
            : order
        )
      );
    }
  };

  const setStatus = async (orderId: number, status: string) => {
    console.log(`Setting status of order ${orderId} to ${status}`);
    const { error } = await supabase
      .from("orders")
      .update({ status, is_read: true })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      setData((currentData) =>
        currentData.map((order) =>
          order.id === orderId ? { ...order, status, is_read: true } : order
        )
      );
    }
  };

  const columns = createColumns(
    markAsContacted,
    undoMarkAsContacted,
    setStatus
  );

  const table = useReactTable({
    data,
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

  return (
    <RoleBasedWrapper allowedRoles={["user", "admin", "super admin"]}>
      <div className="h-screen flex flex-col">
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                <TextGenerateEffect words={title} />
              </h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4">
            <OrderTableToolbar table={table} />
            <div className="rounded-md border flex-1 flex flex-col">
              <div className="relative w-full h-full overflow-auto flex-1">
                {loading ? <p>Loading...</p> : <DataTable table={table} />}
              </div>
            </div>
          </div>
        </section>
      </div>
    </RoleBasedWrapper>
  );
}
