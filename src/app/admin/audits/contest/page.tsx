'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { CustomCalendar } from '@/components/ui/calendar';
import { DataTable } from './data-table';
import { RenderDropdown } from './dropdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  WeightedScoringCalculator,
  SalesData,
  AuditData,
  PointsCalculation,
} from './WeightedScoringCalculator';

interface Employee {
  lanid: string;
}

interface SummaryData {
  Lanid: string;
  TotalDros: number;
  MinorMistakes: number;
  MajorMistakes: number;
  CancelledDros: number;
  WeightedErrorRate: number;
  Qualified: boolean;
  DisqualificationReason: string;
  isDivider?: boolean;
}

const ContestPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLanid, setSelectedLanid] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<PointsCalculation[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('lanid');
      if (error) {
        console.error(error);
      } else {
        setEmployees(data);
      }
    };

    const fetchPointsCalculation = async () => {
      const { data, error } = await supabase.from('points_calculation').select('*');
      if (error) {
        console.error(error);
      } else {
        setPointsCalculation(data);
      }
    };

    fetchEmployees();
    fetchPointsCalculation();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedMonth) {
        const startDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        ).toISOString();
        const endDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        if (showAllEmployees) {
          const { data: allAuditData, error: allAuditError } = await supabase
            .from('Auditsinput')
            .select('*')
            .gte('audit_date', startDate.split('T')[0])
            .lte('audit_date', endDate.split('T')[0]);

          if (allAuditError) {
            console.error(allAuditError);
          } else {
            const lanids = Array.from(new Set(allAuditData.map((audit) => audit.salesreps)));
            const { data: allSalesData, error: allSalesError } = await supabase
              .from('detailed_sales_data')
              .select('*')
              .in('Lanid', lanids)
              .gte('SoldDate', startDate)
              .lte('SoldDate', endDate)
              .eq('Desc', 'Dros Fee');

            if (allSalesError) {
              console.error(allSalesError);
            } else {
              setSalesData(allSalesData);
              setAuditData(allAuditData);
              calculateSummary(allSalesData, allAuditData, selectedMonth, lanids);
            }
          }
        } else if (selectedLanid) {
          const { data: salesData, error: salesError } = await supabase
            .from('detailed_sales_data')
            .select('*')
            .eq('Lanid', selectedLanid)
            .gte('SoldDate', startDate)
            .lte('SoldDate', endDate)
            .eq('Desc', 'Dros Fee');

          const { data: auditData, error: auditError } = await supabase
            .from('Auditsinput')
            .select('*')
            .eq('salesreps', selectedLanid)
            .gte('audit_date', startDate.split('T')[0])
            .lte('audit_date', endDate.split('T')[0]);

          if (salesError || auditError) {
            console.error(salesError || auditError);
          } else {
            setSalesData(salesData);
            setAuditData(auditData);
            calculateSummary(salesData, auditData, selectedMonth, [selectedLanid]);
          }
        }
      }
    };

    fetchData();

    const salesSubscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'detailed_sales_data' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const auditsSubscription = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Auditsinput' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(salesSubscription);
      supabase.removeChannel(auditsSubscription);
    };
  }, [selectedLanid, selectedMonth, pointsCalculation, showAllEmployees]);

  const calculateSummary = (
    salesData: SalesData[],
    auditData: AuditData[],
    selectedMonth: Date,
    lanids: string[]
  ) => {
    let summary = lanids.map((lanid) => {
      const employeeSalesData = salesData.filter((sale) => sale.Lanid === lanid);

      // Add detailed logging
      // console.log(`Processing ${lanid}:`, {
      //   totalSalesData: salesData.length,
      //   employeeSalesData: employeeSalesData.length,
      //   sampleSale: employeeSalesData[0],
      // });

      const employeeAuditData = auditData.filter((audit) => audit.salesreps === lanid);

      const calculator = new WeightedScoringCalculator({
        salesData: employeeSalesData,
        auditData: employeeAuditData,
        pointsCalculation,
        isOperations: false,
        minimumDros: 20,
      });

      return calculator.metrics;
    });

    // Sort summary data by Weighted Error Rate in ascending order (lower is better)
    summary.sort((a, b) => a.WeightedErrorRate - b.WeightedErrorRate);
    setSummaryData(summary);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto p-4 my-8">
      <div className="flex space-x-4 mb-4">
        <div className="w-full">
          <RenderDropdown
            field={{ onChange: setSelectedLanid }}
            options={employees.map((emp) => ({
              value: emp.lanid,
              label: emp.lanid,
            }))}
            placeholder="Select Employee"
          />
        </div>
        <CustomCalendar
          selectedDate={selectedMonth}
          onDateChange={(date: Date | undefined) => setSelectedMonth(date)}
          disabledDays={() => false}
        />
      </div>
      <div className="mb-4">
        <Button onClick={() => setShowAllEmployees((prev) => !prev)}>
          {showAllEmployees ? 'Show Selected Employee' : 'Show All Employees'}
        </Button>
      </div>
      <div className="text-left">
        <DataTable<SummaryData>
          columns={[
            {
              Header: 'Sales Rep',
              accessor: 'Lanid',
              Cell: ({ value, row }) => (
                <div className={!row.original.Qualified ? 'text-gray-400 italic' : ''}>{value}</div>
              ),
            },
            {
              Header: 'Total DROS',
              accessor: 'TotalDros',
              Cell: ({ value, row }) => (
                <div className={!row.original.Qualified ? 'text-gray-400 italic' : ''}>{value}</div>
              ),
            },
            {
              Header: 'Minor Mistakes',
              accessor: 'MinorMistakes',
              Cell: ({ value, row }) => (
                <div className={!row.original.Qualified ? 'text-gray-400 italic' : ''}>{value}</div>
              ),
            },
            {
              Header: 'Major Mistakes',
              accessor: 'MajorMistakes',
              Cell: ({ value, row }) => (
                <div className={!row.original.Qualified ? 'text-gray-400 italic' : ''}>{value}</div>
              ),
            },
            {
              Header: 'Cancelled DROS',
              accessor: 'CancelledDros',
              Cell: ({ value, row }) => (
                <div className={!row.original.Qualified ? 'text-gray-400 italic' : ''}>{value}</div>
              ),
            },
            {
              Header: 'Error Rate',
              accessor: 'WeightedErrorRate',
              Cell: ({ value, row }) => (
                <div className={!row.original.Qualified ? 'text-gray-400 italic' : ''}>
                  {row.original.isDivider ? '' : `${value}%`}
                </div>
              ),
            },
            {
              Header: 'Status',
              accessor: 'DisqualificationReason',
              Cell: ({ row }) => (
                <div className={row.original.Qualified ? 'text-green-500' : 'text-red-500'}>
                  {row.original.DisqualificationReason}
                </div>
              ),
            },
          ]}
          data={summaryData}
        />
      </div>
    </Card>
  );
};

export default ContestPage;
