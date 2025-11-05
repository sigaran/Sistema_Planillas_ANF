import React, { useState, useMemo } from 'react';
import { Employee, PayrollNovelty, User } from '../types';
import { AguinaldoData } from '../App';

interface AguinaldoViewProps {
    employees: Employee[];
    novelties: PayrollNovelty[];
    onConfirmAguinaldo: (aguinaldoData: AguinaldoData[]) => void;
    currentUser: User;
}

const formatCurrency = (amount: number) => amount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });

const AguinaldoView: React.FC<AguinaldoViewProps> = ({ employees, novelties, onConfirmAguinaldo }) => {
    const [calculatedAguinaldos, setCalculatedAguinaldos] = useState<AguinaldoData[] | null>(null);

    const { isWithinDateRange, hasBeenRun } = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const startDate = new Date(currentYear, 9, 20); // October 20
        const endDate = new Date(currentYear, 11, 20); // December 20

        const isWithinDateRange = today >= startDate && today <= endDate;

        const hasBeenRun = novelties.some(n =>
            n.type === 'aguinaldo' && new Date(n.date).getFullYear() === currentYear
        );

        return { isWithinDateRange, hasBeenRun };
    }, [novelties]);

    const handleCalculate = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const calculationDate = new Date(currentYear, 11, 12); // December 12

        const results: AguinaldoData[] = employees.map(emp => {
            const hireDate = new Date(emp.hireDate);
            const dailySalary = emp.baseSalary / 30;

            const diffTime = Math.abs(calculationDate.getTime() - hireDate.getTime());
            const diffDaysTotal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const yearsOfService = diffDaysTotal / 365;
            
            let daysToPay = 0;
            let amount = 0;

            if (yearsOfService >= 1) {
                if (yearsOfService >= 10) {
                    daysToPay = 21;
                } else if (yearsOfService >= 3) {
                    daysToPay = 19;
                } else {
                    daysToPay = 15;
                }
                amount = dailySalary * daysToPay;
            } else {
                // Proportional
                const startOfYear = new Date(currentYear, 0, 1);
                const effectiveStartDate = hireDate > startOfYear ? hireDate : startOfYear;
                const daysWorkedInYear = Math.ceil(Math.abs(calculationDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24));
                // Proportional to 15 days of salary
                amount = (dailySalary * 15 / 365) * daysWorkedInYear;
            }
            
            return {
                employeeId: emp.id,
                employeeName: emp.name,
                amount: amount,
                isTaxable: emp.baseSalary > 1500,
            };
        });
        setCalculatedAguinaldos(results);
    };
    
    const handleConfirm = () => {
        if (calculatedAguinaldos) {
            onConfirmAguinaldo(calculatedAguinaldos);
            setCalculatedAguinaldos(null);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Proceso de Aguinaldo</h1>
            
            {!calculatedAguinaldos && (
                 <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-semibold mb-4">Iniciar Cálculo de Aguinaldo Anual</h2>
                    {hasBeenRun ? (
                        <div className="p-4 bg-green-100 text-green-800 rounded-md">
                            <p className="font-semibold">El proceso de aguinaldo para este año ya ha sido ejecutado.</p>
                        </div>
                    ) : isWithinDateRange ? (
                         <>
                            <p className="text-slate-600 mb-6">Haz clic en el botón para calcular los montos de aguinaldo para todos los empleados activos según la ley.</p>
                            <button 
                                onClick={handleCalculate}
                                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Iniciar Proceso de Aguinaldo
                            </button>
                        </>
                    ) : (
                        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
                            <p className="font-semibold">El proceso de aguinaldo solo puede ejecutarse entre el 20 de octubre y el 20 de diciembre de cada año.</p>
                        </div>
                    )}
                 </div>
            )}
           
            {calculatedAguinaldos && (
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Revisión de Aguinaldos Calculados</h2>
                    <p className="text-slate-600 mb-4">Verifica los montos calculados. Al confirmar, se crearán las novedades de pago que se incluirán en la planilla del mes actual.</p>
                     <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Empleado</th>
                                    <th scope="col" className="px-6 py-3 text-right">Monto Calculado</th>
                                    <th scope="col" className="px-6 py-3 text-center">Renta Aplicable</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculatedAguinaldos.map(item => (
                                    <tr key={item.employeeId} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.employeeName}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isTaxable ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {item.isTaxable ? 'Sí (Gravable)' : 'No (Exento)'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-6 space-x-4">
                        <button onClick={() => setCalculatedAguinaldos(null)} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
                            Cancelar
                        </button>
                        <button onClick={handleConfirm} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Confirmar y Generar Pagos
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AguinaldoView;