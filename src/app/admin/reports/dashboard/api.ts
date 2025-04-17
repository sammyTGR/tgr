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

export interface KPIResult {
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
    // Set precise time boundaries for the day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const formattedStartDate = start.toISOString();

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    // Remove the extra day addition since we're already setting to end of day
    const formattedEndDate = end.toISOString();

    // Add debug logging for date boundaries
    // console.log("Date Range:", {
    //   start: formattedStartDate.split("T")[0] + " 00:00:00",
    //   end: formattedEndDate.split("T")[0] + " 23:59:59",
    // });

    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Create a Set to track processed items
    const processedItems = new Set();
    let duplicateCount = 0;

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
          Mfg,
          Full_Name
        `
        )
        .or(
          `CatDesc.eq.Station Rental,` +
            `CatDesc.eq.Class,` +
            `Desc.ilike.%Gunsmithing%,` +
            `Desc.ilike.%Pistol Optic Zero Fee%,` +
            `Desc.ilike.%Sight In/ Function Fee%,` +
            `Desc.ilike.%Laser Engraving%,` +
            `Desc.ilike.%Reloaded%,` +
            `SubDesc.eq.Targets,` +
            `SubDesc.eq.Shooting Bag,` +
            `SubDesc.eq.Shooting Sled,` +
            `SubDesc.eq.Ear Protection,` +
            `SubDesc.eq.Eye Protection,` +
            `CatDesc.eq.Gun Range Rental,` +
            `CatDesc.eq.Ammunition,` +
            `CatDesc.eq.Pistol,` +
            `CatDesc.eq.Receiver,` +
            `CatDesc.eq.Revolver,` +
            `CatDesc.eq.Rifle,` +
            `CatDesc.eq.Shotgun,` +
            `Desc.eq.Ear Muffs,` +
            `Desc.ilike.%12 & Under Earmuff Rentals%,` +
            `Desc.ilike.%Disposable Earplugs 32db%,` +
            `Desc.ilike.%3M Disposable earplugs%,` +
            `Desc.ilike.%Mirage Clear Lens Safety Glasses%,` +
            `Desc.ilike.%Radians Mirage Clear Lens Safety Glasses%,` +
            `Desc.ilike.%Medium ERP EP4 Ear Plugs%`
        )
        .gte("SoldDate", formattedStartDate)
        .lt("SoldDate", formattedEndDate);

      const { data, error } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("SoldDate", { ascending: true });

      if (error) {
        console.error("KPI Data fetch error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        const processedData = data.filter((item) => {
          const itemId = `${item.SoldDate}-${item.Desc}-${item.id}`;
          if (processedItems.has(itemId)) {
            duplicateCount++;
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

    // Group and aggregate the data
    const kpiGroups = allData.reduce<Record<string, KPIResult>>((acc, item) => {
      const soldDate = new Date(item.SoldDate);
      // Only process items within the date range
      if (soldDate >= start && soldDate <= end) {
        if (item.CatDesc === "Station Rental") {
          // Debug logging for Station Rental entries
          // console.log("Processing Station Rental:", {
          //   id: item.id,
          //   desc: item.Desc,
          //   subDesc: item.SubDesc,
          //   rawSubDesc:
          //     item.SubDesc === null
          //       ? "NULL"
          //       : item.SubDesc === ""
          //         ? "EMPTY"
          //         : item.SubDesc,
          //   qty: item.Qty,
          //   margin: item.Margin,
          //   soldDate: item.SoldDate,
          //   isStandardShooterFee:
          //     item.SubDesc === "Standard Shooter Fee" ||
          //     !item.SubDesc ||
          //     item.SubDesc.trim() === "" ||
          //     (item.SubDesc === null && item.Desc.includes("Shooters Card")),
          // });

          const category = "Range Station Rental";
          // Match SQL query logic: count as Standard Shooter Fee if SubDesc is exactly 'Standard Shooter Fee' or null/empty
          // Also include Shooters Card entries with null SubDesc
          const variant =
            item.SubDesc === "Standard Shooter Fee" ||
            !item.SubDesc ||
            item.SubDesc.trim() === "" ||
            (item.SubDesc === null && item.Desc.includes("Shooters Card"))
              ? "Standard Shooter Fee"
              : item.SubDesc.trim();

          const qty = Number(item.Qty) || 0;
          // For Shooters Card entries with null SubDesc, use standard $26 margin
          const margin =
            item.SubDesc === null && item.Desc.includes("Shooters Card")
              ? 26
              : Number(item.Margin) || 0;

          // Initialize category if needed
          if (!acc[category]) {
            acc[category] = {
              qty: 0,
              revenue: 0,
              variants: {},
              group: "Range Rentals",
            };
          }

          // Initialize variant if needed
          if (!acc[category].variants[variant]) {
            acc[category].variants[variant] = { qty: 0, revenue: 0 };
          }

          // Debug logging before update
          // console.log("Before update:", {
          //   variant,
          //   categoryTotal: acc[category].revenue,
          //   variantTotal: acc[category].variants[variant].revenue,
          //   addingMargin: margin,
          //   currentQty: qty,
          // });

          // Update category totals
          acc[category].qty += qty;
          acc[category].revenue += margin;

          // Update variant totals
          acc[category].variants[variant].qty += qty;
          acc[category].variants[variant].revenue += margin;

          // Debug logging after update
          // console.log("After update:", {
          //   variant,
          //   categoryTotal: acc[category].revenue,
          //   variantTotal: acc[category].variants[variant].revenue,
          //   addedMargin: margin,
          //   runningQty: acc[category].variants[variant].qty,
          // });
        } else {
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
          } else if (
            [
              "Ear Muffs",
              "12 & Under Earmuff Rentals",
              // "Disposable Earplugs 32db 1 Pair",
              // "3M Disposable earplugs 1 pair/pack 200 pack/case",
              // "Mirage Clear Lens Safety Glasses",
              // "Radians Mirage Clear Lens Safety Glasses",
              // "Medium ERP EP4 Ear Plugs",
            ].includes(item.Desc?.trim())
          ) {
            category = "Range Protection Equipment";
            variant = item.Desc?.trim() || "Unknown PPE";
          }

          // Simplify Gun Range Rental categorization
          else if (item.CatDesc === "Gun Range Rental") {
            if (
              item.SubDesc === "Shooting Bag" ||
              item.SubDesc === "Shooting Sled"
            ) {
              category = "Range Shooting Equipment";
              variant = item.SubDesc;
            } else {
              category = "Range Firearm Rental";
              variant = item.SubDesc?.trim() || "Unknown";
            }
          }

          // Add PPE Sold categorization
          else if (item.CatDesc === "Personal Protection Equipment") {
            category = "PPE Sold";
            variant = item.SubDesc?.trim() || "Unknown";
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

          // Add class categorization
          else if (item.CatDesc === "Class") {
            category = "Classes";
            // Combine SubDesc with Full_Name for the variant
            variant = `${item.SubDesc?.trim() || "Unknown Class"} - ${item.Full_Name?.trim() || "Unknown Student"}`;
          }

          if (category) {
            if (!acc[category]) {
              acc[category] = {
                qty: 0,
                revenue: 0,
                variants: {},
                group: [
                  "Ear Muffs",
                  "12 & Under Earmuff Rentals",
                  "Disposable Earplugs 32db 1 Pair",
                  "3M Disposable earplugs 1 pair/pack 200 pack/case",
                  "Mirage Clear Lens Safety Glasses",
                  "Radians Mirage Clear Lens Safety Glasses",
                  "Medium ERP EP4 Ear Plugs",
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
                      : category === "Classes"
                        ? "Classes"
                        : [
                              "Gunsmithing",
                              "Reloads",
                              "Laser Engraving/Stippling",
                            ].includes(category)
                          ? "Services"
                          : "Sales",
              };
            }

            const qty = Number(item.Qty) || 0;
            const margin = Number(item.Margin) || 0;
            const revenue = margin; // Use margin directly for revenue

            // Debug logging for all categories
            // console.log(`Sale:`, {
            //   category,
            //   variant,
            //   qty,
            //   margin,
            //   revenue,
            //   date: item.SoldDate,
            //   id: item.id,
            // });

            // Update category totals
            acc[category].qty += qty;
            acc[category].revenue += revenue;

            // Track variants
            if (!acc[category].variants[variant]) {
              acc[category].variants[variant] = { qty: 0, revenue: 0 };
            }
            acc[category].variants[variant].qty += qty;
            acc[category].variants[variant].revenue += revenue;
          }
        }
      }

      return acc;
    }, {});

    // Add summary logging at the end of the reduce function
    // console.log("=== Firearms Revenue Summary ===");
    ["Pistol", "Rifle", "Revolver", "Shotgun", "Receiver"].forEach(
      (category) => {
        if (kpiGroups[category]) {
          // console.log(`${category}:`, {
          //   totalQty: kpiGroups[category].qty,
          //   totalRevenue: kpiGroups[category].revenue,
          //   variants: Object.entries(kpiGroups[category].variants).map(
          //     ([variant, stats]) => ({
          //       variant,
          //       qty: stats.qty,
          //       revenue: stats.revenue,
          //     })
          //   ),
          // });
        }
      }
    );

    return kpiGroups;
  } catch (error) {
    console.error("Error in fetchKPIData:", error);
    throw error;
  }
};

// Add new function to fetch DROS cancellations
export const fetchDROSCancellations = async (
  startDate: Date,
  endDate: Date
) => {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const formattedStartDate = start.toISOString();

  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);
  const formattedEndDate = end.toISOString();

  // console.log("DROS Date Range:", {
  //   start: formattedStartDate.split("T")[0] + " 00:00:00",
  //   end: formattedEndDate.split("T")[0] + " 23:59:59",
  // });

  const { data, error } = await supabase
    .from("Auditsinput")
    .select("*")
    .eq("dros_cancel", "Yes")
    .gte("trans_date", formattedStartDate)
    .lt("trans_date", formattedEndDate)
    .order("trans_date", { ascending: true });

  if (error) throw error;

  // Process the data into the required format
  const result = {
    qty: data?.length || 0,
    revenue: 0, // No revenue for cancellations
    variants: data?.reduce(
      (acc: Record<string, { qty: number; revenue: number }>, item) => {
        const key = `${item.salesreps} - ${new Date(item.trans_date).toLocaleDateString()}`;
        if (!acc[key]) {
          acc[key] = { qty: 0, revenue: 0 };
        }
        acc[key].qty += 1;
        return acc;
      },
      {}
    ),
    group: "DROS",
  };

  return result;
};
