"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PopoverFormProps {
  onSubmit: (employeeName: string, weeks: string) => void;
  buttonText: string;
  placeholder: string;
}

export const PopoverForm: React.FC<PopoverFormProps> = ({ onSubmit, buttonText, placeholder }) => {
  const [employeeName, setEmployeeName] = useState("");
  const [weeks, setWeeks] = useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="linkHover2">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{placeholder}</label>
          {buttonText.includes("All Staff") ? (
            <Input
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              placeholder="Number of weeks"
              className="mt-2"
            />
          ) : (
            <>
              <Input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Employee Name"
              />
              {buttonText.includes("Single Employee") && (
                <Input
                  type="number"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  placeholder="Number of weeks"
                  className="mt-2"
                />
              )}
            </>
          )}
          <Button
            className="mt-2"
            onClick={() => {
              onSubmit(employeeName, weeks);
              setEmployeeName("");
              setWeeks("");
            }}
          >
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
