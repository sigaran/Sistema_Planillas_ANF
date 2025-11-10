import React from 'react';
import { Employee, User } from '../types';
import { EditIcon, TrashIcon } from './icons';

interface EmployeeListProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
    currentUser: User;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onEdit, onDelete, currentUser }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Lista de Empleados</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nombre</th>
                            <th scope="col" className="px-6 py-3">Puesto</th>
                            <th scope="col" className="px-6 py-3">DUI</th>
                            <th scope="col" className="px-6 py-3">Teléfono</th>
                            <th scope="col" className="px-6 py-3">Salario Base</th>
                            <th scope="col" className="px-6 py-3">Fecha de Contratación</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(employee => {
                            const isActive = employee.status === 'active' || !employee.status;
                            return (
                                <tr key={employee.id} className={`bg-white border-b hover:bg-slate-50 ${!isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{employee.name}</th>
                                    <td className="px-6 py-4">{employee.position}</td>
                                    <td className="px-6 py-4">{employee.dui}</td>
                                    <td className="px-6 py-4">{employee.telephone}</td>
                                    <td className="px-6 py-4">{employee.baseSalary.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</td>
                                    <td className="px-6 py-4">{new Date(employee.hireDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>
                                            {isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center space-x-3">
                                        <button onClick={() => onEdit(employee)} className="text-indigo-600 hover:text-indigo-900">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        {currentUser.role === 'admin' && (
                                            <button onClick={() => onDelete(employee)} className="text-red-600 hover:text-red-900">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                         {employees.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-slate-500">No hay empleados para mostrar.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeList;