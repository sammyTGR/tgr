"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext"; // Adjust the import path as needed
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner"; // Import toast from Sonner
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const denominations = [
  { name: "Pennies", value: 0.01 },
  { name: "Nickels", value: 0.05 },
  { name: "Dimes", value: 0.1 },
  { name: "Quarters", value: 0.25 },
  { name: "$1's", value: 1 },
  { name: "$5's", value: 5 },
  { name: "$10's", value: 10 },
  { name: "$20's", value: 20 },
  { name: "$50's", value: 50 },
  { name: "$100's", value: 100 },
  { name: "Roll Of Pennies", value: 0.5 },
  { name: "Roll Of Nickels", value: 2 },
  { name: "Roll Of Dimes", value: 5 },
  { name: "Roll Of Quarters", value: 10 },
];

const registers = [
  "Register 1",
  "Register 2",
  "Register 3",
  "Register 4",
  "Register 5",
];

export default function Component() {
  const { role, loading, user } = useRole();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const [quantities, setQuantities] = useState<number[][]>(
    Array(registers.length)
      .fill(0)
      .map(() => Array(denominations.length).fill(0))
  );
  const [isSecondCount, setIsSecondCount] = useState(false);
  const [aimGeneratedTotals, setAimGeneratedTotals] = useState<string[]>(
    Array(registers.length).fill("")
  );
  const [discrepancyMessages, setDiscrepancyMessages] = useState<string[]>(
    Array(registers.length).fill("")
  );
  const [explainDiscrepancies, setExplainDiscrepancies] = useState<string[]>(
    Array(registers.length).fill("")
  );
  const [activeTab, setActiveTab] = useState("reg1");

  useEffect(() => {
    if (
      !loading &&
      role !== "user" &&
      role !== "admin" &&
      role !== "super admin"
    ) {
      router.push("/unauthorized"); // Redirect to an unauthorized page or login page
    }
  }, [role, loading, router]);

  useEffect(() => {
    // Add wheel event listeners to all inputs
    inputRefs.current.flat().forEach((input) => {
      if (input) {
        input.addEventListener("wheel", handleWheel, { passive: false });
      }
    });

    // Clean up event listeners on unmount
    return () => {
      inputRefs.current.flat().forEach((input) => {
        if (input) {
          input.removeEventListener("wheel", handleWheel);
        }
      });
    };
  }, []);

  const handleQuantityChange = (
    registerIndex: number,
    denominationIndex: number,
    value: number
  ) => {
    const newQuantities = [...quantities];
    newQuantities[registerIndex][denominationIndex] = isNaN(value) ? 0 : value;
    setQuantities(newQuantities);
  };

  const handleAimGeneratedTotalChange = (
    registerIndex: number,
    value: string
  ) => {
    const newAimGeneratedTotals = [...aimGeneratedTotals];
    newAimGeneratedTotals[registerIndex] = value;
    setAimGeneratedTotals(newAimGeneratedTotals);
    updateDiscrepancyMessage(registerIndex, parseFloat(value));
  };

  const handleExplainDiscrepanciesChange = (
    registerIndex: number,
    value: string
  ) => {
    const newExplainDiscrepancies = [...explainDiscrepancies];
    newExplainDiscrepancies[registerIndex] = value;
    setExplainDiscrepancies(newExplainDiscrepancies);
  };

  const calculateTotal = (registerIndex: number, denominationIndex: number) => {
    return (
      quantities[registerIndex][denominationIndex] *
      denominations[denominationIndex].value
    ).toFixed(2);
  };

  const calculateOverallTotal = (registerIndex: number) => {
    return quantities[registerIndex]
      .reduce(
        (total, quantity, index) =>
          total + quantity * denominations[index].value,
        0
      )
      .toFixed(2);
  };

  const calculateTotalToDeposit = (registerIndex: number) => {
    const overallTotal = parseFloat(calculateOverallTotal(registerIndex));
    return overallTotal >= 300 ? (overallTotal - 300).toFixed(2) : "";
  };

  const clearForm = (registerIndex: number) => {
    const newQuantities = [...quantities];
    newQuantities[registerIndex] = Array(denominations.length).fill(0);
    setQuantities(newQuantities);

    const newAimGeneratedTotals = [...aimGeneratedTotals];
    newAimGeneratedTotals[registerIndex] = "";
    setAimGeneratedTotals(newAimGeneratedTotals);

    const newDiscrepancyMessages = [...discrepancyMessages];
    newDiscrepancyMessages[registerIndex] = "";
    setDiscrepancyMessages(newDiscrepancyMessages);

    const newExplainDiscrepancies = [...explainDiscrepancies];
    newExplainDiscrepancies[registerIndex] = "";
    setExplainDiscrepancies(newExplainDiscrepancies);
  };

  const resetFormAndTabs = () => {
    setQuantities(
      Array(registers.length)
        .fill(0)
        .map(() => Array(denominations.length).fill(0))
    );
    setAimGeneratedTotals(Array(registers.length).fill(""));
    setDiscrepancyMessages(Array(registers.length).fill(""));
    setExplainDiscrepancies(Array(registers.length).fill(""));
    setIsSecondCount(false);
    setActiveTab("reg1");
  };

  const handleSwitchChange = () => {
    setIsSecondCount(!isSecondCount);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    registerIndex: number,
    denominationIndex: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[registerIndex][denominationIndex + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        // If it's the last input in the list, focus the first input in the next register tab
        const nextTabFirstInput = inputRefs.current[registerIndex + 1]?.[0];
        if (nextTabFirstInput) {
          nextTabFirstInput.focus();
        }
      }
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
  };

  const updateDiscrepancyMessage = (
    registerIndex: number,
    aimGenerated: number
  ) => {
    const totalToDeposit = parseFloat(calculateTotalToDeposit(registerIndex));
    let message = "";

    if (!isNaN(totalToDeposit)) {
      if (aimGenerated === totalToDeposit) {
        message = "No Discrepancies";
      } else if (aimGenerated > totalToDeposit) {
        message = `Register Is Over By $${(
          aimGenerated - totalToDeposit
        ).toFixed(2)}`;
      } else if (aimGenerated < totalToDeposit) {
        message = `Register Is Short By $${(
          totalToDeposit - aimGenerated
        ).toFixed(2)}`;
      }
    }

    const newDiscrepancyMessages = [...discrepancyMessages];
    newDiscrepancyMessages[registerIndex] = message;
    setDiscrepancyMessages(newDiscrepancyMessages);
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error("Error retrieving user data: User not found");
      return;
    }

    const employee_name = user.user_metadata?.full_name || "Unknown";
    const user_uuid = user.id || "";

    const deposits = registers.map((register, index) => ({
      register,
      employee_name,
      pennies: quantities[index][0],
      nickels: quantities[index][1],
      dimes: quantities[index][2],
      quarters: quantities[index][3],
      ones: quantities[index][4],
      fives: quantities[index][5],
      tens: quantities[index][6],
      twenties: quantities[index][7],
      fifties: quantities[index][8],
      hundreds: quantities[index][9],
      roll_of_pennies: quantities[index][10],
      roll_of_nickels: quantities[index][11],
      roll_of_dimes: quantities[index][12],
      roll_of_quarters: quantities[index][13],
      total_in_drawer: parseFloat(calculateOverallTotal(index)),
      total_to_deposit: parseFloat(calculateTotalToDeposit(index)),
      aim_generated_total: parseFloat(aimGeneratedTotals[index]),
      discrepancy_message: discrepancyMessages[index],
      explain_discrepancies: explainDiscrepancies[index],
      user_uuid,
    }));

    const { data, error: insertError } = await supabase
      .from("daily_deposits")
      .insert(deposits);

    if (insertError) {
      console.error("Error submitting deposit data:", insertError);
      // Handle error (e.g., show an error message)
    } else {
      const currentDate = new Date().toLocaleDateString();
      console.log("Successfully submitted deposit data:", data);
      toast.success(`Successfully submitted deposit data for ${currentDate}!`);
      resetFormAndTabs();
    }
  };

  if (
    loading ||
    (role !== "user" && role !== "admin" && role !== "super admin")
  ) {
    return <div>Loading...</div>;
  }

  return (
    <main className="grid flex-1 items-start mx-auto my-4 mb-4 max-w-6xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center space-x-2">
          <TabsList>
            {registers.map((register, index) => (
              <TabsTrigger key={index} value={`reg${index + 1}`}>
                {`Reg ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center">
            <Switch
              id="deposit-type"
              checked={isSecondCount}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="deposit-type" className="ml-2">
              Select For 2nd Count
            </Label>
          </div>
        </div>

        {registers.map((register, registerIndex) => (
          <TabsContent key={registerIndex} value={`reg${registerIndex + 1}`}>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{register}</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                <div className="border p-4">
                  {denominations.map((denomination, denominationIndex) => (
                    <div
                      className="grid grid-cols-4 gap-4 mb-4"
                      key={denominationIndex}
                    >
                      <div>{denomination.name}</div>
                      <Input
                        id={`input-${registerIndex}-${denominationIndex}`}
                        className="col-span-2"
                        type="number"
                        inputMode="numeric"
                        ref={(el) => {
                          if (!inputRefs.current[registerIndex]) {
                            inputRefs.current[registerIndex] = [];
                          }
                          inputRefs.current[registerIndex][denominationIndex] =
                            el;
                        }}
                        value={
                          quantities[registerIndex][denominationIndex] === 0
                            ? ""
                            : quantities[registerIndex][
                                denominationIndex
                              ].toString()
                        }
                        onChange={(e) =>
                          handleQuantityChange(
                            registerIndex,
                            denominationIndex,
                            parseInt(e.target.value)
                          )
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, registerIndex, denominationIndex)
                        }
                      />
                      <div className="text-right">
                        ${calculateTotal(registerIndex, denominationIndex)}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="col-span-3 text-left">Total In Drawer</div>
                    <div className="text-right">
                      ${calculateOverallTotal(registerIndex)}
                    </div>
                  </div>
                  {!isSecondCount && (
                    <>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="col-span-3 text-left">
                          Total To Deposit
                        </div>
                        <div className="text-right">
                          {calculateTotalToDeposit(registerIndex)}
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4 mb-4">
                        <Input
                          className="col-span-2"
                          placeholder="AIM Generated Total"
                          value={aimGeneratedTotals[registerIndex]}
                          onChange={(e) =>
                            handleAimGeneratedTotalChange(
                              registerIndex,
                              e.target.value
                            )
                          }
                        />
                        <div className="col-span-2 text-center">
                          {discrepancyMessages[registerIndex]}
                        </div>
                        <Input
                          className="col-span-2"
                          placeholder="Explain Discrepancies"
                          value={explainDiscrepancies[registerIndex]}
                          onChange={(e) =>
                            handleExplainDiscrepanciesChange(
                              registerIndex,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between items-center w-full">
                  <Button
                    variant="outline"
                    onClick={() => clearForm(registerIndex)}
                    className="mr-4"
                  >
                    Clear
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
        {!isSecondCount && (
          <Button
            className="flex justify-between ml-auto mt-4"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        )}
      </Tabs>
    </main>
  );
}
