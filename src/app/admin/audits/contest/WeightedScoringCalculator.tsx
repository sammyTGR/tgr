// src/app/admin/audits/contest/WeightedScoringCalculator.tsx
import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface SalesData {
  id: number;
  Lanid: string;

  SoldDate: string;
  dros_cancel: string | null;
  Desc: string;
  [key: string]: any;
}

export interface AuditData {
  id: string;
  salesreps: string;
  error_location: string;
  audit_date: string;
  dros_cancel: string | null;
  [key: string]: any;
}

export interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

interface CalculatorProps {
  salesData: SalesData[];
  auditData: AuditData[];
  pointsCalculation: PointsCalculation[];
  isOperations?: boolean;
  minimumDros?: number;
}

export class WeightedScoringCalculator {
  private salesData: SalesData[];
  private auditData: AuditData[];
  private pointsCalculation: PointsCalculation[];
  private isOperations: boolean;
  private minimumDros: number;
  private supabase = createClientComponentClient();

  constructor({
    salesData,
    auditData,
    pointsCalculation,
    isOperations = false,
    minimumDros = 20,
  }: CalculatorProps) {
    // console.log("Raw sales data length:", salesData.length);
    // console.log("Sample raw sale:", JSON.stringify(salesData[0], null, 2));

    // Filter sales data to specifically count DROS transactions
    this.salesData = salesData.filter((sale) => {
      // Debug logging for first few records
      if (salesData.indexOf(sale) < 3) {
        // console.log("Detailed sale:", {
        //   id: sale.id,
        //   Lanid: sale.Lanid,
        //   Desc: sale.Desc,
        //   SoldDate: sale.SoldDate,
        // });
      }

      // Check if sale has required properties and is a DROS Fee
      return sale.Lanid && sale.SoldDate && sale.Desc === 'Dros Fee';
    });

    // console.log("Filtered sales data length:", this.salesData.length);
    if (this.salesData.length > 0) {
      // console.log("Sample filtered sale:", {
      //   id: this.salesData[0].id,
      //   Lanid: this.salesData[0].Lanid,
      //   Desc: this.salesData[0].Desc,
      // });
    }

    this.auditData = auditData;
    this.pointsCalculation = pointsCalculation;
    this.isOperations = isOperations;
    this.minimumDros = minimumDros;
  }

  private async filterSalesDataByDepartment(salesData: SalesData[]) {
    // Get eligible employees (Operations or Sales departments)
    const { data: eligibleEmployees } = await this.supabase
      .from('employees')
      .select('lanid, department')
      .eq('status', 'active');

    if (!eligibleEmployees) return [];

    // Debug log for employees data
    console.log('WeightedScoringCalculator - Employees Data:', eligibleEmployees?.map(emp => ({
      lanid: emp.lanid,
      department: emp.department
    })));

    const eligibleLanids = eligibleEmployees.map((emp) => emp.lanid);

    // Filter sales to only include those from eligible employees
    return salesData.filter((sale) => eligibleLanids.includes(sale.Lanid));
  }

  private calculateWeightedScore() {
    // Initialize counters for different types of mistakes
    let minorMistakes = 0; // weight: 1
    let majorMistakes = 0; // weight: 2
    let cancelledDros = 0; // weight: 3

    // Count total DROS from valid sales data
    let totalDros = this.salesData.length;

    // Count cancelled DROS from sales data
    this.salesData.forEach((sale) => {
      if (sale.dros_cancel === 'Yes') {
        cancelledDros++;
      }
    });

    // Process audit data
    this.auditData.forEach((audit) => {
      // Find the corresponding points calculation entry
      const pointsEntry = this.pointsCalculation.find(
        (point) => point.error_location === audit.error_location
      );

      if (pointsEntry) {
        // Categorize based on points_deducted in the original system
        if (pointsEntry.points_deducted === 2) {
          minorMistakes++;
        } else if (pointsEntry.points_deducted >= 1 && pointsEntry.points_deducted <= 5) {
          majorMistakes++;
        }
      }

      // Additional check for cancelled DROS in audit data
      if (audit.dros_cancel === 'Yes') {
        cancelledDros++;
      }
    });

    // Calculate weighted score
    const totalWeightedMistakes =
      minorMistakes * 1 + // Minor mistakes weight: 1
      majorMistakes * 2 + // Major mistakes weight: 2
      cancelledDros * 3; // Cancelled DROS weight: 3

    // Calculate error rate as weighted mistakes per DROS
    const weightedErrorRate = totalDros > 0 ? (totalWeightedMistakes / totalDros) * 100 : 0;

    const isQualified = !this.isOperations && totalDros >= this.minimumDros;

    return {
      minorMistakes,
      majorMistakes,
      cancelledDros,
      totalDros,
      weightedErrorRate: parseFloat(weightedErrorRate.toFixed(2)),
      totalWeightedMistakes,
      isQualified,
    };
  }

  get metrics() {
    const scores = this.calculateWeightedScore();
    const lanid = this.salesData[0]?.Lanid || '';

    // Add debug logging
    console.log('WeightedScoringCalculator Metrics:', {
      lanid,
      isOperations: this.isOperations,
      totalDros: scores.totalDros,
      isQualified: scores.isQualified,
      disqualificationReason: !scores.isQualified
        ? this.isOperations
          ? 'Not Qualified (Ops Department)'
          : scores.totalDros < this.minimumDros
            ? `Not Qualified (< ${this.minimumDros} DROS)`
            : 'Not Qualified'
        : 'Qualified'
    });

    return {
      Lanid: lanid,
      TotalDros: scores.totalDros,
      MinorMistakes: scores.minorMistakes,
      MajorMistakes: scores.majorMistakes,
      CancelledDros: scores.cancelledDros,
      WeightedErrorRate: scores.weightedErrorRate,
      TotalWeightedMistakes: scores.totalWeightedMistakes,
      Qualified: scores.isQualified,
      DisqualificationReason: !scores.isQualified
        ? this.isOperations
          ? 'Not Qualified (Ops Department)'
          : scores.totalDros < this.minimumDros
            ? `Not Qualified (< ${this.minimumDros} DROS)`
            : 'Not Qualified'
        : 'Qualified',
    };
  }
}

export default WeightedScoringCalculator;
