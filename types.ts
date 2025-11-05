export interface User {
  id: string;
  username: string;
  password; // En una app real, esto sería un hash
  role: 'admin' | 'manager';
}

export interface Employee {
  id: string;
  name: string;
  dui: string;
  nit: string;
  isss: string;
  nup: string;
  telephone: string;
  position: string;
  jobDescription?: string;
  baseSalary: number;
  contractType: 'mensual' | 'diario' | 'por_hora';
  hireDate: string;
  terminationDate?: string;
  afpType: 'Confía' | 'Crecer';
}

export type OvertimeRateType = 'day' | 'night' | 'holiday_day' | 'holiday_night';

export interface PayrollNovelty {
  id: string;
  employeeId: string;
  employeeName: string; 
  date: string; // YYYY-MM-DD
  type: 'overtime' | 'expense' | 'unpaid_leave' | 'vacation_pay' | 'aguinaldo';
  description: string;
  amount?: number; 
  overtimeHours?: number; 
  overtimeRateType?: OvertimeRateType;
  unpaidLeaveDays?: number;
}

export interface DeductionDetails {
  isss: number;
  afp: number;
  renta: number;
}

export interface EmployerContributions {
  isss: number;
  afp: number;
  total: number;
}

export interface Payslip {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  overtimePay: number;
  vacationPay: number;
  aguinaldoPay: number;
  aguinaldoIsTaxable?: boolean;
  expenses: number; // Viáticos (non-taxable)
  otherDeductions: number; // Manual deductions
  grossPay: number; // Taxable income: baseSalary + overtimePay + vacationPay + (aguinaldo if taxable)
  deductions: DeductionDetails;
  employerContributions: EmployerContributions;
  totalDeductions: number;
  netPay: number;
}

export interface Payroll {
  id: string;
  period: string; // e.g., "July 2024"
  date: Date;
  payslips: Payslip[];
  totalCost: number;
}

export type View = 'dashboard' | 'employees' | 'payroll' | 'users' | 'novelties' | 'vacations' | 'aguinaldo';
