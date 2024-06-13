import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

const useUnreadTimeOffRequests = () => {
  const [unreadTimeOffCount, setUnreadTimeOffCount] = useState(0);

  const fetchUnreadTimeOffRequests = async () => {
    try {
      const { count, error } = await supabase
        .from('time_off_requests')
        .select('request_id', { count: 'exact' })
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread time-off requests:', error);
      } else {
        setUnreadTimeOffCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread time-off requests:', error);
    }
  };

  useEffect(() => {
    fetchUnreadTimeOffRequests();

    const subscription = supabase
      .channel('time_off_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_off_requests' },
        () => {
          fetchUnreadTimeOffRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return unreadTimeOffCount;
};

export default useUnreadTimeOffRequests;
