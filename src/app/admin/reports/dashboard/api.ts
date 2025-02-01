"use client";

import { supabase } from "@/utils/supabase/client";
import { Domain, Suggestion, Certificate } from "./types";

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
      : current.last_maintenance_date ?? null;
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
  const { data, error } = await supabase
    .from("sales_data")
    .select("Desc, SoldQty, total_net")
    .or(
      "Desc.ilike.%Gunsmithing%, Desc.ilike.%Gunsmithing Parts%, Desc.ilike.%Pistol Optic Zero Fee%, Desc.ilike.%Sight In/Function Fee%, Desc.ilike.%Laser Engraving%, Desc.ilike.%Reloaded%"
    )
    .gte("Date", startDate.toISOString())
    .lte("Date", endDate.toISOString());

  if (error) throw error;

  // Define the order of categories
  const categoryOrder = [
    "Gunsmithing",
    "Gunsmithing Parts",
    "Laser Engraving/Stippling",
    "Reloaded Ammunition",
    "Pistol Optic Zero Fee",
    "Sight In/Function Fee",
  ];

  // Group and aggregate the data
  const kpiGroups = data.reduce(
    (
      acc: {
        [key: string]: {
          qty: number;
          revenue: number;
          variants?: { [key: string]: { qty: number; revenue: number } };
        };
      },
      item
    ) => {
      let category = "";
      if (item.Desc.includes("Gunsmithing") && !item.Desc.includes("Parts")) {
        category = "Gunsmithing";
      } else if (item.Desc.includes("Gunsmithing Parts")) {
        category = "Gunsmithing Parts";
      } else if (item.Desc.includes("Pistol Optic Zero Fee")) {
        category = "Pistol Optic Zero Fee";
      } else if (item.Desc.includes("Sight In/Function Fee")) {
        category = "Sight In/Function Fee";
      } else if (item.Desc.includes("Laser Engraving")) {
        category = "Laser Engraving/Stippling";
      } else if (item.Desc.includes("Reloaded")) {
        category = "Reloaded Ammunition";

        // Initialize the category if it doesn't exist
        if (!acc[category]) {
          acc[category] = { qty: 0, revenue: 0, variants: {} };
        }

        // Ensure variants object exists and is initialized
        if (!acc[category].variants) {
          acc[category].variants = {};
        }

        // Use the full description as the variant name
        const variant = item.Desc.trim();
        const variants = acc[category].variants;

        if (variants) {
          if (!variants[variant]) {
            variants[variant] = { qty: 0, revenue: 0 };
          }

          variants[variant].qty += item.SoldQty || 0;
          variants[variant].revenue += item.total_net || 0;
        }
      }

      // Initialize category if it doesn't exist
      if (!acc[category]) {
        acc[category] = { qty: 0, revenue: 0 };
      }

      // Update category totals
      acc[category].qty += item.SoldQty || 0;
      acc[category].revenue += item.total_net || 0;

      return acc;
    },
    {}
  );

  // Create an ordered result object
  const orderedKpiGroups: typeof kpiGroups = {};
  categoryOrder.forEach((category) => {
    if (kpiGroups[category]) {
      orderedKpiGroups[category] = kpiGroups[category];
    }
  });

  return orderedKpiGroups;
};
