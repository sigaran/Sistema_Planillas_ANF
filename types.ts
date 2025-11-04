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
  grossPay: number;
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

export type View = 'dashboard' | 'employees' | 'payroll' | 'users';