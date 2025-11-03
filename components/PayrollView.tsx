
import React, { useState } from 'react';
import { Payroll, Payslip } from '../types';
import Modal from './Modal';

interface PayrollViewProps {
    payrolls: Payroll[];
    onRunPayroll: () => void;
}

const PayslipDetailModal: React.FC<{ payslip: Payslip; onClose: () => void }> = ({ payslip, onClose }) => {

    return (
        <Modal isOpen={true} onClose={onClose} title={`Recibo de Pago - ${payslip.employeeName}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="font-semibold text-slate-600">Empleado:</span> {payslip.employeeName}</p>
                    <p><span className="font-semibold text-slate-600">Salario Bruto:</span> {payslip.grossPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                    <p><span className="font-semibold text-slate-600">Deducciones:</span> {payslip.deductions.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                    <p className="font-bold text-lg text-indigo-600"><span className="font-semibold text-slate-600">Salario Neto:</span> {payslip.netPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                </div>
            </div>
        </Modal>
    );
}

const PayrollView: React.FC<PayrollViewProps> = ({ payrolls, onRunPayroll }) => {
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [expandedPayrollId, setExpandedPayrollId] = useState<string | null>(payrolls[0]?.id || null);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Planillas</h1>
                <button onClick={onRunPayroll} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    Ejecutar Nueva Planilla
                </button>
            </div>

            <div className="space-y-4">
                {payrolls.map(payroll => (
                    <div key={payroll.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <button onClick={() => setExpandedPayrollId(payroll.id === expandedPayrollId ? null : payroll.id)} className="w-full text-left p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100">
                            <div>
                                <h2 className="font-semibold text-lg">{payroll.period}</h2>
                                <p className="text-sm text-slate-500">Ejecutada el {payroll.date.toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-slate-800">{payroll.totalCost.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                                <p className="text-sm text-slate-500">Costo Total</p>
                            </div>
                        </button>
                        {expandedPayrollId === payroll.id && (
                            <div className="p-4">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2">Empleado</th>
                                            <th className="px-4 py-2">Salario Neto</th>
                                            <th className="px-4 py-2">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payroll.payslips.map(payslip => (
                                            <tr key={payslip.employeeId} className="border-b hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium text-slate-900">{payslip.employeeName}</td>
                                                <td className="px-4 py-2">{payslip.netPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</td>
                                                <td className="px-4 py-2">
                                                    <button onClick={() => setSelectedPayslip(payslip)} className="text-indigo-600 hover:underline text-xs">Ver Recibo</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
                {payrolls.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <p className="text-slate-500">No hay planillas ejecutadas.</p>
                        <p className="text-sm text-slate-400 mt-2">Haz clic en "Ejecutar Nueva Planilla" para comenzar.</p>
                    </div>
                )}
            </div>

            {selectedPayslip && <PayslipDetailModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />}
        </div>
    );
};

export default PayrollView;