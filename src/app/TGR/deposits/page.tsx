'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { User } from '@supabase/supabase-js';
import { useSidebar } from '@/components/ui/sidebar';

const denominations = [
  { name: 'Pennies', value: 0.01 },
  { name: 'Nickels', value: 0.05 },
  { name: 'Dimes', value: 0.1 },
  { name: 'Quarters', value: 0.25 },
  { name: "$1's", value: 1 },
  { name: "$5's", value: 5 },
  { name: "$10's", value: 10 },
  { name: "$20's", value: 20 },
  { name: "$50's", value: 50 },
  { name: "$100's", value: 100 },
  { name: 'Roll Of Pennies', value: 0.5 },
  { name: 'Roll Of Nickels', value: 2 },
  { name: 'Roll Of Dimes', value: 5 },
  { name: 'Roll Of Quarters', value: 10 },
];

const registers = ['Register 1', 'Register 2', 'Register 3', 'Register 4', 'Register 5'];

export default function DailyDepositsPage() {
  const { state } = useSidebar();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['wheelEventHandlers'] });

  // Add user query
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const [quantities, setQuantities] = useState<number[][]>(
    Array(registers.length)
      .fill(0)
      .map(() => Array(denominations.length).fill(0))
  );
  const [isSecondCount, setIsSecondCount] = useState(false);
  const [aimGeneratedTotals, setAimGeneratedTotals] = useState<string[]>(
    Array(registers.length).fill('')
  );
  const [discrepancyMessages, setDiscrepancyMessages] = useState<string[]>(
    Array(registers.length).fill('')
  );
  const [explainDiscrepancies, setExplainDiscrepancies] = useState<string[]>(
    Array(registers.length).fill('')
  );
  const [activeTab, setActiveTab] = useState('reg1');

  useEffect(() => {
    if (!isFetching) {
      // Add wheel event listeners
      inputRefs.current.flat().forEach((input) => {
        if (input) {
          input.addEventListener('wheel', handleWheel, { passive: false });
        }
      });

      // Cleanup function
      return () => {
        inputRefs.current.flat().forEach((input) => {
          if (input) {
            input.removeEventListener('wheel', handleWheel);
          }
        });
      };
    }
  }, [isFetching]);

  const handleQuantityChange = (
    registerIndex: number,
    denominationIndex: number,
    value: number
  ) => {
    const newQuantities = [...quantities];
    newQuantities[registerIndex][denominationIndex] = isNaN(value) ? 0 : value;
    setQuantities(newQuantities);
  };

  const handleAimGeneratedTotalChange = (registerIndex: number, value: string) => {
    const newAimGeneratedTotals = [...aimGeneratedTotals];
    newAimGeneratedTotals[registerIndex] = value;
    setAimGeneratedTotals(newAimGeneratedTotals);
    updateDiscrepancyMessage(registerIndex, parseFloat(value));
  };

  const handleExplainDiscrepanciesChange = (registerIndex: number, value: string) => {
    const newExplainDiscrepancies = [...explainDiscrepancies];
    newExplainDiscrepancies[registerIndex] = value;
    setExplainDiscrepancies(newExplainDiscrepancies);
  };

  const calculateTotal = (registerIndex: number, denominationIndex: number) => {
    return (
      quantities[registerIndex][denominationIndex] * denominations[denominationIndex].value
    ).toFixed(2);
  };

  const calculateOverallTotal = (registerIndex: number) => {
    return quantities[registerIndex]
      .reduce((total, quantity, index) => total + quantity * denominations[index].value, 0)
      .toFixed(2);
  };

  const calculateTotalToDeposit = (registerIndex: number) => {
    const overallTotal = parseFloat(calculateOverallTotal(registerIndex));
    return overallTotal >= 300 ? (overallTotal - 300).toFixed(2) : '';
  };

  const calculateRemainingBalance = (registerIndex: number) => {
    const overallTotal = parseFloat(calculateOverallTotal(registerIndex));
    const totalToDeposit = parseFloat(calculateTotalToDeposit(registerIndex));
    return overallTotal >= 300 ? (overallTotal - totalToDeposit).toFixed(2) : '';
  };

  const clearForm = (registerIndex: number) => {
    const newQuantities = [...quantities];
    newQuantities[registerIndex] = Array(denominations.length).fill(0);
    setQuantities(newQuantities);

    const newAimGeneratedTotals = [...aimGeneratedTotals];
    newAimGeneratedTotals[registerIndex] = '';
    setAimGeneratedTotals(newAimGeneratedTotals);

    const newDiscrepancyMessages = [...discrepancyMessages];
    newDiscrepancyMessages[registerIndex] = '';
    setDiscrepancyMessages(newDiscrepancyMessages);

    const newExplainDiscrepancies = [...explainDiscrepancies];
    newExplainDiscrepancies[registerIndex] = '';
    setExplainDiscrepancies(newExplainDiscrepancies);
  };

  const resetFormAndTabs = () => {
    setQuantities(
      Array(registers.length)
        .fill(0)
        .map(() => Array(denominations.length).fill(0))
    );
    setAimGeneratedTotals(Array(registers.length).fill(''));
    setDiscrepancyMessages(Array(registers.length).fill(''));
    setExplainDiscrepancies(Array(registers.length).fill(''));
    setIsSecondCount(false);
    setActiveTab('reg1');
  };

  const handleSwitchChange = () => {
    setIsSecondCount(!isSecondCount);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    registerIndex: number,
    denominationIndex: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = inputRefs.current[registerIndex][denominationIndex + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
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

  const updateDiscrepancyMessage = (registerIndex: number, aimGenerated: number) => {
    const totalToDeposit = parseFloat(calculateTotalToDeposit(registerIndex));
    let message = '';

    if (!isNaN(totalToDeposit)) {
      if (aimGenerated === totalToDeposit) {
        message = 'No Discrepancies';
      } else if (aimGenerated > totalToDeposit) {
        message = `Register Is Short By $${(aimGenerated - totalToDeposit).toFixed(2)}`;
      } else if (aimGenerated < totalToDeposit) {
        message = `Register Is Over By $${(totalToDeposit - aimGenerated).toFixed(2)}`;
      }
    }

    const newDiscrepancyMessages = [...discrepancyMessages];
    newDiscrepancyMessages[registerIndex] = message;
    setDiscrepancyMessages(newDiscrepancyMessages);
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error('Error retrieving user data: User not found');
      return;
    }

    const employee_name = user.user_metadata?.full_name || 'Unknown';
    const user_uuid = user.id || '';

    for (let i = 0; i < registers.length; i++) {
      const remainingBalance = parseFloat(calculateRemainingBalance(i));
      if (remainingBalance !== 300) {
        toast.error(`Count Register ${i + 1} Again`);
        return;
      }
    }

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

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Unauthorized');
        console.error('Unauthorized: ', sessionError?.message || 'No active session');
        return;
      }

      const response = await fetch('/api/submitDailyDeposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(deposits),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error submitting deposit data:', errorData);
        toast.error('There was an error submitting the deposit data.');
        return;
      }

      const currentDate = new Date().toLocaleDateString();
      toast.success(`Successfully submitted deposit data for ${currentDate}!`);
      resetFormAndTabs();
    } catch (error) {
      console.error('Unexpected error submitting deposit data:', error);
      toast.error('Unexpected error occurred while submitting the deposit data.');
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={['user', 'auditor', 'admin', 'super admin', 'dev', 'ceo']}>
      <main
        className={`relative w-full ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-60rem)] h-full overflow-hidden flex-1 transition-all duration-300`}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
              {registers.map((register, index) => (
                <TabsTrigger
                  key={index}
                  value={`reg${index + 1}`}
                  className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
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
                Count Only
              </Label>
            </div>
          </div>

          {registers.map((register, registerIndex) => (
            <TabsContent key={registerIndex} value={`reg${registerIndex + 1}`}>
              <Card>
                <CardHeader>
                  <CardTitle>{register}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {denominations.map((denomination, denominationIndex) => (
                      <div className="flex grid grid-cols-3 mb-1" key={denominationIndex}>
                        <div>{denomination.name}</div>
                        <Input
                          id={`input-${registerIndex}-${denominationIndex}`}
                          className="col-span-1 text-center"
                          type="number"
                          inputMode="numeric"
                          ref={(el) => {
                            if (!inputRefs.current[registerIndex]) {
                              inputRefs.current[registerIndex] = [];
                            }
                            inputRefs.current[registerIndex][denominationIndex] = el;
                          }}
                          value={
                            quantities[registerIndex][denominationIndex] === 0
                              ? ''
                              : quantities[registerIndex][denominationIndex].toString()
                          }
                          onChange={(e) =>
                            handleQuantityChange(
                              registerIndex,
                              denominationIndex,
                              parseInt(e.target.value)
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, registerIndex, denominationIndex)}
                        />
                        <div className="text-right">
                          ${calculateTotal(registerIndex, denominationIndex)}
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 mb-2">
                      <div className="col-span-1 text-left">Total In Drawer</div>
                      <div className="col-span-2 text-right">
                        ${calculateOverallTotal(registerIndex)}
                      </div>
                    </div>
                    {!isSecondCount && (
                      <>
                        <div className="grid grid-cols-3 mb-2">
                          <div className="col-span-2 text-left text-lg font-bold">
                            Total To Deposit
                          </div>
                          <div className="col-span-1 text-right text-lg font-bold">
                            ${calculateTotalToDeposit(registerIndex)}
                          </div>
                        </div>
                        <div className="grid grid-cols-6 mb-2">
                          <Input
                            className="col-span-2"
                            placeholder="AIM Cash Clearing Total"
                            value={aimGeneratedTotals[registerIndex]}
                            onChange={(e) =>
                              handleAimGeneratedTotalChange(registerIndex, e.target.value)
                            }
                          />
                          <div className="col-span-2 text-center">
                            {discrepancyMessages[registerIndex]}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 mb-2">
                          <div className="col-span-2 text-left">
                            Remaining Balance In Register After $
                            {calculateTotalToDeposit(registerIndex)} Is Deposited
                          </div>
                          <div className="col-span-1 text-right">
                            ${calculateRemainingBalance(registerIndex)}
                          </div>
                        </div>
                        <Textarea
                          className="col-span-2"
                          placeholder="Explain Discrepancies"
                          value={explainDiscrepancies[registerIndex]}
                          onChange={(e) =>
                            handleExplainDiscrepanciesChange(registerIndex, e.target.value)
                          }
                        />
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
                      Clear Current Register
                    </Button>
                    {!isSecondCount && (
                      <Button
                        variant="gooeyRight"
                        className="flex justify-between ml-auto mt-4"
                        onClick={handleSubmit}
                      >
                        Submit Final
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}
