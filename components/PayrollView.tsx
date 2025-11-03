
import React, { useState } from 'react';
import { Payroll, Payslip } from '../types';
import Modal from './Modal';
import { DownloadIcon } from './icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PayrollViewProps {
    payrolls: Payroll[];
    onRunPayroll: () => void;
}

const formatCurrency = (amount: number) => amount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });

const PayslipDetailModal: React.FC<{ payslip: Payslip; payrollPeriod: string; onClose: () => void }> = ({ payslip, payrollPeriod, onClose }) => {

    const exportToPDF = () => {
        const doc = new jsPDF();
        const finalY = (doc as any).lastAutoTable.finalY || 10;

        doc.setFontSize(18);
        doc.text("Recibo de Pago", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Periodo: ${payrollPeriod}`, 14, 29);

        (doc as any).autoTable({
            startY: 35,
            head: [['Detalle del Empleado', '']],
            body: [
                ['Nombre', payslip.employeeName],
                ['Salario Bruto', formatCurrency(payslip.grossPay)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [74, 85, 104] },
        });

        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Deducciones de Ley (Empleado)', 'Monto']],
            body: [
                ['ISSS (3%)', formatCurrency(payslip.deductions.isss)],
                ['AFP (7.25%)', formatCurrency(payslip.deductions.afp)],
                ['Impuesto sobre la Renta', formatCurrency(payslip.deductions.renta)],
            ],
            foot: [
                [{ content: 'Total Deducciones', styles: { fontStyle: 'bold' } }, { content: formatCurrency(payslip.totalDeductions), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [74, 85, 104] },
            footStyles: { fillColor: [241, 245, 249], textColor: [0,0,0] },
        });

        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            body: [
                [{ content: 'Salario Neto a Pagar', styles: { fontStyle: 'bold', fontSize: 12, halign: 'left' } },
                 { content: formatCurrency(payslip.netPay), styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }]
            ],
            theme: 'grid',
            styles: {
                fillColor: [237, 242, 247],
                textColor: [26, 32, 44]
            }
        });
        
        doc.save(`Recibo_${payslip.employeeName.replace(' ', '_')}_${payrollPeriod}.pdf`);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Recibo de Pago - ${payslip.employeeName}`}>
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div><span className="font-semibold text-slate-600">Empleado:</span></div>
                    <div>{payslip.employeeName}</div>
                    
                    <div><span className="font-semibold text-slate-600">Salario Bruto:</span></div>
                    <div className="text-right">{formatCurrency(payslip.grossPay)}</div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-semibold text-md mb-2 text-slate-700">Deducciones de Ley (Empleado)</h4>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div><span className="text-slate-600">ISSS (3%):</span></div>
                        <div className="text-right">{formatCurrency(payslip.deductions.isss)}</div>
                        
                        <div><span className="text-slate-600">AFP (7.25%):</span></div>
                        <div className="text-right">{formatCurrency(payslip.deductions.afp)}</div>
                        
                        <div><span className="text-slate-600">Impuesto sobre la Renta:</span></div>
                        <div className="text-right">{formatCurrency(payslip.deductions.renta)}</div>
                        
                        <div className="font-semibold border-t mt-2 pt-2"><span className="text-slate-600">Total Deducciones:</span></div>
                        <div className="font-semibold border-t mt-2 pt-2 text-right">{formatCurrency(payslip.totalDeductions)}</div>
                    </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-x-8 font-bold text-lg text-indigo-600">
                    <div>Salario Neto a Pagar:</div>
                    <div className="text-right">{formatCurrency(payslip.netPay)}</div>
                </div>
                 <div className="border-t pt-4 flex justify-end">
                    <button onClick={exportToPDF} className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Exportar a PDF
                    </button>
                </div>
            </div>
        </Modal>
    );
}

