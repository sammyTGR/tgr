"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { set } from "lodash";

const supabase = createClientComponentClient();

interface AcquisitionItem {
  manufacturer: string;
  countryOfManufacture: string;
  model: string;
  serial: string;
  caliber: string;
  type: string;
  importer?: string;
  barrelLength?: number;
  overallLength?: number;
  condition?: string;
  cost?: number;
  price?: number;
  mpn?: string;
  upc?: string;
  sku?: string;
  location?: string;
  notes?: string;
}

interface Contact {
  fflNumber?: string;
  fflExpires?: string;
  licenseName?: string;
  organizationName?: string;
  firstName?: string;
  lastName?: string;
  premiseAddress1: string;
  premiseAddress2?: string;
  premiseCity: string;
  premiseState: string;
  premiseZipCode: string;
  premiseCountry: string;
  phoneNumber?: string;
  emailAddress?: string;
}

interface AcquisitionData {
  items: AcquisitionItem[];
  type: string;
  contact: Contact;
  date: string;
  poNumber?: string;
  invoiceNumber?: string;
  trackingNumber?: string;
  note?: string;
}

const createAcquisition = async (data: AcquisitionData) => {
  const response = await fetch("/api/fastBoundApi/acquisitions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  if (!response.ok) {
    console.error("API response error:", responseData);
    throw new Error(JSON.stringify(responseData.error));
  }
  return responseData;
};

