"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Control,
  useForm,
  UseFormSetValue,
  useWatch,
  UseFormReturn,
} from "react-hook-form";
import { Alert, AlertDescription } from "../../../../../components/ui/alert";
import { Button } from "../../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { Textarea } from "../../../../../components/ui/textarea";
import { toast } from "../../../../../components/ui/use-toast";
import { supabase } from "../../../../../utils/supabase/client";
import MakeSelect from "@/components/MakeSelect";
import { FORM_OPTIONS } from "../components/formOptions";

interface FormOptionsData {
  genders: string[];
  eyeColors: string[];
  hairColors: string[];
  heightFeet: string[];
  heightInches: string[];
  idTypes: string[];
  placesOfBirth: string[];
  exemptionCodes: string[];
  colors: string[];
  fsd: string[];
  race: string[];
  citizenship: string[];
  restrictionsExemptions: string[];
  makes: string[];
  calibers: string[];
  unit: string[];
  category: string[];
  regulated: string[];
  nonRosterExemption: string[];
  waitingPeriodExemption: string[];
}

type AgencyDepartment = {
  value: string;
  label: string;
  department: string;
};

export type FormData = {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  streetAddress: string;
  zipCode: string;
  city: string;
  state: string;
  gender: string;
  hairColor: string;
  eyeColor: string;
  heightFeet: number;
  heightInches: number;
  weight?: number;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  race: string;
  isUsCitizen: string;
  placeOfBirth: string;
  phoneNumber?: string;
  aliasFirstName?: string;
  aliasMiddleName?: string;
  aliasLastName?: string;
  aliasSuffix?: string;
  sellerFirstName: string;
  sellerMiddleName?: string;
  sellerLastName: string;
  sellerSuffix?: string;
  sellerStreetAddress: string;
  sellerZipCode: string;
  sellerCity: string;
  sellerState: string;
  sellerGender: string;
  sellerHairColor: string;
  sellerEyeColor: string;
  sellerHeightFeet: number;
  sellerHeightInches: number;
  sellerWeight?: number;
  sellerDateOfBirth: string;
  sellerIdType: string;
  sellerIdNumber: string;
  sellerRace: string;
  sellerIsUsCitizen: string;
  sellerPlaceOfBirth: string;
  sellerPhoneNumber?: string;
  sellerAliasFirstName?: string;
  sellerAliasMiddleName?: string;
  sellerAliasLastName?: string;
  sellerAliasSuffix?: string;
  hscFscNumber?: string;
  exemptionCode?: string;
  eligibilityQ1: string;
  eligibilityQ2: string;
  eligibilityQ3: string;
  eligibilityQ4: string;
  isGunShowTransaction: string;
  waitingPeriodExemption?: string;
  restrictionExemption?: string;
  make: string;
  model: string;
  serialNumber: string;
  otherNumber?: string;
  color: string;
  isNewGun: string;
  firearmSafetyDevice: string;
  nonRosterExemption: string;
  agencyDepartment?: string;
  comments?: string;
  status: string;
  transaction_type: string;
  frameOnly?: boolean;
  calibers?: string;
  additionalCaliber?: string;
  additionalCaliber2?: string;
  additionalCaliber3?: string;
  barrelLength?: number;
  unit?: string;
  gunType?: string;
  category?: string;
  regulated?: string;
  firearmsQ1?: string;
};

type ZipCodeData = {
  primary_city: string;
  state: string;
  acceptable_cities: string[] | null;
};

const initialFormState: Partial<FormData> = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  streetAddress: "",
  zipCode: "",
  city: "",
  state: "",
  gender: "",
  hairColor: "",
  eyeColor: "",
  heightFeet: 0,
  heightInches: 0,
  weight: undefined,
  dateOfBirth: "",
  idType: "",
  idNumber: "",
  race: "",
  isUsCitizen: "",
  placeOfBirth: "",
  phoneNumber: "",
  aliasFirstName: "",
  aliasMiddleName: "",
  aliasLastName: "",
  aliasSuffix: "",
  sellerFirstName: "",
  sellerMiddleName: "",
  sellerLastName: "",
  sellerSuffix: "",
  sellerStreetAddress: "",
  sellerZipCode: "",
  sellerCity: "",
  sellerState: "",
  sellerGender: "",
  sellerHairColor: "",
  sellerEyeColor: "",
  sellerHeightFeet: 0,
  sellerHeightInches: 0,
  sellerWeight: undefined,
  sellerDateOfBirth: "",
  sellerIdType: "",
  sellerIdNumber: "",
  sellerRace: "",
  sellerIsUsCitizen: "",
  sellerPlaceOfBirth: "",
  sellerPhoneNumber: "",
  sellerAliasFirstName: "",
  sellerAliasMiddleName: "",
  sellerAliasLastName: "",
  sellerAliasSuffix: "",
  hscFscNumber: "",
  exemptionCode: "",
  eligibilityQ1: "",
  eligibilityQ2: "",
  eligibilityQ3: "",
  eligibilityQ4: "",
  isGunShowTransaction: "",
  waitingPeriodExemption: "",
  restrictionExemption:
    "Private Party Transfer Through Licensed Firearms Dealer",
  make: "",
  model: "",
  serialNumber: "",
  otherNumber: "",
  color: "",
  isNewGun: "",
  firearmSafetyDevice: "",
  nonRosterExemption: "",
  agencyDepartment: "",
  comments: "",
  status: "pending",
  transaction_type: "officer-ppt-handgun",
  frameOnly: false,
  calibers: "",
  additionalCaliber: "",
  additionalCaliber2: "",
  additionalCaliber3: "",
  barrelLength: undefined,
  unit: "",
  gunType: "HANDGUN",
  category: "",
  regulated: "",
  firearmsQ1: "",
};

