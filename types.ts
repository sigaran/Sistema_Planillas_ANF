export interface Employee {
  id: string;
  name: string;
  dui: string;
  nit: string;
  isss: string;
  nup: string;
  position: string;
  jobDescription?: string;
  baseSalary: number;
  contractType: 'mensual' | 'diario' | 'por_hora';
  hireDate: string;
  terminationDate?: string;
  afpType: 'Confía' | 'Crecer';
}

export interface Payslip {
  employeeId: string;
  employeeName: string;
  grossPay: number; // For the period (monthly)
  deductions: number;
  netPay: number;
}

export interface Payroll {
  id: string;
  period: string; // e.g., "July 2024"
  date: Date;
  payslips: Payslip[];
  totalCost: number;
}

export type View = 'dashboard' | 'employees' | 'payroll';