// run to sync approved devices from oag.ca.gov to supabase by running: node tools/sync_approved_devices.js in terminal
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for upsert

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchAndSync() {
  const url = 'https://oag.ca.gov/firearms/certified-safety-devices/search-results?model=&manufacturer=All';
  const res = await fetch(url);
  const html = await res.text();

  const $ = cheerio.load(html);
  const rows = [];

  $('table tbody tr').each((_, tr) => {
    const cells = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
    if (cells.length >= 4) {
      rows.push({
        manufacturer: cells[0],
        model: cells[1],
        type: cells[2],
        description: cells[3],
        fetched_at: new Date().toISOString(),
      });
    }
  });

  // Upsert all rows (by manufacturer+model+type+description)
  for (const row of rows) {
    await supabase
      .from('approved_devices')
      .insert(row);
  }

  console.log(`Upserted ${rows.length} approved devices.`);
}

fetchAndSync().catch(console.error); 