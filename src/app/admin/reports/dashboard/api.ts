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
    // Set precise time boundaries for the day
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const formattedStartDate = start.toISOString();

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    const formattedEndDate = end.toISOString();

    // Add debug logging
    // console.log("Date boundaries:", {
    //   start: formattedStartDate,
    //   end: formattedEndDate,
    //   rawStart: start,
    //   rawEnd: end,
    // });

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
            `Desc.ilike.%Radians Mirage Clear Lens Safety Glasses%`
        )
        .gte("SoldDate", formattedStartDate)
        .lt("SoldDate", formattedEndDate);

      // Add debug logging
      // console.log("Query:", {
      //   start: formattedStartDate,
      //   end: formattedEndDate,
      //   query: query.toString(),
      // });

      const { data, error } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("SoldDate", { ascending: true });

      // Add debug logging for Station Rental records
      if (data) {
        const stationRentals = data.filter(
          (item) => item.CatDesc === "Station Rental"
        );
        // console.log(
        //   "Station Rental Records:",
        //   stationRentals.map((item) => ({
        //     id: item.id,
        //     date: item.SoldDate,
        //     subDesc: item.SubDesc,
        //     qty: item.Qty,
        //     margin: item.Margin,
        //     total: Number(item.Margin),
        //   }))
        // );
      }

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
      // Handle Station Rental first
      if (item.CatDesc === "Station Rental") {
        const category = "Range Station Rental";
        const variant = item.SubDesc?.trim() || "Standard Station Rental";
        const qty = Number(item.Qty) || 0;
        const margin = Number(item.Margin) || 0;
        const revenue = qty * margin;

        // Initialize category if needed
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
        acc[category].revenue += revenue;

        // Initialize and update variant
        if (!acc[category].variants[variant]) {
          acc[category].variants[variant] = { qty: 0, revenue: 0 };
        }
        acc[category].variants[variant].qty += qty;
        acc[category].variants[variant].revenue += revenue;

        return acc;
      }

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
          "Disposable Earplugs 32db 1 Pair",
          "3M Disposable earplugs 1 pair/pack 200 pack/case",
          "Mirage Clear Lens Safety Glasses",
          "Radians Mirage Clear Lens Safety Glasses",
        ].includes(item.Desc?.trim())
      ) {
        category = "Range Protection Equipment";
        variant = item.Desc?.trim() || "Unknown PPE";

        const qty = Number(item.Qty) || 0;
        const margin = Number(item.Margin) || 0;
        const revenue = qty * margin;

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
        acc[category].revenue += revenue;

        // Initialize variant if it doesn't exist
        if (!acc[category].variants[variant]) {
          acc[category].variants[variant] = { qty: 0, revenue: 0 };
        }

        // Update variant totals
        acc[category].variants[variant].qty += qty;
        acc[category].variants[variant].revenue += revenue;

        // Add debug logging for PPE items
        // console.log("PPE Item:", {
        //   desc: item.Desc,
        //   qty,
        //   margin,
        //   revenue: revenue,
        //   variant,
        //   totalQty: acc[category].qty,
        //   totalRevenue: acc[category].revenue,
        // });

        return acc;
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

      // Add class categorization
      else if (item.CatDesc === "Class") {
        category = "Classes";
        // Combine SubDesc with Full_Name for the variant
        variant = `${item.SubDesc?.trim() || "Unknown Class"} - ${item.Full_Name?.trim() || "Unknown Student"}`;

        const qty = Number(item.Qty) || 0;
        const margin = Number(item.Margin) || 0;
        const revenue = qty * margin;

        if (!acc[category]) {
          acc[category] = {
            qty: 0,
            revenue: 0,
            variants: {},
            group: "Classes",
          };
        }

        // Update category totals
        acc[category].qty += qty;
        acc[category].revenue += revenue;

        // Initialize and update variant
        if (!acc[category].variants[variant]) {
          acc[category].variants[variant] = { qty: 0, revenue: 0 };
        }
        acc[category].variants[variant].qty += qty;
        acc[category].variants[variant].revenue += revenue;

        return acc;
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
        const revenue = qty * margin;

        // Add debug logging for all items
        // console.log(`${category} Item:`, {
        //   desc: item.Desc,
        //   qty,
        //   margin,
        //   revenue,
        //   variant,
        //   totalQty: acc[category].qty,
        //   totalRevenue: acc[category].revenue,
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

      return acc;
    }, {});

    return kpiGroups;
  } catch (error) {
    console.error("Error in fetchKPIData:", error);
    throw error;
  }
};
