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
import { validateDateRange } from "../utils/dateValidation";
import { useState, useEffect } from "react";

interface AcquisitionFieldsProps {
  searchParams: SearchParams | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export function AcquisitionFields({
  searchParams,
  onInputChange,
  onSelectChange,
}: AcquisitionFieldsProps) {
  const acquisitionFields = [
    "acquiredOnAfter",
    "acquiredOnBefore",
    "acquiredType",
    "manufacturingAcquiredType",
    "acquiredFromLicenseName",
    "acquiredFromFFL",
    "acquiredFromTradeName",
    "acquiredFromFirstName",
    "acquiredFromLastName",
    "acquiredOrganizationName",
    "acquiredFromAddress1",
    "acquiredFromAddress2",
    "acquiredFromCity",
    "acquiredFromState",
    "acquiredFromZip",
    "acquiredFromCountry",
    "acquiredFromPONumber",
    "acquiredFromInvoiceNumber",
    "acquiredFromShipmentTracking",
  ];

  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  useEffect(() => {
    const error = validateDateRange(
      searchParams?.acquiredOnAfter || "",
      searchParams?.acquiredOnBefore || ""
    );
    setDateRangeError(error);
  }, [searchParams?.acquiredOnAfter, searchParams?.acquiredOnBefore]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <DateInput
          id="acquiredOnAfter"
          name="acquiredOnAfter"
          label="Acquired On or After"
          value={searchParams?.acquiredOnAfter || ""}
          onChange={onInputChange}
          error={dateRangeError ?? undefined}
        />
        <DateInput
          id="acquiredOnBefore"
          name="acquiredOnBefore"
          label="Acquired On or Before"
          value={searchParams?.acquiredOnBefore || ""}
          onChange={onInputChange}
          error={dateRangeError ?? undefined}
        />
      </div>
      {acquisitionFields.map((field) => (
        <div key={field}>
          <Label htmlFor={field}>{field.split(/(?=[A-Z])/).join(" ")}</Label>
          {field === "acquiredType" || field === "manufacturingAcquiredType" ? (
            <Select
              onValueChange={(value) => onSelectChange(field, value)}
              value={
                searchParams?.[field as keyof SearchParams]?.toString() ?? ""
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field}`} />
              </SelectTrigger>
              <SelectContent>
                {field === "acquiredType" && (
                  <>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="trade">Trade</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="consignment">Consignment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </>
                )}
                {field === "manufacturingAcquiredType" && (
                  <>
                    <SelectItem value="manufacture">Manufacture</SelectItem>
                    <SelectItem value="assembly">Assembly</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="modification">Modification</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field}
              name={field}
              value={
                searchParams?.[field as keyof SearchParams]?.toString() ?? ""
              }
              onChange={onInputChange}
              type={field.includes("Date") ? "date" : "text"}
            />
          )}
        </div>
      ))}
    </>
  );
}
