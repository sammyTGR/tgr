// src/pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import formidable, { File } from 'formidable';
import { read, utils } from 'xlsx';
import fs from 'fs';
import { parse } from 'csv-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

const subcategoryMap = new Map<number, string>([
  [1, 'Dros Fee'],
  [7, 'Standard Ammunition Eligibility Check'],
  [8, 'Basic Ammunition Eligibility Check'],
  [16, 'DROS Reprocessing Fee (Dealer Sale)'],
]);

const processExcelFile = async (filePath: string) => {
  const data = fs.readFileSync(filePath);
  const workbook = read(data, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = utils.sheet_to_json(sheet);

  return jsonData.map((row: any) => ({
    lanid: row['Lanid'] || '',
    invoice: row['Invoice'] || '',
    sku: row['Sku'] || '',
    description: row['Description'] || '',
    sold_price: parseFloat(row['SoldPrice']) || 0,
    sold_qty: parseInt(row['SoldQty']) || 0,
    cost: parseFloat(row['Cost']) || 0,
    acct: row['Acct'] || '',
    sale_date: row['Date'] ? new Date(row['Date']).toISOString() : null,
    discount: parseFloat(row['Disc']) || 0,
    type: row['Type'] || '',
    spiff: parseFloat(row['Spiff']) || 0,
    last_name: row['LastName'] || '',
    legacy: row['Legacy'] || '',
    stloc: row['Stloc'] || '',
    cat: row['Cat'] ? parseInt(row['Cat']) : null,
    sub: row['Sub'] ? parseInt(row['Sub']) : null,
    mfg: row['Mfg'] || '',
    cust_type: row['CustType'] || '',
    category_label: categoryMap.get(parseInt(row['Cat'])) || '',
    subcategory_label: subcategoryMap.get(parseInt(row['Sub'])) || '',
  }));
};

const processCsvFile = async (filePath: string) => {
  const records: any[] = [];
  const parser = fs.createReadStream(filePath).pipe(parse({ columns: true }));

  for await (const record of parser) {
    records.push(record);
  }

  return records.map((row: any) => ({
    lanid: row['Lanid'] || '',
    invoice: row['Invoice'] || '',
    sku: row['Sku'] || '',
    description: row['Description'] || '',
    sold_price: parseFloat(row['SoldPrice']) || 0,
    sold_qty: parseInt(row['SoldQty']) || 0,
    cost: parseFloat(row['Cost']) || 0,
    acct: row['Acct'] || '',
    sale_date: row['Date'] ? new Date(row['Date']).toISOString() : null,
    discount: parseFloat(row['Disc']) || 0,
    type: row['Type'] || '',
    spiff: parseFloat(row['Spiff']) || 0,
    last_name: row['LastName'] || '',
    legacy: row['Legacy'] || '',
    stloc: row['Stloc'] || '',
    cat: row['Cat'] ? parseInt(row['Cat']) : null,
    sub: row['Sub'] ? parseInt(row['Sub']) : null,
    mfg: row['Mfg'] || '',
    cust_type: row['CustType'] || '',
    category_label: categoryMap.get(parseInt(row['Cat'])) || '',
    subcategory_label: subcategoryMap.get(parseInt(row['Sub'])) || '',
  }));
};

const insertDataToSupabase = async (data: any[]) => {
  const { error } = await supabase.from('sales_data').insert(data);
  if (error) {
    console.error('Supabase Insert Error:', error);
    throw error;
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form Parsing Error:', err);
      res.status(500).json({ error: 'Failed to parse form data' });
      return;
    }

    const file = files.file as unknown as File;
    if (!file) {
      console.error('No file uploaded');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = file.filepath;
    const fileType = file.mimetype;

    try {
      let processedData: any[] = [];
      if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        processedData = await processExcelFile(filePath);
      } else if (fileType === 'text/csv') {
        processedData = await processCsvFile(filePath);
      } else {
        console.error('Unsupported file type:', fileType);
        res.status(400).json({ error: 'Unsupported file type' });
        return;
      }

      await insertDataToSupabase(processedData);
      res.status(200).json({ message: 'File processed successfully' });
    } catch (error) {
      console.error('File Processing Error:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });
};
