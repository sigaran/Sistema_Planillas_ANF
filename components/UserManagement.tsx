import React from 'react';
import { User } from '../types';
import { EditIcon, TrashIcon, ShieldCheckIcon } from './icons';

interface UserManagementProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onEdit, onDelete, currentUser }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Lista de Usuarios</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Usuario</th>
                            <th scope="col" className="px-6 py-3">Rol</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{user.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center w-fit ${
                                        user.role === 'admin' 
                                        ? 'bg-indigo-100 text-indigo-800' 
                                        : 'bg-slate-100 text-slate-800'
                                    }`}>
                                      {user.role === 'admin' && <ShieldCheckIcon className="h-4 w-4 mr-1"/>}
                                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <button onClick={() => onEdit(user)} className="text-indigo-600 hover:text-indigo-900">
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    {/* Un admin no se puede eliminar a sí mismo */}
                                    {currentUser.id !== user.id && (
                                        <button onClick={() => onDelete(user)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
