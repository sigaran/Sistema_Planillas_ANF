import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { hashPassword } from '../utils/hashing';

interface UserFormProps {
    onSave: (user: User) => void;
    onClose: () => void;
    userToEdit: User | null;
    allUsers: User[];
}

const UserForm: React.FC<UserFormProps> = ({ onSave, onClose, userToEdit, allUsers }) => {
    const [user, setUser] = useState<Omit<User, 'id' | 'password'> & { password?: string }>({
        username: '',
        password: '',
        role: 'manager',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    useEffect(() => {
        if (userToEdit) {
            setUser({
                username: userToEdit.username,
                role: userToEdit.role,
                password: '', // Leave password blank for editing
            });
        }
    }, [userToEdit]);

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!user.username.trim()) {
            newErrors.username = 'El nombre de usuario es obligatorio.';
        } else {
            const usernameExists = allUsers.some(existingUser => 
                existingUser.username.toLowerCase() === user.username.toLowerCase() && (!userToEdit || existingUser.id !== userToEdit.id)
            );
            if (usernameExists) {
                newErrors.username = 'Este nombre de usuario ya está en uso.';
            }
        }
        
        // Password is only required when creating a new user
        if (!userToEdit && !user.password) {
            newErrors.password = 'La contraseña es obligatoria.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        // Prepare the user data to be saved
        const userPayload: User = {
            id: userToEdit?.id || new Date().toISOString(),
            username: user.username,
            role: user.role,
            // Determine which password to save
            password: '', 
        };

        if (user.password) {
            // If a new password was entered, hash it
            userPayload.password = hashPassword(user.password);
        } else if (userToEdit) {
            // If editing and no new password, keep the old one
            userPayload.password = userToEdit.password;
        }
        
        onSave(userPayload);
    };

    const inputClass = (fieldName: string) => 
        `mt-1 block w-full px-3 py-2 bg-white border ${errors[fieldName] ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none ${errors[fieldName] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} sm:text-sm`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">Nombre de Usuario</label>
                <input type="text" name="username" id="username" value={user.username} onChange={handleChange} required className={inputClass('username')} />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Contraseña {userToEdit && <span className="text-slate-500 text-xs">(Dejar en blanco para no cambiar)</span>}
                </label>
                <input 
                    type="password" 
                    name="password" 
                    id="password" 
                    value={user.password || ''} 
                    onChange={handleChange} 
                    required={!userToEdit} // Required only when creating
                    className={inputClass('password')} 
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">Rol</label>
                <select name="role" id="role" value={user.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="manager">Gerente</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Guardar Usuario</button>
            </div>
        </form>
    );
};

export default UserForm;