import React, { useState, useMemo, useEffect } from 'react';
import { Employee, PayrollNovelty, OvertimeRateType, User } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface NoveltiesViewProps {
    employees: Employee[];
    novelties: PayrollNovelty[];
    onSave: (novelty: Omit<PayrollNovelty, 'id'>) => void;
    onDelete: (novelty: PayrollNovelty) => void;
    currentUser: User;
}

const initialFormState = {
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'overtime' as 'overtime' | 'expense' | 'unpaid_leave',
    description: '',
    amount: 0,
    overtimeHours: 0,
    overtimeRateType: 'day' as OvertimeRateType,
    unpaidLeaveDays: 1,
};

const NoveltiesView: React.FC<NoveltiesViewProps> = ({ employees, novelties, onSave, onDelete, currentUser }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [viewDate, setViewDate] = useState(new Date());

    const today = new Date();
    const maxDate = today.toISOString().split('T')[0];
    const maxMonth = today.toISOString().slice(0, 7);

    useEffect(() => {
        if (formData.type === 'unpaid_leave' && formData.employeeId && formData.unpaidLeaveDays > 0) {
            const employee = employees.find(e => e.id === formData.employeeId);
            if (employee) {
                const dailyRate = employee.baseSalary / 30;
                const calculatedAmount = dailyRate * formData.unpaidLeaveDays;
                setFormData(prev => ({ ...prev, amount: calculatedAmount }));
            }
        }
    }, [formData.type, formData.employeeId, formData.unpaidLeaveDays, employees]);

    const displayedNovelties = useMemo(() => {
        const viewYear = viewDate.getFullYear();
        const viewMonth = viewDate.getMonth();
        return novelties
            .filter(n => {
                const noveltyDate = new Date(n.date);
                return noveltyDate.getFullYear() === viewYear && noveltyDate.getMonth() === viewMonth;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [novelties, viewDate]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setViewDate(new Date(year, month - 1, 1));
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.employeeId) newErrors.employeeId = 'Debe seleccionar un empleado.';
        if (!formData.date) newErrors.date = 'La fecha es obligatoria.';
        else if (formData.date > maxDate) {
            newErrors.date = 'La fecha no puede ser futura.';
        }
        
        if (formData.type === 'overtime') {
            if (formData.overtimeHours <= 0) {
                newErrors.overtimeHours = 'Las horas deben ser mayor a cero.';
            } else {
                const isDayTime = formData.overtimeRateType === 'day' || formData.overtimeRateType === 'holiday_day';
                const isNightTime = formData.overtimeRateType === 'night' || formData.overtimeRateType === 'holiday_night';

                if (isDayTime && formData.overtimeHours > 8) {
                    newErrors.overtimeHours = 'Las horas extras diurnas no pueden exceder las 8 horas.';
                } else if (isNightTime && formData.overtimeHours > 7) {
                    newErrors.overtimeHours = 'Las horas extras nocturnas no pueden exceder las 7 horas.';
                }
            }
        } else if (formData.type === 'expense') {
            if (formData.amount <= 0) newErrors.amount = 'El monto debe ser mayor a cero.';
            if (!formData.description.trim()) newErrors.description = 'El motivo es obligatorio.';
        } else if (formData.type === 'unpaid_leave') {
            const days = formData.unpaidLeaveDays;
            if (!days || days < 1 || days > 2) {
                newErrors.unpaidLeaveDays = 'Los días de permiso deben ser 1 o 2.';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
        if (!selectedEmployee) return;

        let noveltyToSave: Omit<PayrollNovelty, 'id'> = {
            employeeId: formData.employeeId,
            employeeName: selectedEmployee.name,
            date: formData.date,
            type: formData.type,
            description: formData.description,
        };

        if (formData.type === 'overtime') {
            const rateText = { day: 'Diurna', night: 'Nocturna', holiday_day: 'Asueto Diurna', holiday_night: 'Asueto Nocturna' };
            noveltyToSave = {
                ...noveltyToSave,
                overtimeHours: formData.overtimeHours,
                overtimeRateType: formData.overtimeRateType,
                description: `${formData.overtimeHours} hrs extra (${rateText[formData.overtimeRateType]})`,
            };
        } else if (formData.type === 'unpaid_leave') {
            noveltyToSave = {
                ...noveltyToSave,
                unpaidLeaveDays: formData.unpaidLeaveDays,
                amount: formData.amount,
                description: `${formData.unpaidLeaveDays} día(s) de permiso sin goce de sueldo.`,
            };
        } else { // 'expense'
            noveltyToSave = {
                ...noveltyToSave,
                amount: formData.amount,
            };
        }

        onSave(noveltyToSave);
        setFormData(initialFormState);
        setErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type: targetType } = e.target;
    
        if (name === 'type') {
            setFormData({
                ...initialFormState,
                employeeId: formData.employeeId,
                date: formData.date,
                type: value as any,
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: targetType === 'number' ? parseFloat(value) : value,
            }));
        }
    };

    const inputClass = (fieldName: string) =>
        `mt-1 block w-full px-3 py-2 bg-white border ${errors[fieldName] ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none ${errors[fieldName] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} sm:text-sm`;

    const getNoveltyDetails = (novelty: PayrollNovelty) => {
        switch (novelty.type) {
            case 'overtime':
                const rateText = { day: 'Diurna', night: 'Nocturna', holiday_day: 'Asueto Diurno', holiday_night: 'Asueto Nocturno' };
                return `${novelty.overtimeHours} hrs (${rateText[novelty.overtimeRateType!] || ''})`;
            case 'expense':
                return `${novelty.description} - ${novelty.amount?.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}`;
            case 'unpaid_leave':
                return `${novelty.unpaidLeaveDays} día(s) - Descuento: ${novelty.amount?.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}`;
        }
    }
    
    const typeToBadge = {
        overtime: <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Hora Extra</span>,
        expense: <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Viático</span>,
        unpaid_leave: <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Permiso s/ Sueldo</span>,
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Gestión de Novedades</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Registrar Novedad</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700">Empleado</label>
                            <select name="employeeId" id="employeeId" value={formData.employeeId} onChange={handleChange} className={inputClass('employeeId')}>
                                <option value="">-- Seleccione --</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                            {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-700">Fecha</label>
                            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} max={maxDate} className={inputClass('date')} />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-700">Tipo de Novedad</label>
                            <select name="type" id="type" value={formData.type} onChange={handleChange} className={inputClass('type')}>
                                <option value="overtime">Horas Extras</option>
                                <option value="expense">Viático</option>
                                <option value="unpaid_leave">Permiso sin Goce de Sueldo</option>
                            </select>
                        </div>
                        
                        {formData.type === 'overtime' && (
                            <>
                                <div>
                                    <label htmlFor="overtimeHours" className="block text-sm font-medium text-slate-700">Cantidad de Horas</label>
                                    <input
                                        type="number"
                                        name="overtimeHours"
                                        id="overtimeHours"
                                        value={formData.overtimeHours}
                                        onChange={handleChange}
                                        min="0"
                                        max={['day', 'holiday_day'].includes(formData.overtimeRateType) ? 8 : 7}
                                        className={inputClass('overtimeHours')}
                                    />
                                    {errors.overtimeHours && <p className="text-red-500 text-xs mt-1">{errors.overtimeHours}</p>}
                                </div>
                                <div>
                                    <label htmlFor="overtimeRateType" className="block text-sm font-medium text-slate-700">Tipo de Hora Extra</label>
                                    <select name="overtimeRateType" id="overtimeRateType" value={formData.overtimeRateType} onChange={handleChange} className={inputClass('overtimeRateType')}>
                                        <option value="day">Diurna (100% Recargo)</option>
                                        <option value="night">Nocturna (125% Recargo)</option>
                                        <option value="holiday_day">Asueto Diurna (Doble-Doble)</option>
                                        <option value="holiday_night">Asueto Nocturna</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {formData.type === 'expense' && (
                             <>
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Monto (USD)</label>
                                    <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} min="0" className={inputClass('amount')} />
                                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                                </div>
                                 <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Motivo</label>
                                    <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className={inputClass('description')} />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                </div>
                            </>
                        )}

                        {formData.type === 'unpaid_leave' && (
                             <>
                                <div>
                                    <label htmlFor="unpaidLeaveDays" className="block text-sm font-medium text-slate-700">Días de Permiso</label>
                                    <input type="number" name="unpaidLeaveDays" id="unpaidLeaveDays" value={formData.unpaidLeaveDays} onChange={handleChange} min="1" max="2" step="1" className={inputClass('unpaidLeaveDays')} />
                                    {errors.unpaidLeaveDays && <p className="text-red-500 text-xs mt-1">{errors.unpaidLeaveDays}</p>}
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Monto a Descontar (calculado)</label>
                                    <input type="text" name="amount" id="amount" value={formData.amount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} readOnly className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm sm:text-sm" />
                                </div>
                            </>
                        )}

                        <div className="pt-2">
                             <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Agregar Novedad
                            </button>
                        </div>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold capitalize">
                            Novedades de {viewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="month-picker" className="text-sm font-medium text-slate-700">Ver mes:</label>
                            <input
                                type="month"
                                id="month-picker"
                                value={viewDate.toISOString().slice(0, 7)}
                                max={maxMonth}
                                onChange={handleMonthChange}
                                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                     </div>
                     <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Empleado</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Detalle</th>
                                    {currentUser.role === 'admin' && <th className="px-4 py-3">Acción</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {displayedNovelties.map(novelty => (
                                    <tr key={novelty.id} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-900">{novelty.employeeName}</td>
                                        <td className="px-4 py-2">{new Date(novelty.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{typeToBadge[novelty.type]}</td>
                                        <td className="px-4 py-2">{getNoveltyDetails(novelty)}</td>
                                        {currentUser.role === 'admin' && (
                                            <td className="px-4 py-2">
                                                <button onClick={() => onDelete(novelty)} className="text-red-500 hover:text-red-700">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {displayedNovelties.length === 0 && (
                                    <tr>
                                        <td colSpan={currentUser.role === 'admin' ? 5 : 4} className="text-center py-8 text-slate-500">No hay novedades registradas para este período.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default NoveltiesView;