"use client";
import MakeSelectExempt from "@/components/MakeSelectExempt";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { Control, useForm, UseFormSetValue, useWatch } from "react-hook-form";
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
  DialogDescription,
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
import { Loader2 } from "lucide-react";
import { FORM_OPTIONS } from "../components/formOptions";
import MakeSelect from "@/components/MakeSelect";

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
  heightFeet: string;
  heightInches: string;
  weight?: string;
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
  hscFscNumber?: string;
  exemptionCode: string;
  eligibilityQ1: string;
  eligibilityQ2: string;
  eligibilityQ3: string;
  eligibilityQ4: string;
  firearmsQ1: string; // Add this field
  isGunShowTransaction: string;
  waitingPeriodExemption?: string;
  restrictionExemption?: string;
  frameOnly?: string;
  make: string;
  model: string;
  calibers: string;
  additionalCaliber: string;
  additionalCaliber2: string;
  additionalCaliber3: string;
  barrelLength: string;
  unit: string;
  gunType: string;
  category: string;
  regulated: string;
  serialNumber: string;
  otherNumber?: string;
  color: string;
  isNewGun: string;
  firearmSafetyDevice: string;
  comments?: string;
  transaction_type: string;
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
  heightFeet: "",
  heightInches: "",
  weight: "",
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
  hscFscNumber: "",
  exemptionCode: "",
  eligibilityQ1: "",
  eligibilityQ2: "",
  eligibilityQ3: "",
  eligibilityQ4: "",
  firearmsQ1: "",
  isGunShowTransaction: "",
  waitingPeriodExemption: "",
  restrictionExemption: "",
  make: "",
  model: "",
  serialNumber: "",
  otherNumber: "",
  color: "",
  isNewGun: "",
  firearmSafetyDevice: "",
  comments: "",
  transaction_type: "curiorelic-handgun",
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

interface HandgunRoster {
  [make: string]: string[];
}

