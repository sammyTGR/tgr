"use client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  SelectValue,
  SelectTrigger,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Component() {
  return (
    <div className="bg-white p-8">
      <h1 className="text-4xl font-bold mb-6">Daily Deposits</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <Switch id="deposit-type" />
          <Label htmlFor="deposit-type">Select Your Deposit</Label>
        </div>
        <div className="flex space-x-4">
          <Select>
            <SelectTrigger id="register">
              <SelectValue placeholder="Select Register" />
            </SelectTrigger>
            <SelectContent />
          </Select>
          <Select>
            <SelectTrigger id="cashier">
              <SelectValue placeholder="Select Cashier" />
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
        <div className="flex items-center">
          <Checkbox id="am-count" />
          <Label htmlFor="am-count">Select If AM Count</Label>
        </div>
      </div>
      <div className="border p-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Pennies</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Nickels</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Dimes</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Quarters</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>$1's</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>$5's</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>$10's</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>$20's</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>$50's</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>$100's</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Roll Of Pennies</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Roll Of Nickels</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Roll Of Dimes</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>Roll Of Quarters</div>
          <Input className="col-span-2" placeholder="0" />
          <div>$0.00</div>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-4">
          <Input className="col-span-1" placeholder="AIM Generated Amount" />
          <div className="col-span-2">Total To Deposit</div>
          <div className="col-span-1">Total In Drawer</div>
          <div className="col-span-1 text-right">$0.00</div>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button variant="outline">Clear</Button>
        <Button>Submit</Button>
      </div>
    </div>
  );
}
