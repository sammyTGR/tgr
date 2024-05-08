"use client"
import { DataTable } from "@/components/ui/data-table"
import { AuditData, columns } from "../auditreview/columns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import Link from "next/link"
import React from "react"
import supabase from "../../../supabase/lib/supabaseClient"

const words = 'Audits'

export default function RealtimeAuditReview() {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<AuditData[]>([]);
    const supabase = createClientComponentClient()
    const router = useRouter();

    useEffect(() => {
        
        const channels = supabase.channel('custom-all-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Auditsinput' },
          () => {
            router.refresh()
            
          }).subscribe();

        return () => {
            supabase.removeChannel(channels)
        };
    }, [supabase, router])
  

    return (
        <div>
      
      <section>
        <div className="hidden h-full flex flex-col space-y-8 p-8 md:flex ">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold"><TextGenerateEffect words={words} /></h2>
            </div>
          </div>
          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                <DataTable columns={columns} data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Link className="fixed bottom-4 left-8" href="/">Home</Link>
    </div>
  );
}