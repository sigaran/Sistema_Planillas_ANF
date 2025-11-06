import React, { useState, useCallback, useEffect } from 'react';
import { db } from './firebase-config';
import { Employee, Payroll, Payslip, View, DeductionDetails, EmployerContributions, User, PayrollNovelty } from './types';
import { DashboardIcon, UsersIcon, DocumentReportIcon, PlusIcon, LogoutIcon, ShieldCheckIcon, CalendarIcon, SunIcon, GiftIcon, MenuIcon, CloseIcon } from './components/icons';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import PayrollView from './components/PayrollView';
import UserManagement from './components/UserManagement';
import NoveltiesView from './components/NoveltiesView';
import VacationsView from './components/VacationsView';
import AguinaldoView from './components/AguinaldoView';
import UserForm from './components/UserForm';
import Modal from './components/Modal';
import Login from './components/Login';
import Spinner from './components/Spinner';


export interface AguinaldoData {
    employeeId: string;
    employeeName: string;
    amount: number;
    isTaxable: boolean;
}

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
    
    // --- Data Fetching from Firestore ---
    useEffect(() => {
        if (!currentUser) return; // Don't fetch if not logged in

        setIsLoading(true);
        const queries = [
            // FIX: Use Firebase v8 compat syntax for onSnapshot
            db.collection("users").onSnapshot((snapshot) => 
                setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)))
            ),
            // FIX: Use Firebase v8 compat syntax for onSnapshot
            db.collection("employees").onSnapshot((snapshot) => 
                setEmployees(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Employee)))
            ),
            // FIX: Use Firebase v8 compat syntax for onSnapshot
            db.collection("novelties").onSnapshot((snapshot) => 
                setNovelties(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PayrollNovelty)))
            ),
            // FIX: Use Firebase v8 compat syntax for query with onSnapshot
            db.collection("payrolls").orderBy("date", "desc").onSnapshot((snapshot) => {
                 setPayrolls(snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Firestore timestamp needs to be converted to JS Date
                    return { ...data, id: doc.id, date: data.date.toDate() } as Payroll;
                }));
            }),
        ];
        
        Promise.all(queries.map(q => new Promise(resolve => setTimeout(resolve, 0)))).then(() => {
            setIsLoading(false);
        });

        // Cleanup function to unsubscribe from listeners
        return () => queries.forEach(unsubscribe => unsubscribe());

    }, [currentUser]);


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
                alert(`El ${label} "${value}" ya está registrado para el empleado ${duplicate.name}.`);
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
                 // FIX: Use Firebase v8 compat syntax for setDoc
                 await db.collection("employees").doc(employeeToEdit.id).set(employee);
            } else {
                const { id, ...employeeData } = employee;
                // FIX: Use Firebase v8 compat syntax for addDoc
                await db.collection("employees").add(employeeData);
            }
        } catch(e) {
            console.error("Error guardando empleado: ", e);
            alert("Hubo un error al guardar el empleado.");
        }
        handleCloseEmployeeModal();
    };
    const handleDeleteEmployee = async () => {
        if (employeeToDelete) {
             try {
                // FIX: Use Firebase v8 compat syntax for deleteDoc
                await db.collection("employees").doc(employeeToDelete.id).delete();
             } catch(e) {
                console.error("Error eliminando empleado: ", e);
                alert("Hubo un error al eliminar el empleado.");
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
            alert(`El nombre de usuario "${user.username}" ya existe. Por favor, elige otro.`);
            return; // Stop the save operation
        }

        try {
            if (userToEdit) {
                 // FIX: Use Firebase v8 compat syntax for setDoc
                 await db.collection("users").doc(userToEdit.id).set(user);
            } else {
                const { id, ...userData } = user;
                // FIX: Use Firebase v8 compat syntax for addDoc
                await db.collection("users").add(userData);
            }
        } catch(e) {
            console.error("Error guardando usuario: ", e);
            alert("Hubo un error al guardar el usuario.");
        }
        handleCloseUserModal();
    };
    const handleDeleteUser = async () => {
        if (userToDelete) {
            try {
                // FIX: Use Firebase v8 compat syntax for deleteDoc
                await db.collection("users").doc(userToDelete.id).delete();
            } catch(e) {
                console.error("Error eliminando usuario: ", e);
                alert("Hubo un error al eliminar el usuario.");
            }
            setUserToDelete(null);
        }
    };
    
    // --- Novelty Handlers ---
    const handleSaveNovelty = async (novelty: Omit<PayrollNovelty, 'id'>) => {
        try {
            // FIX: Use Firebase v8 compat syntax for addDoc
            await db.collection("novelties").add(novelty);
        } catch(e) {
            console.error("Error guardando novedad: ", e);
            alert("Hubo un error al guardar la novedad.");
        }
    };
    const handleDeleteNovelty = async () => {
        if (noveltyToDelete) {
            try {
                // FIX: Use Firebase v8 compat syntax for deleteDoc
                await db.collection("novelties").doc(noveltyToDelete.id).delete();
            } catch(e) {
                console.error("Error eliminando novedad: ", e);
                alert("Hubo un error al eliminar la novedad.");
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
            alert(`Las vacaciones para ${employee.name} ya fueron pagadas este año.`);
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
        handleSaveNovelty(vacationNovelty);
        alert(`Bono vacacional de ${vacationBonus.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} registrado para ${employee.name}. Se reflejará en la próxima planilla.`);
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
                // FIX: Use Firebase v8 compat syntax for deleteDoc
                await db.collection("novelties").doc(noveltyToDelete.id).delete();
            } catch(e) {
                console.error("Error restableciendo vacación: ", e);
                alert("Hubo un error al restablecer la vacación.");
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
            // Batch write would be better for production, but this is fine for now
            for (const novelty of aguinaldoNovelties) {
                // FIX: Use Firebase v8 compat syntax for addDoc
                await db.collection("novelties").add(novelty);
            }
            alert('Proceso de aguinaldo completado. Los pagos se han generado como novedades y se incluirán en la planilla del mes en curso.');
        } catch(e) {
            console.error("Error guardando aguinaldos: ", e);
            alert("Hubo un error al guardar los aguinaldos.");
        }
    };


    // --- Payroll Handlers ---
    const handleDeletePayroll = async () => {
         if (payrollToDelete) {
             try {
                // FIX: Use Firebase v8 compat syntax for deleteDoc
                await db.collection("payrolls").doc(payrollToDelete.id).delete();
             } catch(e) {
                 console.error("Error eliminando planilla: ", e);
                 alert("Hubo un error al eliminar la planilla.");
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
        } else if (taxableAfterAfpIsss > 472.00) { // Tramo II
            rentaDeduction = ((taxableAfterAfpIsss - 472.00) * 0.10) + 17.67;
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
        if (employees.length === 0) {
            alert("No hay empleados para ejecutar la planilla.");
            return;
        }
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const period = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const periodCapitalized = period.charAt(0).toUpperCase() + period.slice(1);

        if (payrolls.some(p => p.period === periodCapitalized)) {
            alert(`La planilla para ${periodCapitalized} ya ha sido ejecutada.`);
            return;
        }

        let totalPayrollCost = 0;
        const newPayslips: Payslip[] = employees.map(emp => {
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
            // FIX: Use Firebase v8 compat syntax for addDoc
            await db.collection("payrolls").add(newPayroll);
            setView('payroll');
            alert(`Planilla para ${periodCapitalized} ejecutada exitosamente con las novedades del mes.`);
        } catch(e) {
            console.error("Error ejecutando planilla: ", e);
            alert("Hubo un error al ejecutar la planilla.");
        }

    }, [employees, payrolls, novelties]);


    const renderView = () => {
        if (!currentUser || isLoading) return null;
        switch (view) {
            case 'dashboard': return <Dashboard employees={employees} payrolls={payrolls} />;
            case 'employees': return <EmployeeList employees={employees} onEdit={handleOpenEmployeeModal} onDelete={setEmployeeToDelete} currentUser={currentUser} />;
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
        setIsSidebarOpen(false); // Close sidebar on mobile after navigation
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

    if (!currentUser) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="relative min-h-screen md:flex bg-slate-100">
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
                
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <Spinner size="lg" />
                    </div>
                )}
                
                {view === 'employees' && !isLoading && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-800">Gestión de Empleados</h1>
                        <button onClick={() => handleOpenEmployeeModal(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2"/>Añadir Empleado
                        </button>
                    </div>
                )}
                 {view === 'users' && currentUser.role === 'admin' && !isLoading && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
                        <button onClick={() => handleOpenUserModal(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2"/>Añadir Usuario
                        </button>
                    </div>
                )}
                {renderView()}
            </main>
            
            {/* --- Modals --- */}
            <Modal isOpen={isEmployeeModalOpen} onClose={handleCloseEmployeeModal} title={employeeToEdit ? 'Editar Empleado' : 'Añadir Nuevo Empleado'}>
                <EmployeeForm onSave={handleSaveEmployee} onClose={handleCloseEmployeeModal} employeeToEdit={employeeToEdit} allEmployees={employees} />
            </Modal>
             <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={userToEdit ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}>
                <UserForm onSave={handleSaveUser} onClose={handleCloseUserModal} userToEdit={userToEdit} allUsers={users} />
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