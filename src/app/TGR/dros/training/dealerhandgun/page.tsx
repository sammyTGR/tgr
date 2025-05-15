'use client';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/utils/supabase/client';
import { useMemo } from 'react';
import { useForm, UseFormSetValue } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FORM_OPTIONS } from '../components/formOptions';

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
  make: string;
  model: string;
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
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  streetAddress: '',
  zipCode: '',
  city: '',
  state: '',
  gender: '',
  hairColor: '',
  eyeColor: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  dateOfBirth: '',
  idType: '',
  idNumber: '',
  race: '',
  isUsCitizen: '',
  placeOfBirth: '',
  phoneNumber: '',
  aliasFirstName: '',
  aliasMiddleName: '',
  aliasLastName: '',
  aliasSuffix: '',
  hscFscNumber: '',
  exemptionCode: '',
  eligibilityQ1: '',
  eligibilityQ2: '',
  eligibilityQ3: '',
  eligibilityQ4: '',
  firearmsQ1: '',
  isGunShowTransaction: '',
  waitingPeriodExemption: '',
  restrictionExemption: '',
  make: '',
  model: '',
  serialNumber: '',
  otherNumber: '',
  color: '',
  isNewGun: '',
  firearmSafetyDevice: '',
  comments: '',
  transaction_type: 'dealer-handgun',
};

const useZipCodeLookup = (zipCode: string, setValue: UseFormSetValue<FormData>) => {
  return useQuery({
    queryKey: ['zipCode', zipCode],
    queryFn: async (): Promise<ZipCodeData | null> => {
      if (zipCode.length !== 5) return null;

      const { data, error } = await supabase
        .from('zip_codes')
        .select('primary_city, state, acceptable_cities')
        .eq('zip', zipCode)
        .single();

      if (error) throw error;

      if (data) {
        setValue('state', data.state, { shouldValidate: true });
      }

      return data;
    },
    enabled: zipCode?.length === 5,
    staleTime: 30000,
  });
};

interface HandgunRoster {
  [make: string]: string[];
}

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
}

