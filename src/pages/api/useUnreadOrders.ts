import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

const useUnreadOrders = () => {
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);

  const fetchUnreadOrders = async () => {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread orders:", error);
    } else {
      setUnreadOrderCount(count || 0);
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

  return unreadOrderCount;
};

export default useUnreadOrders;
