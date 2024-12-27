"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Alert, AlertDescription } from "../../../../../components/ui/alert";
import { Button } from "../../../../../components/ui/button";
import { Textarea } from "../../../../../components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog";
import { toast } from "../../../../../components/ui/use-toast";
import { supabase } from "../../../../../utils/supabase/client";
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
        setValue("city", data.primary_city, { shouldValidate: true });
        setValue("state", data.state, { shouldValidate: true });
      }

      return data;
    },
    enabled: zipCode?.length === 5,
    staleTime: 30000, // Cache results for 30 seconds
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

const PptHandgunPage = () => {
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

  // Watch both zip code fields
  const zipCode = watch("zipCode");
  const sellerZipCode = watch("sellerZipCode");

  // Use both zip code lookup hooks
  const { data: zipData, isLoading: isZipLoading } = useZipCodeLookup(
    zipCode || "",
    setValue
  );

  const { data: sellerZipData, isLoading: isSellerZipLoading } =
    useSellerZipCodeLookup(sellerZipCode || "", setValue);

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
        body: JSON.stringify({
          ...data,
          transaction_type: "dealer-handgun",
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
        calibers: [
          ".14 Walker Hornet, .14/221, .14-222, 14-gauge shotgun",
          ".17 (various)",
          ".204 Ruger, Remington, Savage",
          ".218 Bee",
          ".22 Short/Long/Rifle rim. cart.; .22 Hornet, .22-250, 22-gauge",
          ".220 Swift",
          ".221 Remington Fireball",
          ".222 Remington, .222 Remington Magnum",
          ".223 Remington",
          ".224 Weatherby Mag, .224 Valkyrie",
          ".225 Winchester",
          ".226 JDJ",
          ".240 Weatherby Mag",
          ".243 Winchester",
          ".25 ACP, .25-06, .25-20, .25-35",
          ".250-3000 Savage",
          ".256 Newton, .256 Win Mag",
          ".257 Roberts, .257 Weatherby Mag, .257 Mini Dreadnaught",
          ".26 Nosler",
          ".260 Mag. Res Lone Eagle, .260 Rem, .260 Savage, .260 Thompson/Cen",
          ".264 Winchester Magnum",
          ".270 Winchester, .270 Weatherby Magnum",
          ".276 Enfield, .276 Pederson",
          ".28 Nosler, 28-gauge shotgun",
          ".280 Remington, .280 JDJ, .80 British",
          ".284 Winchester",
          ".30 M1 Carbine, .30-40 Krag, 30-30 Winchester, .30 Mauser",
          ".30-06 U.S. (.30 Springfield)",
          ".300 Win. Mag/.300 Wtherby Mag/.300 Sav/.300 H&H Mag/.300 AAC Blkout",
          ".303 British, .303 Savage",
          ".307 Winchester",
          ".308 Winchester",
          ".309 JDJ",
          ".31 Baby Dragoon 1848, 1849 Pocket",
          ".32 ACP,.32 Short Colt, .32 Long Colt, .32 H&R Mag, 32-gauge shotgun",
          ".32-20 Winchester",
          ".32-40 Winchester",
          ".320 Revolver",
          ".325 Winchester",
          ".327 Federal Magnum Cartridge",
          ".33 Winchester",
          ".330 Dakota",
          ".338 Winchester Mag, .338 Federal, .338 Lapua Mag",
          ".340 Weatherby Magnum",
          ".348 Winchester",
          ".35 Whelen, .35 Remington, .350 Remington Mag, .35 S&W",
          ".35-06 JDJ",
          ".350 Legend",
          ".351 Winchester",
          ".356 Win, SW940",
          ".357 Remington Magnum, .357 Maximum, .357 AutoMag, .357 Sig",
          ".358 Win, Remington, RPM, ROP, STA",
          ".36 caliber markings normally found only on black-powder firearms",
          ".375 H&H Magnum, .375 Winchester, 375-06 JDJ",
          ".376 Steyr",
          ".378 Weatherby Mag",
          ".38 S&W, .38 (S&W) Special, .38 ACP, .38 Super, etc.",
          ".38-40 Winchester",
          ".38-55 Win, .38-55 Ballard",
          ".380 ACP in U.S.; also known as 9mm Kurz/Corto/Short",
          ".40 S&W",
          ".40-44 Woodswalker",
          ".40-65 Winchester",
          ".400 Cor-bon",
          ".401 Winchester, .401 Power Mag",
          ".404 Jeffery",
          ".405 Winchester",
          ".408 Cheytac",
          ".41 Short Rimfire, .41 Remington Mag, .41 Action Express, .41 AutoMa",
          ".411 JDJ",
          ".416 Barrett, .416 Rigby, .416 Rem Mag",
          ".425 Express",
          ".44 Russian, .44 Special, .44 Rem. Mag, .44 AutoMag",
          ".44-40 Winchester",
          ".440 Cor-bon",
          ".444 Marlin",
          ".445",
          ".45 ACP, .45 AutoRim, .45 Short/Long Colt, .45 Winchester Mag",
          ".45-70 U.S. Government",
          ".450 Marlin, .450 Dakota, .450 Revolver, .450 Bushmaster",
          ".454 Casull-ragin Bull Model with Colt 45",
          ".455 Webley, or .455 Manstopper, .455 Enfield",
          ".458 Winchester Mag, .458 Whisper",
          ".460 Weatherby Mag, .460 A-Square, .460 S&W, .460 Steyr",
          ".470 Nitro Express, .470 Rigby",
          ".475 Linebaugh, .475 JDJ",
          ".476 Enfield",
          ".480 Ruger",
          ".485 British",
          ".495 A-Square",
          ".50 BMG, .50 Action Exp, .50 Beowolf; black-powder firearm",
          ".50-70 Gov't",
          ".500 Linebaugh, .500 S&W Mag, .500 WE",
          ".510 DTC",
          ".54 Used in black-powder firearms",
          ".577 Tyrannosaur, .577/450 Martini Henry, .577 Snyder",
          ".58 Used in black-powder firearms; .577 Nitro Express Elephant Gun",
          ".60 Used in black-powder firearms; .600 Nitro Express Elephant Gun",
          ".653 Scramjet",
          ".671 Phantom, .671 Blackbrid",
          ".75 caliber, 7.5mm Nagant (Swedish), 7.5mm Swiss, 7.5mm French MAS",
          ".909 Eagle",
          ".953 Hellcat, .953 Saturn",
          "10.15mm Jermann, 10.15mm Serbian Mauser",
          "10.4mm Italian, 10.4mm Swiss",
          "10.57 Maverick, 10.57 Meteor",
          "10.75mm Russian Berdan",
          "10mm, 10-gauge shotgun",
          "11.15mm Spanish Rem., 11.15mm Mauser, 11.15mm Werndl M/77",
          "11.43mm Egyptian, 11.43mm Turkish",
          "11.4mm Brazilian, 11.4mm Werndel M/73",
          "11.75mm Montenegrin",
          "11.7mm Danish Rem.",
          "11mm Mauser, 11mm French, 11 Belgian",
          "12-gauge shotgun",
          "12.5mm",
          "13mm Gyrojet rocket pistol/carbine",
          "16-gauge shotgun",
          "2.7mm Kolibri",
          "20-gauge shotgun",
          "24-gauge shotgun",
          "3mm Kolibri",
          "4-gauge shotgun or blank",
          "410-gauge shotgun",
          "5.45x39mm, 5.45x18mm Soviet",
          "5.56x45mm NATO",
          "5.5mm Velo Dog",
          "5.6x50mm Mag, 5.6x57mm RWS, 5.6x61mm, 5.6x52 Rmm",
          "5.7 X 28mm Fabrique Nationale",
          "5mm Bergmann, 5mm Clement Auto",
          "6.17 Spitfire, 6.17 Flash",
          "6.35mm",
          "6.5mm (various); .65 caliber black-powder firearms",
          "6.8mm Remington, 6.8x57mm Chinese",
          "6mm Remington, 6mm SAW",
          "7-30 Waters",
          "7.21 Tomahawk, 7.21 Firehawk, 7.21 Firebird",
          "7.35mm Carcano",
          "7.62x39 Soviet, 7.62x51 NATO, 7.62x54R Rus. Moisin-Nagant, 7.62x35",
          "7.63mm Mannlicher, 7.62x25mm Tokarev",
          "7.65mm Luger, 7.65mm Roth-Sauer, 7.65 MAS (French), .30 Luger",
          "7.7mm Arisaka",
          "7.82 Patriot, 7.82 Warbird",
          "7.92mm Kurz (Short)",
          "7mm, Rem Weatherby Mag, 7mm Bench Rest, 7x57 Mauser, 7mm-08 Rem",
          "8.59 Galaxy, 8.59 Titan",
          "8x57 Mauser, 8mm Lebel, 8mm Remington Mag, 8x56mmR, 8-gauge shotgun",
          "9.3mm JDJ, 9.3x57mm Mauser",
          "9.5mm Turkish Mauser",
          "9.8mm Auto Colt",
          "9mm L/Para/9x18,9x21,9x23/Largo 9x19, 9mm rimfire shotgun",
          "Firearm with interchangable barrels",
        ],
        category: [
          "4 OR MORE BARRELS",
          "BOLT ACTION",
          "DERRINGER",
          "DOUBLE BARREL",
          "LEVER ACTION",
          "OVER AND UNDER",
          "REVOLVER",
          "SEMI-AUTOMATIC",
          "SINGLE SHOT",
          "THREE BARRELS",
        ],
unit: [
          "INCH",
          "CENTIMETER",
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
        waitingPeriodExemption: [
          "CFD NUMBER",
          "COLLECTOR",
          "PEACE OFFICER (LETTER REQUIRED)",
          "SPECIAL WEAPON PERMIT",
        ],
        frameOnly: ["YES", "NO"],
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
            {/* Purchaser Information */}
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
                <p>
                  Height: {formValues.heightFeet}&apos;{formValues.heightInches}
                  &quot;
                </p>
                <p>Weight: {formValues.weight} lbs</p>
                <p>Date of Birth: {formValues.dateOfBirth}</p>
                <p>Race: {formValues.race}</p>
                <p>Gender: {formValues.gender}</p>
                <p>Hair Color: {formValues.hairColor}</p>
                <p>Eye Color: {formValues.eyeColor}</p>
                <p>U.S. Citizen: {formValues.isUsCitizen}</p>
                <p>Place of Birth: {formValues.placeOfBirth}</p>
              </div>

              {/* Seller Information */}
              <div className="space-y-2">
                <h3 className="font-bold">Seller Information</h3>
                <p>
                  Name: {formValues.sellerFirstName}{" "}
                  {formValues.sellerMiddleName} {formValues.sellerLastName}{" "}
                  {formValues.sellerSuffix}
                </p>
                <p>Address: {formValues.sellerStreetAddress}</p>
                <p>
                  Location: {formValues.sellerCity}, {formValues.sellerState}{" "}
                  {formValues.sellerZipCode}
                </p>
                <p>Phone: {formValues.sellerPhoneNumber}</p>
                <p>ID Type: {formValues.sellerIdType}</p>
                <p>ID Number: {formValues.sellerIdNumber}</p>
                <p>
                  Height: {formValues.sellerHeightFeet}&apos;
                  {formValues.sellerHeightInches}
                  &quot;
                </p>
                <p>Weight: {formValues.sellerWeight} lbs</p>
                <p>Date of Birth: {formValues.sellerDateOfBirth}</p>
                <p>Race: {formValues.sellerRace}</p>
                <p>Gender: {formValues.sellerGender}</p>
                <p>Hair Color: {formValues.sellerHairColor}</p>
                <p>Eye Color: {formValues.sellerEyeColor}</p>
                <p>U.S. Citizen: {formValues.sellerIsUsCitizen}</p>
                <p>Place of Birth: {formValues.sellerPlaceOfBirth}</p>
              </div>
            </div>

            {/* Firearm Information */}
            <div className="space-y-2">
              <h3 className="font-bold">Firearm Information</h3>
              <p>Make: {formValues.make}</p>
              <p>Model: {formValues.model}</p>
              <p>Serial Number: {formValues.serialNumber}</p>
              <p>Other Number: {formValues.otherNumber}</p>
              <p>Color: {formValues.color}</p>
              <p>Condition: {formValues.isNewGun === "new" ? "New" : "Used"}</p>
              <p>Safety Device: {formValues.firearmSafetyDevice}</p>
              <p>Gun Show Transaction: {formValues.isGunShowTransaction}</p>
              <p>
                Waiting Period Exemption: {formValues.waitingPeriodExemption}
              </p>
              <p>Restriction Exemption: {formValues.restrictionExemption}</p>
              <p>Comments: {formValues.comments}</p>
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
                      {...register("sellerZipCode", {
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

                  {sellerZipCode?.length === 5 && (
                    <>
                      <div className="space-y-2">
                        <Label>Seller City</Label>
                        <Select
                          {...register("sellerCity")}
                          onValueChange={(value) =>
                            setValue("sellerCity", value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
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
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Seller State</Label>
                        <Input
                          {...register("sellerState")}
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
                  <Label className="required">Seller Gender</Label>
                  <Select
                    {...register("sellerGender")}
                    onValueChange={(value) => setValue("sellerGender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
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
                  <Label className="required">Seller Hair Color</Label>
                  <Select
                    {...register("sellerHairColor")}
                    onValueChange={(value) =>
                      setValue("sellerHairColor", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Hair Color" />
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
                  <Label className="required">Seller Eye Color</Label>
                  <Select
                    {...register("sellerEyeColor")}
                    onValueChange={(value) => setValue("sellerEyeColor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Eye Color" />
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

                {/* Seller Height/Weight/DOB */}

                <div className="space-y-2">
                  <Label className="required">Seller Height</Label>
                  <div className="flex gap-2">
                    <Select
                      {...register("sellerHeightFeet")}
                      onValueChange={(value) =>
                        setValue("sellerHeightFeet", value)
                      }
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
                      {...register("sellerHeightInches")}
                      onValueChange={(value) =>
                        setValue("sellerHeightInches", value)
                      }
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
                  <Label>Seller Weight</Label>
                  <Input {...register("sellerWeight")} />
                </div>

                <div className="space-y-2">
                  <Label className="required">Seller Date of Birth</Label>
                  <Input {...register("sellerDateOfBirth")} type="date" />
                </div>
              </div>

              {/* Seller ID Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Seller ID Type</Label>
                  <Select
                    {...register("sellerIdType")}
                    onValueChange={(value) => setValue("sellerIdType", value)}
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
                  <Label className="required">Seller ID Number</Label>
                  <Input {...register("sellerIdNumber")} />
                </div>

                <div className="space-y-2">
                  <Label className="required">Seller Race</Label>
                  <Select
                    {...register("sellerRace")}
                    onValueChange={(value) => setValue("sellerRace", value)}
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

                {/* Seller Additional Information */}

                <div className="space-y-2">
                  <Label className="required">Seller U.S. Citizen</Label>
                  <Select
                    {...register("sellerIsUsCitizen")}
                    onValueChange={(value) =>
                      setValue("sellerIsUsCitizen", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.citizenship.map((option) => (
                        <SelectItem key={option} value={option.toLowerCase()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Seller Place of Birth</Label>
                  <Select
                    {...register("sellerPlaceOfBirth")}
                    onValueChange={(value) =>
                      setValue("sellerPlaceOfBirth", value)
                    }
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
                  <Label>Seller Phone Number</Label>
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
                      {formData?.waitingPeriodExemption.map((waitingPeriod) => (
                        <SelectItem
                          key={waitingPeriod}
                          value={waitingPeriod.toLowerCase()}
                        >
                          {waitingPeriod}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>30-Day Restriction Exemption</Label>

                  <Select
                    {...register("restrictionExemption")}
                    onValueChange={(value) =>
                      setValue("restrictionExemption", value)
                    }
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Private Party Transfer Through Licensed Firearms Dealer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private_party_transfer">
                        Private Party Transfer Through Licensed Firearms Dealer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Frame Only Question */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="required">Frame Only</Label>
                  <Select
                    {...register("frameOnly")}
                    onValueChange={(value) => setValue("frameOnly", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.frameOnly.map((frameOnly) => (
                        <SelectItem
                          key={frameOnly}
                          value={frameOnly.toLowerCase()}
                        >
                          {frameOnly}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Make and Model*/}
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
                        Object.keys(handgunData).map((make) => (
                          <SelectItem key={make} value={make}>
                            {DOMPurify.sanitize(make)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="required">Model</Label>
                  <Input {...register("model")} placeholder="Enter model" />
                </div>
              </div>

              {/* Caliber Additional Caliber Section*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">Caliber</Label>
                  <Select
                    {...register("calibers")}
                    onValueChange={(value) => setValue("calibers", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Caliber" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.calibers.map((caliber) => (
                        <SelectItem key={caliber} value={caliber}>
                          {DOMPurify.sanitize(caliber)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Additional Caliber</Label>
                  <Select
                    {...register("additionalCaliber")}
                    onValueChange={(value) =>
                      setValue("additionalCaliber", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Additional Caliber (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.calibers.map((caliber) => (
                        <SelectItem key={caliber} value={caliber}>
                          {DOMPurify.sanitize(caliber)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Caliber 2 and 3 Section*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="required">Additional Caliber</Label>
                  <Select
                    {...register("calibers")}
                    onValueChange={(value) =>
                      setValue("additionalCaliber2", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Caliber" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.calibers.map((caliber) => (
                        <SelectItem key={caliber} value={caliber}>
                          {DOMPurify.sanitize(caliber)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Additional Caliber</Label>
                  <Select
                    {...register("additionalCaliber")}
                    onValueChange={(value) =>
                      setValue("additionalCaliber3", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Additional Caliber (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.calibers.map((caliber) => (
                        <SelectItem key={caliber} value={caliber}>
                          {DOMPurify.sanitize(caliber)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Barrel Length Section*/}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="required">Barrel Length</Label>
                  <Input {...register("barrelLength")} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    {...register("unit")}
                    onValueChange={(value) =>
                      setValue("unit", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.unit.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {DOMPurify.sanitize(unit)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gun Type</Label>

                  <Select
                    {...register("gunType")}
                    onValueChange={(value) =>
                      setValue("gunType", value)
                    }
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Handgun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handgun">
                        Handgun
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    {...register("category")}
                    onValueChange={(value) =>
                      setValue("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.category.map((category) => (
                        <SelectItem key={category} value={category}>
                          {DOMPurify.sanitize(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

export default PptHandgunPage;