export default function Acquisitions() {
  const [items, setItems] = useState<AcquisitionItem[]>([]);
  const [poNumber, setPoNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [note, setNote] = useState("");
  const [acquireDate, setAcquireDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [newItem, setNewItem] = useState<AcquisitionItem>({
    manufacturer: "",
    countryOfManufacture: "",
    importer: "",
    model: "",
    serial: "",
    caliber: "",
    barrelLength: 0,
    overallLength: 0,
    condition: "",
    cost: 0,
    price: 0,
    mpn: "",
    upc: "",
    sku: "",
    location: "",
    notes: "",
    type: "",
  });
  const [type, setType] = useState<string>("Purchase");
  const [contact, setContact] = useState<Contact>({
    fflNumber: "",
    fflExpires: "", // Add this field
    licenseName: "",
    premiseAddress1: "",
    premiseAddress2: "",
    premiseCity: "",
    premiseState: "",
    premiseZipCode: "",
    premiseCountry: "",
    phoneNumber: "",
    emailAddress: "",
  });
  const ITEM_TYPES = [
    "Combination",
    "Frame",
    "Pistol",
    "Pistol Grip Firearm",
    "Receiver",
    "Revolver",
    "Rifle",
    "Shotgun",
    "Other",
  ] as const;

  const mutation = useMutation({
    mutationFn: createAcquisition,
    onSuccess: () => {
      setItems([]);
      setNewItem({
        manufacturer: "",
        countryOfManufacture: "",
        importer: "",
        model: "",
        serial: "",
        caliber: "",
        type: "",
      });
      resetForm();
    },
  });

  const resetForm = () => {
    setItems([]);
    setNewItem({
      manufacturer: "",
      countryOfManufacture: "",
      importer: "",
      model: "",
      serial: "",
      caliber: "",
      barrelLength: 0,
      overallLength: 0,
      condition: "",
      cost: 0,
      price: 0,
      mpn: "",
      upc: "",
      sku: "",
      location: "",
      notes: "",
      type: "",
    });
    setPoNumber("");
    setInvoiceNumber("");
    setTrackingNumber("");
    setNote("");
    setAcquireDate(new Date().toISOString().split("T")[0]);
    setType("Purchase");
    setContact({
      fflNumber: "",
      fflExpires: "",
      licenseName: "",
      premiseAddress1: "",
      premiseAddress2: "",
      premiseCity: "",
      premiseState: "",
      premiseZipCode: "",
      premiseCountry: "",
      phoneNumber: "",
      emailAddress: "",
    });
  };

  const handleAddItem = () => {
    if (!newItem.type) {
      console.error("Type is required");
      // Show an error message to the user
      return;
    }
    setItems([...items, newItem]);
    setNewItem({
      manufacturer: "",
      countryOfManufacture: "",
      importer: "",
      model: "",
      serial: "",
      caliber: "",
      type: "", // Reset this to empty string
    });
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      console.error("No items to submit");
      return;
    }

    // Validate contact information
    const isFFL =
      contact.fflNumber && contact.fflExpires && contact.licenseName;
    const isOrganization = contact.organizationName;
    const isIndividual = contact.firstName && contact.lastName;

    if (!isFFL && !isOrganization && !isIndividual) {
      console.error("Contact information is incomplete");
      // Show an error message to the user
      return;
    }

    if (
      !contact.premiseAddress1 ||
      !contact.premiseCity ||
      !contact.premiseState ||
      !contact.premiseZipCode ||
      !contact.premiseCountry
    ) {
      console.error("Address information is incomplete");
      // Show an error message to the user
      return;
    }

    // Remove empty fields from contact
    const cleanedContact = Object.fromEntries(
      Object.entries(contact).filter(([_, v]) => v != null && v !== "")
    );

    const acquisitionData: AcquisitionData = {
      items,
      type,
      contact: cleanedContact as Contact,
      date: acquireDate,
      poNumber,
      invoiceNumber,
      trackingNumber,
      note,
    };

    console.log(
      "Acquisition data being sent:",
      JSON.stringify(acquisitionData, null, 2)
    );

    mutation.mutate(acquisitionData);
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Acquisition</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acquireDate">Acquire Date *</Label>
              <Input
                type="date"
                id="acquireDate"
                value={acquireDate}
                onChange={(e) => setAcquireDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]} // This prevents selecting future dates
                required
              />
            </div>

            <div>
              <Label htmlFor="poNumber">PO Number</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4>Contact Information (Choose one option)</h4>

            <div>
              <h3 className="font-bold">Option 1: FFL Information</h3>
              <Label htmlFor="fflNumber">FFL Number *</Label>
              <Input
                id="fflNumber"
                value={contact.fflNumber || ""}
                onChange={(e) =>
                  setContact({ ...contact, fflNumber: e.target.value })
                }
              />
              <Label htmlFor="fflExpires">FFL Expiration Date *</Label>
              <Input
                type="date"
                id="fflExpires"
                value={contact.fflExpires || ""}
                onChange={(e) =>
                  setContact({ ...contact, fflExpires: e.target.value })
                }
              />
              <Label htmlFor="licenseName">License Name *</Label>
              <Input
                id="licenseName"
                value={contact.licenseName || ""}
                onChange={(e) =>
                  setContact({ ...contact, licenseName: e.target.value })
                }
              />
            </div>

            <div>
              <h3 className="mt-4 font-bold">
                Option 2: Organization Information
              </h3>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={contact.organizationName || ""}
                onChange={(e) =>
                  setContact({ ...contact, organizationName: e.target.value })
                }
              />
            </div>

            <div>
              <h3 className="mt-4 font-bold">
                Option 3: Individual Information
              </h3>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={contact.firstName || ""}
                onChange={(e) =>
                  setContact({ ...contact, firstName: e.target.value })
                }
              />
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={contact.lastName || ""}
                onChange={(e) =>
                  setContact({ ...contact, lastName: e.target.value })
                }
              />
            </div>

            {/* Common fields */}
            <h3 className="mt-4 font-bold">
              Enter the following information for the individual or organization
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="premiseAddress1">Address Line 1 *</Label>
                <Input
                  id="premiseAddress1"
                  value={contact.premiseAddress1}
                  onChange={(e) =>
                    setContact({ ...contact, premiseAddress1: e.target.value })
                  }
                  required
                />
                {/* Add other required fields similarly */}
              </div>
              <div>
                <Label htmlFor="premiseAddress2">Address Line 2</Label>
                <Input
                  id="premiseAddress2"
                  value={contact.premiseAddress2}
                  onChange={(e) =>
                    setContact({ ...contact, premiseAddress2: e.target.value })
                  }
                />
                {/* Add other required fields similarly */}
              </div>
              <div>
                <Label htmlFor="premiseCity">Premise City *</Label>
                <Input
                  id="premiseCity"
                  value={contact.premiseCity}
                  onChange={(e) =>
                    setContact({ ...contact, premiseCity: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="premiseState">Premise State *</Label>
                <Input
                  id="premiseState"
                  value={contact.premiseState}
                  onChange={(e) =>
                    setContact({ ...contact, premiseState: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="premiseZipCode">Premise Zip Code *</Label>
                <Input
                  id="premiseZipCode"
                  value={contact.premiseZipCode}
                  onChange={(e) =>
                    setContact({ ...contact, premiseZipCode: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="premiseCountry">Premise Country *</Label>
                <Input
                  id="premiseCountry"
                  value={contact.premiseCountry}
                  onChange={(e) =>
                    setContact({ ...contact, premiseCountry: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={contact.phoneNumber}
                  onChange={(e) =>
                    setContact({ ...contact, phoneNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  value={contact.emailAddress}
                  onChange={(e) =>
                    setContact({ ...contact, emailAddress: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="type">Acquire Type *</Label>
                <Select onValueChange={setType} defaultValue={type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select acquire type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Trade">Trade</SelectItem>
                    <SelectItem value="Consignment">Consignment</SelectItem>
                    <SelectItem value="Dealer Transfer">
                      Dealer Transfer
                    </SelectItem>
                    <SelectItem value="Gunsmithing">Gunsmithing</SelectItem>
                    <SelectItem value="Pawn">Pawn</SelectItem>
                    <SelectItem value="Private Party Transfer">
                      Private Party Transfer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Firearm Info */}
          <h3 className="mt-4 font-bold">
            Enter the following firearm information
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={newItem.manufacturer}
                onChange={(e) =>
                  setNewItem({ ...newItem, manufacturer: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="countryOfManufacture">
                Country of Manufacture
              </Label>
              <Input
                id="countryOfManufacture"
                value={newItem.countryOfManufacture || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    countryOfManufacture: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="importer">Importer</Label>
              <Input
                id="importer"
                value={newItem.importer || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    importer: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={newItem.model}
                onChange={(e) =>
                  setNewItem({ ...newItem, model: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="serial">Serial *</Label>
              <Input
                id="serial"
                value={newItem.serial}
                onChange={(e) =>
                  setNewItem({ ...newItem, serial: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="caliber">Caliber *</Label>
              <Input
                id="caliber"
                value={newItem.caliber}
                onChange={(e) =>
                  setNewItem({ ...newItem, caliber: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="barrelLength">Barrel Length</Label>
              <Input
                id="barrelLength"
                type="number"
                step="0.01"
                value={newItem.barrelLength || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    barrelLength: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g. 4.75"
              />
            </div>
            <div>
              <Label htmlFor="overallLength">Overall Length</Label>
              <Input
                id="overallLength"
                type="number"
                step="0.01"
                value={newItem.overallLength || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    overallLength: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g. 7.5"
              />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={newItem.condition || ""}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, condition: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={newItem.cost || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    cost: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newItem.price || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    price: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="mpn">MPN (Manufacturer Part Number)</Label>
              <Input
                id="mpn"
                value={newItem.mpn || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, mpn: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="upc">UPC</Label>
              <Input
                id="upc"
                value={newItem.upc || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, upc: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={newItem.sku || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, sku: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newItem.location || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, location: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="note">Notes</Label>
              <Input
                id="note"
                value={newItem.notes || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="type">Firearm Type *</Label>
              <Select
                value={newItem.type}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, type: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/*Buttons */}
        <div className="flex flex-row space-x-4 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (items.length > 0) {
                const newItems = [...items];
                newItems.pop();
                setItems(newItems);
              }
            }}
            className="mt-4"
          >
            Remove Firearm
          </Button>
          <Button onClick={handleAddItem} className="mt-4">
            Add Firearm
          </Button>
        </div>
        <div className="mt-4">
          <h3>Firearms to Acquire:</h3>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                {item.manufacturer} - {item.model} - {item.serial}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={handleSubmit}>Submit Acquisition</Button>
        {mutation.isSuccess && <p>Acquisition created successfully!</p>}
        {mutation.isError && (
          <p>Error creating acquisition: {mutation.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
