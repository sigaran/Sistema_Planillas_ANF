import React from 'react';
import { Employee, Payroll } from '../types';
import { UsersIcon, DocumentReportIcon } from './icons';

interface DashboardProps {
    employees: Employee[];
    payrolls: Payroll[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ employees, payrolls }) => {
    const totalEmployees = employees.length;
    const latestPayroll = payrolls.length > 0 ? payrolls[0] : null;
    const totalPayrollCost = latestPayroll?.totalCost.toLocaleString('es-ES', { style: 'currency', currency: 'USD' }) || '$0.00';
    const averageSalary = employees.length > 0
        ? (employees.reduce((acc, emp) => acc + emp.baseSalary, 0) / employees.length).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })
        : '$0.00';

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Panel de Control</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total de Empleados" value={totalEmployees.toString()} icon={<UsersIcon className="h-6 w-6" />} />
                <StatCard title="Costo Última Planilla" value={totalPayrollCost} icon={<DocumentReportIcon className="h-6 w-6" />} />
                <StatCard title="Salario Mensual Promedio" value={averageSalary} icon={<span className="text-xl font-bold">$</span>} />
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Empleados Recientes</h2>
                {employees.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {employees.slice(0, 5).map(emp => (
                            <li key={emp.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{emp.name}</p>
                                    <p className="text-sm text-slate-500">{emp.position}</p>
                                </div>
                                <p className="text-sm text-slate-500">Contratado: {new Date(emp.hireDate).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 py-4">No hay empleados registrados.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;