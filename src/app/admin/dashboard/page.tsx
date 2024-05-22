import { SearchUsers } from "@/app/admin/dashboard/_search-users";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

export default async function Dashboard() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SearchUsers />
    </Suspense>
  );
}
