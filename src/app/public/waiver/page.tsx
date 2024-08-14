"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { RadioGroupItem, RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
const addressRegex = /^[0-9]+\s[A-Za-z0-9\s,.-]+$/;

const schema = z.object({
  first_name: z.string().min(1, { message: "First Name is required" }),
  last_name: z.string().min(1, { message: "Last Name is required" }),
  phone: z
    .string()
    .min(1, { message: "Phone number is required" })
    .regex(phoneRegex, {
      message: "Phone number must be in xxx-xxx-xxxx format",
    }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  street: z
    .string()
    .min(1, { message: "Street is required" })
    .regex(addressRegex, {
      message: "Street address must be a valid address format",
    }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }).max(2, {
    message: "For Example: CA",
  }),
  zip: z.string().min(5, { message: "Zip is required" }),
  occupation: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  work_phone: z.string().optional().nullable(),
  safety_rules: z
    .boolean()
    .refine((val) => val, { message: "You must agree to the safety rules" }),
  information_accurate: z.boolean().refine((val) => val, {
    message: "You must confirm the information is accurate",
  }),
  special_offers: z.boolean().optional(),
  signature: z.string().min(2, { message: "Signature is required" }),
  handgun_experience: z
    .string()
    .min(1, { message: "Handgun experience is required" }),
  rifle_experience: z
    .string()
    .min(1, { message: "Rifle experience is required" }),
  shotgun_experience: z
    .string()
    .min(1, { message: "Shotgun experience is required" }),
  mental_illness: z.string().min(1, { message: "This field is required" }),
  felony: z.string().min(1, { message: "This field is required" }),
  misdemeanor: z.string().min(1, { message: "This field is required" }),
  narcotics: z.string().min(1, { message: "This field is required" }),
  alcohol_abuse: z.string().min(1, { message: "This field is required" }),
});

type FormData = z.infer<typeof schema>;

