"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";
import { useMemo } from "react";
import { useForm, UseFormSetValue } from "react-hook-form";

type FormData = {
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
        setValue("city", data.primary_city, { shouldValidate: true });
        setValue("state", data.state, { shouldValidate: true });
      }

      return data;
    },
    enabled: zipCode?.length === 5,
    staleTime: 30000, // Cache results for 30 seconds
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

const DealerHandgunSalePage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: initialFormState,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  // Watch the zipCode field
  const zipCode = watch("zipCode");

  // Pass setValue to the hook
  const { data: zipData, isLoading: isZipLoading } = useZipCodeLookup(
    zipCode || "",
    setValue
  );

  // Replace form state management with react-hook-form
  const onSubmit = (data: FormData) => {
    submitForm(data);
  };

  // Form submission mutation
  const { mutate: submitForm, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/dealerHandgun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
  const { data: formData } = useQuery({
    queryKey: ["formOptions"],
    queryFn: async () => {
      // Replace with your actual API call
      return {
        genders: ["Male", "Female", "Nonbinary / Unspecified"],
        eyeColors: [
          "BLACK",
          "BLUE",
          "BROWN",
          "GRAY",
          "GREEN",
          "HAZEL",
          "MAROON",
          "MULTICOLOR",
          "PINK",
          "UNKNOWN",
        ],
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
        hairColors: [
          "BALD",
          "BLACK",
          "BLONDE",
          "BLUE",
          "BROWN",
          "GRAY",
          "GREEN",
          "ORANGE",
          "PINK",
          "PURPLE",
          "RED",
          "SANDY",
          "UNKNOWN",
          "WHITE",
        ],
        heightFeet: ["3", "4", "5", "6", "7", "8"],
        heightInches: [
          "00",
          "01",
          "02",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "11",
        ],
        idTypes: ["California DL", "California ID", "DEPT OF DEFENSE ID"],
        placesOfBirth: [
          "AFGHANISTAN",
          "AGUASCALIENTES",
          "ALABAMA",
          "ALASKA",
          "ALBANIA",
          "ALBERTA",
          "ALGERIA",
          "AMERICAN SAMOA ISLANDS",
          "ANDORRA",
          "ANGOLA",
          "ANGUILLA",
          "ANTIGUA",
          "ARGENTINA",
          "ARIZONA",
          "ARKANSAS",
          "ARMENIA",
          "ARUBA",
          "ASHMORE AND CARTIER ISLANDS",
          "AUSTRALIA",
          "AUSTRIA",
          "AZERBAIJAN",
          "AZORES ISLANDS",
          "BAHAMAS",
          "BAHRAIN",
          "BAJA CALIFORNIA NORTE",
          "BAJA CALIFORNIA SUR",
          "BAKER ISLAND",
          "BALEARIC ISLANDS",
          "BANGLADESH",
          "BARBADOS",
          "BASSAS DA INDIA",
          "BELGIUM",
          "BELIZE",
          "BENIN",
          "BERMUDA",
          "BHUTAN",
          "BOLIVIA",
          "BOSNIA HERCEGOVENA",
          "BOTSWANA",
          "BOUVET ISLAND",
          "BRAZIL",
          "BRITISH COLUMBIA",
          "BRITISH INDIAN OCEAN TERR",
          "BRITISH VIRGIN ISLANDS",
          "BRUNEI",
          "BULGARIA",
          "BURKINA FASO",
          "BURMA",
          "BURUNDI",
          "BYELARUS",
          "CALIFORNIA",
          "CAMBODIA (KHMER AND KAMPUCHEA)",
          "CAMEROON",
          "CAMPECHE",
          "CANADA",
          "CANAL ZONE",
          "CANARY ISLANDS",
          "CAPE VERDE ISLANDS",
          "CAROLINE ISLANDS",
          "CAYMAN ISLANDS",
          "CENTRAL AFRICAN REPUBLIC",
          "CHAD",
          "CHIAPAS",
          "CHIHUAHUA",
          "CHILE",
          "CHRISTMAS ISLAND",
          "CLIPPERTON ISLAND",
          "COAHUILA",
          "COCOS (KEELING) ISLANDS",
          "COLIMA",
          "COLOMBIA",
          "COLORADO",
          "COMOROS ISLANDS",
          "CONNECTICUT",
          "COOK ISLANDS",
          "CORAL SEA ISLANDS",
          "COSTA RICA",
          "CROATIA",
          "CUBA",
          "CYPRUS",
          "CZECH REPUBLIC",
          "DELAWARE",
          "DENMARK",
          "DISTRICT OF COLUMBIA",
          "DISTRITO FEDERAL",
          "DJIBOUTI",
          "DOMINICA",
          "DOMINICAN REPUBLIC",
          "DURANGO",
          "EAST GERMANY",
          "ECUADOR",
          "EGYPT",
          "EL SALVADOR",
          "ENGLAND",
          "EQUATORIAL GUINEA",
          "ERETRIA",
          "ESTONIA",
          "ETHIOPIA",
          "EUROPA ISLAND",
          "FALKLAND ISLANDS",
          "FAROE ISLANDS",
          "FEDERATED STATES OF MICRONESIA",
          "FIJI",
          "FINLAND",
          "FLORIDA",
          "FRANCE",
          "FRENCH GUIANA",
          "FRENCH POLYNESIA",
          "FRENCH SOUTHERN AND ANTARTIC LANDS",
          "GABON",
          "GAMBIA",
          "GAZA",
          "GEORGIA (COUNTRY)",
          "GEORGIA (STATE)",
          "GERMANY",
          "GHANA",
          "GIBRALTAR",
          "GREECE",
          "GREENLAND",
          "GRENADA",
          "GUADELOUPE",
          "GUAM",
          "GUANAJUATO",
          "GUATEMALA",
          "GUERNSEY",
          "GUERRERO",
          "GUINEA",
          "GUINEA/BISSAU",
          "GUYANA",
          "HAITI",
          "HAWAII",
          "HEARD ISLAND & MCDONALD ISLAND",
          "HIDALGO",
          "HONDURAS",
          "HONG KONG",
          "HOWLAND ISLAND",
          "HUNGARY",
          "ICELAND",
          "IDAHO",
          "ILLINOIS",
          "INDIA",
          "INDIANA",
          "INDONESIA",
          "IOWA",
          "IRAN",
          "IRAQ",
          "IRELAND (NOT NORTHERN IRELAND)",
          "ISLE OF MAN",
          "ISRAEL",
          "ITALY",
          "IVORY COAST",
          "JALISCO",
          "JAMAICA",
          "JAN MAYEN",
          "JAPAN",
          "JARVIS ISLAND",
          "JERSEY",
          "JOHNSTON ISLANDS",
          "JORDAN",
          "JUAN DE NOVA ISLAND",
          "KANSAS",
          "KAZAKHSTAN",
          "KENTUCKY",
          "KENYA",
          "KINGMAN REEF",
          "KIRIBATI",
          "KOSOVO",
          "KUWAIT",
          "KYRGYZSTAN",
          "LAOS",
          "LATVIA",
          "LEBANON",
          "LESOTHO",
          "LIBERIA",
          "LIBYA",
          "LIECHTENSTEIN",
          "LITHUANIA",
          "LOUISIANA",
          "LUXEMBOURG",
          "MACAU",
          "MADEIRA ISLANDS",
          "MAINE",
          "MALAGASY REPUBLIC",
          "MALAWI",
          "MALAYSIA",
          "MALDIVES",
          "MALI",
          "MALTA",
          "MANAHIKI ISLAND",
          "MANITOBA",
          "MARIANA ISLANDS",
          "MARSHALL ISLANDS",
          "MARTINIQUE",
          "MARYLAND",
          "MASSACHUSETTS",
          "MAURITANIA",
          "MAURITIUS",
          "MAYOTTE",
          "MEXICO",
          "MICHIGAN",
          "MICHOACAN",
          "MIDWAY ISLANDS",
          "MINNESOTA",
          "MISSISSIPPI",
          "MISSOURI",
          "MOLDOVA",
          "MONACO",
          "MONGOLIA",
          "MONTANA",
          "MONTSERRAT",
          "MORELOS",
          "MOROCCO",
          "MOZAMBIQUE",
          "NAMIBIA/SOUTHWEST AFRICA",
          "NAURU",
          "NAVASSA ISLAND",
          "NAYARIT",
          "NEBRASKA",
          "NEPAL",
          "NETHERLANDS",
          "NETHERLANDS ANTILLES",
          "NEVADA",
          "NEVIS/SAINT CHRISTOPHER/SAINT KITTS",
          "NEW BRUNSWICK",
          "NEW CALEDONIA",
          "NEW HAMPSHIRE",
          "NEW JERSEY",
          "NEW MEXICO",
          "NEW YORK",
          "NEW ZEALAND",
          "NEWFOUNDLAND",
          "NICARAGUA",
          "NIGER",
          "NIGERIA",
          "NORFOLK ISLAND",
          "NORTH CAROLINA",
          "NORTH DAKOTA",
          "NORTH KOREA",
          "NORTH VIETNAM",
          "NORTHERN IRELAND",
          "NORTHWEST TERRITORIES",
          "NORWAY",
          "NOVA SCOTIA",
          "NUEVO LEON",
          "OAXACA",
          "OHIO",
          "OKINAWA",
          "OKLAHOMA",
          "OMAN",
          "ONTARIO",
          "OREGON",
          "OTHER NOT LISTED",
          "PAKISTAN",
          "PALAU, REPUBLIC OF",
          "PALMYRA ATOLL",
          "PANAMA",
          "PAPUA NEW GUINEA",
          "PARAGUAY",
          "PARCEL ISLANDS",
          "PENNSYLVANIA",
          "PEOPLES REPUBLIC OF CHINA",
          "PERU",
          "PHILIPPINES",
          "PITCAIRN HENDERSON DUCIE OENO",
          "POLAND",
          "PORTUGAL",
          "PRINCE EDWARD ISLAND",
          "PUEBLA",
          "PUERTO RICO",
          "QATAR",
          "QUEBEC",
          "QUERETARO",
          "QUINTANA ROO",
          "REPUBLIC OF CONGO/BRAZZAVILLE",
          "REPUBLIC OF MACEDONIA",
          "REPUBLIC OF YEMEN",
          "REUNION",
          "RHODE ISLAND",
          "ROMANIA/RUMANIA",
          "RUSSIA (FORMERLY USSR)",
          "RUSSIAN FEDERATION",
          "RWANDA",
          "SAINT HELENA",
          "SAINT LUCIA",
          "SAINT PIERRE/MIGUELON",
          "SAINT VINCENT",
          "SAN LUIS POTOSI",
          "SAN MARINO",
          "SAO TOMER/PRINCIPE",
          "SASKATCHEWAN",
          "SAUDI ARABIA",
          "SCOTLAND",
          "SENEGAL",
          "SERBIA",
          "SEYCHELLES",
          "SIERRA LEONE",
          "SINALOA",
          "SINGAPORE",
          "SLOVAKIA",
          "SLOVENIA",
          "SOCIALIST REPUBLIC OF VIETNAM",
          "SOLOMON ISLANDS",
          "SOMALIA",
          "SONORA",
          "SOUTH AFRICA",
          "SOUTH CAROLINA",
          "SOUTH DAKOTA",
          "SOUTH GEORGIA & SOUTH SANDWICH ISLAN",
          "SOUTH KOREA",
          "SPAIN",
          "SPRATLY ISLANDS",
          "SRI LANKA (CEYLON)",
          "SUDAN",
          "SURINAM",
          "SVALBARD",
          "SWAZILAND",
          "SWEDEN",
          "SWITZERLAND",
          "SYRIA",
          "TABASCO",
          "TAIWAN",
          "TAJIKISTAN",
          "TAMAULIPAS",
          "TANZANIA",
          "TENNESSEE",
          "TEXAS",
          "THAILAND",
          "TLAXCALA",
          "TOGO",
          "TOKELAU",
          "TONGA",
          "TONGAREVA ISLAND",
          "TRINIDAD/TOBAGO",
          "TROMELIN ISLAND",
          "TRUST TERRITORY OF PACIFIC ISLANDS",
          "TUAMOTU ARCHIPELAGO",
          "TUNISIA",
          "TURKEY",
          "TURKMENISTAN",
          "TURKS/CALCOS ISLANDS",
          "TUVALU",
          "UGANDA",
          "UKRAINE",
          "UNITED ARAB EMIRATES",
          "UNITED STATES OF AMERICA",
          "URUGUAY",
          "US VIRGIN ISLANDS",
          "UTAH",
          "UZBEKISTAN",
          "VANTUATU",
          "VATICAN CITY",
          "VENEZUELA",
          "VERACRUZ",
          "VERMONT",
          "VIRGINIA",
          "WAKE ISLAND",
          "WALES",
          "WALLIS AND FUTUNA",
          "WASHINGTON",
          "WEST BANK",
          "WEST GERMANY",
          "WEST INDIES",
          "WEST VIRGINIA",
          "WESTERN SAHARA",
          "WESTERN SAMOA",
          "WISCONSIN",
          "WYOMING",
          "YUCATAN",
          "YUGOSLAVIA",
          "YUKON TERRITORY",
          "ZACATECAS",
          "ZAIRE",
          "ZAMBIA",
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
          "WHITE",
        ],
      };
    },
  });

  // Update the handgun roster query
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

  // Preview Dialog Component
  const PreviewDialog = () => {
    const formValues = watch(); // Get all current form values

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
                  Name: {formValues.firstName} {formValues.middleName}{" "}
                  {formValues.lastName} {formValues.suffix}
                </p>
                <p>Address: {formValues.streetAddress}</p>
                <p>
                  Location: {formValues.city}, {formValues.state}{" "}
                  {formValues.zipCode}
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
                  Height: {formValues.heightFeet}'{formValues.heightInches}"
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
                <p>
                  Condition: {formValues.isNewGun === "new" ? "New" : "Used"}
                </p>
                <p>Safety Device: {formValues.firearmSafetyDevice}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">Additional Information</h3>
                <p>Gun Show Transaction: {formValues.isGunShowTransaction}</p>
                <p>
                  Waiting Period Exemption: {formValues.waitingPeriodExemption}
                </p>
                <p>Restriction Exemption: {formValues.restrictionExemption}</p>
                <p>Comments: {formValues.comments}</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Edit
              </Button>
              <Button
                onClick={() => submitForm(formValues)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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

              {zipCode?.length === 5 && (
                <>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select
                      {...register("city")}
                      onValueChange={(value) => setValue("city", value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      {...register("state")}
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
              <Select
                {...register("gender")}
                onValueChange={(value) => setValue("gender", value)}
              >
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
              <Select
                {...register("hairColor")}
                onValueChange={(value) => setValue("hairColor", value)}
              >
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
              <Select
                {...register("eyeColor")}
                onValueChange={(value) => setValue("eyeColor", value)}
              >
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
                <Select
                  {...register("heightFeet")}
                  onValueChange={(value) => setValue("heightFeet", value)}
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
                  {...register("heightInches")}
                  onValueChange={(value) => setValue("heightInches", value)}
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
              <Select
                {...register("idType")}
                onValueChange={(value) => setValue("idType", value)}
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
              <Input {...register("idNumber")} id="purchaserId" />
            </div>

            <div className="space-y-2">
              <Label className="required">Race</Label>
              <Select
                {...register("race")}
                onValueChange={(value) => setValue("race", value)}
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
                {...register("isUsCitizen")}
                onValueChange={(value) => setValue("isUsCitizen", value)}
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
                {...register("placeOfBirth")}
                onValueChange={(value) => setValue("placeOfBirth", value)}
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
              <Input {...register("phoneNumber")} id="phoneNumber" />
              <div className="text-sm text-gray-500">
                (Format as: ##########)
              </div>
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
              <Select
                {...register("exemptionCode")}
                onValueChange={(value) => setValue("exemptionCode", value)}
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
                <Select
                  {...register("eligibilityQ1")}
                  onValueChange={(value) => setValue("eligibilityQ1", value)}
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
                <Select
                  {...register("eligibilityQ2")}
                  onValueChange={(value) => setValue("eligibilityQ2", value)}
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
                <Select
                  {...register("eligibilityQ3")}
                  onValueChange={(value) => setValue("eligibilityQ3", value)}
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
                  <span className="font-bold">
                    Firearms Eligibility Question 4:
                  </span>{" "}
                  Is purchaser currently the subject of any restraining order
                  specified in PC section 29825, a Gun Violence Restraining
                  Order, or a probation condition prohibiting firearm
                  possession?
                </Label>
                <Select
                  {...register("eligibilityQ4")}
                  onValueChange={(value) => setValue("eligibilityQ4", value)}
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
                    {...register("isGunShowTransaction")}
                    onValueChange={(value) =>
                      setValue("isGunShowTransaction", value)
                    }
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
                    {...register("waitingPeriodExemption")}
                    onValueChange={(value) =>
                      setValue("waitingPeriodExemption", value)
                    }
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
              {/* Make and Model Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">Make</Label>
                  <Select
                    {...register("make")}
                    disabled={isLoadingHandguns}
                    onValueChange={(value) => {
                      setValue("make", value);
                      setValue("model", ""); // Reset model when make changes
                    }}
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
                    <Select
                      {...register("model")}
                      onValueChange={(value) => setValue("model", value)}
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
                    <Input value={handgunDetails.caliber || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Barrel Length</Label>
                    <Input value={handgunDetails.barrelLength || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input value={handgunDetails.unit || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Input value={handgunDetails.material || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={handgunDetails.category || ""} readOnly />
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
                  <div className="text-sm text-muted-foreground">
                    Please re-enter the serial number to verify
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Other Number</Label>
                  <Input {...register("otherNumber")} />
                </div>
                <div className="space-y-2">
                  <Label className="required">Color</Label>
                  <Select
                    {...register("color")}
                    onValueChange={(value) => setValue("color", value)}
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
                    {...register("isNewGun")}
                    onValueChange={(value) => setValue("isNewGun", value)}
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
                  <Label className="required">
                    Firearm Safety Device (FSD)
                  </Label>
                  <Select
                    {...register("firearmSafetyDevice")}
                    onValueChange={(value) =>
                      setValue("firearmSafetyDevice", value)
                    }
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
        <PreviewDialog />
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default DealerHandgunSalePage;
