"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Purchase {
  id: string;
  created_at: string;
  amount: number;
  product_name: string;
  quantity: number;
  type: "product";
}

interface ClassEnrollment {
  id: number;
  created_at: string;
  class_id: number;
  type: "class";
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const [
      { data: purchases, error: purchasesError },
      { data: enrollments, error: enrollmentsError },
    ] = await Promise.all([
      supabase
        .from("purchases")
        .select("id, created_at, amount, quantity, product_name, stripe_session_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("class_enrollments")
        .select(`
          id, 
          created_at, 
          class_id,
          stripe_session_id
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (purchasesError) throw purchasesError;
    if (enrollmentsError) throw enrollmentsError;

    // Filter out purchases that have a matching stripe_session_id in class_enrollments
    const enrollmentSessionIds = new Set(enrollments?.map(e => e.stripe_session_id) || []);
    const formattedPurchases: Purchase[] = (purchases || [])
      .filter(p => !enrollmentSessionIds.has(p.stripe_session_id))
      .map((p) => ({
        ...p,
        type: "product" as const,
      }));

    const enrollmentsWithDetails: ClassEnrollment[] = await Promise.all(
      (enrollments || []).map(async (e) => {
        try {
          const { data: classDetails, error } = await supabase
            .from("class_schedules")
            .select("*")
            .eq("id", e.class_id)
            .single();

          if (error) {
            console.error("Error fetching class details:", error);
            throw error;
          }

          //console.log('Class Details:', classDetails);

          return {
            ...e,
            type: "class" as const,
            classDetails: classDetails as ClassDetails,
          };
        } catch (error) {
          console.error("Error processing enrollment:", e, error);
          return {
            ...e,
            type: "class" as const,
            classDetails: undefined,
          };
        }
      })
    );

    const allOrders = [...formattedPurchases, ...enrollmentsWithDetails].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    //console.log('All Orders:', allOrders);

    return allOrders;
  };

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<OrderItem[]>({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  //console.log('Rendered Orders:', orders);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {(error as Error).message}</div>;

  const productPurchases =
    orders?.filter((order) => order.type === "product") || [];
  const classEnrollments =
    orders?.filter((order) => order.type === "class") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      {orders && orders.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productPurchases.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.product_name}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>${order.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        ${(order.amount * order.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classEnrollments.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {order.classDetails?.title || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.classDetails?.description || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.classDetails
                          ? `${new Date(
                              order.classDetails.start_time
                            ).toLocaleTimeString()} - 
                           ${new Date(
                             order.classDetails.end_time
                           ).toLocaleTimeString()}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        ${order.classDetails?.price.toFixed(2) || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
}
