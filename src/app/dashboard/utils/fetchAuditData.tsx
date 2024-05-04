// In your fetchAuditData.ts
import supabase from '../../../../supabase/lib/supabaseClient';
import { AuditData } from './types';

const fetchAuditData = async (): Promise<AuditData[]> => {
    const { data, error } = await supabase
        .from('Auditsinput')
        .select('*');
    if (error) throw new Error(error.message);
    return data as AuditData[];
}

export default fetchAuditData