const WaiverForm = () => {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      safety_rules: false,
      information_accurate: false,
      special_offers: false,
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = methods;

  const onSubmit = async (data: FormData) => {
    if (data.felony === "yes") {
      toast.error("Felons are ineligible to shoot.");
      return;
    }

    // Normalize the input data to uppercase for case-insensitive checking
    const normalizedFirstName = data.first_name.toUpperCase();
    const normalizedLastName = data.last_name.toUpperCase();
    const normalizedEmail = data.email.toUpperCase();
    const normalizedPhone = data.phone;
    const normalizedStreet = data.street.toUpperCase();
    const normalizedCity = data.city.toUpperCase();
    const normalizedState = data.state.toUpperCase();
    const normalizedSignature = data.signature.toUpperCase();

    try {
      // Check for existing entries with the same normalized name, email, and phone number
      const { data: existingEntries, error: fetchError } = await supabase
        .from("waiver")
        .select("id")
        .eq("first_name", normalizedFirstName)
        .eq("last_name", normalizedLastName)
        .eq("email", normalizedEmail)
        .eq("phone", normalizedPhone);

      if (fetchError) {
        console.error("Error checking for duplicate entries:", fetchError);
        toast.error("Error checking for duplicate entries.");
        return;
      }

      if (existingEntries && existingEntries.length > 0) {
        toast.error("You already submitted a waiver fam!");
        return;
      }

      // Proceed with form submission if no duplicates are found
      const { error } = await supabase.from("waiver").insert({
        ...data,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        phone: normalizedPhone,
        street: normalizedStreet,
        city: normalizedCity,
        state: normalizedState,
        signature: normalizedSignature,
      });

      if (error) {
        console.error("Error submitting form:", error);
        toast.error("Error submitting form.");
      } else {
        // console.log("Form submitted successfully");
        // Reset form fields
        reset({
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          street: "",
          city: "",
          state: "",
          zip: "",
          occupation: "",
          company: "",
          work_phone: "",
          safety_rules: false,
          information_accurate: false,
          special_offers: false,
          signature: "",
          handgun_experience: "",
          rifle_experience: "",
          shotgun_experience: "",
          mental_illness: "",
          felony: "",
          misdemeanor: "",
          narcotics: "",
          alcohol_abuse: "",
        });
        toast.success("Form submitted successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Unexpected error occurred.");
    }
  };

  return (
    <div className="flex flex-col p-8 rounded-lg shadow-md w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Firearm Experience & Safety Questionnaire
      </h1>
      <p className="text-sm mb-6">
        Everyone who wishes to shoot in this facility, whether using their own
        or a rental firearm, must completely fill out this form. All information
        supplied will be kept secret confidential, not distributed or made
        available to others for any purpose, and is for the sole use of The Gun
        Range indoor shooting facility, to properly identify the user and to
        document their previous firearm experience. This is being done to best
        ensure the safety of all range users.
      </p>
      <form
        className="flex flex-col space-y-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="first_name"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="First Name"
                  value={field.value || ""}
                />
                {errors.first_name && (
                  <span className="text-red-500 text-xs">
                    {errors.first_name.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="last_name"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Last Name"
                  value={field.value || ""}
                />
                {errors.last_name && (
                  <span className="text-red-500 text-xs">
                    {errors.last_name.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Phone"
                  value={field.value || ""}
                  type="tel"
                />
                {errors.phone && (
                  <span className="text-red-500 text-xs">
                    {errors.phone.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Email"
                  value={field.value || ""}
                  type="email"
                />
                {errors.email && (
                  <span className="text-red-500 text-xs">
                    {errors.email.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="street"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Street"
                  value={field.value || ""}
                />
                {errors.street && (
                  <span className="text-red-500 text-xs">
                    {errors.street.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="City"
                  value={field.value || ""}
                />
                {errors.city && (
                  <span className="text-red-500 text-xs">
                    {errors.city.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="State"
                  value={field.value || ""}
                />
                {errors.state && (
                  <span className="text-red-500 text-xs">
                    {errors.state.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="zip"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="ZIP"
                  value={field.value || ""}
                  type="number"
                />
                {errors.zip && (
                  <span className="text-red-500 text-xs">
                    {errors.zip.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="occupation"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Occupation"
                  value={field.value || ""}
                />
                {errors.occupation && (
                  <span className="text-red-500 text-xs">
                    {errors.occupation.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="company"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Company"
                  value={field.value || ""}
                />
                {errors.company && (
                  <span className="text-red-500 text-xs">
                    {errors.company.message}
                  </span>
                )}
              </div>
            )}
          />
          <Controller
            name="work_phone"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Work Phone"
                  value={field.value || ""}
                  type="tel"
                />
                {errors.work_phone && (
                  <span className="text-red-500 text-xs">
                    {errors.work_phone.message}
                  </span>
                )}
              </div>
            )}
          />
        </div>
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Shooting Experience</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-1">Hand Gun</div>
            <div className="flex space-x-2 col-span-4">
              <Controller
                name="handgun_experience"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-2"
                  >
                    <RadioGroupItem id="handgun-1st" value="1st Time" />
                    <Label htmlFor="handgun-1st">1st Time</Label>
                    <RadioGroupItem id="handgun-novice" value="Novice" />
                    <Label htmlFor="handgun-novice">Novice</Label>
                    <RadioGroupItem id="handgun-beginner" value="Beginner" />
                    <Label htmlFor="handgun-beginner">Beginner</Label>
                    <RadioGroupItem
                      id="handgun-intermediate"
                      value="Intermediate"
                    />
                    <Label htmlFor="handgun-intermediate">Intermediate</Label>
                    <RadioGroupItem id="handgun-expert" value="Expert" />
                    <Label htmlFor="handgun-expert">Expert</Label>
                  </RadioGroup>
                )}
              />
            </div>
            <div className="col-span-1">Rifle</div>
            <div className="flex space-x-2 col-span-4">
              <Controller
                name="rifle_experience"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-2"
                  >
                    <RadioGroupItem id="rifle-1st" value="1st Time" />
                    <Label htmlFor="rifle-1st">1st Time</Label>
                    <RadioGroupItem id="rifle-novice" value="Novice" />
                    <Label htmlFor="rifle-novice">Novice</Label>
                    <RadioGroupItem id="rifle-beginner" value="Beginner" />
                    <Label htmlFor="rifle-beginner">Beginner</Label>
                    <RadioGroupItem
                      id="rifle-intermediate"
                      value="Intermediate"
                    />
                    <Label htmlFor="rifle-intermediate">Intermediate</Label>
                    <RadioGroupItem id="rifle-expert" value="Expert" />
                    <Label htmlFor="rifle-expert">Expert</Label>
                  </RadioGroup>
                )}
              />
            </div>
            <div className="col-span-1">Shotgun</div>
            <div className="flex space-x-2 col-span-4">
              <Controller
                name="shotgun_experience"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-2"
                  >
                    <RadioGroupItem id="shotgun-1st" value="1st Time" />
                    <Label htmlFor="shotgun-1st">1st Time</Label>
                    <RadioGroupItem id="shotgun-novice" value="Novice" />
                    <Label htmlFor="shotgun-novice">Novice</Label>
                    <RadioGroupItem id="shotgun-beginner" value="Beginner" />
                    <Label htmlFor="shotgun-beginner">Beginner</Label>
                    <RadioGroupItem
                      id="shotgun-intermediate"
                      value="Intermediate"
                    />
                    <Label htmlFor="shotgun-intermediate">Intermediate</Label>
                    <RadioGroupItem id="shotgun-expert" value="Expert" />
                    <Label htmlFor="shotgun-expert">Expert</Label>
                  </RadioGroup>
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Safety Questionnaire</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <span>Have you ever had any history of mental illness?</span>
              <div className="flex ml-auto space-x-2">
                <Controller
                  name="mental_illness"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem id="mental-illness-yes" value="yes" />
                      <Label htmlFor="mental-illness-yes">Yes</Label>
                      <RadioGroupItem id="mental-illness-no" value="no" />
                      <Label htmlFor="mental-illness-no">No</Label>
                    </RadioGroup>
                  )}
                />
                {errors.mental_illness && (
                  <span className="text-red-500 text-xs">
                    {errors.mental_illness.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>Have you ever been convicted of a felony?</span>
              <div className="flex ml-auto space-x-2">
                <Controller
                  name="felony"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem id="felony-yes" value="yes" />
                      <Label htmlFor="felony-yes">Yes</Label>
                      <RadioGroupItem id="felony-no" value="no" />
                      <Label htmlFor="felony-no">No</Label>
                    </RadioGroup>
                  )}
                />
                {errors.felony && (
                  <span className="text-red-500 text-xs">
                    {errors.felony.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>Have you ever been convicted of a misdemeanor?</span>
              <div className="flex ml-auto space-x-2">
                <Controller
                  name="misdemeanor"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem id="misdemeanor-yes" value="yes" />
                      <Label htmlFor="misdemeanor-yes">Yes</Label>
                      <RadioGroupItem id="misdemeanor-no" value="no" />
                      <Label htmlFor="misdemeanor-no">No</Label>
                    </RadioGroup>
                  )}
                />
                {errors.misdemeanor && (
                  <span className="text-red-500 text-xs">
                    {errors.misdemeanor.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>
                Are you an unlawful user, or are you addicted to any narcotics
                or controlled substance, legal or not?
              </span>
              <div className="flex ml-auto space-x-2">
                <Controller
                  name="narcotics"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem id="narcotics-yes" value="yes" />
                      <Label htmlFor="narcotics-yes">Yes</Label>
                      <RadioGroupItem id="narcotics-no" value="no" />
                      <Label htmlFor="narcotics-no">No</Label>
                    </RadioGroup>
                  )}
                />
                {errors.narcotics && (
                  <span className="text-red-500 text-xs">
                    {errors.narcotics.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span>Do you have a problem with alcohol abuse?</span>
              <div className="flex ml-auto space-x-2">
                <Controller
                  name="alcohol_abuse"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem id="alcohol-yes" value="yes" />
                      <Label htmlFor="alcohol-yes">Yes</Label>
                      <RadioGroupItem id="alcohol-no" value="no" />
                      <Label htmlFor="alcohol-no">No</Label>
                    </RadioGroup>
                  )}
                />
                {errors.alcohol_abuse && (
                  <span className="text-red-500 text-xs">
                    {errors.alcohol_abuse.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm mb-6">
          <span>
            Applicant, for itself and its executor, and assigns, releases The
            Gun Range from any and all liability for personal injury or property
            damage arising out of the use of the equipment and/or facilities of
            The Gun Range, and agree to hold The Gun Range, free, clear and
            harmless for and indemnify The Gun Range from any responsability for
            any and all claims and demands for personal injury or property
            damage arising out of such use.
          </span>
          <br />
          <br />
          <span className="italic mt-2">
            By signing below, I certify that there is no legal reason to prevent
            me from visiting, using, renting and/or shooting at this range
            facility.
          </span>
        </p>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <Controller
              name="safety_rules"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            <label className="ml-2" htmlFor="safety-rules">
              I have read and fully understand the range safety rules as set
              forth by The Gun Range.
            </label>
            {errors.safety_rules && (
              <span className="text-red-500 text-xs">
                {errors.safety_rules.message}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <Controller
              name="information_accurate"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            <label className="ml-2" htmlFor="information-accurate">
              I further declare that the above information is true, complete and
              accurate.
            </label>
            {errors.information_accurate && (
              <span className="text-red-500 text-xs">
                {errors.information_accurate.message}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <Controller
              name="special_offers"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            <label className="ml-2" htmlFor="special-offers">
              I would like to receive special offers and event notices from The
              Gun Range via e-mail.
            </label>
          </div>
          <div className="flex items-center space-between">
            <Controller
              name="signature"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col w-[400px]">
                  <Input
                    {...field}
                    placeholder="Signature"
                    value={field.value || ""}
                  />
                  {errors.signature && (
                    <span className="text-red-500 text-xs">
                      {errors.signature.message}
                    </span>
                  )}
                </div>
              )}
            />
            <div className="flex justify-end ml-auto">
              <Button type="submit">Submit</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WaiverForm;
