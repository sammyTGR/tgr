// "use client";
// import dynamic from "next/dynamic";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";

// const LandingPagePublic = dynamic(() => import("./LandingPagePublic"));

// const LandingPage: React.FC = () => {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchRoleAndRedirect = async () => {
//       const { data: userData, error: userError } =
//         await supabase.auth.getUser();
//       if (userError || !userData.user) {
//         console.error("Error fetching user:", userError?.message);
//         setLoading(false);
//         return;
//       }

//       const user = userData.user;

//       // Check the employees table
//       const { data: roleData, error: roleError } = await supabase
//         .from("employees")
//         .select("role, employee_id")
//         .eq("user_uuid", user.id)
//         .single();

//       if (roleError || !roleData) {
//         // Check the profiles table if not found in employees table
//         const { data: customerData, error: customerError } = await supabase
//           .from("profiles")
//           .select("role")
//           .eq("email", user.email)
//           .single();

//         if (customerError || !customerData) {
//           console.error(
//             "Error fetching role:",
//             roleError?.message || customerError?.message
//           );
//           setLoading(false);
//           return;
//         }

//         const role = customerData.role;
//         if (role === "customer") {
//           router.push(`/profiles/customer/${user.id}`);
//         } else {
//           router.push(`/profiles/user/${user.id}`);
//         }
//       } else {
//         const { role, employee_id } = roleData;
//         switch (role) {
//           case "admin":
//             router.push(`/TGR/crew/profile/${employee_id}`);
//             break;
//           case "super admin":
//             router.push(`/TGR/crew/profile/${employee_id}`);
//             break;
//           case "gunsmith":
//             router.push(`/TGR/crew/profile/${employee_id}`);
//             break;
//           case "auditor":
//             router.push(`/TGR/crew/profile/${employee_id}`);
//             break;
//           default:
//             router.push(`/TGR/crew/profile/${employee_id}`);
//             break;
//         }
//       }

//       setLoading(false);
//     };

//     fetchRoleAndRedirect();
//   }, [router]);

//   if (loading) {
//     return <div>Loading...</div>; // Show loading spinner or any placeholder
//   }

//   return <LandingPagePublic />;
// };

// export default LandingPage;
