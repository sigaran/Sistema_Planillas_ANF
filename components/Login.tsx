import React, { useState } from 'react';
import Spinner from './Spinner';
import { User } from '../types';
import { db } from '../firebase-config';
import { hashPassword } from '../utils/hashing';
import { collection, query, where, getDocs } from 'firebase/firestore';


interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const usersCollection = collection(db, "users");
            const q = query(usersCollection, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setError('Usuario o contraseña incorrectos.');
                setIsLoading(false);
                return;
            }

            const enteredPasswordHash = hashPassword(password);
            let foundUser: User | null = null;
            querySnapshot.forEach((doc) => {
                const userData = { ...doc.data(), id: doc.id } as User;
                // Compare the hashed entered password with the stored hash
                if (userData.password === enteredPasswordHash) {
                    foundUser = userData;
                }
            });

            if (foundUser) {
                onLoginSuccess(foundUser);
            } else {
                setError('Usuario o contraseña incorrectos.');
            }

        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            setError('Ocurrió un error al intentar iniciar sesión.');
        }

        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-indigo-600">Sistema de Planillas</h1>
                    <p className="mt-1 text-slate-600 font-medium">Grupo Corporativo Castillo</p>
                    <p className="mt-4 text-slate-500">Inicia sesión para gestionar el sistema</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="text-sm font-bold text-slate-700 tracking-wide">
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full text-base px-4 py-2 mt-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="p. ej. admin"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-bold text-slate-700 tracking-wide">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full text-base px-4 py-2 mt-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="p. ej. password"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;