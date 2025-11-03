import React, { useState, useEffect } from 'react';
import { Employee } from '../types';

interface EmployeeFormProps {
    onSave: (employee: Employee) => void;
    onClose: () => void;
    employeeToEdit: Employee | null;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSave, onClose, employeeToEdit }) => {
    const [employee, setEmployee] = useState<Omit<Employee, 'id'>>({
        name: '',
        dui: '',
        nit: '',
        isss: '',
        nup: '',
        position: '',
        jobDescription: '',
        baseSalary: 0,
        contractType: 'mensual',
        hireDate: new Date().toISOString().split('T')[0],
        terminationDate: '',
        afpType: 'Confía',
    });

    useEffect(() => {
        if (employeeToEdit) {
            setEmployee({
                name: employeeToEdit.name,
                dui: employeeToEdit.dui,
                nit: employeeToEdit.nit,
                isss: employeeToEdit.isss,
                nup: employeeToEdit.nup,
                position: employeeToEdit.position,
                jobDescription: employeeToEdit.jobDescription || '',
                baseSalary: employeeToEdit.baseSalary,
                contractType: employeeToEdit.contractType,
                hireDate: employeeToEdit.hireDate,
                terminationDate: employeeToEdit.terminationDate || '',
                afpType: employeeToEdit.afpType,
            });
        }
    }, [employeeToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEmployee(prev => ({ ...prev, [name]: name === 'baseSalary' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...employee,
            id: employeeToEdit?.id || new Date().toISOString(),
            terminationDate: employee.terminationDate || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                    <input type="text" name="name" id="name" value={employee.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="position" className="block text-sm font-medium text-slate-700">Puesto</label>
                    <input type="text" name="position" id="position" value={employee.position} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>

            <hr/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="dui" className="block text-sm font-medium text-slate-700">DUI</label>
                    <input type="text" name="dui" id="dui" value={employee.dui} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="nit" className="block text-sm font-medium text-slate-700">NIT</label>
                    <input type="text" name="nit" id="nit" value={employee.nit} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="isss" className="block text-sm font-medium text-slate-700">ISSS</label>
                    <input type="text" name="isss" id="isss" value={employee.isss} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="nup" className="block text-sm font-medium text-slate-700">NUP (AFP)</label>
                    <input type="text" name="nup" id="nup" value={employee.nup} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
            
            <hr/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="afpType" className="block text-sm font-medium text-slate-700">Tipo de AFP</label>
                    <select name="afpType" id="afpType" value={employee.afpType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="Confía">Confía</option>
                        <option value="Crecer">Crecer</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="contractType" className="block text-sm font-medium text-slate-700">Tipo de Contrato</label>
                    <select name="contractType" id="contractType" value={employee.contractType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="mensual">Mensual</option>
                        <option value="diario">Diario</option>
                        <option value="por_hora">Por Hora</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="baseSalary" className="block text-sm font-medium text-slate-700">Salario Base (USD)</label>
                    <input type="number" name="baseSalary" id="baseSalary" value={employee.baseSalary} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>

             <hr/>
             
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="hireDate" className="block text-sm font-medium text-slate-700">Fecha de Contratación</label>
                    <input type="date" name="hireDate" id="hireDate" value={employee.hireDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="terminationDate" className="block text-sm font-medium text-slate-700">Fecha de Salida (Opcional)</label>
                    <input type="date" name="terminationDate" id="terminationDate" value={employee.terminationDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>

            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700">Descripción del Puesto</label>
                 </div>
                <textarea name="jobDescription" id="jobDescription" value={employee.jobDescription} onChange={handleChange} rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>

            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Guardar Empleado</button>
            </div>
        </form>
    );
};

export default EmployeeForm;