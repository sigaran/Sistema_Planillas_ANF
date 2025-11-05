import React, { useMemo } from 'react';
import { Employee, PayrollNovelty, User } from '../types';
import { UndoIcon } from './icons';

interface VacationsViewProps {
    employees: Employee[];
    novelties: PayrollNovelty[];
    onPayVacation: (employee: Employee) => void;
    onResetVacation: (employee: Employee) => void;
    currentUser: User;
}

const VacationsView: React.FC<VacationsViewProps> = ({ employees, novelties, onPayVacation, onResetVacation, currentUser }) => {

    const eligibleEmployees = useMemo(() => {
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        const today = new Date();
        return employees.filter(emp => {
            const hireDate = new Date(emp.hireDate);
            return (today.getTime() - hireDate.getTime()) >= oneYearInMs;
        });
    }, [employees]);

    const getYearsOfService = (hireDate: string): number => {
        const today = new Date();
        const start = new Date(hireDate);
        let years = today.getFullYear() - start.getFullYear();
        const m = today.getMonth() - start.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < start.getDate())) {
            years--;
        }
        return years;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Gestión de Vacaciones</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Empleados Elegibles para Vacaciones</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Puesto</th>
                                <th scope="col" className="px-6 py-3">Fecha de Contratación</th>
                                <th scope="col" className="px-6 py-3">Años de Servicio</th>
                                <th scope="col" className="px-6 py-3 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eligibleEmployees.map(employee => {
                                const currentYear = new Date().getFullYear();
                                const hasBeenPaid = novelties.some(n =>
                                    n.employeeId === employee.id &&
                                    n.type === 'vacation_pay' &&
                                    new Date(n.date).getFullYear() === currentYear
                                );

                                return (
                                    <tr key={employee.id} className="bg-white border-b hover:bg-slate-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{employee.name}</th>
                                        <td className="px-6 py-4">{employee.position}</td>
                                        <td className="px-6 py-4">{new Date(employee.hireDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{getYearsOfService(employee.hireDate)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {hasBeenPaid ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        Pagado
                                                    </span>
                                                    {currentUser.role === 'admin' && (
                                                        <button 
                                                            onClick={() => onResetVacation(employee)}
                                                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
                                                            title="Restablecer pago"
                                                        >
                                                            <UndoIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => onPayVacation(employee)}
                                                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                                                >
                                                    Pagar Vacación
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {eligibleEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-500">No hay empleados que cumplan con el requisito de antigüedad para vacaciones.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VacationsView;