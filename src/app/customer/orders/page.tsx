"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';

interface Purchase {
  id: string;
  created_at: string;
  amount: number;
  product_name: string;
  type: 'product';
}

interface ClassEnrollment {
  id: number;
  created_at: string;
  class_id: number;
  type: 'class';
  classDetails?: ClassDetails;
}

interface ClassDetails {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  price: number;
}

type OrderItem = Purchase | ClassEnrollment;

export default function OrderHistory() {
  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [{ data: purchases, error: purchasesError }, { data: enrollments, error: enrollmentsError }] = await Promise.all([
      supabase
        .from('purchases')
        .select('id, created_at, amount, product_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('class_enrollments')
        .select(`
          id, 
          created_at, 
          class_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    if (purchasesError) throw purchasesError;
    if (enrollmentsError) throw enrollmentsError;

    //console.log('Purchases:', purchases);
    //console.log('Enrollments:', enrollments);

    const formattedPurchases: Purchase[] = (purchases || []).map(p => ({ ...p, type: 'product' as const }));

    const enrollmentsWithDetails: ClassEnrollment[] = await Promise.all((enrollments || []).map(async (e) => {
      try {
        const { data: classDetails, error } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('id', e.class_id)
          .single();

        if (error) {
          console.error('Error fetching class details:', error);
          throw error;
        }

        //console.log('Class Details:', classDetails);

        return {
          ...e,
          type: 'class' as const,
          classDetails: classDetails as ClassDetails
        };
      } catch (error) {
        console.error('Error processing enrollment:', e, error);
        return {
          ...e,
          type: 'class' as const,
          classDetails: undefined
        };
      }
    }));

    const allOrders = [...formattedPurchases, ...enrollmentsWithDetails].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    //console.log('All Orders:', allOrders);

    return allOrders;
  };

  const { data: orders, isLoading, error } = useQuery<OrderItem[]>({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });

  //console.log('Rendered Orders:', orders);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {(error as Error).message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            //console.log('Rendering order:', order);
            return (
              <div key={order.id} className="border p-4 rounded-lg shadow">
                <p className="font-semibold">
                  {order.type === 'product' ? 'Product Purchase' : 'Class Enrollment'}
                </p>
                <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                {order.type === 'product' && (
                  <>
                    <p>Product: {order.product_name}</p>
                    <p>Amount: ${(order.amount / 100).toFixed(2)}</p>
                  </>
                )}
                {order.type === 'class' && order.classDetails ? (
                  <>
                    <p>Class: {order.classDetails.title}</p>
                    <p>Description: {order.classDetails.description}</p>
                    <p>Class Date: {new Date(order.classDetails.start_time).toLocaleDateString()}</p>
                    <p>Time: {new Date(order.classDetails.start_time).toLocaleTimeString()} - {new Date(order.classDetails.end_time).toLocaleTimeString()}</p>
                    <p>Price: ${order.classDetails.price.toFixed(2)}</p>
                  </>
                ) : order.type === 'class' ? (
                  <p>Error loading class details</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
}