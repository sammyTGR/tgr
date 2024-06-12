// src/app/TGR/certifications/updateStatus.ts
import { createClient } from '@supabase/supabase-js';
import {supabase} from '@/utils/supabase/client';

export async function updateCertificationStatus() {
  const { data, error } = await supabase
    .from('certifications')
    .select('id, expiration');

  if (error) throw error;

  const updates = data.map(cert => {
    const expirationDate = new Date(cert.expiration);
    const today = new Date();
    const timeDiff = expirationDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const status = daysDiff <= 60 ? 'Start Renewal Process' : '';

    return { id: cert.id, status };
  });

  for (const update of updates) {
    await supabase
      .from('certifications')
      .update({ status: update.status })
      .eq('id', update.id);
  }
}