const UnifiedPayrollModal: React.FC<{ payroll: Payroll; onClose: () => void }> = ({ payroll, onClose }) => {
    
    const exportToPDF = () => {
        const doc = new jsPDF();
        const head = [['Empleado', 'Salario Base', 'ISSS Patronal (7.5%)', 'AFP Patronal (7.75%)', 'Costo Total Empleado']];
        const body = payroll.payslips.map(p => [
            p.employeeName,
            formatCurrency(p.baseSalary),
            formatCurrency(p.employerContributions.isss),
            formatCurrency(p.employerContributions.afp),
            formatCurrency(p.baseSalary + p.employerContributions.total)
        ]);
        const foot = [[
            'Total General',
            formatCurrency(payroll.payslips.reduce((acc, p) => acc + p.baseSalary, 0)),
            formatCurrency(payroll.payslips.reduce((acc, p) => acc + p.employerContributions.isss, 0)),
            formatCurrency(payroll.payslips.reduce((acc, p) => acc + p.employerContributions.afp, 0)),
            formatCurrency(payroll.totalCost)
        ]];

        doc.setFontSize(18);
        doc.text(`Planilla Patronal - ${payroll.period}`, 14, 22);
        
        (doc as any).autoTable({
            head,
            body,
            foot,
            startY: 30,
            headStyles: { fillColor: [30, 41, 59] },
            footStyles: { fillColor: [241, 245, 249], textColor: [0,0,0], fontStyle: 'bold' },
            styles: { cellPadding: 2.5, fontSize: 8 },
            didParseCell: function(data: any) {
                if (typeof data.cell.raw === 'string' && data.cell.raw.startsWith('$')) {
                    data.cell.styles.halign = 'right';
                }
            }
        });

        doc.save(`Planilla_Patronal_${payroll.period}.pdf`);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Planilla Patronal - ${payroll.period}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-4 py-3">Empleado</th>
                            <th className="px-4 py-3 text-right">Salario Base</th>
                            <th className="px-4 py-3 text-right">ISSS Patronal (7.5%)</th>
                            <th className="px-4 py-3 text-right">AFP Patronal (7.75%)</th>
                            <th className="px-4 py-3 text-right">Costo Total Empleado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payroll.payslips.map(p => (
                            <tr key={p.employeeId} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-900">{p.employeeName}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(p.baseSalary)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(p.employerContributions.isss)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(p.employerContributions.afp)}</td>
                                <td className="px-4 py-2 text-right font-medium text-slate-800">{formatCurrency(p.baseSalary + p.employerContributions.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-semibold">
                        <tr>
                            <td className="px-4 py-3 text-slate-800">Total General</td>
                             <td className="px-4 py-3 text-right">{formatCurrency(payroll.payslips.reduce((acc, p) => acc + p.baseSalary, 0))}</td>
                             <td className="px-4 py-3 text-right">{formatCurrency(payroll.payslips.reduce((acc, p) => acc + p.employerContributions.isss, 0))}</td>
                             <td className="px-4 py-3 text-right">{formatCurrency(payroll.payslips.reduce((acc, p) => acc + p.employerContributions.afp, 0))}</td>
                            <td className="px-4 py-3 text-right text-indigo-600 text-base">{formatCurrency(payroll.totalCost)}</td>
                        </tr>
                    </tfoot>
                </table>
                 <div className="mt-6 flex justify-end">
                    <button onClick={exportToPDF} className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Exportar a PDF
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const PayrollView: React.FC<PayrollViewProps> = ({ payrolls, onRunPayroll }) => {
    const [selectedPayslip, setSelectedPayslip] = useState<{payslip: Payslip, period: string} | null>(null);
    const [unifiedPayrollToShow, setUnifiedPayrollToShow] = useState<Payroll | null>(null);
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
                        <div className="w-full text-left p-4 flex justify-between items-center bg-slate-50">
                            <button onClick={() => setExpandedPayrollId(payroll.id === expandedPayrollId ? null : payroll.id)} className="flex-grow text-left">
                                <h2 className="font-semibold text-lg">{payroll.period}</h2>
                                <p className="text-sm text-slate-500">Ejecutada el {payroll.date.toLocaleDateString()}</p>
                            </button>
                            <div className="text-right flex items-center space-x-4">
                                <div>
                                    <p className="font-semibold text-slate-800">{formatCurrency(payroll.totalCost)}</p>
                                    <p className="text-sm text-slate-500">Costo Total para la Empresa</p>
                                </div>
                                <button onClick={() => setUnifiedPayrollToShow(payroll)} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors text-sm font-medium">
                                    Ver Planilla Patronal
                                </button>
                            </div>
                        </div>
                        {expandedPayrollId === payroll.id && (
                            <div className="p-4">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2">Empleado</th>
                                            <th className="px-4 py-2 text-right">Salario Neto</th>
                                            <th className="px-4 py-2 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payroll.payslips.map(payslip => (
                                            <tr key={payslip.employeeId} className="border-b hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium text-slate-900">{payslip.employeeName}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(payslip.netPay)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => setSelectedPayslip({payslip, period: payroll.period})} className="text-indigo-600 hover:underline text-xs">Ver Recibo</button>
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

            {selectedPayslip && <PayslipDetailModal payslip={selectedPayslip.payslip} payrollPeriod={selectedPayslip.period} onClose={() => setSelectedPayslip(null)} />}
            {unifiedPayrollToShow && <UnifiedPayrollModal payroll={unifiedPayrollToShow} onClose={() => setUnifiedPayrollToShow(null)} />}
        </div>
    );
};

export default PayrollView;