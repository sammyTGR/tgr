import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { FirearmsMaintenanceData } from './columns';

interface MaintenanceFrequencyFormProps {
  firearm: FirearmsMaintenanceData;
  onUpdate: (id: number, maintenance_frequency: number) => void;
}

const MaintenanceFrequencyForm: React.FC<MaintenanceFrequencyFormProps> = ({
  firearm,
  onUpdate,
}) => {
  const [frequency, setFrequency] = useState(firearm.maintenance_frequency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('firearms_maintenance')
      .update({ maintenance_frequency: frequency })
      .eq('id', firearm.id);

    if (error) {
      console.error('Error updating maintenance frequency:', error.message);
    } else {
      onUpdate(firearm.id, frequency);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Maintenance Frequency:
        <select value={frequency} onChange={(e) => setFrequency(Number(e.target.value))}>
          <option value={7}>Weekly</option>
          <option value={14}>Bi-weekly</option>
          <option value={30}>Monthly</option>
          <option value={60}>Every other month</option>
          <option value={90}>Every quarter</option>
        </select>
      </label>
      <button type="submit">Update</button>
    </form>
  );
};

export default MaintenanceFrequencyForm;
