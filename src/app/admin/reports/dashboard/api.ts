"use client";

import { supabase } from "@/utils/supabase/client";
import { Domain, Suggestion, Certificate } from "./types";

// First, define the types
interface KPIVariant {
  qty: number;
  revenue: number;
  margin?: number;
  soldPrice?: number;
}

interface KPIGroup {
  qty: number;
  revenue: number;
  margin?: number;
  soldPrice?: number;
  variants: Record<string, KPIVariant>;
}

type KPIGroups = Record<string, KPIGroup>;

// Add at the top with other interfaces
interface SalesItem {
  id: string;
  Desc: string;
  Qty: number;
  Margin: number;
  SoldDate: string;
  SubDesc: string;
  CatDesc: string;
  MPN: string;
  Mfg: string;
}

interface KPIResult {
  qty: number;
  revenue: number;
  variants: Record<string, { qty: number; revenue: number }>;
  group: string;
}

// Fetch functions
export const fetchSuggestions = async () => {
  const { data, error } = await supabase
    .from("employee_suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchDomains = async () => {
  const { data, error } = await supabase
    .from("employee_domains")
    .select("*")
    .order("domain");

  if (error) throw error;
  return data;
};

export const fetchCertificates = async () => {
  const { data: activeEmployees, error: employeesError } = await supabase
    .from("employees")
    .select("name")
    .eq("status", "active");

  if (employeesError) throw employeesError;

  const activeNames = activeEmployees.map((emp) => emp.name);

  const { data, error } = await supabase
    .from("certifications")
    .select("id, name, certificate, action_status, expiration, status")
    .in("name", activeNames)
    .lt(
      "expiration",
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("expiration", { ascending: true });

  if (error) throw error;

  // Transform and validate the data
  const transformedData =
    data?.map((cert) => {
      // console.log("Raw cert data:", cert); // Debug log
      return {
        id: cert.id,
        name: cert.name || "",
        certificate: cert.certificate || "",
        action_status: cert.action_status || "N/A",
        expiration: cert.expiration ? new Date(cert.expiration) : null,
      } as Certificate;
    }) || [];

  // console.log("Transformed data:", transformedData); // Debug log
  return transformedData;
};

export const fetchLatestRangeWalkReport = async () => {
  const { data, error } = await supabase
    .from("range_walk_reports")
    .select("*")
    .order("date_of_walk", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

export const fetchLatestChecklistSubmission = async () => {
  const { data, error } = await supabase
    .from("checklist_submissions")
    .select("*")
    .order("submission_date", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

export const fetchLatestGunsmithMaintenance = async () => {
  const { data, error } = await supabase
    .from("firearms_maintenance")
    .select("id, firearm_name, last_maintenance_date")
    .order("last_maintenance_date", { ascending: false })
    .limit(5)
    .not("last_maintenance_date", "is", null);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

export const fetchLatestDailyDeposit = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("daily_deposits")
    .select("*")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Group deposits by register
  const deposits = data?.reduce((acc: any[], deposit) => {
    return [
      ...acc,
      {
        name: `Register ${deposit.register}`,
        value: deposit.total_to_deposit?.toFixed(2) || "0.00",
      },
    ];
  }, []);

  // Return the first deposit's metadata along with all register deposits
  return {
    created_at: data?.[0]?.created_at || null,
    employee_name: data?.[0]?.employee_name || null,
    register: "All Registers",
    total_to_deposit: data?.reduce(
      (sum, deposit) => sum + (deposit.total_to_deposit || 0),
      0
    ),
    details: deposits,
  };
};

export const fetchDailyChecklistStatus = async () => {
  const { data, error } = await supabase
    .from("firearms_maintenance")
    .select("id, last_maintenance_date")
    .eq("rental_notes", "With Gunsmith");

  if (error) throw error;

  const firearmsCount = data.length;
  const lastSubmission = data.reduce((latest: string | null, current) => {
    return latest && latest > (current.last_maintenance_date ?? "")
      ? latest
      : (current.last_maintenance_date ?? null);
  }, null);

  const submitted = lastSubmission
    ? new Date(lastSubmission) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    : false;

  return {
    submitted,
    lastSubmissionDate: lastSubmission,
    firearmsCount,
  };
};

// Mutation functions
export const addDomainMutation = async (newDomain: string) => {
  const { error } = await supabase
    .from("employee_domains")
    .insert({ domain: newDomain.toLowerCase() });

  if (error) throw error;
};

export const updateDomainMutation = async (domain: Domain) => {
  const { error } = await supabase
    .from("employee_domains")
    .update({ domain: domain.domain.toLowerCase() })
    .eq("id", domain.id);

  if (error) throw error;
};

export const deleteDomainMutation = async (id: number) => {
  const { error } = await supabase
    .from("employee_domains")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const sendEmailMutation = async ({
  email,
  subject,
  templateName,
  templateData,
}: {
  email: string;
  subject: string;
  templateName: string;
  templateData: any;
}) => {
  const response = await fetch("/api/send_email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, subject, templateName, templateData }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const fetchLatestSalesData = async (startDate: Date, endDate: Date) => {
  const utcStartDate = new Date(startDate.toUTCString().slice(0, -4));
  const utcEndDate = new Date(endDate.toUTCString().slice(0, -4));

  const response = await fetch("/api/fetch-sales-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: utcStartDate.toISOString(),
      endDate: utcEndDate.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Error fetching sales data");
  }

  const responseData = await response.json();
  let salesData;

  if (Array.isArray(responseData)) {
    salesData = responseData;
  } else if (responseData && Array.isArray(responseData.data)) {
    salesData = responseData.data;
  } else {
    throw new Error("Unexpected data format");
  }

  return processAndCalculateSalesData(salesData);
};

// Helper function to process sales data
function processAndCalculateSalesData(salesData: any[]) {
  const excludeCategoriesFromChart = [
    "CA Tax Gun Transfer",
    "CA Tax Adjust",
    "CA Excise Tax",
    "CA Excise Tax Adjustment",
  ];

  const excludeCategoriesFromTotalNet = [
    "Pistol",
    "Rifle",
    "Revolver",
    "Shotgun",
    "Receiver",
    ...excludeCategoriesFromChart,
  ];

  let totalGross = 0;
  let totalNetMinusExclusions = 0;
  let totalNet = 0;

  salesData.forEach(
    (item: {
      category_label: string;
      total_gross: number;
      total_net: number;
    }) => {
      const category = item.category_label;
      const grossValue = item.total_gross ?? 0;
      const netValue = item.total_net ?? 0;

      totalGross += grossValue;
      totalNet += netValue;

      if (!excludeCategoriesFromTotalNet.includes(category)) {
        totalNetMinusExclusions += netValue;
      }
    }
  );

  return { totalGross, totalNet, totalNetMinusExclusions, salesData };
}

// Add this mutation function
export const replySuggestion = async ({
  suggestion,
  replyText,
  replierName,
}: {
  suggestion: Suggestion;
  replyText: string;
  replierName: string;
}) => {
  const { error } = await supabase
    .from("employee_suggestions")
    .update({
      is_read: true,
      replied_by: replierName,
      replied_at: new Date().toISOString(),
      reply: replyText,
    })
    .eq("id", suggestion.id);

  if (error) throw error;
};

export const fetchKPIData = async (startDate: Date, endDate: Date) => {
  try {
    // Ensure we have valid dates and set them to start/end of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Format dates for Supabase query
    const formattedStartDate = start.toISOString();
    const formattedEndDate = end.toISOString();

    // Add validation for dates
    if (start > end) {
      throw new Error("Start date cannot be after end date");
    }

    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Create a Set to track processed items
    const processedItems = new Set();

    while (hasMore) {
      let query = supabase
        .from("detailed_sales_data")
        .select(
          `
          id,
          Desc,
          Qty,
          Margin,
          SoldDate,
          SubDesc,
          CatDesc,
          MPN,
          Mfg
        `
        )
        .or(
          `Desc.eq.Ear Muffs,` +
            `Desc.eq.12 & Under Earmuff Rentals,` +
            `Desc.eq.Disposable Earplugs 32db 1 Pair,` +
            `Desc.eq.3M Disposable earplugs 1 pair/pack 200 pack/case,` +
            `Desc.eq.Mirage Clear Lens Safety Glasses,` +
            `Desc.eq.Radians Mirage Clear Lens Safety Glasses,` +
            `Desc.ilike.%Gunsmithing%,` +
            `Desc.ilike.%Pistol Optic Zero Fee%,` +
            `Desc.ilike.%Sight In/ Function Fee%,` +
            `Desc.ilike.%Laser Engraving%,` +
            `Desc.ilike.%Reloaded%,` +
            `SubDesc.eq.Targets,` +
            `CatDesc.eq.Station Rental,` +
            `CatDesc.eq.Gun Range Rental,` +
            `CatDesc.eq.Ammunition,` +
            `CatDesc.eq.Pistol,` +
            `CatDesc.eq.Receiver,` +
            `CatDesc.eq.Revolver,` +
            `CatDesc.eq.Rifle,` +
            `CatDesc.eq.Shotgun`
        )
        .gte("SoldDate", formattedStartDate)
        .lte("SoldDate", formattedEndDate);

      // Add debug logging right after the query
      // console.log("Full query:", query.toString());

      const { data, error } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("SoldDate", { ascending: true });

      // Add detailed logging for the raw data
      // console.log(
      //   "Raw data for 2/11/2025:",
      //   data?.filter((item) => {
      //     const itemDate = new Date(item.SoldDate).toISOString().split("T")[0];
      //     return itemDate === "2025-02-11";
      //   })
      // );

      if (error) {
        console.error("KPI Data fetch error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        // Modify the processedItems check to be more specific
        const processedData = data.filter((item) => {
          // Create a more detailed unique identifier
          const itemId = `${item.SoldDate}-${item.Desc}-${item.id}`; // Changed to use item.id instead
          if (processedItems.has(itemId)) {
            // console.log("Duplicate found:", itemId);
            return false;
          }
          processedItems.add(itemId);
          return true;
        });

        allData = [...allData, ...processedData];
        page++;
        hasMore = data.length === pageSize;
      }
    }

    // Add debug logging for empty results
    if (allData.length === 0) {
      console.warn("No KPI data found for date range:", {
        start: formattedStartDate,
        end: formattedEndDate,
      });
    }

    // Add this specific debug logging
    // console.log(
    //   "2/11/2025 PPE Breakdown:",
    //   allData
    //     .filter((item) => {
    //       const itemDate = new Date(item.SoldDate).toISOString().split("T")[0];
    //       return (
    //         itemDate === "2025-02-11" &&
    //         [
    //           "Ear Muffs",
    //           "12 & Under Earmuff Rentals",
    //           "Disposable Earplugs 32db 1 Pair",
    //           "3M Disposable earplugs 1 pair/pack 200 pack/case",
    //           "Mirage Clear Lens Safety Glasses",
    //           "Radians Mirage Clear Lens Safety Glasses",
    //         ].includes(item.Desc)
    //       );
    //     })
    //     .reduce(
    //       (acc, item) => {
    //         if (!acc[item.Desc]) {
    //           acc[item.Desc] = {
    //             count: 0,
    //             totalQty: 0,
    //             totalMargin: 0,
    //           };
    //         }
    //         acc[item.Desc].count++;
    //         acc[item.Desc].totalQty += Number(item.Qty) || 0;
    //         acc[item.Desc].totalMargin +=
    //           (Number(item.Qty) || 0) * (Number(item.Margin) || 0);
    //         return acc;
    //       },
    //       {} as Record<
    //         string,
    //         { count: number; totalQty: number; totalMargin: number }
    //       >
    //     )
    // );

    // Group and aggregate the data
    const kpiGroups = allData.reduce<Record<string, KPIResult>>((acc, item) => {
      let category = "";
      let variant = "";
      const desc = item.Desc?.toLowerCase() || "";
      const subDesc = item.SubDesc || "Unknown";

      // Updated categorization logic
      if (
        desc.includes("gunsmithing") ||
        desc.includes("sight in/ function fee") ||
        desc.includes("pistol optic zero fee")
      ) {
        category = "Gunsmithing";

        if (desc.includes("parts")) {
          variant = "Gunsmithing Parts";
        } else if (desc.includes("sight in/ function fee")) {
          variant = "Sight In/Function Fee";
        } else if (desc.includes("pistol optic zero fee")) {
          variant = "Pistol Optic Zero Fee";
        } else {
          variant = "Gunsmithing";
        }
      } else if (desc.includes("laser engraving")) {
        category = "Laser Engraving/Stippling";
        variant = item.Desc?.trim() || "Unknown";
      } else if (item.CatDesc === "Ammunition") {
        if (desc.includes("reloaded")) {
          category = "Reloads";
          variant = item.Desc?.trim() || "Unknown";
        } else {
          category = "Factory Ammo";
          variant = item.Mfg?.trim() || "Unknown Manufacturer";
        }
      }
      // Range Rentals categorization logic
      else if (item.SubDesc === "Targets") {
        category = "Range Targets";
        // variant = item.Desc?.trim() || "Unknown";
      } else if (
        [
          "Ear Muffs",
          "12 & Under Earmuff Rentals",
          "Disposable Earplugs 32db 1 Pair",
          "3M Disposable earplugs 1 pair/pack 200 pack/case",
          "Mirage Clear Lens Safety Glasses",
          "Radians Mirage Clear Lens Safety Glasses",
        ].includes(item.Desc)
      ) {
        category = "Range Protection Equipment";
        variant = item.Desc; // Use exact description as variant

        const qty = Number(item.Qty) || 0;
        const margin = Number(item.Margin) || 0;

        if (!acc[category]) {
          acc[category] = {
            qty: 0,
            revenue: 0,
            variants: {},
            group: "Range Rentals",
          };
        }

        // Update category totals
        acc[category].qty += qty;
        acc[category].revenue += margin * qty;

        // Initialize variant if it doesn't exist
        if (!acc[category].variants[variant]) {
          acc[category].variants[variant] = { qty: 0, revenue: 0 };
        }

        // Update variant totals
        acc[category].variants[variant].qty += qty;
        acc[category].variants[variant].revenue += margin * qty;

        // Skip the rest of the categorization logic for these items
        return acc;
      } else if (item.CatDesc === "Station Rental") {
        category = "Range Station Rental";
        variant = item.SubDesc?.trim() || "Standard Station Rental";
      }

      // Simplify Gun Range Rental categorization
      else if (item.CatDesc === "Gun Range Rental") {
        category = "Gun Range Rental";
        if (
          item.SubDesc === "Shooting Bag" ||
          item.SubDesc === "Shooting Sled"
        ) {
          variant = item.SubDesc;
        } else {
          variant = item.SubDesc?.trim() || "Unknown";
        }
      }

      // Add firearms categorization
      else if (
        ["Pistol", "Rifle", "Revolver", "Shotgun", "Receiver"].includes(
          item.CatDesc
        )
      ) {
        category = item.CatDesc;
        variant = item.Mfg?.trim() || "Unknown";
      }

      if (category) {
        if (!acc[category]) {
          acc[category] = {
            qty: 0,
            revenue: 0,
            variants: {},
            group: [
              "Ear Muffs Rental",
              "12 & Under Ear Protection",
              "Disposable Protection",
            ].includes(category)
              ? "Range Protection"
              : category.startsWith("Range") || category === "PPE"
                ? "Range Rentals"
                : [
                      "Pistol",
                      "Receiver",
                      "Revolver",
                      "Rifle",
                      "Shotgun",
                    ].includes(category)
                  ? "Firearms"
                  : "Services",
          };
        }

        const qty = Number(item.Qty) || 0;
        const margin = Number(item.Margin) || 0;
        const revenue = qty * margin; // Calculate revenue as qty * margin

        // Update category totals
        acc[category].qty += qty;
        acc[category].revenue += revenue; // Use calculated revenue

        // Track variants
        if (!acc[category].variants[variant]) {
          acc[category].variants[variant] = { qty: 0, revenue: 0 };
        }
        acc[category].variants[variant].qty += qty;
        acc[category].variants[variant].revenue += revenue; // Use calculated revenue
      }

      return acc;
    }, {});

    // Add more specific debug logging
    // console.log(
    //   "Protection Equipment Items (Raw):",
    //   allData.filter((item) =>
    //     [
    //       "Ear Muffs",
    //       "12 & Under Earmuff Rentals",
    //       "Disposable Earplugs 32db 1 Pair",
    //       "3M Disposable earplugs 1 pair/pack 200 pack/case",
    //       "Mirage Clear Lens Safety Glasses",
    //       "Radians Mirage Clear Lens Safety Glasses",
    //     ].includes(item.Desc)
    //   )
    // );

    // Add debug logging for firearms
    // console.log(
    //   "Firearms Items:",
    //   allData.filter((item) =>
    //     ["Pistol", "Rifle", "Revolver", "Shotgun", "Receiver"].includes(
    //       item.CatDesc
    //     )
    //   )
    // );

    // Add specific debug logging for disposable earplugs
    // console.log(
    //   "Disposable Earplugs Items:",
    //   allData.filter(
    //     (item) =>
    //       item.Desc === "Disposable Earplugs 32db 1 Pair" ||
    //       item.Desc === "3M Disposable earplugs 1 pair/pack 200 pack/case"
    //   )
    // );

    // Add debug logging for totals
    // console.log("PPE Totals:", {
    //   items: allData
    //     .filter((item) =>
    //       [
    //         "Ear Muffs",
    //         "12 & Under Earmuff Rentals",
    //         "Disposable Earplugs 32db 1 Pair",
    //         "3M Disposable earplugs 1 pair/pack 200 pack/case",
    //         "Mirage Clear Lens Safety Glasses",
    //         "Radians Mirage Clear Lens Safety Glasses",
    //       ].includes(item.Desc)
    //     )
    //     .reduce(
    //       (acc, item) => ({
    //         qty: acc.qty + (Number(item.Qty) || 0),
    //         revenue:
    //           acc.revenue +
    //           (Number(item.Margin) || 0) * (Number(item.Qty) || 0),
    //       }),
    //       { qty: 0, revenue: 0 }
    //     ),
    // });

    // Update the debug logging
    // console.log(
    //   "2/11/2025 Detailed PPE Breakdown:",
    //   allData
    //     .filter((item) => {
    //       const itemDate = new Date(item.SoldDate).toISOString().split("T")[0];
    //       return itemDate === "2025-02-11";
    //     })
    //     .map((item) => ({
    //       id: item.id,
    //       Desc: item.Desc,
    //       Qty: item.Qty,
    //       Margin: item.Margin,
    //       Total: (Number(item.Qty) || 0) * (Number(item.Margin) || 0),
    //     }))
    // );

    return kpiGroups;
  } catch (error) {
    console.error("Error in fetchKPIData:", error);
    throw error;
  }
};
