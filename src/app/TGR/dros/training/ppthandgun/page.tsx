"use client";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import {
  Control,
  useForm,
  useFormContext,
  UseFormSetValue,
  useWatch,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";

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
  firearmsQ1: string;
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
  sellerFirstName: string;
  sellerMiddleName: string;
  sellerLastName: string;
  sellerSuffix: string;
  sellerStreetAddress: string;
  sellerZipCode: string;
  sellerCity: string;
  sellerState: string;
  sellerGender: string;
  sellerHairColor: string;
  sellerEyeColor: string;
  sellerHeightFeet: string;
  sellerHeightInches: string;
  sellerWeight: string;
  sellerDateOfBirth: string;
  sellerIdType: string;
  sellerIdNumber: string;
  sellerRace: string;
  sellerIsUsCitizen: string;
  sellerPlaceOfBirth: string;
  sellerPhoneNumber: string;
  sellerAliasFirstName: string;
  sellerAliasMiddleName: string;
  sellerAliasLastName: string;
  sellerAliasSuffix: string;
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
  transaction_type: "dealer-handgun",
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
  sellerHeightFeet: "",
  sellerHeightInches: "",
  sellerWeight: "",
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
};

const useZipCodeLookup = (
  zipCode: string,
  setValue: UseFormSetValue<FormData>
) => {
  return useQuery({
    queryKey: ["zipCode", zipCode],
    queryFn: async (): Promise<ZipCodeData | null> => {
      if (zipCode.length !== 5) return null;

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
    },
    enabled: zipCode?.length === 5,
    staleTime: 30000,
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

      const { data, error } = await supabase
        .from("zip_codes")
        .select("primary_city, state, acceptable_cities")
        .eq("zip", sellerZipCode)
        .single();

      if (error) throw error;

      if (data) {
        setValue("sellerCity", data.primary_city, { shouldValidate: true });
        setValue("sellerState", data.state, { shouldValidate: true });
      }

      return data;
    },
    enabled: sellerZipCode?.length === 5,
    staleTime: 30000,
  });
};

interface HandgunRoster {
  [make: string]: string[];
}

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
  });
};

