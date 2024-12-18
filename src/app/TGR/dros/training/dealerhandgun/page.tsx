"use client";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

const DealerHandgunSalePage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

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
  const { data: formData } = useQuery({
    queryKey: ["formOptions"],
    queryFn: async () => {
      // Replace with your actual API call
      return {
        genders: ["Male", "Female"],
        eyeColors: ["Brown", "Blue", "Green", "Hazel"],
        exemptionCodes: [
          "X01 SPECIAL WEAPONS PERMIT",
          "X02 OPERATION OF LAW REPRESENTATIVE",
          "X03 FIREARM BEING RETURNED TO OWNER",
          "X13 FFL COLLECTOR W/COE CURIO/RELIC TRANSACTION",
          "X21 MILITARY - ACTIVE DUTY",
          "X22 MILITARY - ACTIVE RESERVE",
          "X25 MILITARY - HONORABLY RETIRED",
          "X31 PEACE OFFICER - CALIFORNIA - ACTIVE",
          "X32 PEACE OFFICER - FEDERAL - ACTIVE",
          "X33 PEACE OFFICER - HONORABLY RETIRED",
          "X34 PEACE OFFICER - RESERVE",
          "X35 PEACE OFFICER - FEDERAL - HONORABLY RETIRED",
          "X41 CARRY CONCEALED WEAPON (CCW) PERMIT HOLDER",
          "X81 PEACE OFFICER STANDARDS AND TRAINING (832PC) FIREARMS TRAINING",
          "X91 PARTICULAR AND LIMITED AUTHORITY PEACE OFFICERS",
          "X95 LAW ENFORECEMENT SERVICE GUN TO FAMILY MEMBER",
          "X96 TRANSACTION IS TO REPLACE A BROKEN OR DEFECTIVE HANDGUN FRAME",
          "X99 DOJ CERTIFIED INSTRUCTOR",
        ],
        colors: [
          "ALUMINUM/SILVER",
          "BEIGE",
          "BLACK",
          "BLUE",
          "BLUE, DARK",
          "BLUE, LIGHT",
          "BRONZE",
          "BROWN",
          "BURGUNDY/MAROON",
          "CAMOUFLAGE",
          "CHROME/STAINLESS",
          "COPPER",
          "CREAM/IVORY",
          "GOLD",
          "GRAY",
          "GREEN",
          "GREEN, DARK",
          "GREEN, LIGHT",
          "LAVENDER",
          "ORANGE",
          "OTHER, MULTICOLOR",
          "PINK",
          "PURPLE",
          "RED",
          "TAN",
          "TURQUOISE",
          "UNKNOWN",
          "WHITE",
          "YELLOW",
        ],
        fsd: [
          "ANTIQUE",
          "APPROVED LOCK BOX",
          "FSD PURCHASED",
          "OEM",
          "SAFE AFFIDAVIT",
        ],
        hairColors: ["Black", "Brown", "Blonde", "Red"],
        heightFeet: ["4", "5", "6", "7", "8", "9", "10", "11", "12"],
        heightInches: [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
        ],
        idTypes: ["California DL", "California ID", "DEPT OF DEFENSE ID"],
        placesOfBirth: [
          "AFGHANISTAN",
          "AGUASCALIENTES",
          "TEXAS",
          "CALIFORNIA",
          "ALBERTA",
          "GUAM",
          "PUERTO RICO",
          "ZIMBABWE",
        ],
        restrictionsExemptions: [
          "COLLECTOR - 03 FFL - VALID COE",
          "COMMUNITY COLLEGE - POST CERTIFIED",
          "DULY AUTHORIZED LAW ENFORCEMENT AGENCY",
          "ENTERTAINMENT COMPANY - PERMIT - VALID COE",
          "EXCHANGE - WITHIN PRECEDING 30 DAYS",
          "LAW ENFORCEMENT AGENCY - CALIFORNIA",
          "LICENSED CALIFORNIA FIREARMS DEALER",
          "PEACE OFFICER - ACTIVE - LETTER REQUIRED",
          "PEACE OFFICER - CALIFORNIA - ACTIVE",
          "PRIVATE SECURITY COMPANY (PPO) - CALIFORNIA - LICENSED",
          "REPLACEMENT - REPORTED LOST OR STOLEN FIREARM",
          "SPECIAL WEAPONS PERMIT",
          "STATE OR LOCAL CORRECTIONAL FACILITY",
        ],
        citizenship: ["YES", "NO"],
        firearmTypes: ["Handgun", "Rifle", "Shotgun", "Other"],
        makes: [
          "ARMSCOR PRECISION",
          "BERETTA",
          "BERSA",
          "BROWNING",
          "CAMDON DEFENSE",
          "CENTURY ARMS INC",
          "CHARTER 2000",
          "COLT",
          "CTF MANUFACTURING",
          "CZ USA",
          "DAN WESSON",
          "EUROPEAN AMERICAN ARMORY CORP",
          "FMK FIREARMS",
          "FN HERSTAL, S.A.",
          "FRANKLIN ARMORY",
          "GERMAN SPORTS GUN",
          "GIRSAN (IMPORTED BY EAA CORP)",
          "GLOCK",
          "GUNCRAFTER INDUSTRIES, LLC",
          "HECKLER & KOCH",
          "HENRY REPEATING ARM",
          "JUGGERNAUT TACTICAL",
          "KAHR ARMS",
          "KIMBER",
          "LES BAE",
          "MAGNUM RESEARCH",
          "NIGHTHAWK CUSTOM",
          "NORTH AMERICAN ARMS",
          "PHOENIX ARMS",
          "ROST MARTIN",
          "SECOND AMENDMENT ZONE",
          "SEECAMP",
          "SIG SAUER",
          "SMITH & WESSON",
          "SPRINGFIELD ARMORY",
          "STANDARD MANUFACTURING CO",
          "STRAYER VOIGT",
          "STURM, RUGER & CO",
          "TAURUS",
          "VALTRO",
          "WALTHER",
          "WILSON COMBAT",
        ],
        race: [
          "AMERICAN INDIAN",
          "ASIAN INDIAN",
          "BLACK",
          "CAMBODIAN",
          "CHINESE",
          "FILIPINO",
          "GUAMANIAN",
          "HAWAIIAN",
          "HISPANIC",
          "JAPANESE",
          "KOREAN",
          "LAOTIAN",
          "OTHER",
          "OTHER ASIAN",
          "PACIFIC ISLANDER",
          "SAMOAN",
          "VIETNAMESE",
          "UNKNOWN",
          "VIETNAMESE",
          "WHITE",
        ],
      };
    },
  });

  // New query for handgun roster data
  const { data: handgunData, isLoading: isLoadingHandguns } = useQuery({
    queryKey: ["handgunRoster"],
    queryFn: async () => {
      const response = await fetch("/api/fetchRoster");
      if (!response.ok) {
        throw new Error("Failed to fetch handgun roster");
      }
      return response.json();
    },
  });

  // Mutation for selected make (instead of useState)
  const { data: selectedMake, mutate: setSelectedMake } = useMutation({
    mutationFn: (make: string) => Promise.resolve(make),
  });

  // Get models for selected manufacturer
  const models =
    selectedMake && handgunData ? handgunData[selectedMake].sort() : [];

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-center mb-8">
        Submit Dealer Handgun Sale
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
                onChange={(e) => {
                  const sanitizedValue = DOMPurify.sanitize(e.target.value);
                  // Handle the sanitized value
                }}
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="required">
                Purchaser First Name
              </Label>
              <Input id="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Purchaser Middle Name</Label>
              <Input id="middleName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="required">
                Purchaser Last Name
              </Label>
              <Input id="lastName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input id="suffix" />
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="required">
                Purchaser Street Address
              </Label>
              <Input id="address" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="required">
                Zip Code
              </Label>
              <Input id="zipCode" required maxLength={5} />
            </div>
          </div>

          {/* Physical Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label className="required">Gender</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {formData?.genders.map((gender) => (
                    <SelectItem key={gender} value={gender.toLowerCase()}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="required">Hair Color</Label>
              <Select>
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
            </div>

            <div className="space-y-2">
              <Label className="required">Eye Color</Label>
              <Select>
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
            </div>

            <div className="space-y-2">
              <Label className="required">Height (Feet / Inches)</Label>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Feet" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData?.heightFeet.map((feet) => (
                      <SelectItem key={feet} value={feet.toLowerCase()}>
                        {feet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Inches" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData?.heightInches.map((inches) => (
                      <SelectItem key={inches} value={inches.toLowerCase()}>
                        {inches}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" />
            </div>

            {/* Add remaining fields similarly */}
            {/* Height, Weight, DOB fields */}
          </div>

          {/* ID Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="required">Purchaser ID Type</Label>
              <Select>
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
              <Input id="purchaserId" />
            </div>

            <div className="space-y-2">
              <Label className="required">Race</Label>
              <Select>
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
              <Select>
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
              <Select>
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
              <Input id="phoneNumber" />
              <div className="text-sm text-gray-500">
                (Format as: ##########)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aliasFirstName">Purchaser Alias First Name</Label>
              <Input id="aliasFirstName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliasMiddleName">
                Purchaser Alias Middle Name
              </Label>
              <Input id="aliasMiddleName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliasLastName">Purchaser Alias Last Name</Label>
              <Input id="aliasLastName" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliasSuffix">Purchaser Alias Suffix</Label>
              <Input id="aliasSuffix" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hscFscNumber">HSC / FSC Number</Label>
              <Input id="hscFscNumber" />
            </div>

            <div className="space-y-2">
              <Label className="required">HSC / FSX Exemption Code</Label>
              <Select>
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
                <Select>
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
                <Select>
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
                <Select>
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
                  <span className="font-bold">
                    Firearms Eligibility Question 4:
                  </span>{" "}
                  Is purchaser currently the subject of any restraining order
                  specified in PC section 29825, a Gun Violence Restraining
                  Order, or a probation condition prohibiting firearm
                  possession?
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
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
                  <Select>
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
                  <Select>
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
                <Select>
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
                    disabled={isLoadingHandguns}
                    onValueChange={(value) => setSelectedMake(value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingHandguns ? "Loading..." : "Select Make"
                        }
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
                    <Select>
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
              {/* Serial Numbers Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Serial Number</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label className="required">Re-enter Serial Number</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Other Number</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label className="required">Color</Label>
                  <Select>
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
                  <Select>
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
                  <Label className="required">
                    Firearm Safety Device (FSD)
                  </Label>
                  <Select>
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
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  maxLength={200}
                  onChange={(e) => {
                    const remaining = 200 - e.target.value.length;
                    // Update remaining characters count
                  }}
                />
                <div className="text-sm text-gray-500">
                  200 character limit. Characters remaining: 200
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
          onClick={() => handleNavigation("/TGR/dros/training")}
        >
          Back
        </Button>
        <Button>Preview</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default DealerHandgunSalePage;
