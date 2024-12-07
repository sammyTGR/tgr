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

interface DispositionFieldsProps {
  searchParams: SearchParams | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export function DispositionFields({
  searchParams,
  onInputChange,
  onSelectChange,
}: DispositionFieldsProps) {
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  useEffect(() => {
    const error = validateDateRange(
      searchParams?.disposedOnAfter || "",
      searchParams?.disposedOnBefore || ""
    );
    setDateRangeError(error);
  }, [searchParams?.disposedOnAfter, searchParams?.disposedOnBefore]);

  const dispositionFields = [
    "disposedOnAfter",
    "disposedOnBefore",
    "disposedType",
    "manufacturingDisposedType",
    "disposedToLicenseName",
    "disposedToFFL",
    "disposedToTradeName",
    "disposedToFirstName",
    "disposedToLastName",
    "disposedOrganizationName",
    "disposedToAddress1",
    "disposedToAddress2",
    "disposedToCity",
    "disposedToState",
    "disposedToZip",
    "disposedToCountry",
    "disposedToPONumber",
    "disposedToInvoiceNumber",
    "disposedToShipmentTracking",
    "ttsn",
    "otsn",
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <DateInput
          id="disposedOnAfter"
          name="disposedOnAfter"
          label="Disposed On or After"
          value={searchParams?.disposedOnAfter || ""}
          onChange={onInputChange}
          error={dateRangeError ?? undefined}
        />
        <DateInput
          id="disposedOnBefore"
          name="disposedOnBefore"
          label="Disposed On or Before"
          value={searchParams?.disposedOnBefore || ""}
          onChange={onInputChange}
          error={dateRangeError ?? undefined}
        />
      </div>
      {dispositionFields.map((field) => (
        <div key={field}>
          <Label htmlFor={field}>
            {field === "ttsn"
              ? "T.T.S.N"
              : field === "otsn"
              ? "O.T.S.N"
              : field.split(/(?=[A-Z])/).join(" ")}
          </Label>
          {field === "disposedType" || field === "manufacturingDisposedType" ? (
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
                {field === "disposedType" && (
                  <>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="theft">Theft/Loss</SelectItem>
                    <SelectItem value="return">
                      Return to Manufacturer
                    </SelectItem>
                    <SelectItem value="destruction">Destruction</SelectItem>
                    <SelectItem value="error">Error/Correction</SelectItem>
                  </>
                )}
                {field === "manufacturingDisposedType" && (
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
