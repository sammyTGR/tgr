// src/pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import formidable, { File, IncomingForm } from 'formidable';
import { read, utils } from 'xlsx';
import fs from 'fs/promises';
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

const processExcelFile = async (file: File) => {
  try {
    const data = await fs.readFile(file.filepath);
    const workbook = read(data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(sheet);

    const processedData = jsonData.map((row: any) => {
      const categoryLabel = categoryMap.get(Number(row['Cat'])) || '';
      const subcategoryLabel = subcategoryMap.get(Number(row['Sub'])) || '';
      return {
        sales_reps: row['Sales Reps'] || '',
        invoice: row['Invoice'] || '',
        sku: row['Sku'] || '',
        description: row['Desc'] || '',
        sold_price: row['SoldPrice'] || 0,
        sold_qty: row['SoldQty'] || 0,
        cost: row['Cost'] || 0,
        acct: row['Acct'] || '',
        sale_date: new Date(row['Date']) || null,
        discount: row['Disc'] || 0,
        type: row['Type'] || '',
        spiff: row['Spiff'] || 0,
        last: row['Last'] || '',
        last_name: row['LastName'] || '',
        legacy: row['Legacy'] || '',
        stloc: row['Stloc'] || '',
        cat: Number(row['Cat']) || null,
        sub: Number(row['Sub']) || null,
        mfg: row['Mfg'] || '',
        cust_type: row['CustType'] || '',
        category_label: categoryLabel,
        subcategory_label: subcategoryLabel
      };
    });

    console.log('Processed Data:', processedData);

    const { error } = await supabase.from('sales_data').insert(processedData);
    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Excel Processing Error:', error);
    throw error;
  }
};

const processCsvFile = async (file: File) => {
  try {
    const data = await fs.readFile(file.filepath);
    const records: any[] = [];
    const parser = parse(data, { columns: true });

    for await (const record of parser) {
      records.push(record);
    }

    const processedData = records.map((row: any) => {
      const categoryLabel = categoryMap.get(Number(row['Cat'])) || '';
      const subcategoryLabel = subcategoryMap.get(Number(row['Sub'])) || '';
      return {
        sales_reps: row['Sales Reps'] || '',
        invoice: row['Invoice'] || '',
        sku: row['Sku'] || '',
        description: row['Desc'] || '',
        sold_price: row['SoldPrice'] || 0,
        sold_qty: row['SoldQty'] || 0,
        cost: row['Cost'] || 0,
        acct: row['Acct'] || '',
        sale_date: new Date(row['Date']) || null,
        discount: row['Disc'] || 0,
        type: row['Type'] || '',
        spiff: row['Spiff'] || 0,
        last: row['Last'] || '',
        last_name: row['LastName'] || '',
        legacy: row['Legacy'] || '',
        stloc: row['Stloc'] || '',
        cat: Number(row['Cat']) || null,
        sub: Number(row['Sub']) || null,
        mfg: row['Mfg'] || '',
        cust_type: row['CustType'] || '',
        category_label: categoryLabel,
        subcategory_label: subcategoryLabel
      };
    });

    console.log('Processed Data:', processedData);

    const { error } = await supabase.from('sales_data').insert(processedData);
    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('CSV Processing Error:', error);
    throw error;
  }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new IncomingForm();
  console.log('Parsing form...');

  form.parse(req, async (err: any, fields: formidable.Fields, files: formidable.Files) => {
    if (err) {
      console.error('Form Parsing Error:', err);
      res.status(500).json({ error: 'Failed to parse form data' });
      return;
    }

    console.log('Form parsed successfully:', { fields, files });

    const fileArray = files.file as formidable.File[];
    if (!fileArray || fileArray.length === 0) {
      console.error('No files uploaded');
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const file = fileArray[0];
    const fileType = file.mimetype;

    try {
      console.log('Processing file:', file.originalFilename, fileType);
      if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        await processExcelFile(file);
      } else if (fileType === 'text/csv') {
        await processCsvFile(file);
      } else {
        console.error('Unsupported file type:', fileType);
        res.status(400).json({ error: 'Unsupported file type' });
        return;
      }
      res.status(200).json({ message: 'File processed successfully' });
    } catch (error) {
      console.error('File Processing Error:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });
};
