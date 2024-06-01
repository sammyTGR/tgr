// /src/app/TGR/deposits/page.tsx
"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const denominations = [
  { name: "Pennies", value: 0.01 },
  { name: "Nickels", value: 0.05 },
  { name: "Dimes", value: 0.10 },
  { name: "Quarters", value: 0.25 },
  { name: "$1's", value: 1 },
  { name: "$5's", value: 5 },
  { name: "$10's", value: 10 },
  { name: "$20's", value: 20 },
  { name: "$50's", value: 50 },
  { name: "$100's", value: 100 },
  { name: "Roll Of Pennies", value: 0.50 },
  { name: "Roll Of Nickels", value: 2 },
  { name: "Roll Of Dimes", value: 5 },
  { name: "Roll Of Quarters", value: 10 },
];

export default function Component() {
  const [quantities, setQuantities] = useState(Array(denominations.length).fill(0));

  const handleQuantityChange = (index: number, value: number) => {
    const newQuantities = [...quantities];
    newQuantities[index] = value;
    setQuantities(newQuantities);
  };

  const calculateTotal = (index: number) => {
    return (quantities[index] * denominations[index].value).toFixed(2);
  };

  const calculateOverallTotal = () => {
    return quantities
      .reduce((total, quantity, index) => total + quantity * denominations[index].value, 0)
      .toFixed(2);
  };

  const clearForm = () => {
    setQuantities(Array(denominations.length).fill(0));
  };

  return (
    <Card >
      <CardHeader>
        <CardTitle>Daily Deposits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="deposit-type">Select Your Deposit</Label>
            <Switch id="deposit-type" />
          </div>
          <div className="w-1/4">
            <Select>
              <SelectTrigger id="register" className="w-full">
                <SelectValue placeholder="Select Register" />
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
          <div className="w-1/4">
            <Select>
              <SelectTrigger id="cashier" className="w-full">
                <SelectValue placeholder="Select Cashier" />
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
          <div className="flex items-center">
            <Label htmlFor="am-count">Select If AM Count</Label>
            <Checkbox id="am-count" />
          </div>
        </div>
        <div className="border p-4">
          {denominations.map((denomination, index) => (
            <div className="grid grid-cols-4 gap-4 mb-4" key={index}>
              <div>{denomination.name}</div>
              <Input
                className="col-span-2"
                type="number"
                placeholder="0"
                value={quantities[index]}
                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
              />
              <div>${calculateTotal(index)}</div>
            </div>
          ))}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <Input className="col-span-1" placeholder="AIM Generated Amount" />
            <div className="col-span-2">Total To Deposit</div>
            <div className="col-span-1">Total In Drawer</div>
            <div className="col-span-1 text-right">${calculateOverallTotal()}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={clearForm}>Clear</Button>
          <Button>Submit</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