const useHandgunDetails = (make: string, model: string) => {
  return useQuery({
    queryKey: ['handgunDetails', make, model],
    queryFn: async () => {
      if (!make || !model) return null;
      const response = await fetch(`/api/fetchRoster?make=${make}&model=${model}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    enabled: !!make && !!model,
  });
};

const DealerHandgunSalePage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<FormData>({
    defaultValues: initialFormState,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // Watch the zipCode field
  const zipCode = form.watch('zipCode');

  // Pass setValue to the hook
  const { data: zipData, isLoading: isZipLoading } = useZipCodeLookup(zipCode || '', form.setValue);

  // Replace form state management with react-hook-form
  const onSubmit = (data: FormData) => {
    submitForm(data);
  };

  // Form submission mutation
  const { mutate: submitForm, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/dealerHandgun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          transaction_type: 'dealer-handgun',
        }),
      });
      if (!response.ok) throw new Error('Failed to submit form');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Form submitted successfully' });
      router.push('/TGR/dros/training');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Dialog state mutation
  const { data: isDialogOpen, mutate: setDialogOpen } = useMutation({
    mutationKey: ['previewDialog'],
    mutationFn: (isOpen: boolean) => Promise.resolve(isOpen),
  });

  const { mutate: handleReset } = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      // Invalidate all relevant queries to reset their data
      queryClient.invalidateQueries({ queryKey: ['handgunRoster'] });
      queryClient.invalidateQueries({ queryKey: ['formOptions'] });
      // Reset the selected make
      setSelectedMake('');
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
    queryKey: ['formOptions'],
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
    queryKey: ['handgunRoster'],
    queryFn: async () => {
      const response = await fetch('/api/fetchRoster');
      if (!response.ok) {
        throw new Error('Failed to fetch handgun roster');
      }
      return response.json();
    },
  });

  // Watch the make and model fields
  const selectedMake = form.watch('make');
  const selectedModel = form.watch('model');

  // Update the handgun details query
  const { data: handgunDetails } = useQuery({
    queryKey: ['handgunDetails', selectedMake, selectedModel],
    queryFn: async () => {
      if (!selectedMake || !selectedModel) return null;
      const response = await fetch(`/api/fetchRoster?make=${selectedMake}&model=${selectedModel}`);
      if (!response.ok) throw new Error('Network response was not ok');
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
    mutationKey: ['selectedMake'],
    mutationFn: async (make: string) => {
      // First update the form state
      const updatedForm = {
        ...initialFormState,
        make: make,
        model: '',
      } as Partial<FormData>;

      form.setValue('make', make);
      form.setValue('model', '');
      return make;
    },
  });

  // Preview Dialog Component
  const PreviewDialog = () => {
    const formValues = form.watch(); // Get all current form values

    return (
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>Preview</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-bold">Purchaser Information</h3>
                <p>
                  Name: {formValues.firstName} {formValues.middleName} {formValues.lastName}{' '}
                  {formValues.suffix}
                </p>
                <p>Address: {formValues.streetAddress}</p>
                <p>
                  Location: {formValues.city}, {formValues.state} {formValues.zipCode}
                </p>
                <p>Phone: {formValues.phoneNumber}</p>
                <p>ID Type: {formValues.idType}</p>
                <p>ID Number: {formValues.idNumber}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">Physical Characteristics</h3>
                <p>Gender: {formValues.gender}</p>
                <p>Hair Color: {formValues.hairColor}</p>
                <p>Eye Color: {formValues.eyeColor}</p>
                <p>
                  Height: {formValues.heightFeet}&apos;{formValues.heightInches}
                  &quot;
                </p>
                <p>Weight: {formValues.weight} lbs</p>
                <p>Date of Birth: {formValues.dateOfBirth}</p>
                <p>Race: {formValues.race}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">Firearm Information</h3>
                <p>Make: {formValues.make}</p>
                <p>Model: {formValues.model}</p>
                <p>Serial Number: {formValues.serialNumber}</p>
                <p>Other Number: {formValues.otherNumber}</p>
                <p>Color: {formValues.color}</p>
                <p>Condition: {formValues.isNewGun === 'new' ? 'New' : 'Used'}</p>
                <p>Safety Device: {formValues.firearmSafetyDevice}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">Additional Information</h3>
                <p>Gun Show Transaction: {formValues.isGunShowTransaction}</p>
                <p>Waiting Period Exemption: {formValues.waitingPeriodExemption}</p>
                <p>Restriction Exemption: {formValues.restrictionExemption}</p>
                <p>Comments: {formValues.comments}</p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
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

            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Edit
              </Button>
              <Button onClick={() => submitForm(formValues)} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="container mx-auto py-8 max-w-6xl">
          <h1 className="text-2xl font-bold text-center mb-8">Submit Dealer Handgun Sale</h1>

          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              ATTENTION: NAVIGATING AWAY FROM THIS PAGE BEFORE SUBMITTING THE TRANSACTION MAY RESULT
              IN DATA LOSS.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Purchaser Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ID Card Swipe Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Swipe CA Driver License or ID Card</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Swipe or enter ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Purchaser First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchaser Middle Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Purchaser Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suffix</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="streetAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">City</FormLabel>
                      <FormControl>
                        <Select
                          disabled={!zipData}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Don't auto-set the city when zip code is entered
                          }}
                          value={field.value || ''}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent>
                            {zipData?.primary_city && (
                              <SelectItem value={zipData.primary_city}>
                                {zipData.primary_city}
                              </SelectItem>
                            )}
                            {zipData?.acceptable_cities?.map((city: string) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">State</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Physical Characteristics */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Gender</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData?.genders.map((gender) => (
                              <SelectItem key={gender} value={gender.toLowerCase()}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hairColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Hair Color</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Color" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData?.hairColors.map((color) => (
                              <SelectItem key={color} value={color.toLowerCase()}>
                                {color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eyeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Eye Color</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Color" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData?.eyeColors.map((color) => (
                              <SelectItem key={color} value={color.toLowerCase()}>
                                {color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label className="required">Height (Feet / Inches)</Label>
                  <div className="flex gap-2">
                    <Select
                      {...form.register('heightFeet')}
                      onValueChange={(value) => form.setValue('heightFeet', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Feet" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.heightFeet.map((feet) => (
                          <SelectItem key={feet} value={feet}>
                            {feet}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      {...form.register('heightInches')}
                      onValueChange={(value) => form.setValue('heightInches', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Inches" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.heightInches.map((inches) => (
                          <SelectItem key={inches} value={inches}>
                            {inches}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input {...form.register('weight')} id="weight" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input {...form.register('dateOfBirth')} id="dob" type="date" />
                </div>
              </div>

              {/* ID Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Purchaser ID Type</Label>
                  <Select
                    {...form.register('idType')}
                    onValueChange={(value) => form.setValue('idType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.idTypes.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaserId">Purchaser ID Number</Label>
                  <Input {...form.register('idNumber')} id="purchaserId" />
                </div>

                <div className="space-y-2">
                  <Label className="required">Race</Label>
                  <Select
                    {...form.register('race')}
                    onValueChange={(value) => form.setValue('race', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Race" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.race.map((race) => (
                        <SelectItem key={race} value={race.toLowerCase()}>
                          {race}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="required">U.S. Citizen</Label>
                  <Select
                    {...form.register('isUsCitizen')}
                    onValueChange={(value) => form.setValue('isUsCitizen', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.citizenship.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Place of Birth</Label>
                  <Select
                    {...form.register('placeOfBirth')}
                    onValueChange={(value) => form.setValue('placeOfBirth', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Place of Birth" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.placesOfBirth.map((place) => (
                        <SelectItem key={place} value={place.toLowerCase()}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telephone Number</Label>
                  <Input {...form.register('phoneNumber')} id="phoneNumber" />
                  <div className="text-sm text-gray-500">(Format as: ##########)</div>
                </div>
              </div>

              {/* Alias Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aliasFirstName">Purchaser Alias First Name</Label>
                  <Input {...form.register('aliasFirstName')} id="aliasFirstName" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aliasMiddleName">Purchaser Alias Middle Name</Label>
                  <Input {...form.register('aliasMiddleName')} id="aliasMiddleName" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aliasLastName">Purchaser Alias Last Name</Label>
                  <Input {...form.register('aliasLastName')} id="aliasLastName" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aliasSuffix">Purchaser Alias Suffix</Label>
                  <Input {...form.register('aliasSuffix')} id="aliasSuffix" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hscFscNumber">HSC / FSC Number</Label>
                  <Input {...form.register('hscFscNumber')} id="hscFscNumber" />
                </div>

                <div className="space-y-2">
                  <Label className="required">HSC / FSX Exemption Code</Label>
                  <Select
                    {...form.register('exemptionCode')}
                    onValueChange={(value) => form.setValue('exemptionCode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Exemption Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.exemptionCodes.map((code) => (
                        <SelectItem key={code} value={code.toLowerCase()}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Eligibility Questions */}
              <div className="space-y-6">
                <CardContent className="space-y-6">
                  {/* Question 1 */}
                  <div className="space-y-2">
                    <Label className="required block text-sm font-medium">
                      <span className="font-bold">Firearms Eligibility Question 1:</span> Has
                      purchaser: (1) ever been convicted of a felony, any offense specified in Penal
                      Code (PC) section 29905, an offense specified in PC 23515(a), (b), or (d), a
                      misdemeanor PC 273.5 offense, (2) been convicted in the last 10 years of a
                      misdemeanor offense specified in PC 29805, or (3) been adjudged a ward of the
                      juvenile court for committing an offense specified in PC 29805 and is not 30
                      years of age or older?
                    </Label>
                    <Select
                      {...form.register('eligibilityQ1')}
                      onValueChange={(value) => form.setValue('eligibilityQ1', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question 2 */}
                  <div className="space-y-2">
                    <Label className="required block text-sm font-medium">
                      <span className="font-bold">Firearms Eligibility Question 2:</span> Has a
                      court ever found, as specified in Welfare and Institutions Code (WIC) section
                      8103, the purchaser to be a danger to others from mental illness, a mentally
                      disordered sex offender, not guilty by reason of insanity, mentally
                      incompetent to stand trial, or gravely disabled to be placed under a
                      conservatorship?
                    </Label>
                    <Select
                      {...form.register('eligibilityQ2')}
                      onValueChange={(value) => form.setValue('eligibilityQ2', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Question 3 */}
                  <div className="space-y-2">
                    <Label className="required block text-sm font-medium">
                      <span className="font-bold">Firearms Eligibility Question 3:</span> Is
                      purchaser a danger/threat to self or others under WIC section 8100, a person
                      certified for intensive treatment as described in WIC section 5103(g), or a
                      person described in WIC section 8103(f) who has ever been admitted to a mental
                      health facility as a danger to self or others at least twice within 1 year or
                      admitted once within the past 5 years?
                    </Label>
                    <Select
                      {...form.register('eligibilityQ3')}
                      onValueChange={(value) => form.setValue('eligibilityQ3', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Question 4 */}
                  <div className="space-y-2">
                    <Label className="required block text-sm font-medium">
                      <span className="font-bold">Firearms Eligibility Question 4:</span> Is
                      purchaser currently the subject of any restraining order specified in PC
                      section 29825, a Gun Violence Restraining Order, or a probation condition
                      prohibiting firearm possession?
                    </Label>
                    <Select
                      {...form.register('eligibilityQ4')}
                      onValueChange={(value) => form.setValue('eligibilityQ4', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Firearms Possession Question 1 */}
                  <div className="space-y-2">
                    <Label className="required block text-sm font-medium">
                      <span className="font-bold">Firearms Possession Question 1:</span> If you
                      currently own or possess firearms, have you checked and confirmed possession
                      of those firearms within the past 30 days? If you do not currently own or
                      possess firearms, you must select not applicable (N/A).
                    </Label>
                    <Select
                      {...form.register('firearmsQ1')}
                      onValueChange={(value) => form.setValue('firearmsQ1', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="required">Gun Show Transaction</Label>
                      <Select
                        {...form.register('isGunShowTransaction')}
                        onValueChange={(value) => form.setValue('isGunShowTransaction', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Waiting Period Exemption</Label>
                      <Select
                        {...form.register('waitingPeriodExemption')}
                        onValueChange={(value) => form.setValue('waitingPeriodExemption', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Waiting Period Exemption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cfd">CFD NUMBER</SelectItem>
                          <SelectItem value="peaceofficer">
                            PEACE OFFICER (LETTER REQUIRED)
                          </SelectItem>
                          <SelectItem value="specialweaponspermit">
                            SPECIAL WEAPONS PERMIT
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* 30-Day Restriction Row */}
                  <div className="space-y-2">
                    <Label>30-Day Restriction Exemption</Label>
                    <Select
                      {...form.register('restrictionExemption')}
                      onValueChange={(value) => form.setValue('restrictionExemption', value)}
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
                  {/* Make and Model Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="required">Make</Label>
                      <Select
                        {...form.register('make')}
                        disabled={isLoadingHandguns}
                        onValueChange={(value) => {
                          form.setValue('make', value);
                          form.setValue('model', ''); // Reset model when make changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isLoadingHandguns ? 'Loading...' : 'Select Make'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {handgunData &&
                            Object.keys(handgunData)
                              .sort()
                              .map((make) => (
                                <SelectItem key={make} value={make}>
                                  {make}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedMake && (
                      <div className="space-y-2">
                        <Label className="required">Model</Label>
                        <Select
                          {...form.register('model')}
                          onValueChange={(value) => form.setValue('model', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((model: string) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Handgun Details Section */}
                  {handgunDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 p-4 border rounded-md bg-muted">
                      <div className="space-y-2">
                        <Label>Caliber</Label>
                        <Input value={handgunDetails.caliber || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Barrel Length</Label>
                        <Input value={handgunDetails.barrelLength || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input value={handgunDetails.unit || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Material</Label>
                        <Input value={handgunDetails.material || ''} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input value={handgunDetails.category || ''} readOnly />
                      </div>
                    </div>
                  )}

                  {/* Serial Numbers Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="required">Serial Number</Label>
                      <Input {...form.register('serialNumber')} />
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
                      <Input {...form.register('otherNumber')} />
                    </div>
                    <div className="space-y-2">
                      <Label className="required">Color</Label>
                      <Select
                        {...form.register('color')}
                        onValueChange={(value) => form.setValue('color', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Color" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData?.colors.map((color) => (
                            <SelectItem key={color} value={color.toLowerCase()}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Gun Details Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="required">New/Used Gun</Label>
                      <Select
                        {...form.register('isNewGun')}
                        onValueChange={(value) => form.setValue('isNewGun', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="required">Firearm Safety Device (FSD)</Label>
                      <Select
                        {...form.register('firearmSafetyDevice')}
                        onValueChange={(value) => form.setValue('firearmSafetyDevice', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Firearm Safety Device (FSD)" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData?.fsd.map((code) => (
                            <SelectItem key={code} value={code.toLowerCase()}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Gun Type (Read Only) */}
                    <div className="space-y-2">
                      <Label>Gun Type</Label>
                      <Input value="HANDGUN" disabled />
                    </div>
                  </div>

                  {/* Comments Section */}
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="w-full min-h-[100px]" maxLength={200} />
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-gray-500">
                          200 character limit. Characters remaining:{' '}
                          {200 - (field.value?.length || 0)}
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </div>

              {/* Additional fields can be added following the same pattern */}
            </CardContent>
          </Card>
          <div className="flex justify-center gap-4 mt-6">
            <Button variant="outline" onClick={() => router.push('/TGR/dros/training')}>
              Back
            </Button>
            <PreviewDialog />
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default DealerHandgunSalePage;
