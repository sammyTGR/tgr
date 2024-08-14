// src/pages/api/update-labels.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

const categoryMap = new Map<number, string>([
  [3, 'Firearm Accessories'],
  [175, 'Station Rental'],
  [4, 'Ammunition'],
  [170, 'Buyer Fees'],
  [1, 'Pistol'],
  [10, 'Shotgun'],
  [150, 'Gun Range Rental'],
  [8, 'Accessories'],
  [6, 'Knives & Tools'],
  [131, 'Service Labor'],
  [101, 'Class'],
  [11, 'Revolver'],
  [2, 'Rifle'],
  [191, 'FFL Transfer Fee'],
  [12, 'Consumables'],
  [9, 'Receiver'],
  [135, 'Shipping'],
  [5, 'Clothing'],
  [100, 'Shooting Fees'],
  [7, 'Hunting Gear'],
  [14, 'Storage'],
  [13, 'Reloading Supplies'],
  [15, 'Less Than Lethal'],
  [16, 'Personal Protection Equipment'],
  [17, 'Training Tools'],
  [132, 'Outside Service Labor'],
  [168, 'CA Tax Adjust'],
  [192, 'CA Tax Gun Transfer'],
  [102, 'Monthly Storage Fee (Per Firearm)'],
]);

const subcategoryMap = new Map<string, string>([
  ["170-7", "Standard Ammunition Eligibility Check"],
  ["170-1", "Dros Fee"],
  ["170-16", "DROS Reprocessing Fee (Dealer Sale)"],
  ["170-8", "Basic Ammunition Eligibility Check"],
]);

const updateLabels = async () => {
  const { data, error } = await supabase.from('sales_data').select('*');
  if (error) throw error;

  const updates = data.map((row) => ({
    id: row.id,
    category_label: categoryMap.get(row.Cat) || '',
    subcategory_label: subcategoryMap.get(`${row.Cat}-${row.Sub}`) || '',
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('sales_data')
      .update({
        category_label: update.category_label,
        subcategory_label: update.subcategory_label,
      })
      .eq('id', update.id);
    if (error) {
      console.error(`Error updating row with id ${update.id}:`, error);
      throw error;
    }
  }

  return updates.length;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const updatedRows = await updateLabels();
    // console.log(`Updated labels for ${updatedRows} rows`);
    res.status(200).json({ message: `Updated labels for ${updatedRows} rows` });
  } catch (error) {
    console.error('Error updating labels:', error);
    res.status(500).json({ error: 'Failed to update labels' });
  }
};