const PreviewDialog = () => {
  const form = useFormContext<FormData>();
  const formValues = useWatch({ control: form.control });
  const router = useRouter();

  // Dialog state mutation
  const { mutate: setDialogOpen } = useMutation({
    mutationKey: ["previewDialog"],
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
  });

  // Form submission mutation
  const { mutate: submitForm, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform the data before submission
      const frameOnlyData = {
        frame_only: data.frameOnly === "yes",
        calibers: data.frameOnly === "yes" ? null : data.calibers,
        additional_caliber:
          data.frameOnly === "yes" ? null : data.additionalCaliber,
        additional_caliber2:
          data.frameOnly === "yes" ? null : data.additionalCaliber2,
        additional_caliber3:
          data.frameOnly === "yes" ? null : data.additionalCaliber3,
        barrel_length:
          data.frameOnly === "yes" ? null : parseFloat(data.barrelLength) || 0,
        unit: data.frameOnly === "yes" ? null : "INCH",
        gun_type: "HANDGUN",
        category: data.category,
        regulated:
          data.frameOnly === "yes" ? data.regulated?.toUpperCase() : null,
        status: "submitted", // Add default status
      };

      const transformedData = {
        ...data,
        ...frameOnlyData,
        transaction_type: "ppt-handgun",
        // Ensure proper case for fields
        gender: data.gender?.toLowerCase(),
        hairColor: data.hairColor?.toLowerCase(),
        eyeColor: data.eyeColor?.toLowerCase(),
        sellerGender: data.sellerGender?.toLowerCase(),
        sellerHairColor: data.sellerHairColor?.toLowerCase(),
        sellerEyeColor: data.sellerEyeColor?.toLowerCase(),
        // Set default exemption code if empty
        exemptionCode: data.exemptionCode || "NO EXEMPTION",
        // Convert numeric fields
        height_feet: parseInt(data.heightFeet) || 0,
        height_inches: parseInt(data.heightInches) || 0,
        seller_height_feet: parseInt(data.sellerHeightFeet) || 0,
        seller_height_inches: parseInt(data.sellerHeightInches) || 0,
        // Ensure yes/no fields are lowercase
        is_us_citizen: data.isUsCitizen?.toLowerCase(),
        seller_is_us_citizen: data.sellerIsUsCitizen?.toLowerCase(),
        is_gun_show_transaction: data.isGunShowTransaction?.toLowerCase(),
        eligibility_q1: data.eligibilityQ1?.toLowerCase(),
        eligibility_q2: data.eligibilityQ2?.toLowerCase(),
        eligibility_q3: data.eligibilityQ3?.toLowerCase(),
        eligibility_q4: data.eligibilityQ4?.toLowerCase(),
        firearms_q1: data.firearmsQ1?.toLowerCase(),
        is_new_gun: data.isNewGun?.toLowerCase(),
      };

      console.log("Transformed data being sent:", transformedData);

      const response = await fetch("/api/pptHandgun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.details || errorData.error || "Failed to submit form"
        );
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
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    const result = await form.trigger();
    if (!result) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const formData = form.getValues();
    console.log("Submitting form data:", formData);
    submitForm(formData);
  };

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
              <span>{`${formValues.firstName} ${formValues.middleName || ""} ${
                formValues.lastName
              } ${formValues.suffix || ""}`}</span>

              <span className="font-medium">Address:</span>
              <span>{`${formValues.streetAddress}, ${formValues.city}, ${formValues.state} ${formValues.zipCode}`}</span>

              <span className="font-medium">Physical Description:</span>
              <span>{`${formValues.gender}, ${formValues.hairColor} hair, ${formValues.eyeColor} eyes`}</span>

              <span className="font-medium">Height:</span>
              <span>{`${formValues.heightFeet}'${formValues.heightInches}"`}</span>

              <span className="font-medium">Weight:</span>
              <span>{formValues.weight || "N/A"}</span>

              <span className="font-medium">Date of Birth:</span>
              <span>{formValues.dateOfBirth}</span>

              <span className="font-medium">ID Information:</span>
              <span>{`${formValues.idType} - ${formValues.idNumber}`}</span>

              <span className="font-medium">Race:</span>
              <span>{formValues.race}</span>

              <span className="font-medium">U.S. Citizen:</span>
              <span>{formValues.isUsCitizen}</span>

              <span className="font-medium">Place of Birth:</span>
              <span>{formValues.placeOfBirth}</span>

              <span className="font-medium">Phone Number:</span>
              <span>{formValues.phoneNumber || "N/A"}</span>

              {/* Alias Information if provided */}
              {(formValues.aliasFirstName || formValues.aliasLastName) && (
                <>
                  <span className="font-medium">Alias:</span>
                  <span>{`${formValues.aliasFirstName || ""} ${
                    formValues.aliasMiddleName || ""
                  } ${formValues.aliasLastName || ""} ${
                    formValues.aliasSuffix || ""
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
              <span>{`${formValues.sellerFirstName} ${
                formValues.sellerMiddleName || ""
              } ${formValues.sellerLastName} ${
                formValues.sellerSuffix || ""
              }`}</span>

              <span className="font-medium">Address:</span>
              <span>{`${formValues.sellerStreetAddress}, ${formValues.sellerCity}, ${formValues.sellerState} ${formValues.sellerZipCode}`}</span>

              <span className="font-medium">Physical Description:</span>
              <span>{`${formValues.sellerGender}, ${formValues.sellerHairColor} hair, ${formValues.sellerEyeColor} eyes`}</span>

              <span className="font-medium">Height:</span>
              <span>{`${formValues.sellerHeightFeet}'${formValues.sellerHeightInches}"`}</span>

              <span className="font-medium">Weight:</span>
              <span>{formValues.sellerWeight || "N/A"}</span>

              <span className="font-medium">Date of Birth:</span>
              <span>{formValues.sellerDateOfBirth}</span>

              <span className="font-medium">ID Information:</span>
              <span>{`${formValues.sellerIdType} - ${formValues.sellerIdNumber}`}</span>

              <span className="font-medium">Race:</span>
              <span>{formValues.sellerRace}</span>

              <span className="font-medium">U.S. Citizen:</span>
              <span>{formValues.sellerIsUsCitizen}</span>

              <span className="font-medium">Place of Birth:</span>
              <span>{formValues.sellerPlaceOfBirth}</span>

              <span className="font-medium">Phone Number:</span>
              <span>{formValues.sellerPhoneNumber || "N/A"}</span>

              {/* Seller Alias Information if provided */}
              {(formValues.sellerAliasFirstName ||
                formValues.sellerAliasLastName) && (
                <>
                  <span className="font-medium">Alias:</span>
                  <span>{`${formValues.sellerAliasFirstName || ""} ${
                    formValues.sellerAliasMiddleName || ""
                  } ${formValues.sellerAliasLastName || ""} ${
                    formValues.sellerAliasSuffix || ""
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

              {formValues.frameOnly === "yes" && (
                <>
                  <span className="font-medium">Federally Regulated:</span>
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

              <span className="font-medium">FSD:</span>
              <span>{formValues.firearmSafetyDevice}</span>
            </div>
          </div>

          {/* Transaction Information */}
          <div className="col-span-2 space-y-4 mt-4">
            <h3 className="font-bold">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Gun Show Transaction:</span>
              <span>{formValues.isGunShowTransaction}</span>

              <span className="font-medium">Waiting Period Exemption:</span>
              <span>{formValues.waitingPeriodExemption || "N/A"}</span>

              <span className="font-medium">HSC/FSC Number:</span>
              <span>{formValues.hscFscNumber || "N/A"}</span>

              <span className="font-medium">Exemption Code:</span>
              <span>{formValues.exemptionCode || "N/A"}</span>

              <span className="font-medium">Comments:</span>
              <span>{formValues.comments || "N/A"}</span>
            </div>
          </div>

          {/* Eligibility Questions */}
          <div className="col-span-2 space-y-4 mt-4">
            <h3 className="font-bold">Eligibility Questions</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Eligibility Question 1:</span>
              <span>{formValues.eligibilityQ1}</span>

              <span className="font-medium">Eligibility Question 2:</span>
              <span>{formValues.eligibilityQ2}</span>

              <span className="font-medium">Eligibility Question 3:</span>
              <span>{formValues.eligibilityQ3}</span>

              <span className="font-medium">Eligibility Question 4:</span>
              <span>{formValues.eligibilityQ4}</span>

              <span className="font-medium">Firearms Possession Question:</span>
              <span>{formValues.firearmsQ1}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Submit"}
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

const PptHandgunPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const methods = useForm<FormData>({
    defaultValues: initialFormState,
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(
      z.object({
        // Buyer fields
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        streetAddress: z.string().min(1, "Street address is required"),
        zipCode: z.string().min(5, "Valid zip code is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        gender: z.string().min(1, "Gender is required"),
        hairColor: z.string().min(1, "Hair color is required"),
        eyeColor: z.string().min(1, "Eye color is required"),
        heightFeet: z.string().min(1, "Height (feet) is required"),
        heightInches: z.string().min(1, "Height (inches) is required"),
        dateOfBirth: z.string().min(1, "Date of birth is required"),
        idType: z.string().min(1, "ID type is required"),
        idNumber: z.string().min(1, "ID number is required"),
        race: z.string().min(1, "Race is required"),
        isUsCitizen: z.string().min(1, "Citizenship status is required"),
        placeOfBirth: z.string().min(1, "Place of birth is required"),
        // Seller fields
        sellerFirstName: z.string().min(1, "Seller first name is required"),
        sellerLastName: z.string().min(1, "Seller last name is required"),
        sellerStreetAddress: z
          .string()
          .min(1, "Seller street address is required"),
        sellerZipCode: z.string().min(5, "Valid seller zip code is required"),
        sellerCity: z.string().min(1, "Seller city is required"),
        sellerState: z.string().min(1, "Seller state is required"),
        sellerGender: z.string().min(1, "Seller gender is required"),
        sellerHairColor: z.string().min(1, "Seller hair color is required"),
        sellerEyeColor: z.string().min(1, "Seller eye color is required"),
        sellerHeightFeet: z.string().min(1, "Seller height (feet) is required"),
        sellerHeightInches: z
          .string()
          .min(1, "Seller height (inches) is required"),
        sellerDateOfBirth: z
          .string()
          .min(1, "Seller date of birth is required"),
        sellerIdType: z.string().min(1, "Seller ID type is required"),
        sellerIdNumber: z.string().min(1, "Seller ID number is required"),
        sellerRace: z.string().min(1, "Seller race is required"),
        sellerIsUsCitizen: z
          .string()
          .min(1, "Seller citizenship status is required"),
        sellerPlaceOfBirth: z
          .string()
          .min(1, "Seller place of birth is required"),
        // Firearm fields
        make: z.string().min(1, "Make is required"),
        model: z.string().min(1, "Model is required"),
        serialNumber: z.string().min(1, "Serial number is required"),
        color: z.string().min(1, "Color is required"),
        isNewGun: z.string().min(1, "New/Used status is required"),
        firearmSafetyDevice: z
          .string()
          .min(1, "Firearm safety device is required"),
        eligibilityQ1: z.string().min(1, "Eligibility question 1 is required"),
        eligibilityQ2: z.string().min(1, "Eligibility question 2 is required"),
        eligibilityQ3: z.string().min(1, "Eligibility question 3 is required"),
        eligibilityQ4: z.string().min(1, "Eligibility question 4 is required"),
        isGunShowTransaction: z
          .string()
          .min(1, "Gun show transaction status is required"),
        frameOnly: z.string().min(1, "Frame only status is required"),
      })
    ),
  });

  // Watch both zip code fields
  const zipCode = methods.watch("zipCode");
  const sellerZipCode = methods.watch("sellerZipCode");
  const frameOnlySelection = methods.watch("frameOnly");

  // Use both zip code lookup hooks
  const { data: zipData, isLoading: isZipLoading } = useZipCodeLookup(
    zipCode || "",
    methods.setValue
  );

  const { data: sellerZipData, isLoading: isSellerZipLoading } =
    useSellerZipCodeLookup(sellerZipCode || "", methods.setValue);

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
      methods.setValue("make", "");
      methods.setValue("model", "");
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
  const { data: formData } = useQuery({
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
  const selectedMake = methods.watch("make");
  const selectedModel = methods.watch("model");

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

      methods.setValue("make", make);
      methods.setValue("model", "");
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
    <FormProvider {...methods}>
      <div className="container mx-auto py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-center mb-8">
          Submit Private Party Handgun Transfer
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
                  {...methods.register("idNumber")}
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="required">
                  Purchaser First Name
                </Label>
                <Input
                  {...methods.register("firstName")}
                  id="firstName"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Purchaser Middle Name</Label>
                <Input {...methods.register("middleName")} id="middleName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="required">
                  Purchaser Last Name
                </Label>
                <Input
                  {...methods.register("lastName")}
                  id="lastName"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input {...methods.register("suffix")} id="suffix" />
              </div>
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="required">
                  Purchaser Street Address
                </Label>
                <Input
                  {...methods.register("streetAddress")}
                  id="address"
                  required
                />
              </div>
              <div className="flex gap-4 items-start">
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    {...methods.register("zipCode", {
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

                {zipCode?.length === 5 && (
                  <>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <SelectComponent
                        value={methods.watch("city") || ""}
                        onValueChange={(value) =>
                          methods.setValue("city", value)
                        }
                        placeholder="Select city"
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
                        {...methods.register("state")}
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
                  value={methods.watch("gender") || ""}
                  onValueChange={(value) => methods.setValue("gender", value)}
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
                  value={methods.watch("hairColor") || ""}
                  onValueChange={(value) =>
                    methods.setValue("hairColor", value)
                  }
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
                  value={methods.watch("eyeColor") || ""}
                  onValueChange={(value) => methods.setValue("eyeColor", value)}
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
                    value={methods.watch("heightFeet") || ""}
                    onValueChange={(value) =>
                      methods.setValue("heightFeet", value)
                    }
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
                    value={methods.watch("heightInches") || ""}
                    onValueChange={(value) =>
                      methods.setValue("heightInches", value)
                    }
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
                <Input {...methods.register("weight")} id="weight" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  {...methods.register("dateOfBirth")}
                  id="dob"
                  type="date"
                />
              </div>
            </div>

            {/* ID Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="required">Purchaser ID Type</Label>
                <SelectComponent
                  name="idType"
                  value={methods.watch("idType") || ""}
                  onValueChange={(value) => methods.setValue("idType", value)}
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
                <Input {...methods.register("idNumber")} id="purchaserId" />
              </div>

              <div className="space-y-2">
                <Label className="required">Race</Label>
                <SelectComponent
                  name="race"
                  value={methods.watch("race") || ""}
                  onValueChange={(value) => methods.setValue("race", value)}
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
                  value={methods.watch("isUsCitizen") || ""}
                  onValueChange={(value) =>
                    methods.setValue("isUsCitizen", value)
                  }
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
                  value={methods.watch("placeOfBirth") || ""}
                  onValueChange={(value) =>
                    methods.setValue("placeOfBirth", value)
                  }
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
                <Input {...methods.register("phoneNumber")} />
              </div>
            </div>

            {/* Alias Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aliasFirstName">
                  Purchaser Alias First Name
                </Label>
                <Input
                  {...methods.register("aliasFirstName")}
                  id="aliasFirstName"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasMiddleName">
                  Purchaser Alias Middle Name
                </Label>
                <Input
                  {...methods.register("aliasMiddleName")}
                  id="aliasMiddleName"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasLastName">Purchaser Alias Last Name</Label>
                <Input
                  {...methods.register("aliasLastName")}
                  id="aliasLastName"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasSuffix">Purchaser Alias Suffix</Label>
                <Input {...methods.register("aliasSuffix")} id="aliasSuffix" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hscFscNumber">HSC / FSC Number</Label>
                <Input
                  {...methods.register("hscFscNumber")}
                  id="hscFscNumber"
                />
              </div>

              <div className="space-y-2">
                <Label className="required">HSC / FSX Exemption Code</Label>
                <SelectComponent
                  name="exemptionCode"
                  value={methods.watch("exemptionCode") || ""}
                  onValueChange={(value) =>
                    methods.setValue("exemptionCode", value)
                  }
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
                    offense specified in Penal Code (PC) section 29905, an
                    offense specified in PC 23515(a), (b), or (d), a misdemeanor
                    PC 273.5 offense, (2) been convicted in the last 10 years of
                    a misdemeanor offense specified in PC 29805, or (3) been
                    adjudged a ward of the juvenile court for committing an
                    offense specified in PC 29805 and is not 30 years of age or
                    older?
                  </Label>
                  <SelectComponent
                    name="eligibilityQ1"
                    value={methods.watch("eligibilityQ1") || ""}
                    onValueChange={(value) =>
                      methods.setValue("eligibilityQ1", value)
                    }
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
                    value={methods.watch("eligibilityQ2") || ""}
                    onValueChange={(value) =>
                      methods.setValue("eligibilityQ2", value)
                    }
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
                    described in WIC section 5103(g), or a person described in
                    WIC section 8103(f) who has ever been admitted to a mental
                    health facility as a danger to self or others at least twice
                    within 1 year or admitted once within the past 5 years?
                  </Label>
                  <SelectComponent
                    name="eligibilityQ3"
                    value={methods.watch("eligibilityQ3") || ""}
                    onValueChange={(value) =>
                      methods.setValue("eligibilityQ3", value)
                    }
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
                    value={methods.watch("eligibilityQ4") || ""}
                    onValueChange={(value) =>
                      methods.setValue("eligibilityQ4", value)
                    }
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
                      Firearms Possession Question:
                    </span>{" "}
                    If you currently own or possess firearms, have you checked
                    and confirmed possession of those firearms within the past
                    30 days? If you do not currently own or possess firearms,
                    you must select not applicable (N/A).
                  </Label>
                  <SelectComponent
                    name="firearmsQ1"
                    value={methods.watch("firearmsQ1") || ""}
                    onValueChange={(value) =>
                      methods.setValue("firearmsQ1", value)
                    }
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
                    <Input {...methods.register("sellerFirstName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seller Middle Name</Label>
                    <Input {...methods.register("sellerMiddleName")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="required">Seller Last Name</Label>
                    <Input {...methods.register("sellerLastName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seller Suffix</Label>
                    <Input {...methods.register("sellerSuffix")} />
                  </div>
                </div>

                {/* Seller Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="required">Seller Street Address</Label>
                    <Input
                      {...methods.register("sellerStreetAddress")}
                      required
                    />
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="space-y-2">
                      <Label>Zip Code</Label>
                      <Input
                        {...methods.register("sellerZipCode", {
                          onChange: (e) => {
                            const value = e.target.value
                              .slice(0, 5)
                              .replace(/\D/g, "");
                            e.target.value = value;
                          },
                          onBlur: (e) => {
                            if (e.target.value.length === 5) {
                              queryClient.invalidateQueries({
                                queryKey: ["sellerZipCode", e.target.value],
                              });
                            }
                          },
                          maxLength: 5,
                        })}
                        className="w-24"
                      />
                    </div>

                    {sellerZipData && (
                      <>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <SelectComponent
                            name="sellerCity"
                            value={methods.getValues("sellerCity") || ""}
                            onValueChange={(value) =>
                              methods.setValue("sellerCity", value)
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
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <div className="space-y-2">
                    <Label className="required">Gender</Label>
                    <SelectComponent
                      name="sellerGender"
                      value={methods.watch("sellerGender") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerGender", value)
                      }
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
                      name="sellerHairColor"
                      value={methods.watch("sellerHairColor") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerHairColor", value)
                      }
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
                      name="sellerEyeColor"
                      value={methods.watch("sellerEyeColor") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerEyeColor", value)
                      }
                      placeholder="Select Eye Color"
                    >
                      {formData?.eyeColors.map((color) => (
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
                        value={methods.watch("sellerHeightFeet") || ""}
                        onValueChange={(value) =>
                          methods.setValue("sellerHeightFeet", value)
                        }
                        placeholder="ft"
                      >
                        {formData?.heightFeet.map((feet) => (
                          <SelectItem key={feet} value={feet}>
                            {feet}
                          </SelectItem>
                        ))}
                      </SelectComponent>
                      <SelectComponent
                        name="sellerHeightInches"
                        value={methods.watch("sellerHeightInches") || ""}
                        onValueChange={(value) =>
                          methods.setValue("sellerHeightInches", value)
                        }
                        placeholder="in"
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
                    <Label>Weight</Label>
                    <Input {...methods.register("sellerWeight")} />
                  </div>

                  <div className="space-y-2">
                    <Label className="required">Date of Birth</Label>
                    <Input
                      {...methods.register("sellerDateOfBirth")}
                      type="date"
                    />
                  </div>
                </div>

                {/* Seller ID Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="required">Seller ID Type</Label>
                    <SelectComponent
                      name="sellerIdType"
                      value={methods.watch("sellerIdType") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerIdType", value)
                      }
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
                    <Label className="required">Seller ID Number</Label>
                    <Input {...methods.register("sellerIdNumber")} />
                  </div>

                  <div className="space-y-2">
                    <Label className="required">Race</Label>
                    <SelectComponent
                      name="sellerRace"
                      value={methods.watch("sellerRace") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerRace", value)
                      }
                      placeholder="Select Race"
                    >
                      {formData?.race.map((race) => (
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
                      value={methods.watch("sellerIsUsCitizen") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerIsUsCitizen", value)
                      }
                      placeholder="Select"
                    >
                      {formData?.citizenship.map((option) => (
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
                      value={methods.watch("sellerPlaceOfBirth") || ""}
                      onValueChange={(value) =>
                        methods.setValue("sellerPlaceOfBirth", value)
                      }
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
                    <Label>Phone Number</Label>
                    <Input {...methods.register("sellerPhoneNumber")} />
                  </div>
                </div>

                {/* Seller Alias Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Seller Alias First Name</Label>
                    <Input {...methods.register("sellerAliasFirstName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seller Alias Middle Name</Label>
                    <Input {...methods.register("sellerAliasMiddleName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seller Alias Last Name</Label>
                    <Input {...methods.register("sellerAliasLastName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seller Alias Suffix</Label>
                    <Input {...methods.register("sellerAliasSuffix")} />
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
                      value={methods.watch("isGunShowTransaction") || ""}
                      onValueChange={(value) =>
                        methods.setValue("isGunShowTransaction", value)
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
                      value={methods.watch("waitingPeriodExemption") || ""}
                      onValueChange={(value) =>
                        methods.setValue("waitingPeriodExemption", value)
                      }
                      placeholder={
                        formData
                          ? "Select Waiting Period Exemption"
                          : "Loading..."
                      }
                    >
                      {formData?.waitingPeriodExemption?.map(
                        (waitingPeriod) => (
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
                      value={methods.watch("frameOnly") || ""}
                      onValueChange={(value) =>
                        methods.setValue("frameOnly", value)
                      }
                      placeholder="Select"
                    >
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectComponent>
                  </div>
                  {/* Make and Model*/}
                  <div className="space-y-2">
                    <Label className="required">Make</Label>
                    <MakeSelect<FormData>
                      setValue={methods.setValue}
                      value={methods.watch("make") || ""}
                      handgunData={makesData?.manufacturers || []}
                      isLoadingHandguns={isLoadingMakes}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="required">Model</Label>
                    <Input
                      {...methods.register("model", {
                        required: "Model is required",
                      })}
                      placeholder="Enter model"
                      className={
                        methods.formState.errors.model ? "border-red-500" : ""
                      }
                    />
                    {methods.formState.errors.model && (
                      <span className="text-sm text-red-500">
                        {methods.formState.errors.model.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Caliber and Additional Caliber Sections */}

                {methods.watch("frameOnly") !== "yes" ? (
                  <>
                    {/* Show caliber sections when frame only is not yes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="required">Caliber</Label>
                        <SelectComponent
                          name="calibers"
                          value={methods.watch("calibers") || ""}
                          onValueChange={(value) =>
                            methods.setValue("calibers", value)
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
                        <Label>Additional Caliber</Label>
                        <SelectComponent
                          name="additionalCaliber"
                          value={methods.watch("additionalCaliber") || ""}
                          onValueChange={(value) =>
                            methods.setValue("additionalCaliber", value)
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
                          value={methods.watch("additionalCaliber2") || ""}
                          onValueChange={(value) =>
                            methods.setValue("additionalCaliber2", value)
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
                          value={methods.watch("additionalCaliber3") || ""}
                          onValueChange={(value) =>
                            methods.setValue("additionalCaliber3", value)
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
                        <Input {...methods.register("barrelLength")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <SelectComponent
                          name="unit"
                          value={methods.watch("unit") || ""}
                          onValueChange={(value) =>
                            methods.setValue("unit", value)
                          }
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
                          value={methods.watch("category") || ""}
                          onValueChange={(value) =>
                            methods.setValue("category", value)
                          }
                          placeholder="Select Category"
                        >
                          {formData?.category.map((category) => (
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
                        value={methods.watch("category") || ""}
                        onValueChange={(value) =>
                          methods.setValue("category", value)
                        }
                        placeholder="Select Category"
                      >
                        {formData?.category.map((category) => (
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
                        value={methods.watch("regulated") || ""}
                        onValueChange={(value) =>
                          methods.setValue("regulated", value)
                        }
                        placeholder="Select"
                      >
                        {formData?.regulated.map((regulated) => (
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
                    <Input {...methods.register("serialNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="required">Re-enter Serial Number</Label>
                    <Input
                      onChange={(e) => {
                        const reenteredSerial = e.target.value;
                        if (
                          reenteredSerial === initialFormState?.serialNumber
                        ) {
                          // Serial numbers match - you could add visual feedback here
                        } else {
                          // Serial numbers don't match - you could add visual feedback here
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Number</Label>
                    <Input {...methods.register("otherNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="required">Color</Label>
                    <SelectComponent
                      name="color"
                      value={methods.watch("color") || ""}
                      onValueChange={(value) =>
                        methods.setValue("color", value)
                      }
                      placeholder="Select Color"
                    >
                      {formData?.colors.map((color) => (
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
                      value={methods.watch("isNewGun") || ""}
                      onValueChange={(value) =>
                        methods.setValue("isNewGun", value)
                      }
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
                      value={methods.watch("firearmSafetyDevice") || ""}
                      onValueChange={(value) =>
                        methods.setValue("firearmSafetyDevice", value)
                      }
                      placeholder="Select Firearm Safety Device (FSD)"
                    >
                      {formData?.fsd.map((code) => (
                        <SelectItem key={code} value={code.toLowerCase()}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectComponent>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    {...methods.register("comments")}
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
          <PreviewDialog />
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};

export default PptHandgunPage;
