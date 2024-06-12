import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

const useUnreadOrders = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadOrders = async () => {
    const { data, count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("is_read", false); // Assuming 'is_read' is a boolean column

    if (error) {
      console.error("Error fetching unread orders:", error);
    } else {
      setUnreadCount(count || 0);

      // Mark fetched unread orders as read
      if (data && data.length > 0) {
        const orderIds = data.map((order) => order.id);
        const { error: updateError } = await supabase
          .from("orders")
          .update({ is_read: true })
          .in("id", orderIds);

        if (updateError) {
          console.error("Error marking orders as read:", updateError);
        }
      }
    }
  };

  useEffect(() => {
    fetchUnreadOrders();

    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchUnreadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return unreadCount;
};

export default useUnreadOrders;
