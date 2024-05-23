import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { orgRole } = auth();
  return (
    <>
      <div>Your current role is {orgRole}</div>
    </>
  );
}
