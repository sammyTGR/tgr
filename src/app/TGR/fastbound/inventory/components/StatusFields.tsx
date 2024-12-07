import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchParams } from "../types";
import { DateInput } from "./DateInput";

interface StatusFieldsProps {
  searchParams: SearchParams | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export function StatusFields({
  searchParams,
  onInputChange,
  onSelectChange,
}: StatusFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="disposedStatus">Disposed Items</Label>
        <Select
          onValueChange={(value) => onSelectChange("disposedStatus", value)}
          value={searchParams?.disposedStatus || "1"}
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
          onValueChange={(value) => onSelectChange("deletedStatus", value)}
          value={searchParams?.deletedStatus || "1"}
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
          onValueChange={(value) => onSelectChange("doNotDisposeStatus", value)}
          value={searchParams?.doNotDisposeStatus || "1"}
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

      <DateInput
        id="inventoryAsOf"
        name="inventoryAsOf"
        label="Inventory As Of"
        value={searchParams?.inventoryAsOf || ""}
        onChange={onInputChange}
      />
    </>
  );
}
