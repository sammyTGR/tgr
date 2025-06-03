'use server';

import { createClient } from '@/utils/supabase/server';
import { Domain, Suggestion } from './types';

const supabase = createClient();
// Fetch functions using tanstack query patterns
export const fetchDomains = async () => {
  const { data, error } = await supabase.from('employee_domains').select('*').order('domain');

  if (error) throw error;
  return data;
};

export const fetchSuggestions = async () => {
  const { data, error } = await supabase
    .from('employee_suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchCertificates = async () => {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .lt('expiration', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString())
    .order('expiration', { ascending: true });

  if (error) throw error;
  return data;
};

export const fetchLatestRangeWalkReport = async () => {
  const { data, error } = await supabase
    .from('range_walk_reports')
    .select('*')
    .order('date_of_walk', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

export const fetchLatestChecklistSubmission = async () => {
  const { data, error } = await supabase
    .from('checklist_submissions')
    .select('*')
    .order('submission_date', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

export const fetchLatestGunsmithMaintenance = async () => {
  const { data, error } = await supabase
    .from('firearms_maintenance')
    .select('id, firearm_name, last_maintenance_date')
    .order('last_maintenance_date', { ascending: false })
    .limit(5)
    .not('last_maintenance_date', 'is', null);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

export const fetchLatestDailyDeposit = async () => {
  const { data, error } = await supabase
    .from('daily_deposits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

export const fetchDailyChecklistStatus = async () => {
  const { data, error } = await supabase
    .from('firearms_maintenance')
    .select('id, last_maintenance_date')
    .in('rental_notes', ['With Gunsmith', 'Out For Warranty Repair']);

  if (error) throw error;

  const firearmsCount = data.length;
  const lastSubmission = data.reduce((latest: string | null, current) => {
    return latest && latest > (current.last_maintenance_date ?? '')
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

export const fetchLatestSalesData = async (startDate: Date, endDate: Date) => {
  const utcStartDate = new Date(startDate.toUTCString().slice(0, -4));
  const utcEndDate = new Date(endDate.toUTCString().slice(0, -4));

  return Promise.resolve(
    fetch('/api/fetch-sales-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: utcStartDate.toISOString(),
        endDate: utcEndDate.toISOString(),
      }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Error fetching sales data');
      }

      return response.json().then((responseData) => {
        let salesData;

        if (Array.isArray(responseData)) {
          salesData = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          salesData = responseData.data;
        } else {
          throw new Error('Unexpected data format');
        }

        const excludeCategoriesFromChart = [
          'CA Tax Gun Transfer',
          'CA Tax Adjust',
          'CA Excise Tax',
          'CA Excise Tax Adjustment',
        ];

        const excludeCategoriesFromTotalNet = [
          'Pistol',
          'Rifle',
          'Revolver',
          'Shotgun',
          'Receiver',
          ...excludeCategoriesFromChart,
        ];

        let totalGross = 0;
        let totalNetMinusExclusions = 0;
        let totalNet = 0;

        interface SalesItem {
          category_label: string;
          total_gross: number;
          total_net: number;
        }

        salesData.forEach((item: SalesItem) => {
          const category = item.category_label;
          const grossValue = item.total_gross ?? 0;
          const netValue = item.total_net ?? 0;

          totalGross += grossValue;
          totalNet += netValue;

          if (!excludeCategoriesFromTotalNet.includes(category)) {
            totalNetMinusExclusions += netValue;
          }
        });

        return { totalGross, totalNet, totalNetMinusExclusions, salesData };
      });
    })
  );
};

// Mutation functions
export const addDomain = async (newDomain: string) => {
  const { error } = await supabase
    .from('employee_domains')
    .insert({ domain: newDomain.toLowerCase() });

  if (error) throw error;
};

export const updateDomain = async (domain: Domain) => {
  const { error } = await supabase
    .from('employee_domains')
    .update({ domain: domain.domain.toLowerCase() })
    .eq('id', domain.id);

  if (error) throw error;
};

export const deleteDomain = async (id: number) => {
  const { error } = await supabase.from('employee_domains').delete().eq('id', id);

  if (error) throw error;
};

export const sendEmail = async (
  email: string,
  subject: string,
  templateName: string,
  templateData: any
) => {
  const response = await fetch('/api/send_email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, subject, templateName, templateData }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
