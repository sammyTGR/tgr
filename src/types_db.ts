// types_db.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          customer_id: number;
          user_uuid: string;
          email: string;
          role: string;
          created_at: string | null;
          updated_at: string | null;
          first_name: string | null;
          last_name: string | null;
          is_subscribed: boolean;
          subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise' | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          last_payment_date: string | null;
          payment_status: 'active' | 'past_due' | 'canceled' | null;
          stripe_customer_id: string | null;
        };
      };
      class_enrollments: {
        Row: {
          id: number;
          user_id: string | null;
          class_id: number | null;
          payment_status: string;
          stripe_session_id: string | null;
          created_at: string;
          updated_at: string;
          user_name: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          class_id?: number | null;
          payment_status: string;
          stripe_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
          user_name?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          class_id?: number | null;
          payment_status?: string;
          stripe_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
          user_name?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          active: boolean;
          name: string;
          description: string | null;
          image: string | null;
          metadata: Json | null;
        };
      };
      prices: {
        Row: {
          id: string;
          product_id: string;
          active: boolean;
          description: string | null;
          unit_amount: number | null;
          currency: string;
          type: string;
          interval: string | null;
          interval_count: number | null;
          trial_period_days: number | null;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          product_id?: string | null;
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          type?: string | null;
          unit_amount?: number | null;
          interval?: string | null;
          interval_count?: number | null;
          trial_period_days?: number | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          type?: string | null;
          unit_amount?: number | null;
          interval?: string | null;
          interval_count?: number | null;
          trial_period_days?: number | null;
          metadata?: Json | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: string | null;
          metadata: Json | null;
          price_id: string | null;
          quantity: number | null;
          cancel_at_period_end: boolean | null;
          created: string;
          current_period_start: string | null;
          current_period_end: string | null;
          ended_at: string | null;
          cancel_at: string | null;
          canceled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          customer_id: string;
          subscription_id: string | null;
          status: string;
          total: number;
          currency: string;
          created: string;
          period_start: string;
          period_end: string;
          paid: boolean;
          payment_intent_id: string | null;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          price_id: string;
          quantity: number;
          amount: number;
          currency: string;
          description: string | null;
        };
      };
      class_schedules: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          price: number | null;
          stripe_product_id: string | null;
          stripe_price_id: string | null;
        };
      };
      sales_data: {
        Row: {
          id: number;
          Lanid: string | null;
          Invoice: number | null;
          Sku: string | null;
          Desc: string | null;
          SoldPrice: number | null;
          SoldQty: number | null;
          Cost: number | null;
          Acct: number | null;
          Date: string | null;
          Disc: number | null;
          Type: string | null;
          Spiff: number | null;
          Last: string | null;
          LastName: string | null;
          Legacy: string | null;
          Stloc: number | null;
          Cat: number | null;
          Sub: number | null;
          Mfg: string | null;
          CustType: string | null;
          category_label: string | null;
          subcategory_label: string | null;
          status: string | null;
          total_net: number | null;
          'Primary Email': string | null;
          total_gross: number | null;
        };
      };
      employees: {
        Row: {
          employee_id: number;
          name: string | null;
          department: string | null;
          role: string | null;
          contact_info: string | null;
          user_uuid: string | null;
          pay_type: string | null;
          avatar_url: string | null;
          rank: number | null;
          is_online: boolean | null;
          lanid: string | null;
          sick_time_used: number;
          pay_rate: number | null;
          hire_date: string | null;
          birthday: string | null;
          vacation_time: number | null;
          phone_number: string | null;
          street_address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          promotion_date: string | null;
          last_name: string | null;
          term_date: string | null;
          status: string | null;
          extension: number | null;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Customers = Tables<'customers'>;
export type ClassEnrollments = Tables<'class_enrollments'>;
export type Products = Tables<'products'>;
export type Price = Database['public']['Tables']['prices']['Row'];
export type Subscriptions = Tables<'subscriptions'>;
export type Invoices = Tables<'invoices'>;
export type InvoiceItems = Tables<'invoice_items'>;
export type ClassSchedules = Tables<'class_schedules'>;
export type SalesData = Tables<'sales_data'>;
export type Employees = Tables<'employees'>;
