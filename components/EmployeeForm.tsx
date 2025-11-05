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
        telephone: '',
        position: '',
        jobDescription: '',
        baseSalary: 0,
        contractType: 'mensual',
        hireDate: new Date().toISOString().split('T')[0],
        terminationDate: '',
        afpType: 'Confía',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (employeeToEdit) {
            setEmployee({
                name: employeeToEdit.name,
                dui: employeeToEdit.dui,
                nit: employeeToEdit.nit,
                isss: employeeToEdit.isss,
                nup: employeeToEdit.nup,
                telephone: employeeToEdit.telephone,
                position: employeeToEdit.position,
                jobDescription: employeeToEdit.jobDescription || '',
                baseSalary: employeeToEdit.baseSalary,
                contractType: employeeToEdit.contractType,
                hireDate: employeeToEdit.hireDate,
                terminationDate: employeeToEdit.terminationDate || '',
                afpType: employeeToEdit.afpType,
            });
        } else {
             setEmployee({
                name: '',
                dui: '',
                nit: '',
                isss: '',
                nup: '',
                telephone: '',
                position: '',
                jobDescription: '',
                baseSalary: 0,
                contractType: 'mensual',
                hireDate: new Date().toISOString().split('T')[0],
                terminationDate: '',
                afpType: 'Confía',
            });
        }
        setErrors({});
    }, [employeeToEdit]);

    const validateField = (name: string, value: any): string => {
        switch (name) {
            case 'dui':
                if (!value) return 'El DUI es obligatorio.';
                if (!/^\d{8}-\d{1}$/.test(value)) return 'Formato de DUI inválido. Debe ser 00000000-0.';
                return '';
            case 'telephone':
                if (!value) return 'El teléfono es obligatorio.';
                if (!/^\d{4}-\d{4}$/.test(value)) return 'Formato de teléfono inválido. Debe ser 0000-0000.';
                return '';
            case 'nit':
                if (!value) return 'El NIT es obligatorio.';
                if (/[^\d]/.test(value)) return 'El NIT solo debe contener números.';
                return '';
            case 'isss':
                if (!value) return 'El número de ISSS es obligatorio.';
                if (/[^\d]/.test(value)) return 'El ISSS solo debe contener números.';
                return '';
            case 'nup':
                if (!value) return 'El NUP es obligatorio.';
                if (/[^\d]/.test(value)) return 'El NUP solo debe contener números.';
                return '';
            case 'name':
                if (!value.trim()) return 'El nombre es obligatorio.';
                return '';
            case 'position':
                if (!value.trim()) return 'El puesto es obligatorio.';
                return '';
            case 'baseSalary':
                if (value <= 0) return 'El salario debe ser mayor a cero.';
                return '';
            case 'hireDate':
                if (!value) return 'La fecha es obligatoria.';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let processedValue: string | number = value;

        if (['nit', 'isss', 'nup'].includes(name)) {
            processedValue = value.replace(/[^\d]/g, '');
        } else if (name === 'dui') {
            const numericValue = value.replace(/[^\d]/g, '');
            if (numericValue.length > 8) {
                processedValue = `${numericValue.slice(0, 8)}-${numericValue.slice(8, 9)}`;
            } else {
                processedValue = numericValue;
            }
        } else if (name === 'telephone') {
             const numericValue = value.replace(/[^\d]/g, '');
            if (numericValue.length > 4) {
                processedValue = `${numericValue.slice(0, 4)}-${numericValue.slice(4, 8)}`;
            } else {
                processedValue = numericValue;
            }
        } else if (name === 'baseSalary') {
            processedValue = parseFloat(value) || 0;
        }

        setEmployee(prev => ({ ...prev, [name]: processedValue }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;
        
        const employeeDataToValidate = { ...employee };
        if (employeeToEdit) {
          employeeDataToValidate.nit = employeeDataToValidate.nit.replace(/[^\d]/g, '');
          employeeDataToValidate.isss = employeeDataToValidate.isss.replace(/[^\d]/g, '');
          employeeDataToValidate.nup = employeeDataToValidate.nup.replace(/[^\d]/g, '');
        }

        for (const key in employeeDataToValidate) {
            const error = validateField(key, (employeeDataToValidate as any)[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
    
        const employeeToSave = {
            ...employee,
            nit: String(employee.nit).replace(/[^\d]/g, ''),
            isss: String(employee.isss).replace(/[^\d]/g, ''),
            nup: String(employee.nup).replace(/[^\d]/g, ''),
        };
    
        const payload: Employee = {
            ...employeeToSave,
            id: employeeToEdit?.id || new Date().toISOString(),
        };
    
        // Si terminationDate es una cadena vacía, queremos eliminarlo del objeto
        // para que no se guarde en Firestore, en lugar de causar un error al ser 'undefined'.
        if (!payload.terminationDate) {
            delete (payload as Partial<Employee>).terminationDate;
        }
    
        onSave(payload);
    };
    
    const inputClass = (fieldName: string) => 
        `mt-1 block w-full px-3 py-2 bg-white border ${errors[fieldName] ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm placeholder-slate-400 focus:outline-none ${errors[fieldName] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} sm:text-sm`;


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                    <input type="text" name="name" id="name" value={employee.name} onChange={handleChange} onBlur={handleBlur} required className={inputClass('name')} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                 <div>
                    <label htmlFor="position" className="block text-sm font-medium text-slate-700">Puesto</label>
                    <input type="text" name="position" id="position" value={employee.position} onChange={handleChange} onBlur={handleBlur} required className={inputClass('position')} />
                    {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                </div>
            </div>

            <hr/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="dui" className="block text-sm font-medium text-slate-700">DUI</label>
                    <input type="text" name="dui" id="dui" value={employee.dui} onChange={handleChange} onBlur={handleBlur} maxLength={10} placeholder="00000000-0" required className={inputClass('dui')} />
                    {errors.dui && <p className="text-red-500 text-xs mt-1">{errors.dui}</p>}
                </div>
                 <div>
                    <label htmlFor="telephone" className="block text-sm font-medium text-slate-700">Teléfono</label>
                    <input type="text" name="telephone" id="telephone" value={employee.telephone} onChange={handleChange} onBlur={handleBlur} maxLength={9} placeholder="0000-0000" required className={inputClass('telephone')} />
                    {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                </div>
                 <div>
                    <label htmlFor="nit" className="block text-sm font-medium text-slate-700">NIT</label>
                    <input type="text" name="nit" id="nit" value={employee.nit} onChange={handleChange} onBlur={handleBlur} required className={inputClass('nit')} />
                    {errors.nit && <p className="text-red-500 text-xs mt-1">{errors.nit}</p>}
                </div>
                 <div>
                    <label htmlFor="isss" className="block text-sm font-medium text-slate-700">ISSS</label>
                    <input type="text" name="isss" id="isss" value={employee.isss} onChange={handleChange} onBlur={handleBlur} required className={inputClass('isss')} />
                    {errors.isss && <p className="text-red-500 text-xs mt-1">{errors.isss}</p>}
                </div>
                 <div>
                    <label htmlFor="nup" className="block text-sm font-medium text-slate-700">NUP (AFP)</label>
                    <input type="text" name="nup" id="nup" value={employee.nup} onChange={handleChange} onBlur={handleBlur} required className={inputClass('nup')} />
                    {errors.nup && <p className="text-red-500 text-xs mt-1">{errors.nup}</p>}
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
                    <input type="number" name="baseSalary" id="baseSalary" value={employee.baseSalary} onChange={handleChange} onBlur={handleBlur} required className={inputClass('baseSalary')} />
                     {errors.baseSalary && <p className="text-red-500 text-xs mt-1">{errors.baseSalary}</p>}
                </div>
            </div>

             <hr/>
             
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="hireDate" className="block text-sm font-medium text-slate-700">Fecha de Contratación</label>
                    <input type="date" name="hireDate" id="hireDate" value={employee.hireDate} onChange={handleChange} onBlur={handleBlur} required className={inputClass('hireDate')} />
                    {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>}
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