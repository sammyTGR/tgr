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
  const utcStartDate = new Date(startDate);
  utcStartDate.setUTCHours(0, 0, 0, 0);

  const utcEndDate = new Date(endDate);
  utcEndDate.setUTCHours(23, 59, 59, 999);

  let allData: any[] = [];
  let regularPage = 0;
  let rentalPage = 0;
  const pageSize = 1000;
  let hasMoreRegular = true;
  let hasMoreRental = true;

  // Fetch regular items
  while (hasMoreRegular) {
    const { data: regularData, error: regularError } = await supabase
      .from("detailed_sales_data")
      .select(
        '"Desc", "SubDesc", "CatDesc", "Qty", total_net, "SoldDate", "Margin", "SoldPrice"',
        { count: "exact" }
      )
      .or(
        "Desc.ilike.%Gunsmithing%,Desc.ilike.%Pistol Optic Zero Fee%,Desc.ilike.%Sight In/ Function Fee%,Desc.ilike.%Laser Engraving%,Desc.ilike.%Reloaded%,SubDesc.eq.Targets,CatDesc.eq.Personal Protection Equipment,CatDesc.eq.Station Rental"
      )
      .gte("SoldDate", utcStartDate.toISOString())
      .lte("SoldDate", utcEndDate.toISOString())
      .range(regularPage * pageSize, (regularPage + 1) * pageSize - 1);

    if (regularError) {
      console.error("Regular data fetch error:", regularError);
      throw regularError;
    }

    if (regularData?.length) {
      allData = [...allData, ...regularData];
      regularPage++;
      hasMoreRegular = regularData.length === pageSize;
    } else {
      hasMoreRegular = false;
    }
  }

  // Fetch rental items
  while (hasMoreRental) {
    const { data: rentalData, error: rentalError } = await supabase
      .from("detailed_sales_data")
      .select(
        '"Desc", "SubDesc", "CatDesc", "Qty", total_net, "SoldDate", "Margin", "SoldPrice"',
        { count: "exact" }
      )
      .eq("CatDesc", "Gun Range Rental")
      .filter(
        "SubDesc",
        "not.in",
        '("12 & Under Earmuff Rentals","Ear Muffs","")'
      )
      .not("SubDesc", "is", null)
      .gte("SoldDate", utcStartDate.toISOString())
      .lte("SoldDate", utcEndDate.toISOString())
      .range(rentalPage * pageSize, (rentalPage + 1) * pageSize - 1);

    if (rentalError) {
      console.error("Rental data fetch error:", rentalError);
      throw rentalError;
    }

    if (rentalData?.length) {
      allData = [...allData, ...rentalData];
      rentalPage++;
      hasMoreRental = rentalData.length === pageSize;
    } else {
      hasMoreRental = false;
    }
  }

  // Group and aggregate the data
  const kpiGroups = allData.reduce(
    (acc, item) => {
      let category = "";
      const desc = item.Desc?.toLowerCase() || "";

      // Categorization logic
      if (desc.includes("gunsmithing")) {
        if (desc.includes("parts")) {
          category = "Gunsmithing Parts";
        } else {
          category = "Gunsmithing";
        }
      } else if (desc.includes("pistol optic zero fee")) {
        category = "Pistol Optic Zero Fee";
      } else if (desc.includes("sight in/ function fee")) {
        category = "Sight In/Function Fee";
      } else if (desc.includes("laser engraving")) {
        category = "Laser Engraving/Stippling";
      } else if (desc.includes("reloaded")) {
        category = "Reloaded Ammunition";
      }

      if (category) {
        if (!acc[category]) {
          acc[category] = { qty: 0, revenue: 0, variants: {} };
        }

        const qty = Number(item.Qty) || 0;
        const revenue = Number(item.total_net) || 0;

        // Update category totals
        acc[category].qty += qty;
        acc[category].revenue += revenue;

        // Track variants
        const variant = item.Desc?.trim() || "Unknown";
        if (!acc[category].variants[variant]) {
          acc[category].variants[variant] = { qty: 0, revenue: 0 };
        }
        acc[category].variants[variant].qty += qty;
        acc[category].variants[variant].revenue += revenue;
      }

      return acc;
    },
    {} as Record<
      string,
      {
        qty: number;
        revenue: number;
        variants: Record<string, { qty: number; revenue: number }>;
      }
    >
  );

  // Then use the types in the forEach
  Object.entries(kpiGroups as KPIGroups).forEach(([category, data]) => {
    // console.log(`${category} totals:`, {
    //   qty: data.qty,
    //   revenue: data.revenue,
    //   dateRange: `${utcStartDate.toISOString()} to ${utcEndDate.toISOString()}`,
    //   variantCount: Object.keys(data.variants).length,
    // });
  });

  return kpiGroups;
};
