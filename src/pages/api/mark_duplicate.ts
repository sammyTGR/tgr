import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/client";
import { corsHeaders } from '@/utils/cors';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
      }
    
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === "POST") {
    const { request_id } = req.body;

    if (!request_id) {
      res.status(400).json({ error: "Missing request_id" });
      return;
    }

    try {
      // Mark the time off request as a duplicate
      const { error } = await supabase
        .from("time_off_requests")
        .update({ status: "duplicate" })
        .eq("request_id", request_id);

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({ message: "Request marked as duplicate successfully" });
    } catch (error: any) {
      console.error("Error marking request as duplicate:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