const useAgencyDepartments = (agencyType: string | null) => {
  return useQuery({
    queryKey: ["agencyDepartments", agencyType],
    queryFn: async (): Promise<AgencyDepartment[]> => {
      if (!agencyType) return [];
      const response = await fetch(
        `/api/fetchAgencyPd?department=${agencyType}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: !!agencyType,
  });
};

const useZipCodeLookup = (
  zipCode: string,
  setValue: UseFormSetValue<FormData>
) => {
  return useQuery({
    queryKey: ["zipCode", zipCode],
    queryFn: async (): Promise<ZipCodeData | null> => {
      if (zipCode.length !== 5) return null;

      try {
        const { data, error } = await supabase
          .from("zip_codes")
          .select("primary_city, state, acceptable_cities")
          .eq("zip", zipCode)
          .single();

        if (error) throw error;

        if (data) {
          setValue("state", data.state, { shouldValidate: true });
        }

        return data;
      } catch (error) {
        console.error("Error fetching zip code data:", error);
        return null;
      }
    },
    enabled: zipCode?.length === 5,
    staleTime: Infinity, // Cache forever since zip codes don't change
    gcTime: 24 * 60 * 60 * 1000, // Keep cache for 24 hours
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};

const useSellerZipCodeLookup = (
  sellerZipCode: string,
  setValue: UseFormSetValue<FormData>
) => {
  return useQuery({
    queryKey: ["sellerZipCode", sellerZipCode],
    queryFn: async (): Promise<ZipCodeData | null> => {
      if (sellerZipCode.length !== 5) return null;

      try {
        const { data, error } = await supabase
          .from("zip_codes")
          .select("primary_city, state, acceptable_cities")
          .eq("zip", sellerZipCode)
          .single();

        if (error) throw error;

        if (data) {
          setValue("sellerState", data.state, { shouldValidate: true });
        }

        return data;
      } catch (error) {
        console.error("Error fetching seller zip code data:", error);
        return null;
      }
    },
    enabled: sellerZipCode?.length === 5,
    staleTime: Infinity, // Cache forever since zip codes don't change
    gcTime: 24 * 60 * 60 * 1000, // Keep cache for 24 hours
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};

interface HandgunRoster {
  [make: string]: string[];
}

const PreviewDialog = ({ form }: { form: UseFormReturn<FormData> }) => {
  const values = form.getValues(); // Only get values when dialog opens
  const router = useRouter();

  // Dialog state mutation
  const { mutate: setDialogOpen } = useMutation({
    mutationKey: ["previewDialog"],
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
  });

  const { data: agencyName } = useQuery({
    queryKey: ["agencyName", values.agencyDepartment],
    queryFn: async () => {
      if (!values.agencyDepartment) return null;
      const response = await fetch(
        `/api/fetchAgencyPd?id=${values.agencyDepartment}`
      );
      if (!response.ok) throw new Error("Failed to fetch agency name");
      const data = await response.json();
      return data.label;
    },
    enabled: !!values.agencyDepartment,
  });

  // Form submission mutation
  const { mutate: submitForm, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/officerPptHandgun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          transaction_type: "officer-ppt-handgun",
        }),
      });
      if (!response.ok) throw new Error("Failed to submit form");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Form submitted successfully" });
      router.push("/TGR/dros/training");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Preview</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Submission</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Buyer Information */}
          <div className="space-y-4">
            <h3 className="font-bold">Buyer Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Name:</span>
              <span>{`${values.firstName} ${values.middleName || ""} ${
                values.lastName
              } ${values.suffix || ""}`}</span>

              <span className="font-medium">Address:</span>
              <span>{`${values.streetAddress}, ${values.city}, ${values.state} ${values.zipCode}`}</span>

              <span className="font-medium">Physical Description:</span>
              <span>{`${values.gender}, ${values.hairColor} hair, ${values.eyeColor} eyes`}</span>

              <span className="font-medium">Height:</span>
              <span>{`${values.heightFeet}'${values.heightInches}"`}</span>

              <span className="font-medium">Weight:</span>
              <span>{values.weight || "N/A"}</span>

              <span className="font-medium">Date of Birth:</span>
              <span>{values.dateOfBirth}</span>

              <span className="font-medium">ID Information:</span>
              <span>{`${values.idType} - ${values.idNumber}`}</span>

              <span className="font-medium">Race:</span>
              <span>{values.race}</span>

              <span className="font-medium">U.S. Citizen:</span>
              <span>{values.isUsCitizen}</span>

              <span className="font-medium">Place of Birth:</span>
              <span>{values.placeOfBirth}</span>

              <span className="font-medium">Phone Number:</span>
              <span>{values.phoneNumber || "N/A"}</span>

              {/* Alias Information if provided */}
              {(values.aliasFirstName || values.aliasLastName) && (
                <>
                  <span className="font-medium">Alias:</span>
                  <span>{`${values.aliasFirstName || ""} ${
                    values.aliasMiddleName || ""
                  } ${values.aliasLastName || ""} ${
                    values.aliasSuffix || ""
                  }`}</span>
                </>
              )}
            </div>
          </div>

          {/* Seller Information */}
          <div className="space-y-4">
            <h3 className="font-bold">Seller Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Name:</span>
              <span>{`${values.sellerFirstName} ${
                values.sellerMiddleName || ""
              } ${values.sellerLastName} ${values.sellerSuffix || ""}`}</span>

              <span className="font-medium">Address:</span>
              <span>{`${values.sellerStreetAddress}, ${values.sellerCity}, ${values.sellerState} ${values.sellerZipCode}`}</span>

              <span className="font-medium">Physical Description:</span>
              <span>{`${values.sellerGender}, ${values.sellerHairColor} hair, ${values.sellerEyeColor} eyes`}</span>

              <span className="font-medium">Height:</span>
              <span>{`${values.sellerHeightFeet}'${values.sellerHeightInches}"`}</span>

              <span className="font-medium">Weight:</span>
              <span>{values.sellerWeight || "N/A"}</span>

              <span className="font-medium">Date of Birth:</span>
              <span>{values.sellerDateOfBirth}</span>

              <span className="font-medium">ID Information:</span>
              <span>{`${values.sellerIdType} - ${values.sellerIdNumber}`}</span>

              <span className="font-medium">Race:</span>
              <span>{values.sellerRace}</span>

              <span className="font-medium">U.S. Citizen:</span>
              <span>{values.sellerIsUsCitizen}</span>

              <span className="font-medium">Place of Birth:</span>
              <span>{values.sellerPlaceOfBirth}</span>

              <span className="font-medium">Phone Number:</span>
              <span>{values.sellerPhoneNumber || "N/A"}</span>

              {/* Seller Alias Information if provided */}
              {(values.sellerAliasFirstName || values.sellerAliasLastName) && (
                <>
                  <span className="font-medium">Alias:</span>
                  <span>{`${values.sellerAliasFirstName || ""} ${
                    values.sellerAliasMiddleName || ""
                  } ${values.sellerAliasLastName || ""} ${
                    values.sellerAliasSuffix || ""
                  }`}</span>
                </>
              )}
            </div>
          </div>

          {/* Firearm Information */}
          <div className="col-span-2 space-y-4 mt-4">
            <h3 className="font-bold">Firearm Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Frame Only:</span>
              <span>{values.frameOnly}</span>

              <span className="font-medium">Make:</span>
              <span>{values.make}</span>

              <span className="font-medium">Model:</span>
              <span>{values.model}</span>

              {values.frameOnly !== false && (
                <>
                  <span className="font-medium">Caliber:</span>
                  <span>{values.calibers}</span>

                  {values.additionalCaliber && (
                    <>
                      <span className="font-medium">Additional Caliber:</span>
                      <span>{values.additionalCaliber}</span>
                    </>
                  )}

                  {values.additionalCaliber2 && (
                    <>
                      <span className="font-medium">Additional Caliber 2:</span>
                      <span>{values.additionalCaliber2}</span>
                    </>
                  )}

                  {values.additionalCaliber3 && (
                    <>
                      <span className="font-medium">Additional Caliber 3:</span>
                      <span>{values.additionalCaliber3}</span>
                    </>
                  )}

                  <span className="font-medium">Barrel Length:</span>
                  <span>{`${values.barrelLength} ${values.unit}`}</span>
                </>
              )}

              <span className="font-medium">Gun Type:</span>
              <span>{values.gunType || "HANDGUN"}</span>

              <span className="font-medium">Category:</span>
              <span>{values.category}</span>

              {values.frameOnly === true && (
                <>
                  <span className="font-medium">Federally Regulated:</span>
                  <span>{values.regulated}</span>
                </>
              )}

              <span className="font-medium">Serial Number:</span>
              <span>{values.serialNumber}</span>

              {values.otherNumber && (
                <>
                  <span className="font-medium">Other Number:</span>
                  <span>{values.otherNumber}</span>
                </>
              )}

              <span className="font-medium">Color:</span>
              <span>{values.color}</span>

              <span className="font-medium">New/Used:</span>
              <span>{values.isNewGun}</span>

              <span className="font-medium">FSD:</span>
              <span>{values.firearmSafetyDevice}</span>

              <span className="font-medium">Non-Roster Exemption:</span>
              <span>{values.nonRosterExemption}</span>

              <span className="font-medium">Agency Department:</span>
              <span>{agencyName || values.agencyDepartment}</span>
            </div>
          </div>

          {/* Transaction Information */}
          <div className="col-span-2 space-y-4 mt-4">
            <h3 className="font-bold">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Gun Show Transaction:</span>
              <span>{values.isGunShowTransaction}</span>

              <span className="font-medium">Waiting Period Exemption:</span>
              <span>{values.waitingPeriodExemption || "N/A"}</span>

              <span className="font-medium">HSC/FSC Number:</span>
              <span>{values.hscFscNumber || "N/A"}</span>

              <span className="font-medium">Exemption Code:</span>
              <span>{values.exemptionCode || "N/A"}</span>

              <span className="font-medium">Comments:</span>
              <span>{values.comments || "N/A"}</span>
            </div>
          </div>

          {/* Eligibility Questions */}
          <div className="col-span-2 space-y-4 mt-4">
            <h3 className="font-bold">Eligibility Questions</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Eligibility Question 1:</span>
              <span>{values.eligibilityQ1}</span>

              <span className="font-medium">Eligibility Question 2:</span>
              <span>{values.eligibilityQ2}</span>

              <span className="font-medium">Eligibility Question 3:</span>
              <span>{values.eligibilityQ3}</span>

              <span className="font-medium">Eligibility Question 4:</span>
              <span>{values.eligibilityQ4}</span>

              <span className="font-medium">Firearms Possession Question:</span>
              <span>{values.firearmsQ1}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => submitForm(values as FormData)}
            disabled={isPending}
          >
            {isPending ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// const MakeSelect = ({
//   setValue,
//   value,
//   handgunData,
//   isLoadingHandguns,
// }: {
//   setValue: UseFormSetValue<FormData>;
//   value: string;
//   handgunData: Record<string, any>;
//   isLoadingHandguns: boolean;
// }) => {
//   // Query for all makes
//   const { data: makes = [] } = useQuery({
//     queryKey: ["makes"],
//     queryFn: () => (handgunData ? Object.keys(handgunData) : []),
//     enabled: !!handgunData,
//   });

//   return (
//     <Select
//       value={value}
//       onValueChange={(newValue) => {
//         setValue("make", newValue);
//         setValue("model", "");
//       }}
//     >
//       <SelectTrigger className="w-full">
//         <SelectValue placeholder="Select Make" />
//       </SelectTrigger>
//       <SelectContent>
//         <ScrollArea className="h-[200px]">
//           {makes.map((make) => (
//             <SelectItem key={make} value={make}>
//               {DOMPurify.sanitize(make)}
//             </SelectItem>
//           ))}
//         </ScrollArea>
//       </SelectContent>
//     </Select>
//   );
// };

const SelectComponent = React.forwardRef<
  HTMLButtonElement, // Changed from HTMLSelectElement
  {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    children: React.ReactNode;
    name?: string; // Added to support form names
  }
>(({ value, onValueChange, placeholder, children, name }, ref) => (
  <Select value={value} onValueChange={onValueChange} name={name}>
    <SelectTrigger ref={ref}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>
));

SelectComponent.displayName = "SelectComponent";

// Move this outside of the component
const AgencyDepartmentSelect = ({
  agencyType,
  value,
  onChange,
}: {
  agencyType: string | null;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { data: agencies, isLoading } = useAgencyDepartments(agencyType);

  return (
    <div className="space-y-2">
      <Label>Agency Department</Label>
      <SelectComponent
        name="agencyDepartment"
        value={value}
        onValueChange={onChange}
        placeholder={isLoading ? "Loading..." : "Select Agency"}
      >
        {agencies?.map((agency) => (
          <SelectItem key={agency.value} value={agency.value}>
            {agency.label}
          </SelectItem>
        ))}
      </SelectComponent>
    </div>
  );
};

const useFormOptions = () => {
  return useQuery<FormOptionsData>({
    queryKey: ["formOptions"],
    queryFn: () => {
      return {
        genders: FORM_OPTIONS.genders,
        eyeColors: FORM_OPTIONS.eyeColors,
        hairColors: FORM_OPTIONS.hairColors,
        heightFeet: FORM_OPTIONS.heightFeet,
        heightInches: FORM_OPTIONS.heightInches,
        idTypes: FORM_OPTIONS.idTypes,
        placesOfBirth: FORM_OPTIONS.placesOfBirth,
        exemptionCodes: FORM_OPTIONS.exemptionCodes,
        colors: FORM_OPTIONS.colors,
        fsd: FORM_OPTIONS.fsd,
        race: FORM_OPTIONS.race,
        citizenship: FORM_OPTIONS.citizenship,
        restrictionsExemptions: FORM_OPTIONS.restrictionsExemptions,
        makes: FORM_OPTIONS.makes,
        calibers: FORM_OPTIONS.calibers,
        unit: FORM_OPTIONS.unit,
        category: FORM_OPTIONS.category,
        regulated: FORM_OPTIONS.regulated,
        nonRosterExemption: FORM_OPTIONS.nonRosterExemption,
        waitingPeriodExemption: FORM_OPTIONS.waitingPeriodExemption,
      };
    },
    staleTime: Infinity, // Since this is static data, we can cache it indefinitely
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

const useHandgunRoster = () => {
  return useQuery({
    queryKey: ["handgunRoster"],
    queryFn: async () => {
      const response = await fetch("/api/fetchPpt", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch manufacturers");
      }
      const data = await response.json();

      // Transform the data into the format expected by MakeSelectNonRosterPpt
      const manufacturers = Object.keys(data).map((make) => ({
        value: make,
        label: make,
      }));

      return manufacturers;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep cache for 30 minutes
    refetchOnWindowFocus: false,
  });
};

const useHandgunDetails = (make: string, model: string) => {
  return useQuery({
    queryKey: ["handgunDetails", make, model],
    queryFn: async () => {
      if (!make || !model) return null;
      const response = await fetch(
        `/api/fetchRoster?make=${make}&model=${model}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: !!make && !!model,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

const OfficerPptHandgunPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Form validation
  const form = useForm<FormData>({
    defaultValues: initialFormState,
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: async (values) => {
      const errors: Record<string, { type: string; message: string }> = {};

      // Validate frame only constraints
      if (values.frameOnly === true) {
        if (!values.regulated) {
          errors.regulated = {
            type: "required",
            message: "Regulated status is required when frame only is true",
          };
        }
        if (values.calibers) {
          errors.calibers = {
            type: "invalid",
            message: "Calibers should not be set when frame only is true",
          };
        }
        if (values.barrelLength) {
          errors.barrelLength = {
            type: "invalid",
            message: "Barrel length should not be set when frame only is true",
          };
        }
        if (values.unit) {
          errors.unit = {
            type: "invalid",
            message: "Unit should not be set when frame only is true",
          };
        }
      } else if (values.frameOnly === false) {
        if (!values.calibers) {
          errors.calibers = {
            type: "required",
            message: "Calibers are required when frame only is false",
          };
        }
        if (!values.barrelLength) {
          errors.barrelLength = {
            type: "required",
            message: "Barrel length is required when frame only is false",
          };
        }
        if (!values.unit) {
          errors.unit = {
            type: "required",
            message: "Unit is required when frame only is false",
          };
        }
      }

      // Validate unit values
      if (
        values.unit &&
        !["INCHES", "inches", "Inches"].includes(values.unit)
      ) {
        errors.unit = {
          type: "invalid",
          message: "Unit must be one of: INCHES, inches, Inches",
        };
      }

      // Validate regulated values
      if (values.regulated && !["YES", "NO"].includes(values.regulated)) {
        errors.regulated = {
          type: "invalid",
          message: "Regulated must be either YES or NO",
        };
      }

      // Validate firearms_q1 values
      if (
        values.firearmsQ1 &&
        !["yes", "no", "n/a"].includes(values.firearmsQ1.toLowerCase())
      ) {
        errors.firearmsQ1 = {
          type: "invalid",
          message: "Firearms Q1 must be one of: yes, no, n/a",
        };
      }

      // Validate numeric fields
      if (
        values.heightFeet &&
        (isNaN(Number(values.heightFeet)) || Number(values.heightFeet) < 0)
      ) {
        errors.heightFeet = {
          type: "invalid",
          message: "Height feet must be a valid positive number",
        };
      }

      if (
        values.heightInches &&
        (isNaN(Number(values.heightInches)) ||
          Number(values.heightInches) < 0 ||
          Number(values.heightInches) > 11)
      ) {
        errors.heightInches = {
          type: "invalid",
          message: "Height inches must be between 0 and 11",
        };
      }

      if (
        values.weight &&
        (isNaN(Number(values.weight)) || Number(values.weight) < 0)
      ) {
        errors.weight = {
          type: "invalid",
          message: "Weight must be a valid positive number",
        };
      }

      if (
        values.barrelLength &&
        (isNaN(Number(values.barrelLength)) || Number(values.barrelLength) < 0)
      ) {
        errors.barrelLength = {
          type: "invalid",
          message: "Barrel length must be a valid positive number",
        };
      }

      // Validate required fields
      const requiredFields = [
        "firstName",
        "lastName",
        "streetAddress",
        "zipCode",
        "city",
        "state",
        "gender",
        "hairColor",
        "eyeColor",
        "heightFeet",
        "heightInches",
        "dateOfBirth",
        "idType",
        "idNumber",
        "race",
        "isUsCitizen",
        "placeOfBirth",
        "eligibilityQ1",
        "eligibilityQ2",
        "eligibilityQ3",
        "eligibilityQ4",
        "isGunShowTransaction",
        "make",
        "model",
        "serialNumber",
        "color",
        "isNewGun",
        "firearmSafetyDevice",
        "nonRosterExemption",
        "sellerFirstName",
        "sellerLastName",
        "sellerStreetAddress",
        "sellerZipCode",
        "sellerCity",
        "sellerState",
        "sellerGender",
        "sellerHairColor",
        "sellerEyeColor",
        "sellerHeightFeet",
        "sellerHeightInches",
        "sellerDateOfBirth",
        "sellerIdType",
        "sellerIdNumber",
        "sellerRace",
        "sellerIsUsCitizen",
        "sellerPlaceOfBirth",
      ];

      requiredFields.forEach((field) => {
        if (!values[field as keyof FormData]) {
          errors[field] = {
            type: "required",
            message: `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`,
          };
        }
      });

      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
    },
  });

  const { register, handleSubmit, watch, setValue, getValues, control } = form;

  // Only watch fields that need reactive updates
  const zipCode = useWatch({ control: form.control, name: "zipCode" });
  const sellerZipCode = useWatch({
    control: form.control,
    name: "sellerZipCode",
  });
  const nonRosterExemption = useWatch({
    control: form.control,
    name: "nonRosterExemption",
  });
  const frameOnly = watch("frameOnly");

  // Add state for debounced values
  const [debouncedZipCode, setDebouncedZipCode] = useState("");
  const [debouncedSellerZipCode, setDebouncedSellerZipCode] = useState("");

  // Add debounce effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedZipCode(zipCode || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [zipCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSellerZipCode(sellerZipCode || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [sellerZipCode]);

  // Use the debounced values for the queries
  const { data: zipData, isLoading: isZipLoading } = useZipCodeLookup(
    debouncedZipCode,
    form.setValue
  );

  const { data: sellerZipData, isLoading: isSellerZipLoading } =
    useSellerZipCodeLookup(debouncedSellerZipCode, form.setValue);

  // Dialog state mutation
  const { data: isDialogOpen, mutate: setDialogOpen } = useMutation({
    mutationKey: ["previewDialog"],
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
  });

  const { mutate: handleReset } = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handgunRoster"] });
      queryClient.invalidateQueries({ queryKey: ["formOptions"] });
    },
  });

  // Add this mutation for handling navigation
  const { mutate: handleNavigation } = useMutation({
    mutationFn: (path: string) => {
      router.push(path);
      return Promise.resolve();
    },
  });

  // Use the optimized form options query
  const { data: formData, isLoading: isLoadingFormData } = useFormOptions();

  // Use the optimized handgun roster query
  const { data: handgunData, isLoading: isLoadingHandguns } =
    useHandgunRoster();

  // Get models for selected manufacturer
  const models = useMemo(() => {
    if (!handgunData || !watch("make")) return [];
    const makeModels = handgunData[watch("make") as keyof typeof handgunData];
    return Array.isArray(makeModels) ? makeModels.sort() : [];
  }, [handgunData, watch("make")]);
  // Use the optimized handgun details query
  const { data: handgunDetails } = useHandgunDetails(
    watch("make") || "",
    models?.[0] || ""
  );

  const { data: makesData, isLoading: isLoadingMakes } = useQuery({
    queryKey: ["makes"],
    queryFn: async () => {
      const response = await fetch("/api/fetchPpt");
      if (!response.ok) throw new Error("Failed to fetch makes");
      const data = await response.json();
      return data;
    },
  });

  // Mutation for selected make (instead of useState)
  const { mutate: setSelectedMake } = useMutation({
    mutationKey: ["selectedMake"],
    mutationFn: async (make: string) => {
      // First update the form state
      const updatedForm = {
        ...initialFormState,
        make: make,
        model: "",
      } as Partial<FormData>;

      setValue("make", make);
      setValue("model", "");
      return make;
    },
  });

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-center mb-8">
        Submit Peace Officer Non-Roster Handgun Private Party Transfer
      </h1>

      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          ATTENTION: NAVIGATING AWAY FROM THIS PAGE BEFORE SUBMITTING THE
          TRANSACTION MAY RESULT IN DATA LOSS.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Purchaser Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ID Card Swipe Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex max-w-lg">
                <Label>Swipe CA Driver License or ID Card</Label>
              </div>
              <Input
                type="text"
                placeholder="Swipe or enter ID"
                {...register("idNumber")}
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="required">
                Purchaser First Name
              </Label>
              <Input {...register("firstName")} id="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Purchaser Middle Name</Label>
              <Input {...register("middleName")} id="middleName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="required">
                Purchaser Last Name
              </Label>
              <Input {...register("lastName")} id="lastName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input {...register("suffix")} id="suffix" />
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="required">
                Purchaser Street Address
              </Label>
              <Input {...register("streetAddress")} id="address" required />
            </div>
            <div className="flex gap-4 items-start">
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input
                  {...register("zipCode")}
                  maxLength={5}
                  className="w-24"
                  disabled={isZipLoading}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 5).replace(/\D/g, "");
                    setValue("zipCode", value);
                  }}
                />
              </div>

              {debouncedZipCode?.length === 5 && (
                <>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <SelectComponent
                      value={watch("city") || ""}
                      onValueChange={(value) => setValue("city", value)}
                      placeholder={
                        isZipLoading ? "Loading cities..." : "Select city"
                      }
                    >
                      {zipData?.primary_city && (
                        <SelectItem value={zipData.primary_city}>
                          {zipData.primary_city}
                        </SelectItem>
                      )}
                      {zipData?.acceptable_cities?.map((city) => (
                        <SelectItem
                          key={city}
                          value={city}
                          className={
                            city === zipData?.primary_city ? "hidden" : ""
                          }
                        >
                          {city}
                        </SelectItem>
                      ))}
                    </SelectComponent>
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={zipData?.state || ""}
                      disabled
                      className="w-16 bg-muted"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Physical Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label className="required">Gender</Label>
              <SelectComponent
                name="gender"
                value={watch("gender") || ""}
                onValueChange={(value) => setValue("gender", value)}
                placeholder="Select Gender"
              >
                {formData?.genders.map((gender: string) => (
                  <SelectItem key={gender} value={gender.toLowerCase()}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>

            <div className="space-y-2">
              <Label className="required">Hair Color</Label>
              <SelectComponent
                name="hairColor"
                value={watch("hairColor") || ""}
                onValueChange={(value) => setValue("hairColor", value)}
                placeholder="Select Hair Color"
              >
                {formData?.hairColors.map((color: string) => (
                  <SelectItem key={color} value={color.toLowerCase()}>
                    {color}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>

            <div className="space-y-2">
              <Label className="required">Eye Color</Label>
              <SelectComponent
                name="eyeColor"
                value={watch("eyeColor") || ""}
                onValueChange={(value) => setValue("eyeColor", value)}
                placeholder="Select Eye Color"
              >
                {formData?.eyeColors.map((color: string) => (
                  <SelectItem key={color} value={color.toLowerCase()}>
                    {color}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>

            <div className="space-y-2">
              <Label className="required">Height</Label>
              <div className="flex gap-2">
                <SelectComponent
                  name="heightFeet"
                  value={String(watch("heightFeet")) || ""}
                  onValueChange={(value) =>
                    setValue("heightFeet", Number(value))
                  }
                  placeholder="Feet"
                >
                  {formData?.heightFeet.map((feet: string) => (
                    <SelectItem key={feet} value={feet}>
                      {feet}
                    </SelectItem>
                  ))}
                </SelectComponent>
                <SelectComponent
                  name="heightInches"
                  value={String(watch("heightInches")) || ""}
                  onValueChange={(value) =>
                    setValue("heightInches", Number(value))
                  }
                  placeholder="Inches"
                >
                  {formData?.heightInches.map((inches: string) => (
                    <SelectItem key={inches} value={inches}>
                      {inches}
                    </SelectItem>
                  ))}
                </SelectComponent>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input {...register("weight")} id="weight" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input {...register("dateOfBirth")} id="dob" type="date" />
            </div>
          </div>

          {/* ID Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="required">Purchaser ID Type</Label>
              <SelectComponent
                name="idType"
                value={watch("idType") || ""}
                onValueChange={(value) => setValue("idType", value)}
                placeholder="Select ID Type"
              >
                {formData?.idTypes.map((type: string) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaserId">Purchaser ID Number</Label>
              <Input {...register("idNumber")} id="purchaserId" />
            </div>

            <div className="space-y-2">
              <Label className="required">Race</Label>
              <SelectComponent
                name="race"
                value={watch("race") || ""}
                onValueChange={(value) => setValue("race", value)}
                placeholder="Select Race"
              >
                {formData?.race.map((race: string) => (
                  <SelectItem key={race} value={race.toLowerCase()}>
                    {race}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>

            <div className="space-y-2">
              <Label className="required">U.S. Citizen</Label>
              <SelectComponent
                name="isUsCitizen"
                value={watch("isUsCitizen") || ""}
                onValueChange={(value) => setValue("isUsCitizen", value)}
                placeholder="Select"
              >
                {formData?.citizenship.map((type: string) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="required">Place of Birth</Label>
              <SelectComponent
                name="placeOfBirth"
                value={watch("placeOfBirth") || ""}
                onValueChange={(value) => setValue("placeOfBirth", value)}
                placeholder="Select Place of Birth"
              >
                {formData?.placesOfBirth.map((place: string) => (
                  <SelectItem key={place} value={place.toLowerCase()}>
                    {place}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>

            <div className="space-y-2">
              <Label>Purchaser Phone Number</Label>
              <Input {...register("phoneNumber")} />
            </div>
          </div>

          {/* Alias Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aliasFirstName">Purchaser Alias First Name</Label>
              <Input {...register("aliasFirstName")} id="aliasFirstName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliasMiddleName">
                Purchaser Alias Middle Name
              </Label>
              <Input {...register("aliasMiddleName")} id="aliasMiddleName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliasLastName">Purchaser Alias Last Name</Label>
              <Input {...register("aliasLastName")} id="aliasLastName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliasSuffix">Purchaser Alias Suffix</Label>
              <Input {...register("aliasSuffix")} id="aliasSuffix" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hscFscNumber">HSC / FSC Number</Label>
              <Input {...register("hscFscNumber")} id="hscFscNumber" />
            </div>

            <div className="space-y-2">
              <Label className="required">HSC / FSX Exemption Code</Label>
              <SelectComponent
                name="exemptionCode"
                value={watch("exemptionCode") || ""}
                onValueChange={(value) => setValue("exemptionCode", value)}
                placeholder="Select Exemption Code"
              >
                {formData?.exemptionCodes.map((code: string) => (
                  <SelectItem key={code} value={code.toLowerCase()}>
                    {code}
                  </SelectItem>
                ))}
              </SelectComponent>
            </div>
          </div>

          {/* Eligibility Questions */}
          <div className="space-y-6">
            <CardContent className="space-y-6">
              {/* Question 1 */}
              <div className="space-y-2">
                <Label className="required block text-sm font-medium">
                  <span className="font-bold">
                    Firearms Eligibility Question 1:
                  </span>{" "}
                  Has purchaser: (1) ever been convicted of a felony, any
                  offense specified in Penal Code (PC) section 29905, an offense
                  specified in PC 23515(a), (b), or (d), a misdemeanor PC 273.5
                  offense, (2) been convicted in the last 10 years of a
                  misdemeanor offense specified in PC 29805, or (3) been
                  adjudged a ward of the juvenile court for committing an
                  offense specified in PC 29805 and is not 30 years of age or
                  older?
                </Label>
                <SelectComponent
                  name="eligibilityQ1"
                  value={watch("eligibilityQ1") || ""}
                  onValueChange={(value) => setValue("eligibilityQ1", value)}
                  placeholder="Select"
                >
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectComponent>
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <Label className="required block text-sm font-medium">
                  <span className="font-bold">
                    Firearms Eligibility Question 2:
                  </span>{" "}
                  Has a court ever found, as specified in Welfare and
                  Institutions Code (WIC) section 8103, the purchaser to be a
                  danger to others from mental illness, a mentally disordered
                  sex offender, not guilty by reason of insanity, mentally
                  incompetent to stand trial, or gravely disabled to be placed
                  under a conservatorship?
                </Label>
                <SelectComponent
                  name="eligibilityQ2"
                  value={watch("eligibilityQ2") || ""}
                  onValueChange={(value) => setValue("eligibilityQ2", value)}
                  placeholder="Select"
                >
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectComponent>
              </div>
              {/* Question 3 */}
              <div className="space-y-2">
                <Label className="required block text-sm font-medium">
                  <span className="font-bold">
                    Firearms Eligibility Question 3:
                  </span>{" "}
                  Is purchaser a danger/threat to self or others under WIC
                  section 8100, a person certified for intensive treatment as
                  described in WIC section 5103(g), or a person described in WIC
                  section 8103(f) who has ever been admitted to a mental health
                  facility as a danger to self or others at least twice within 1
                  year or admitted once within the past 5 years?
                </Label>
                <SelectComponent
                  name="eligibilityQ3"
                  value={watch("eligibilityQ3") || ""}
                  onValueChange={(value) => setValue("eligibilityQ3", value)}
                  placeholder="Select"
                >
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectComponent>
              </div>
              {/* Question 4 */}
              <div className="space-y-2">
                <Label className="required block text-sm font-medium">
                  <span className="font-bold">
                    Firearms Eligibility Question 4:
                  </span>{" "}
                  Is purchaser currently the subject of any restraining order
                  specified in PC section 29825, a Gun Violence Restraining
                  Order, or a probation condition prohibiting firearm
                  possession?
                </Label>
                <SelectComponent
                  name="eligibilityQ4"
                  value={watch("eligibilityQ4") || ""}
                  onValueChange={(value) => setValue("eligibilityQ4", value)}
                  placeholder="Select"
                >
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectComponent>
              </div>

              {/* Question 5 - Firearms Possession */}
              <div className="space-y-2">
                <Label className="required block text-sm font-medium">
                  <span className="font-bold">
                    Firearms Possession Question:
                  </span>{" "}
                  If you currently own or possess firearms, have you checked and
                  confirmed possession of those firearms within the past 30
                  days? If you do not currently own or possess firearms, you
                  must select not applicable (N/A).
                </Label>
                <SelectComponent
                  name="firearmsQ1"
                  value={watch("firearmsQ1") || ""}
                  onValueChange={(value) => setValue("firearmsQ1", value)}
                  placeholder="Select"
                >
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="n/a">N/A</SelectItem>
                </SelectComponent>
              </div>
            </CardContent>
          </div>

          {/* Seller Information Section */}
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seller Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Seller First Name</Label>
                  <Input {...register("sellerFirstName")} />
                </div>
                <div className="space-y-2">
                  <Label>Seller Middle Name</Label>
                  <Input {...register("sellerMiddleName")} />
                </div>
                <div className="space-y-2">
                  <Label className="required">Seller Last Name</Label>
                  <Input {...register("sellerLastName")} />
                </div>
                <div className="space-y-2">
                  <Label>Seller Suffix</Label>
                  <Input {...register("sellerSuffix")} />
                </div>
              </div>

              {/* Seller Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">Seller Street Address</Label>
                  <Input {...register("sellerStreetAddress")} required />
                </div>
                <div className="flex gap-4 items-start">
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input
                      {...register("sellerZipCode")}
                      maxLength={5}
                      className="w-24"
                      disabled={isSellerZipLoading}
                      onChange={(e) => {
                        const value = e.target.value
                          .slice(0, 5)
                          .replace(/\D/g, "");
                        setValue("sellerZipCode", value);
                      }}
                    />
                  </div>

                  {debouncedSellerZipCode?.length === 5 && (
                    <>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <SelectComponent
                          value={watch("sellerCity") || ""}
                          onValueChange={(value) =>
                            setValue("sellerCity", value)
                          }
                          placeholder={
                            isSellerZipLoading
                              ? "Loading cities..."
                              : "Select city"
                          }
                        >
                          {sellerZipData?.primary_city && (
                            <SelectItem value={sellerZipData.primary_city}>
                              {sellerZipData.primary_city}
                            </SelectItem>
                          )}
                          {sellerZipData?.acceptable_cities?.map((city) => (
                            <SelectItem
                              key={city}
                              value={city}
                              className={
                                city === sellerZipData?.primary_city
                                  ? "hidden"
                                  : ""
                              }
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectComponent>
                      </div>

                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={sellerZipData?.state || ""}
                          disabled
                          className="w-16 bg-muted"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Seller Physical Characteristics */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label className="required">Gender</Label>
                  <SelectComponent
                    name="sellerGender"
                    value={watch("sellerGender") || ""}
                    onValueChange={(value) => setValue("sellerGender", value)}
                    placeholder="Select Gender"
                  >
                    {formData?.genders.map((gender: string) => (
                      <SelectItem key={gender} value={gender.toLowerCase()}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>

                <div className="space-y-2">
                  <Label className="required">Hair Color</Label>
                  <SelectComponent
                    name="sellerHairColor"
                    value={watch("sellerHairColor") || ""}
                    onValueChange={(value) =>
                      setValue("sellerHairColor", value)
                    }
                    placeholder="Select Hair Color"
                  >
                    {formData?.hairColors.map((color: string) => (
                      <SelectItem key={color} value={color.toLowerCase()}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>

                <div className="space-y-2">
                  <Label className="required">Eye Color</Label>
                  <SelectComponent
                    name="sellerEyeColor"
                    value={watch("sellerEyeColor") || ""}
                    onValueChange={(value) => setValue("sellerEyeColor", value)}
                    placeholder="Select Eye Color"
                  >
                    {formData?.eyeColors.map((color: string) => (
                      <SelectItem key={color} value={color.toLowerCase()}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>

                {/* Seller Height/Weight/DOB */}

                <div className="space-y-2">
                  <Label className="required">Height</Label>
                  <div className="flex gap-2">
                    <SelectComponent
                      name="sellerHeightFeet"
                      value={String(watch("sellerHeightFeet")) || ""}
                      onValueChange={(value) =>
                        setValue("sellerHeightFeet", Number(value))
                      }
                      placeholder="ft"
                    >
                      {formData?.heightFeet.map((feet: string) => (
                        <SelectItem key={feet} value={feet}>
                          {feet}
                        </SelectItem>
                      ))}
                    </SelectComponent>
                    <SelectComponent
                      name="sellerHeightInches"
                      value={watch("sellerHeightInches")?.toString() || ""}
                      onValueChange={(value) =>
                        setValue("sellerHeightInches", Number(value))
                      }
                      placeholder="in"
                    >
                      {formData?.heightInches.map((inches: string) => (
                        <SelectItem key={inches} value={inches}>
                          {inches}
                        </SelectItem>
                      ))}
                    </SelectComponent>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input {...register("sellerWeight")} />
                </div>

                <div className="space-y-2">
                  <Label className="required">Date of Birth</Label>
                  <Input {...register("sellerDateOfBirth")} type="date" />
                </div>
              </div>

              {/* Seller ID Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Seller ID Type</Label>
                  <SelectComponent
                    name="sellerIdType"
                    value={watch("sellerIdType") || ""}
                    onValueChange={(value) => setValue("sellerIdType", value)}
                    placeholder="Select ID Type"
                  >
                    {formData?.idTypes.map((type: string) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>

                <div className="space-y-2">
                  <Label className="required">Seller ID Number</Label>
                  <Input {...register("sellerIdNumber")} />
                </div>

                <div className="space-y-2">
                  <Label className="required">Race</Label>
                  <SelectComponent
                    name="sellerRace"
                    value={watch("sellerRace") || ""}
                    onValueChange={(value) => setValue("sellerRace", value)}
                    placeholder="Select Race"
                  >
                    {formData?.race.map((race: string) => (
                      <SelectItem key={race} value={race.toLowerCase()}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>

                {/* Seller Additional Information */}

                <div className="space-y-2">
                  <Label className="required">U.S. Citizen</Label>
                  <SelectComponent
                    name="sellerIsUsCitizen"
                    value={watch("sellerIsUsCitizen") || ""}
                    onValueChange={(value) =>
                      setValue("sellerIsUsCitizen", value)
                    }
                    placeholder="Select"
                  >
                    {formData?.citizenship.map((option: string) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Seller Place of Birth</Label>
                  <SelectComponent
                    name="sellerPlaceOfBirth"
                    value={watch("sellerPlaceOfBirth") || ""}
                    onValueChange={(value) =>
                      setValue("sellerPlaceOfBirth", value)
                    }
                    placeholder="Select Place of Birth"
                  >
                    {formData?.placesOfBirth.map((place: string) => (
                      <SelectItem key={place} value={place.toLowerCase()}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input {...register("sellerPhoneNumber")} />
                </div>
              </div>

              {/* Seller Alias Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Seller Alias First Name</Label>
                  <Input {...register("sellerAliasFirstName")} />
                </div>
                <div className="space-y-2">
                  <Label>Seller Alias Middle Name</Label>
                  <Input {...register("sellerAliasMiddleName")} />
                </div>
                <div className="space-y-2">
                  <Label>Seller Alias Last Name</Label>
                  <Input {...register("sellerAliasLastName")} />
                </div>
                <div className="space-y-2">
                  <Label>Seller Alias Suffix</Label>
                  <Input {...register("sellerAliasSuffix")} />
                </div>
              </div>
            </CardContent>
          </div>

          {/* Transaction and Firearm Information */}
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Transaction and Firearm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Gun Show Transaction</Label>
                  <SelectComponent
                    name="isGunShowTransaction"
                    value={watch("isGunShowTransaction") || ""}
                    onValueChange={(value) =>
                      setValue("isGunShowTransaction", value)
                    }
                    placeholder="Select"
                  >
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectComponent>
                </div>
                <div className="space-y-2">
                  <Label>Waiting Period Exemption</Label>
                  <SelectComponent
                    name="waitingPeriodExemption"
                    value={watch("waitingPeriodExemption") || ""}
                    onValueChange={(value) =>
                      setValue("waitingPeriodExemption", value)
                    }
                    placeholder="Select Waiting Period Exemption"
                  >
                    {formData?.waitingPeriodExemption.map(
                      (waitingPeriod: string) => (
                        <SelectItem
                          key={waitingPeriod}
                          value={waitingPeriod.toLowerCase()}
                        >
                          {waitingPeriod}
                        </SelectItem>
                      )
                    )}
                  </SelectComponent>
                </div>
                <div className="space-y-2">
                  <Label>30-Day Restriction Exemption</Label>
                  <Input
                    value="Private Party Transfer Through Licensed Firearms Dealer"
                    disabled
                  />
                </div>
              </div>

              {/* Frame Only Question */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Frame Only</Label>
                  <SelectComponent
                    name="frameOnly"
                    value={frameOnly ? "yes" : "no"}
                    onValueChange={(value: string) => {
                      setValue("frameOnly", value === "yes", {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="Select"
                  >
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectComponent>
                </div>
                {/* Make and Model*/}
                <div className="space-y-2">
                  <Label className="required">Make</Label>
                  <MakeSelect
                    setValue={setValue}
                    value={watch("make") || ""}
                    handgunData={makesData?.manufacturers || []}
                    isLoadingHandguns={isLoadingMakes}
                    makeField="make"
                    modelField="model"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="required">Model</Label>
                  <Input {...register("model")} placeholder="Enter model" />
                </div>
              </div>

              {/* Caliber and Additional Caliber Sections */}
              {frameOnly === false && (
                <>
                  {/* Show caliber sections when frame only is not yes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="required">Caliber</Label>
                      <SelectComponent
                        name="calibers"
                        value={watch("calibers") || ""}
                        onValueChange={(value: string) =>
                          setValue("calibers", value)
                        }
                        placeholder="Select Caliber"
                      >
                        {formData?.calibers.map((caliber: string) => (
                          <SelectItem key={caliber} value={caliber}>
                            {DOMPurify.sanitize(caliber)}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Caliber</Label>
                      <SelectComponent
                        name="additionalCaliber"
                        value={watch("additionalCaliber") || ""}
                        onValueChange={(value) =>
                          setValue("additionalCaliber", value)
                        }
                        placeholder="Select Additional Caliber (Optional)"
                      >
                        {formData?.calibers.map((caliber: string) => (
                          <SelectItem key={caliber} value={caliber}>
                            {DOMPurify.sanitize(caliber)}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                    </div>
                  </div>

                  {/* Additional Caliber 2 and 3 Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Additional Caliber 2</Label>
                      <SelectComponent
                        name="additionalCaliber2"
                        value={watch("additionalCaliber2") || ""}
                        onValueChange={(value) =>
                          setValue("additionalCaliber2", value)
                        }
                        placeholder="Select Caliber"
                      >
                        {formData?.calibers.map((caliber: string) => (
                          <SelectItem key={caliber} value={caliber}>
                            {DOMPurify.sanitize(caliber)}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Caliber 3</Label>
                      <SelectComponent
                        name="additionalCaliber3"
                        value={watch("additionalCaliber3") || ""}
                        onValueChange={(value) =>
                          setValue("additionalCaliber3", value)
                        }
                        placeholder="Select Additional Caliber (Optional)"
                      >
                        {formData?.calibers.map((caliber: string) => (
                          <SelectItem key={caliber} value={caliber}>
                            {DOMPurify.sanitize(caliber)}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                    </div>
                  </div>

                  {/* Combined row for barrel length, unit, gun type, category */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="required">Barrel Length</Label>
                      <Input {...register("barrelLength")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <SelectComponent
                        name="unit"
                        value={watch("unit") || ""}
                        onValueChange={(value) => setValue("unit", value)}
                        placeholder="Select Unit"
                      >
                        {formData?.unit.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {DOMPurify.sanitize(unit)}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                    </div>
                    <div className="space-y-2">
                      <Label>Gun Type</Label>
                      <Input value="HANDGUN" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <SelectComponent
                        name="category"
                        value={watch("category") || ""}
                        onValueChange={(value: string) =>
                          setValue("category", value)
                        }
                        placeholder="Select Category"
                      >
                        {formData?.category.map((category: string) => (
                          <SelectItem key={category} value={category}>
                            {DOMPurify.sanitize(category)}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                    </div>
                  </div>
                </>
              )}

              {frameOnly === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gun Type</Label>
                    <Input value="HANDGUN" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <SelectComponent
                      name="category"
                      value={watch("category") || ""}
                      onValueChange={(value: string) =>
                        setValue("category", value)
                      }
                      placeholder="Select Category"
                    >
                      {formData?.category.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {DOMPurify.sanitize(category)}
                        </SelectItem>
                      ))}
                    </SelectComponent>
                  </div>
                  <div className="space-y-2">
                    <Label>Federally Regulated Firearm Precursor Part</Label>
                    <SelectComponent
                      name="regulated"
                      value={watch("regulated") || ""}
                      onValueChange={(value: string) =>
                        setValue("regulated", value)
                      }
                      placeholder="Select"
                    >
                      {formData?.regulated.map((regulated: string) => (
                        <SelectItem key={regulated} value={regulated}>
                          {DOMPurify.sanitize(regulated)}
                        </SelectItem>
                      ))}
                    </SelectComponent>
                  </div>
                </div>
              )}

              {/* Serial Numbers Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Serial Number</Label>
                  <Input {...register("serialNumber")} />
                </div>
                <div className="space-y-2">
                  <Label className="required">Re-enter Serial Number</Label>
                  <Input
                    onChange={(e) => {
                      const reenteredSerial = e.target.value;
                      if (reenteredSerial === initialFormState?.serialNumber) {
                        // Serial numbers match - you could add visual feedback here
                      } else {
                        // Serial numbers don't match - you could add visual feedback here
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other Number</Label>
                  <Input {...register("otherNumber")} />
                </div>
                <div className="space-y-2">
                  <Label className="required">Color</Label>
                  <SelectComponent
                    name="color"
                    value={watch("color") || ""}
                    onValueChange={(value) => setValue("color", value)}
                    placeholder="Select Color"
                  >
                    {formData?.colors.map((color: string) => (
                      <SelectItem key={color} value={color.toLowerCase()}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>
              </div>
              {/* Gun Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">New/Used Gun</Label>
                  <SelectComponent
                    name="isNewGun"
                    value={watch("isNewGun") || ""}
                    onValueChange={(value) => setValue("isNewGun", value)}
                    placeholder="Select"
                  >
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectComponent>
                </div>
                <div className="space-y-2">
                  <Label className="required">
                    Firearm Safety Device (FSD)
                  </Label>
                  <SelectComponent
                    name="firearmSafetyDevice"
                    value={watch("firearmSafetyDevice") || ""}
                    onValueChange={(value) =>
                      setValue("firearmSafetyDevice", value)
                    }
                    placeholder="Select Firearm Safety Device (FSD)"
                  >
                    {formData?.fsd.map((code: string) => (
                      <SelectItem key={code} value={code.toLowerCase()}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectComponent>
                </div>
              </div>

              {/* Non-Roster Exemption Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">
                    Purchaser Non-Roster Exemption
                  </Label>
                  {isLoadingFormData ? (
                    <SelectComponent
                      name="nonRosterExemption"
                      value=""
                      onValueChange={() => {}}
                      placeholder="Loading..."
                    >
                      <SelectItem value="loading">Loading...</SelectItem>
                    </SelectComponent>
                  ) : (
                    <SelectComponent
                      name="nonRosterExemption"
                      value={watch("nonRosterExemption") || ""}
                      onValueChange={(value) =>
                        setValue("nonRosterExemption", value)
                      }
                      placeholder="Select Purchaser Non-Roster Exemption"
                    >
                      {(formData?.nonRosterExemption || [])
                        .filter(
                          (exemption: string) =>
                            exemption && exemption.trim() !== ""
                        ) // Filter out empty values
                        .map((exemption: string) => (
                          <SelectItem
                            key={exemption}
                            value={exemption || `exemption-${Date.now()}`} // Ensure unique non-empty value
                          >
                            {exemption}
                          </SelectItem>
                        ))}
                    </SelectComponent>
                  )}
                </div>

                {(() => {
                  const selectedExemption = useWatch({
                    control: form.control,
                    name: "nonRosterExemption",
                  });
                  let agencyType = null;

                  if (selectedExemption === "Police Department")
                    agencyType = "PD";
                  else if (selectedExemption === "Sheriff's Office")
                    agencyType = "SO";
                  else if (
                    selectedExemption === "Any District Attorney's Office"
                  )
                    agencyType = "DA";

                  if (!agencyType) return null;

                  return (
                    <AgencyDepartmentSelect
                      agencyType={agencyType}
                      value={watch("agencyDepartment") || ""}
                      onChange={(value) => {
                        setValue("agencyDepartment", value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  );
                })()}
              </div>

              {/* Comments Section */}
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea
                  {...register("comments")}
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  maxLength={200}
                />
                <div className="text-sm text-gray-500">
                  200 character limit. Characters remaining:{" "}
                  {200 - (initialFormState?.comments?.length || 0)}
                </div>
              </div>
            </CardContent>
          </div>

          {/* Additional fields can be added following the same pattern */}
        </CardContent>
      </Card>
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => router.push("/TGR/dros/training")}
        >
          Back
        </Button>
        <PreviewDialog form={form} />
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default OfficerPptHandgunPage;
