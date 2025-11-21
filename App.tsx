import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { db } from './firebase-config';
import { collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Employee, Payroll, Payslip, View, DeductionDetails, EmployerContributions, User, PayrollNovelty } from './types';
import { DashboardIcon, UsersIcon, DocumentReportIcon, PlusIcon, LogoutIcon, ShieldCheckIcon, CalendarIcon, SunIcon, GiftIcon, MenuIcon, CloseIcon } from './components/icons';
import Modal from './components/Modal';
import Spinner from './components/Spinner';


export interface AguinaldoData {
    employeeId: string;
    employeeName: string;
    amount: number;
    isTaxable: boolean;
}

// Lazy-load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const EmployeeList = lazy(() => import('./components/EmployeeList'));
const EmployeeForm = lazy(() => import('./components/EmployeeForm'));
const PayrollView = lazy(() => import('./components/PayrollView'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const NoveltiesView = lazy(() => import('./components/NoveltiesView'));
const VacationsView = lazy(() => import('./components/VacationsView'));
const AguinaldoView = lazy(() => import('./components/AguinaldoView'));
const UserForm = lazy(() => import('./components/UserForm'));
const Login = lazy(() => import('./components/Login'));


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- State Management with Firestore ---
    const [users, setUsers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [novelties, setNovelties] = useState<PayrollNovelty[]>([]);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    
    // --- UI State ---
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

    // --- Notification Timeout ---
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- Data Fetching from Firestore ---
    useEffect(() => {
        if (!currentUser) return;

        setIsLoading(true);
        const queries = [
            onSnapshot(collection(db, "users"), (snapshot) => 
                setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)))
            ),
            onSnapshot(collection(db, "employees"), (snapshot) => 
                setEmployees(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Employee)))
            ),
            onSnapshot(collection(db, "novelties"), (snapshot) => 
                setNovelties(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PayrollNovelty)))
            ),
            onSnapshot(query(collection(db, "payrolls"), orderBy("date", "desc")), (snapshot) => {
                 setPayrolls(snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Firestore v9+ returns Timestamp objects, so we need to convert them
                    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
                    return { ...data, id: doc.id, date } as Payroll;
                }));
            }),
        ];
        
        // A simple timeout to hide the initial loader. The real-time listeners will populate the data.
        const timer = setTimeout(() => setIsLoading(false), 500);

        return () => {
            clearTimeout(timer);
            queries.forEach(unsubscribe => unsubscribe());
        }

    }, [currentUser]);
    
    const filteredEmployees = useMemo(() => {
        if (!employeeSearchTerm.trim()) {
            return employees;
        }
        const lowercasedTerm = employeeSearchTerm.toLowerCase();
        return employees.filter(emp =>
            emp.name.toLowerCase().includes(lowercasedTerm) ||
            emp.dui.includes(lowercasedTerm) ||
            emp.position.toLowerCase().includes(lowercasedTerm)
        );
    }, [employees, employeeSearchTerm]);


    // --- Modal State ---
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);
    const [noveltyToDelete, setNoveltyToDelete] = useState<PayrollNovelty | null>(null);
    const [vacationToReset, setVacationToReset] = useState<Employee | null>(null);

    // --- Auth Handlers ---
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setView('dashboard'); 
    };

    // --- Employee Handlers ---
    const handleOpenEmployeeModal = (employee: Employee | null) => {
        setEmployeeToEdit(employee);
        setIsEmployeeModalOpen(true);
    };
    const handleCloseEmployeeModal = () => {
        setEmployeeToEdit(null);
        setIsEmployeeModalOpen(false);
    };
    const handleSaveEmployee = async (employee: Employee) => {
        const checkForDuplicate = (field: keyof Employee, value: string, label: string): boolean => {
            const normalizedValue = value.trim().toLowerCase();
            const duplicate = employees.find(emp => {
                if (employeeToEdit && emp.id === employeeToEdit.id) return false;
                const empValue = emp[field] ? String(emp[field]).trim().toLowerCase() : '';
                return empValue === normalizedValue;
            });
            if (duplicate) {
                setNotification({ message: `El ${label} "${value}" ya está registrado.`, type: 'error' });
                return true;
            }
            return false;
        };

        if (checkForDuplicate('name', employee.name, 'Nombre')) return;
        if (checkForDuplicate('dui', employee.dui, 'DUI')) return;
        if (checkForDuplicate('nit', employee.nit, 'NIT')) return;
        if (checkForDuplicate('isss', employee.isss, 'ISSS')) return;
        if (checkForDuplicate('nup', employee.nup, 'NUP')) return;

        try {
            if (employeeToEdit) {
                 await setDoc(doc(db, "employees", employeeToEdit.id), employee);
                 setNotification({ message: 'Empleado actualizado exitosamente.', type: 'success' });
            } else {
                const { id, ...employeeData } = employee;
                await addDoc(collection(db, "employees"), employeeData);
                setNotification({ message: 'Empleado creado exitosamente.', type: 'success' });
            }
            handleCloseEmployeeModal();
        } catch(e) {
            console.error("Error guardando empleado: ", e);
            setNotification({ message: 'Hubo un error al guardar el empleado.', type: 'error' });
        }
    };
    const handleDeleteEmployee = async () => {
        if (employeeToDelete) {
             try {
                await deleteDoc(doc(db, "employees", employeeToDelete.id));
                setNotification({ message: `Empleado "${employeeToDelete.name}" eliminado.`, type: 'success' });
             } catch(e) {
                console.error("Error eliminando empleado: ", e);
                setNotification({ message: 'Hubo un error al eliminar el empleado.', type: 'error' });
             }
            setEmployeeToDelete(null);
        }
    };

    // --- User Handlers (Admin only) ---
    const handleOpenUserModal = (user: User | null) => {
        setUserToEdit(user);
        setIsUserModalOpen(true);
    };
    const handleCloseUserModal = () => {
        setUserToEdit(null);
        setIsUserModalOpen(false);
    };
    const handleSaveUser = async (user: User) => {
        const usernameExists = users.some(existingUser => 
            existingUser.username.toLowerCase() === user.username.toLowerCase() && (!userToEdit || existingUser.id !== userToEdit.id)
        );

        if (usernameExists) {
            setNotification({ message: `El usuario "${user.username}" ya existe.`, type: 'error' });
            return;
        }

        try {
            if (userToEdit) {
                 await setDoc(doc(db, "users", userToEdit.id), user);
                 setNotification({ message: 'Usuario actualizado exitosamente.', type: 'success' });
            } else {
                const { id, ...userData } = user;
                await addDoc(collection(db, "users"), userData);
                setNotification({ message: 'Usuario creado exitosamente.', type: 'success' });
            }
            handleCloseUserModal();
        } catch(e) {
            console.error("Error guardando usuario: ", e);
            setNotification({ message: 'Hubo un error al guardar el usuario.', type: 'error' });
        }
    };
    const handleDeleteUser = async () => {
        if (userToDelete) {
            try {
                await deleteDoc(doc(db, "users", userToDelete.id));
                setNotification({ message: `Usuario "${userToDelete.username}" eliminado.`, type: 'success' });
            } catch(e) {
                console.error("Error eliminando usuario: ", e);
                setNotification({ message: 'Hubo un error al eliminar el usuario.', type: 'error' });
            }
            setUserToDelete(null);
        }
    };
    
    // --- Novelty Handlers ---
    const handleSaveNovelty = async (novelty: Omit<PayrollNovelty, 'id'>) => {
        try {
            await addDoc(collection(db, "novelties"), novelty);
            setNotification({ message: 'Novedad guardada exitosamente.', type: 'success' });
        } catch(e) {
            console.error("Error guardando novedad: ", e);
            setNotification({ message: 'Hubo un error al guardar la novedad.', type: 'error' });
        }
    };
    const handleDeleteNovelty = async () => {
        if (noveltyToDelete) {
            try {
                await deleteDoc(doc(db, "novelties", noveltyToDelete.id));
                setNotification({ message: 'Novedad eliminada exitosamente.', type: 'success' });
            } catch(e) {
                console.error("Error eliminando novedad: ", e);
                setNotification({ message: 'Hubo un error al eliminar la novedad.', type: 'error' });
            }
            setNoveltyToDelete(null);
        }
    };
    
    // --- Vacation Handlers ---
    const handlePayVacation = (employee: Employee) => {
        const currentYear = new Date().getFullYear();
        const alreadyPaid = novelties.some(n =>
            n.employeeId === employee.id &&
            n.type === 'vacation_pay' &&
            new Date(n.date).getFullYear() === currentYear
        );

        if (alreadyPaid) {
            setNotification({ message: `Las vacaciones para ${employee.name} ya fueron pagadas este año.`, type: 'info' });
            return;
        }

        const vacationBonus = (employee.baseSalary / 30) * 15 * 0.30;
        const vacationNovelty: Omit<PayrollNovelty, 'id'> = {
            employeeId: employee.id,
            employeeName: employee.name,
            date: new Date().toISOString().split('T')[0],
            type: 'vacation_pay',
            description: `Bono vacacional año ${currentYear}`,
            amount: vacationBonus
        };
        try {
            addDoc(collection(db, "novelties"), vacationNovelty);
            setNotification({ 
                message: `Bono vacacional de ${vacationBonus.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} registrado.`,
                type: 'success'
            });
        } catch (e) {
            console.error("Error guardando bono vacacional:", e);
            setNotification({ message: 'Hubo un error al registrar el bono vacacional.', type: 'error' });
        }
    };
    
    const handleResetVacation = async () => {
        if (!vacationToReset) return;

        const currentYear = new Date().getFullYear();
        const noveltyToDelete = novelties.find(n =>
            n.employeeId === vacationToReset.id &&
            n.type === 'vacation_pay' &&
            new Date(n.date).getFullYear() === currentYear
        );

        if (noveltyToDelete) {
             try {
                await deleteDoc(doc(db, "novelties", noveltyToDelete.id));
                setNotification({ message: `Pago de vacaciones para ${vacationToReset.name} ha sido restablecido.`, type: 'success' });
            } catch(e) {
                console.error("Error restableciendo vacación: ", e);
                setNotification({ message: 'Hubo un error al restablecer la vacación.', type: 'error' });
            }
        }
        setVacationToReset(null);
    };
    
    // --- Aguinaldo Handlers ---
    const handleConfirmAguinaldo = async (aguinaldoData: AguinaldoData[]) => {
        const currentYear = new Date().getFullYear();
        const aguinaldoNovelties: Omit<PayrollNovelty, 'id'>[] = aguinaldoData.map(data => ({
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            date: new Date().toISOString().split('T')[0],
            type: 'aguinaldo',
            description: `Aguinaldo ${currentYear}`,
            amount: data.amount,
        }));
        
        try {
            const batch = aguinaldoNovelties.map(novelty => addDoc(collection(db, "novelties"), novelty));
            await Promise.all(batch);
            setNotification({ message: 'Proceso de aguinaldo completado exitosamente.', type: 'success' });
        } catch(e) {
            console.error("Error guardando aguinaldos: ", e);
            setNotification({ message: 'Hubo un error al guardar los aguinaldos.', type: 'error' });
        }
    };


    // --- Payroll Handlers ---
    const handleDeletePayroll = async () => {
         if (payrollToDelete) {
             try {
                await deleteDoc(doc(db, "payrolls", payrollToDelete.id));
                setNotification({ message: `Planilla de ${payrollToDelete.period} eliminada.`, type: 'success' });
             } catch(e) {
                 console.error("Error eliminando planilla: ", e);
                 setNotification({ message: 'Hubo un error al eliminar la planilla.', type: 'error' });
             }
            setPayrollToDelete(null);
        }
    }
    
    const calculateDeductions = (salary: number): { deductions: DeductionDetails, totalDeductions: number } => {
        const isssCap = 1000;
        const isssDeduction = Math.min(salary, isssCap) * 0.03;
        const afpDeduction = salary * 0.0725;
        const taxableAfterAfpIsss = salary - isssDeduction - afpDeduction;
        
        let rentaDeduction = 0;
        if (taxableAfterAfpIsss > 2038.10) {
            rentaDeduction = ((taxableAfterAfpIsss - 2038.10) * 0.30) + 288.57;
        } else if (taxableAfterAfpIsss > 895.24) {
            rentaDeduction = ((taxableAfterAfpIsss - 895.24) * 0.20) + 60.00;
        } else if (taxableAfterAfpIsss > 550.00) {
            rentaDeduction = ((taxableAfterAfpIsss - 550.00) * 0.10) + 17.67;
        }
        
        const deductions: DeductionDetails = { isss: isssDeduction, afp: afpDeduction, renta: Math.max(0, rentaDeduction) };
        const totalDeductions = isssDeduction + afpDeduction + Math.max(0, rentaDeduction);
        return { deductions, totalDeductions };
    };

    const calculateEmployerContributions = (salary: number): EmployerContributions => {
        const isssContribution = Math.min(salary, 1000) * 0.075;
        const afpContribution = salary * 0.0875;
        return { isss: isssContribution, afp: afpContribution, total: isssContribution + afpContribution };
    }

    const handleRunPayroll = useCallback(async () => {
        const activeEmployees = employees.filter(emp => emp.status === 'active' || !emp.status);
        if (activeEmployees.length === 0) {
            setNotification({ message: 'No hay empleados activos para ejecutar la planilla.', type: 'info' });
            return;
        }
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const period = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const periodCapitalized = period.charAt(0).toUpperCase() + period.slice(1);

        if (payrolls.some(p => p.period === periodCapitalized)) {
            setNotification({ message: `La planilla para ${periodCapitalized} ya ha sido ejecutada.`, type: 'info' });
            return;
        }

        let totalPayrollCost = 0;
        const newPayslips: Payslip[] = activeEmployees.map(emp => {
            const employeeNovelties = novelties.filter(n => {
                const noveltyDate = new Date(n.date);
                return n.employeeId === emp.id && noveltyDate.getFullYear() === currentYear && noveltyDate.getMonth() === currentMonth;
            });

            const hourlyRate = emp.baseSalary / 30 / 8;
            const overtimePay = employeeNovelties.filter(n => n.type === 'overtime').reduce((total, n) => {
                const hours = n.overtimeHours || 0;
                let rateMultiplier = 0;
                switch (n.overtimeRateType) {
                    case 'day': rateMultiplier = 2; break;
                    case 'night': rateMultiplier = 2.25; break;
                    case 'holiday_day': rateMultiplier = 4; break;
                    case 'holiday_night': rateMultiplier = 4.5; break;
                }
                return total + (hours * hourlyRate * rateMultiplier);
            }, 0);
            
            const vacationPay = employeeNovelties.filter(n => n.type === 'vacation_pay').reduce((total, n) => total + (n.amount || 0), 0);
            const aguinaldoPay = employeeNovelties.filter(n => n.type === 'aguinaldo').reduce((total, n) => total + (n.amount || 0), 0);
            const expenses = employeeNovelties.filter(n => n.type === 'expense').reduce((total, n) => total + (n.amount || 0), 0);
            const otherDeductions = employeeNovelties.filter(n => n.type === 'unpaid_leave').reduce((total, n) => total + (n.amount || 0), 0);
            
            const baseForSocialSecurity = emp.baseSalary + overtimePay + vacationPay;
            
            const aguinaldoIsTaxable = emp.baseSalary > 1500;
            let grossPay = emp.baseSalary + overtimePay + vacationPay;
            if (aguinaldoIsTaxable && aguinaldoPay > 0) {
                grossPay += aguinaldoPay;
            }

            const { deductions, totalDeductions } = calculateDeductions(grossPay);
            const employerContributions = calculateEmployerContributions(baseForSocialSecurity);
            
            const totalEarnings = emp.baseSalary + overtimePay + vacationPay + aguinaldoPay + expenses;
            const netPay = totalEarnings - totalDeductions - otherDeductions;
            
            totalPayrollCost += baseForSocialSecurity + employerContributions.total + (aguinaldoPay > 0 ? aguinaldoPay : 0);

            return {
                employeeId: emp.id, employeeName: emp.name, baseSalary: emp.baseSalary,
                overtimePay, vacationPay, aguinaldoPay, aguinaldoIsTaxable, expenses, otherDeductions, grossPay,
                deductions, employerContributions, totalDeductions, netPay
            };
        });

        const newPayroll: Omit<Payroll, 'id'> = { period: periodCapitalized, date: now, payslips: newPayslips, totalCost: totalPayrollCost };
        
        try {
            await addDoc(collection(db, "payrolls"), newPayroll);
            setView('payroll');
            setNotification({ message: `Planilla para ${periodCapitalized} ejecutada exitosamente.`, type: 'success' });
        } catch(e) {
            console.error("Error ejecutando planilla: ", e);
            setNotification({ message: 'Hubo un error al ejecutar la planilla.', type: 'error' });
        }

    }, [employees, payrolls, novelties]);


    const renderView = () => {
        if (!currentUser) return null;
        switch (view) {
            case 'dashboard': return <Dashboard employees={employees} payrolls={payrolls} />;
            case 'employees': return <EmployeeList employees={filteredEmployees} onEdit={handleOpenEmployeeModal} onDelete={setEmployeeToDelete} currentUser={currentUser} />;
            case 'payroll': return <PayrollView payrolls={payrolls} onRunPayroll={handleRunPayroll} onDeletePayroll={setPayrollToDelete} currentUser={currentUser} />;
            case 'novelties': return <NoveltiesView employees={employees} novelties={novelties} onSave={handleSaveNovelty} onDelete={setNoveltyToDelete} currentUser={currentUser} />;
            case 'vacations': return <VacationsView employees={employees} novelties={novelties} onPayVacation={handlePayVacation} onResetVacation={setVacationToReset} currentUser={currentUser} />;
            case 'aguinaldo': return <AguinaldoView employees={employees} novelties={novelties} onConfirmAguinaldo={handleConfirmAguinaldo} currentUser={currentUser} />;
            case 'users': return currentUser.role === 'admin' ? <UserManagement users={users} onEdit={handleOpenUserModal} onDelete={setUserToDelete} currentUser={currentUser} /> : null;
            default: return <Dashboard employees={employees} payrolls={payrolls} />;
        }
    };

    const handleViewChange = (targetView: View) => {
        setView(targetView);
        setIsSidebarOpen(false);
    };

    const NavItem: React.FC<{
      currentView: View; targetView: View; onClick: (view: View) => void; icon: React.ReactNode; label: string;
    }> = ({ currentView, targetView, onClick, icon, label }) => (
      <li
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${ currentView === targetView ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}
        onClick={() => onClick(targetView)}>
        {icon}
        <span className="ml-3 font-medium">{label}</span>
      </li>
    );

    const fullPageLoader = (
        <div className="flex justify-center items-center h-screen bg-slate-100">
            <Spinner size="lg" />
        </div>
    );

    if (!currentUser) {
        return (
            <Suspense fallback={fullPageLoader}>
                <Login onLoginSuccess={handleLoginSuccess} />
            </Suspense>
        );
    }

    return (
        <div className="relative min-h-screen md:flex bg-slate-100">
             {notification && (
                <div
                    className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 py-3 px-6 rounded-lg shadow-xl flex items-center justify-between transition-all duration-300
                        ${notification.type === 'success' ? 'bg-green-500' : ''}
                        ${notification.type === 'error' ? 'bg-red-500' : ''}
                        ${notification.type === 'info' ? 'bg-indigo-500' : ''}
                        text-white`}
                >
                    <p className="font-medium mr-4">{notification.message}</p>
                    <button onClick={() => setNotification(null)} className="p-1 rounded-full hover:bg-black/20">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>
            )}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg flex flex-col p-4 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-3 mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-indigo-600">Sistema de Planillas</h1>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Grupo Corporativo Castillo</p>
                </div>
                <nav className="flex-grow">
                    <ul>
                        <NavItem currentView={view} targetView="dashboard" onClick={handleViewChange} icon={<DashboardIcon className="h-6 w-6" />} label="Dashboard" />
                        <NavItem currentView={view} targetView="employees" onClick={handleViewChange} icon={<UsersIcon className="h-6 w-6" />} label="Empleados" />
                        <NavItem currentView={view} targetView="novelties" onClick={handleViewChange} icon={<CalendarIcon className="h-6 w-6" />} label="Novedades" />
                        <NavItem currentView={view} targetView="vacations" onClick={handleViewChange} icon={<SunIcon className="h-6 w-6" />} label="Vacaciones" />
                        <NavItem currentView={view} targetView="aguinaldo" onClick={handleViewChange} icon={<GiftIcon className="h-6 w-6" />} label="Aguinaldo" />
                        <NavItem currentView={view} targetView="payroll" onClick={handleViewChange} icon={<DocumentReportIcon className="h-6 w-6" />} label="Planillas" />
                        {currentUser.role === 'admin' && (
                            <NavItem currentView={view} targetView="users" onClick={handleViewChange} icon={<ShieldCheckIcon className="h-6 w-6" />} label="Usuarios" />
                        )}
                    </ul>
                </nav>
                <div className="space-y-2">
                    <button onClick={() => handleOpenEmployeeModal(null)} className="w-full flex items-center justify-center p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow hover:shadow-md">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Nuevo Empleado</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow hover:shadow-md">
                        <LogoutIcon className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 mb-4 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-md">
                    <MenuIcon className="h-6 w-6" />
                </button>
                
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <>
                        {view === 'employees' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h1 className="text-3xl font-bold text-slate-800">Gestión de Empleados</h1>
                                    <button onClick={() => handleOpenEmployeeModal(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                                        <PlusIcon className="h-5 w-5 mr-2"/>Añadir Empleado
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                            </svg>
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre, DUI o puesto..."
                                            value={employeeSearchTerm}
                                            onChange={e => setEmployeeSearchTerm(e.target.value)}
                                            className="w-full py-2 pl-10 pr-4 text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {view === 'users' && currentUser.role === 'admin' && (
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
                                <button onClick={() => handleOpenUserModal(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                                    <PlusIcon className="h-5 w-5 mr-2"/>Añadir Usuario
                                </button>
                            </div>
                        )}
                        <Suspense fallback={
                             <div className="flex justify-center items-center h-full pt-16">
                                <Spinner size="lg" />
                            </div>
                        }>
                            {renderView()}
                        </Suspense>
                    </>
                )}
            </main>
            
            {/* --- Modals --- */}
            <Modal isOpen={isEmployeeModalOpen} onClose={handleCloseEmployeeModal} title={employeeToEdit ? 'Editar Empleado' : 'Añadir Nuevo Empleado'}>
                <Suspense fallback={<div className="flex justify-center p-8"><Spinner/></div>}>
                    <EmployeeForm onSave={handleSaveEmployee} onClose={handleCloseEmployeeModal} employeeToEdit={employeeToEdit} allEmployees={employees} />
                </Suspense>
            </Modal>
             <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={userToEdit ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}>
                <Suspense fallback={<div className="flex justify-center p-8"><Spinner/></div>}>
                    <UserForm onSave={handleSaveUser} onClose={handleCloseUserModal} userToEdit={userToEdit} allUsers={users} />
                </Suspense>
            </Modal>

            {/* --- Confirmation Modals --- */}
            <Modal isOpen={!!employeeToDelete} onClose={() => setEmployeeToDelete(null)} title="Confirmar Eliminación">
                <div className="text-center p-4">
                    <p className="text-lg text-slate-800 mb-4">¿Estás seguro de que quieres eliminar a <span className="font-bold">{employeeToDelete?.name}</span>?</p>
                    <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
                    <div className="flex justify-center mt-8 space-x-4">
                        <button onClick={() => setEmployeeToDelete(null)} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleDeleteEmployee} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Confirmar Eliminación">
                <div className="text-center p-4">
                    <p className="text-lg text-slate-800 mb-4">¿Estás seguro de que quieres eliminar al usuario <span className="font-bold">{userToDelete?.username}</span>?</p>
                    <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
                    <div className="flex justify-center mt-8 space-x-4">
                        <button onClick={() => setUserToDelete(null)} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleDeleteUser} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            </Modal>
             <Modal isOpen={!!payrollToDelete} onClose={() => setPayrollToDelete(null)} title="Confirmar Eliminación">
                <div className="text-center p-4">
                    <p className="text-lg text-slate-800 mb-4">¿Estás seguro de que quieres eliminar la planilla de <span className="font-bold">{payrollToDelete?.period}</span>?</p>
                    <p className="text-sm text-slate-500">Esta acción no se puede deshacer y eliminará todos los recibos de pago asociados.</p>
                    <div className="flex justify-center mt-8 space-x-4">
                        <button onClick={() => setPayrollToDelete(null)} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleDeletePayroll} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={!!noveltyToDelete} onClose={() => setNoveltyToDelete(null)} title="Confirmar Eliminación">
                <div className="text-center p-4">
                    <p className="text-lg text-slate-800 mb-4">¿Estás seguro de que quieres eliminar esta novedad?</p>
                    <p className="text-sm text-slate-600">"{noveltyToDelete?.description}" para <span className="font-bold">{noveltyToDelete?.employeeName}</span></p>
                    <div className="flex justify-center mt-8 space-x-4">
                        <button onClick={() => setNoveltyToDelete(null)} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleDeleteNovelty} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={!!vacationToReset} onClose={() => setVacationToReset(null)} title="Confirmar Restablecimiento">
                <div className="text-center p-4">
                    <p className="text-lg text-slate-800 mb-4">¿Estás seguro de que quieres restablecer el pago de vacaciones para <span className="font-bold">{vacationToReset?.name}</span>?</p>
                    <p className="text-sm text-slate-500">Esta eliminará la novedad de pago de este año y permitirá que se vuelva a pagar.</p>
                    <div className="flex justify-center mt-8 space-x-4">
                        <button onClick={() => setVacationToReset(null)} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleResetVacation} className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">Restablecer</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default App;