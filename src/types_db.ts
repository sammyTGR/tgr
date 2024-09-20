// types_db.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          customer_id: number
          user_uuid: string
          email: string
          role: string
          created_at: string | null
          updated_at: string | null
          first_name: string | null
          last_name: string | null
          is_subscribed: boolean
          subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise' | null
          subscription_start_date: string | null
          subscription_end_date: string | null
          last_payment_date: string | null
          payment_status: 'active' | 'past_due' | 'canceled' | null
          stripe_customer_id: string | null
        }
      }
      products: {
        Row: {
          id: string
          active: boolean
          name: string
          description: string | null
          image: string | null
          metadata: Json | null
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          active: boolean
          description: string | null
          unit_amount: number | null
          currency: string
          type: string
          interval: string | null
          interval_count: number | null
          trial_period_days: number | null
          metadata: Json | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string | null
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          cancel_at_period_end: boolean | null
          created: string
          current_period_start: string | null
          current_period_end: string | null
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          customer_id: string
          subscription_id: string | null
          status: string
          total: number
          currency: string
          created: string
          period_start: string
          period_end: string
          paid: boolean
          payment_intent_id: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          price_id: string
          quantity: number
          amount: number
          currency: string
          description: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Customers = Tables<'customers'>
export type Products = Tables<'products'>
export type Prices = Tables<'prices'>
export type Subscriptions = Tables<'subscriptions'>
export type Invoices = Tables<'invoices'>
export type InvoiceItems = Tables<'invoice_items'>