const PreviewDialog = ({ control }: { control: Control<FormData> }) => {
  const formValues = useWatch({ control });
  const router = useRouter();

  // Form submission mutation
  const { mutate: submitForm, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      // Format the data before submission
      const formattedData = {
        ...data,
        transaction_type: " curiorelic-handgun",
        // Ensure required fields are present and properly formatted
        firstName: data.firstName?.trim() || "",
        lastName: data.lastName?.trim() || "",
        streetAddress: data.streetAddress?.trim() || "",
        zipCode: data.zipCode?.trim() || "",
        city: data.city?.trim() || "",
        state: data.state?.trim() || "",
        gender: data.gender?.toLowerCase() || "",
        hairColor: data.hairColor?.toLowerCase() || "",
        eyeColor: data.eyeColor?.toLowerCase() || "",
        heightFeet: data.heightFeet?.toString() || "",
        heightInches: data.heightInches?.toString() || "",
        dateOfBirth: data.dateOfBirth || "",
        idType: data.idType?.toLowerCase() || "",
        idNumber: data.idNumber?.trim() || "",
        race: data.race?.toLowerCase() || "",
        isUsCitizen: data.isUsCitizen?.toLowerCase() || "",
        placeOfBirth: data.placeOfBirth?.toLowerCase() || "",
        eligibilityQ1: data.eligibilityQ1?.toLowerCase() || "",
        eligibilityQ2: data.eligibilityQ2?.toLowerCase() || "",
        eligibilityQ3: data.eligibilityQ3?.toLowerCase() || "",
        eligibilityQ4: data.eligibilityQ4?.toLowerCase() || "",
        isGunShowTransaction: data.isGunShowTransaction?.toLowerCase() || "",
        make: data.make?.toLowerCase() || "",
        model: data.model?.toLowerCase() || "",
        serialNumber: data.serialNumber?.trim() || "",
        color: data.color?.toLowerCase() || "",
        isNewGun: data.isNewGun?.toLowerCase() || "",
        firearmSafetyDevice: data.firearmSafetyDevice?.toLowerCase() || "",
        frameOnly: data.frameOnly || "no",
        // Handle optional fields
        middleName: data.middleName?.trim() || null,
        suffix: data.suffix?.trim() || null,
        weight: data.weight || null,
        phoneNumber: data.phoneNumber?.trim() || null,
        aliasFirstName: data.aliasFirstName?.trim() || null,
        aliasMiddleName: data.aliasMiddleName?.trim() || null,
        aliasLastName: data.aliasLastName?.trim() || null,
        aliasSuffix: data.aliasSuffix?.trim() || null,
        hscFscNumber: data.hscFscNumber?.trim() || null,
        waitingPeriodExemption:
          data.waitingPeriodExemption?.toLowerCase() || null,
        restrictionExemption: data.restrictionExemption?.toLowerCase() || null,
        otherNumber: data.otherNumber?.trim() || null,
        comments: data.comments?.trim() || null,
        // Handle conditional fields based on frameOnly
        calibers:
          data.frameOnly === "yes"
            ? null
            : data.calibers?.toLowerCase() || null,
        additionalCaliber:
          data.frameOnly === "yes"
            ? null
            : data.additionalCaliber?.toLowerCase() || null,
        additionalCaliber2:
          data.frameOnly === "yes"
            ? null
            : data.additionalCaliber2?.toLowerCase() || null,
        additionalCaliber3:
          data.frameOnly === "yes"
            ? null
            : data.additionalCaliber3?.toLowerCase() || null,
        barrelLength:
          data.frameOnly === "yes" ? null : data.barrelLength || null,
        unit:
          data.frameOnly === "yes" ? null : data.unit?.toUpperCase() || null,
        category: data.category?.toUpperCase() || null,
        regulated:
          data.frameOnly === "yes" ? data.regulated?.toUpperCase() : null,
        firearmsQ1: data.firearmsQ1?.toLowerCase() || null,
      };

      const response = await fetch("/api/curiorelicHandgun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form submitted successfully",
        variant: "default",
      });
      router.push("/TGR/dros/training");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      });
    },
  });

  // Dialog state mutation
  const { data: isDialogOpen, mutate: setDialogOpen } = useMutation({
    mutationKey: ["previewDialog"],
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Preview"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Submission</DialogTitle>
          <DialogDescription>
            Please review your information before submitting
          </DialogDescription>
        </DialogHeader>

        {/* Preview Content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">First Name:</span>
              <span>{formValues.firstName}</span>

              {formValues.middleName && (
                <>
                  <span className="font-medium">Middle Name:</span>
                  <span>{formValues.middleName}</span>
                </>
              )}

              <span className="font-medium">Last Name:</span>
              <span>{formValues.lastName}</span>

              {formValues.suffix && (
                <>
                  <span className="font-medium">Suffix:</span>
                  <span>{formValues.suffix}</span>
                </>
              )}

              <span className="font-medium">Street Address:</span>
              <span>{formValues.streetAddress}</span>

              <span className="font-medium">City:</span>
              <span>{formValues.city}</span>

              <span className="font-medium">State:</span>
              <span>{formValues.state}</span>

              <span className="font-medium">ZIP Code:</span>
              <span>{formValues.zipCode}</span>

              <span className="font-medium">Gender:</span>
              <span>{formValues.gender}</span>

              <span className="font-medium">Hair Color:</span>
              <span>{formValues.hairColor}</span>

              <span className="font-medium">Eye Color:</span>
              <span>{formValues.eyeColor}</span>

              <span className="font-medium">Height:</span>
              <span>{`${formValues.heightFeet}'${formValues.heightInches}"`}</span>

              {formValues.weight && (
                <>
                  <span className="font-medium">Weight:</span>
                  <span>{formValues.weight} lbs</span>
                </>
              )}

              <span className="font-medium">Date of Birth:</span>
              <span>{formValues.dateOfBirth}</span>

              <span className="font-medium">ID Type:</span>
              <span>{formValues.idType}</span>

              <span className="font-medium">ID Number:</span>
              <span>{formValues.idNumber}</span>

              <span className="font-medium">Race:</span>
              <span>{formValues.race}</span>

              <span className="font-medium">US Citizen:</span>
              <span>{formValues.isUsCitizen}</span>

              <span className="font-medium">Place of Birth:</span>
              <span>{formValues.placeOfBirth}</span>

              {formValues.phoneNumber && (
                <>
                  <span className="font-medium">Phone Number:</span>
                  <span>{formValues.phoneNumber}</span>
                </>
              )}
            </div>
          </div>

          {/* Alias Information if any exists */}
          {(formValues.aliasFirstName ||
            formValues.aliasMiddleName ||
            formValues.aliasLastName ||
            formValues.aliasSuffix) && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Alias Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {formValues.aliasFirstName && (
                  <>
                    <span className="font-medium">Alias First Name:</span>
                    <span>{formValues.aliasFirstName}</span>
                  </>
                )}

                {formValues.aliasMiddleName && (
                  <>
                    <span className="font-medium">Alias Middle Name:</span>
                    <span>{formValues.aliasMiddleName}</span>
                  </>
                )}

                {formValues.aliasLastName && (
                  <>
                    <span className="font-medium">Alias Last Name:</span>
                    <span>{formValues.aliasLastName}</span>
                  </>
                )}

                {formValues.aliasSuffix && (
                  <>
                    <span className="font-medium">Alias Suffix:</span>
                    <span>{formValues.aliasSuffix}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transaction Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Transaction Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {formValues.hscFscNumber && (
                <>
                  <span className="font-medium">HSC/FSC Number:</span>
                  <span>{formValues.hscFscNumber}</span>
                </>
              )}

              <span className="font-medium">Exemption Code:</span>
              <span>{formValues.exemptionCode}</span>

              <span className="font-medium">Gun Show Transaction:</span>
              <span>{formValues.isGunShowTransaction}</span>

              {formValues.waitingPeriodExemption && (
                <>
                  <span className="font-medium">Waiting Period Exemption:</span>
                  <span>{formValues.waitingPeriodExemption}</span>
                </>
              )}

              {formValues.restrictionExemption && (
                <>
                  <span className="font-medium">Restriction Exemption:</span>
                  <span>{formValues.restrictionExemption}</span>
                </>
              )}
            </div>
          </div>

          {/* Eligibility Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Eligibility Questions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Question 1:</span>
              <span>{formValues.eligibilityQ1}</span>

              <span className="font-medium">Question 2:</span>
              <span>{formValues.eligibilityQ2}</span>

              <span className="font-medium">Question 3:</span>
              <span>{formValues.eligibilityQ3}</span>

              <span className="font-medium">Question 4:</span>
              <span>{formValues.eligibilityQ4}</span>

              {formValues.firearmsQ1 && (
                <>
                  <span className="font-medium">Firearms Question:</span>
                  <span>{formValues.firearmsQ1}</span>
                </>
              )}
            </div>
          </div>

          {/* Firearm Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Firearm Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Frame Only:</span>
              <span>{formValues.frameOnly}</span>

              <span className="font-medium">Make:</span>
              <span>{formValues.make}</span>

              <span className="font-medium">Model:</span>
              <span>{formValues.model}</span>

              {formValues.frameOnly !== "yes" && (
                <>
                  <span className="font-medium">Caliber:</span>
                  <span>{formValues.calibers}</span>

                  {formValues.additionalCaliber && (
                    <>
                      <span className="font-medium">Additional Caliber:</span>
                      <span>{formValues.additionalCaliber}</span>
                    </>
                  )}

                  {formValues.additionalCaliber2 && (
                    <>
                      <span className="font-medium">Additional Caliber 2:</span>
                      <span>{formValues.additionalCaliber2}</span>
                    </>
                  )}

                  {formValues.additionalCaliber3 && (
                    <>
                      <span className="font-medium">Additional Caliber 3:</span>
                      <span>{formValues.additionalCaliber3}</span>
                    </>
                  )}

                  <span className="font-medium">Barrel Length:</span>
                  <span>{`${formValues.barrelLength} ${formValues.unit}`}</span>
                </>
              )}

              <span className="font-medium">Gun Type:</span>
              <span>{formValues.gunType || "HANDGUN"}</span>

              <span className="font-medium">Category:</span>
              <span>{formValues.category}</span>

              {formValues.frameOnly === "yes" && formValues.regulated && (
                <>
                  <span className="font-medium">Regulated:</span>
                  <span>{formValues.regulated}</span>
                </>
              )}

              <span className="font-medium">Serial Number:</span>
              <span>{formValues.serialNumber}</span>

              {formValues.otherNumber && (
                <>
                  <span className="font-medium">Other Number:</span>
                  <span>{formValues.otherNumber}</span>
                </>
              )}

              <span className="font-medium">Color:</span>
              <span>{formValues.color}</span>

              <span className="font-medium">New/Used:</span>
              <span>{formValues.isNewGun}</span>

              <span className="font-medium">Firearm Safety Device:</span>
              <span>{formValues.firearmSafetyDevice}</span>

              {/* {formValues.nonRosterExemption && (
                <>
                  <span className="font-medium">Non-Roster Exemption:</span>
                  <span>{formValues.nonRosterExemption}</span>
                </>
              )}

              {formValues.agencyDepartment && (
                <>
                  <span className="font-medium">Agency/Department:</span>
                  <span>{formValues.agencyDepartment}</span>
                </>
              )} */}

              {formValues.comments && (
                <>
                  <span className="font-medium">Comments:</span>
                  <span>{formValues.comments}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => submitForm(formValues as FormData)}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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

const CurioRelicHandgun = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control, // Add this
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: initialFormState,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  // Watch both zip code fields
  const zipCode = watch("zipCode");
  //   const sellerZipCode = watch("sellerZipCode");
  const frameOnlySelection = watch("frameOnly");

  // Use both zip code lookup hooks
  const { data: zipData, isLoading: isZipLoading } = useZipCodeLookup(
    zipCode || "",
    setValue
  );

  // const { data: sellerZipData, isLoading: isSellerZipLoading } =
  //     useSellerZipCodeLookup(sellerZipCode || "", setValue);

  // Replace form state management with react-hook-form
  const onSubmit = (data: FormData) => {
    submitForm(data);
  };

  // Form submission mutation
  const { mutate: submitForm, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/curiorelicHandgun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          transaction_type: "curiorelic-handgun",
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

  // Dialog state mutation
  const { data: isDialogOpen, mutate: setDialogOpen } = useMutation({
    mutationKey: ["previewDialog"],
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
  });

  const { mutate: handleReset } = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      // Invalidate all relevant queries to reset their data
      queryClient.invalidateQueries({ queryKey: ["handgunRoster"] });
      queryClient.invalidateQueries({ queryKey: ["formOptions"] });
      // Reset the selected make
      setSelectedMake("");
    },
  });

  // Add this mutation for handling navigation
  const { mutate: handleNavigation } = useMutation({
    mutationFn: (path: string) => {
      router.push(path);
      return Promise.resolve();
    },
  });

  // Example query - replace with your actual data fetching logic
  const { data: formData, isLoading: isLoadingFormData } = useQuery({
    queryKey: ["formOptions"],
    queryFn: async () => {
      // Replace with your actual API call
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
  });

  // Update the handgun roster query
  const { data: handgunData, isLoading: isLoadingHandguns } = useQuery({
    queryKey: ["handgunRoster"],
    queryFn: async () => {
      const response = await fetch("/api/fetchPpt", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch manufacturers");
      }
      const data = await response.json();
      return data;
    },
  });

  // Watch the make and model fields
  const selectedMake = watch("make");
  const selectedModel = watch("model");

  // Update the handgun details query
  const { data: handgunDetails } = useQuery({
    queryKey: ["handgunDetails", selectedMake, selectedModel],
    queryFn: async () => {
      if (!selectedMake || !selectedModel) return null;
      const response = await fetch(
        `/api/fetchRoster?make=${selectedMake}&model=${selectedModel}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: !!selectedMake && !!selectedModel,
  });

  // Get models for selected manufacturer
  const models = useMemo(() => {
    if (!handgunData || !selectedMake) return [];
    return handgunData[selectedMake]?.sort() || [];
  }, [handgunData, selectedMake]);

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

  // Add this query to fetch makes
  const { data: makesData, isLoading: isLoadingMakes } = useQuery({
    queryKey: ["makes"],
    queryFn: async () => {
      const response = await fetch("/api/fetchPpt");
      if (!response.ok) throw new Error("Failed to fetch makes");
      const data = await response.json();
      return data;
    },
  });

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-center mb-8">
        Submit Curio | Relic Handgun Sale
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
                  {...register("zipCode", {
                    onChange: (e) => {
                      const value = e.target.value
                        .slice(0, 5)
                        .replace(/\D/g, "");
                      e.target.value = value;
                    },
                    maxLength: 5,
                  })}
                  className="w-24"
                />
              </div>

              {isZipLoading ? (
                <div className="space-y-2">
                  <Label>Loading...</Label>
                  <Input disabled className="w-32" />
                </div>
              ) : zipData ? (
                <>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <SelectComponent
                      name="city"
                      value={watch("city") || ""}
                      onValueChange={(value) => setValue("city", value)}
                      placeholder="Select city"
                    >
                      {zipData.primary_city && (
                        <SelectItem value={zipData.primary_city}>
                          {zipData.primary_city}
                        </SelectItem>
                      )}
                      {zipData.acceptable_cities
                        ?.filter(
                          (city) =>
                            city &&
                            city.trim() !== "" &&
                            city !== zipData.primary_city
                        )
                        .map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectComponent>
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={zipData.state || ""}
                      disabled
                      className="w-16 bg-muted"
                    />
                  </div>
                </>
              ) : null}
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
                {formData?.genders.map((gender) => (
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
                {formData?.hairColors.map((color) => (
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
                {formData?.eyeColors.map((color) => (
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
                  value={watch("heightFeet") || ""}
                  onValueChange={(value) => setValue("heightFeet", value)}
                  placeholder="Feet"
                >
                  {formData?.heightFeet.map((feet) => (
                    <SelectItem key={feet} value={feet}>
                      {feet}
                    </SelectItem>
                  ))}
                </SelectComponent>
                <SelectComponent
                  name="heightInches"
                  value={watch("heightInches") || ""}
                  onValueChange={(value) => setValue("heightInches", value)}
                  placeholder="Inches"
                >
                  {formData?.heightInches.map((inches) => (
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
                {formData?.idTypes.map((type) => (
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
                {formData?.race.map((race) => (
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
                {formData?.citizenship.map((type) => (
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
                {formData?.placesOfBirth.map((place) => (
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
                {formData?.exemptionCodes.map((code) => (
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

              {/* Firearms Possession Question */}
              <div className="space-y-2">
                <Label className="required block text-sm font-medium">
                  <span className="font-bold">
                    Firearms Possession Question 1:
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
                  <SelectItem value="na">N/A</SelectItem>
                </SelectComponent>
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
                    {(formData?.waitingPeriodExemption || [])
                      .filter(
                        (waitingPeriod) =>
                          waitingPeriod && waitingPeriod.trim() !== ""
                      )
                      .map((waitingPeriod) => (
                        <SelectItem
                          key={waitingPeriod}
                          value={waitingPeriod.toLowerCase()}
                        >
                          {waitingPeriod}
                        </SelectItem>
                      ))}
                  </SelectComponent>
                </div>
                <div className="space-y-2">
                  <Label>30-Day Restriction Exemption</Label>
                  <Select
                    {...register("restrictionExemption")}
                    onValueChange={(value) =>
                      setValue("restrictionExemption", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select 30-Day Restriction Exemption" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.restrictionsExemptions.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Frame Only Question */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Frame Only</Label>
                  <SelectComponent
                    name="frameOnly"
                    value={watch("frameOnly") || ""}
                    onValueChange={(value) => setValue("frameOnly", value)}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label className="required">Model</Label>
                  <Input {...register("model")} placeholder="Enter model" />
                </div>
              </div>

              {/* Caliber and Additional Caliber Sections */}

              {frameOnlySelection !== "yes" ? (
                <>
                  {/* Show caliber sections when frame only is not yes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="required">Caliber</Label>
                      <SelectComponent
                        name="calibers"
                        value={watch("calibers") || ""}
                        onValueChange={(value) => setValue("calibers", value)}
                        placeholder="Select Caliber"
                      >
                        {formData?.calibers.map((caliber) => (
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
                        {formData?.calibers.map((caliber) => (
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
                        {formData?.calibers.map((caliber) => (
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
                        {formData?.calibers.map((caliber) => (
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
                        {(formData?.unit || [])
                          .filter((unit) => unit && unit.trim() !== "")
                          .map((unit) => (
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
                        onValueChange={(value) => setValue("category", value)}
                        placeholder="Select Category"
                      >
                        {(formData?.category || [])
                          .filter(
                            (category) => category && category.trim() !== ""
                          )
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {DOMPurify.sanitize(category)}
                            </SelectItem>
                          ))}
                      </SelectComponent>
                    </div>
                  </div>
                </>
              ) : (
                /* When frame only is yes, show gun type, category, and regulated in one row */
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
                      onValueChange={(value) => setValue("category", value)}
                      placeholder="Select Category"
                    >
                      {(formData?.category || [])
                        .filter(
                          (category) => category && category.trim() !== ""
                        )
                        .map((category) => (
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
                      onValueChange={(value) => setValue("regulated", value)}
                      placeholder="Select"
                    >
                      {(formData?.regulated || [])
                        .filter(
                          (regulated) => regulated && regulated.trim() !== ""
                        )
                        .map((regulated) => (
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
                    {(formData?.colors || [])
                      .filter((color) => color && color.trim() !== "")
                      .map((color) => (
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
                    {(formData?.fsd || [])
                      .filter((code) => code && code.trim() !== "")
                      .map((code) => (
                        <SelectItem key={code} value={code.toLowerCase()}>
                          {code}
                        </SelectItem>
                      ))}
                  </SelectComponent>
                </div>
              </div>

              {/* Non-Roster Exemption Section */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">
                    Purchaser Non-Roster Exemption
                  </Label>
                  {isLoadingFormData ? (
                    <SelectComponent
                      name="nonRosterExemption"
                      value="loading"
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
                          (exemption) => exemption && exemption.trim() !== ""
                        )
                        .map((exemption) => (
                          <SelectItem key={exemption} value={exemption}>
                            {exemption}
                          </SelectItem>
                        ))}
                    </SelectComponent>
                  )}
                </div>

                {(() => {
                  const selectedExemption = watch("nonRosterExemption");
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
                      value={watch("agencyDepartment") ?? ""}
                      onChange={(value) => {
                        setValue("agencyDepartment", value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  );
                })()}
              </div> */}

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
        <PreviewDialog control={control} />
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default CurioRelicHandgun;
