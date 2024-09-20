"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

// Define the shape of an order
interface Order {
  id: string;
  created_at: string;
  amount: number;
  // Add other properties as needed
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setOrders(data as Order[]);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div>
      <h1>Order History</h1>
      {orders.map((order) => (
        <div key={order.id}>
          <p>Order ID: {order.id}</p>
          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
          <p>Amount: ${order.amount / 100}</p>
          {/* Add more order details as needed */}
        </div>
      ))}
    </div>
  );
}