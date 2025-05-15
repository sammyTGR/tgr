import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchParams } from '../types';

interface SearchFieldsProps {
  searchParams: (SearchParams & { searchTriggered: boolean }) | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  manufacturers?: any[];
  calibers?: any[];
  locations?: any[];
}

export function SearchFields({
  searchParams,
  onInputChange,
  onSelectChange,
  manufacturers = [],
  calibers = [],
  locations = [],
}: SearchFieldsProps) {
  const fields = [
    'search',
    'itemNumber',
    'serial',
    'manufacturer',
    'model',
    'type',
    'caliber',
    'location',
    'condition',
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <Label htmlFor={field}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            </Label>
            {field === 'manufacturer' ||
            field === 'caliber' ||
            field === 'location' ||
            field === 'type' ||
            field === 'condition' ? (
              <Select
                onValueChange={(value) => onSelectChange(field, value)}
                value={searchParams?.[field as keyof SearchParams]?.toString() ?? ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field}`} />
                </SelectTrigger>
                <SelectContent>
                  {field === 'manufacturer' &&
                    manufacturers?.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  {field === 'caliber' &&
                    calibers?.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  {field === 'location' &&
                    locations?.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  {field === 'type' &&
                    ['Pistol', 'Revolver', 'Rifle', 'Shotgun', 'Other'].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  {field === 'condition' &&
                    ['New', 'Used'].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field}
                name={field}
                value={searchParams?.[field as keyof SearchParams]?.toString() ?? ''}
                onChange={onInputChange}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Status Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="disposedStatus">Disposed Items</Label>
            <Select
              onValueChange={(value) => onSelectChange('disposedStatus', value)}
              value={searchParams?.disposedStatus || '1'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disposed status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Not Disposed Only</SelectItem>
                <SelectItem value="2">Disposed Only</SelectItem>
                <SelectItem value="3">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deletedStatus">Deleted Items</Label>
            <Select
              onValueChange={(value) => onSelectChange('deletedStatus', value)}
              value={searchParams?.deletedStatus || '1'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deleted status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Not Deleted Only</SelectItem>
                <SelectItem value="2">Deleted Only</SelectItem>
                <SelectItem value="3">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doNotDisposeStatus">Do Not Dispose Items</Label>
            <Select
              onValueChange={(value) => onSelectChange('doNotDisposeStatus', value)}
              value={searchParams?.doNotDisposeStatus || '1'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select do not dispose status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Not Do Not Dispose Only</SelectItem>
                <SelectItem value="2">Do Not Dispose Only</SelectItem>
                <SelectItem value="3">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="inventoryAsOf">Inventory As Of</Label>
            <Input
              type="date"
              id="inventoryAsOf"
              name="inventoryAsOf"
              value={searchParams?.inventoryAsOf || ''}
              onChange={onInputChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
