import React, { useState, useCallback } from 'react';
import { Employee, Payroll, Payslip, View } from './types';
import { DashboardIcon, UsersIcon, DocumentReportIcon, PlusIcon, LogoutIcon } from './components/icons';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import PayrollView from './components/PayrollView';
import Modal from './components/Modal';
import Login from './components/Login';

// Dummy Data
const initialEmployees: Employee[] = [
    { 
        id: '1', 
        name: 'Ana Morales', 
        dui: '01234567-8',
        nit: '0101-150392-101-1',
        isss: '123456789',
        nup: '9876543210',
        position: 'Desarrolladora Frontend Senior', 
        baseSalary: 6250, 
        contractType: 'mensual',
        hireDate: '2022-03-15', 
        afpType: 'Confía',
        jobDescription: 'Responsable de crear interfaces de usuario interactivas y responsivas.' 
    },
    { 
        id: '2', 
        name: 'Carlos Rivera', 
        dui: '87654321-0',
        nit: '0202-010891-102-2',
        isss: '987654321',
        nup: '0123456789',
        position: 'Ingeniero de Backend', 
        baseSalary: 6667, 
        contractType: 'mensual',
        hireDate: '2021-08-01', 
        afpType: 'Crecer',
        jobDescription: 'Mantiene la lógica del servidor, las bases de datos y las APIs.' 
    },
    { 
        id: '3', 
        name: 'Lucía Fernández', 
        dui: '11223344-5',
        nit: '0303-200193-103-3',
        isss: '112233445',
        nup: '5544332211',
        position: 'Diseñadora UX/UI', 
        baseSalary: 5667, 
        contractType: 'mensual',
        hireDate: '2023-01-20', 
        afpType: 'Confía',
        jobDescription: 'Diseña experiencias de usuario intuitivas y visualmente atractivas.' 
    },
];

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [view, setView] = useState<View>('dashboard');
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setView('dashboard'); 
    };

    const handleOpenModal = (employee: Employee | null) => {
        setEmployeeToEdit(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEmployeeToEdit(null);
        setIsModalOpen(false);
    };

    const handleSaveEmployee = (employee: Employee) => {
        if (employeeToEdit) {
            setEmployees(employees.map(e => e.id === employee.id ? employee : e));
        } else {
            setEmployees([...employees, employee]);
        }
        handleCloseModal();
    };

    const handleOpenDeleteConfirm = (employee: Employee) => {
        setEmployeeToDelete(employee);
    };

    const handleCloseDeleteConfirm = () => {
        setEmployeeToDelete(null);
    };

    const handleDeleteEmployee = () => {
        if (employeeToDelete) {
            setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
            handleCloseDeleteConfirm();
        }
    };

    const handleRunPayroll = useCallback(() => {
        if (employees.length === 0) {
            alert("No hay empleados para ejecutar la planilla.");
            return;
        }

        const now = new Date();
        const period = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const periodCapitalized = period.charAt(0).toUpperCase() + period.slice(1);

        if (payrolls.some(p => p.period === periodCapitalized)) {
            alert(`La planilla para ${periodCapitalized} ya ha sido ejecutada.`);
            return;
        }

        const newPayslips: Payslip[] = employees.map(emp => {
            // Note: This is a simplified calculation. Real payroll would depend on contractType.
            const grossPay = emp.baseSalary; 
            const deductions = grossPay * 0.20; // 20% flat tax for simplicity
            const netPay = grossPay - deductions;
            return { employeeId: emp.id, employeeName: emp.name, grossPay, deductions, netPay };
        });

        const totalCost = newPayslips.reduce((acc, slip) => acc + slip.grossPay, 0);

        const newPayroll: Payroll = {
            id: new Date().toISOString(),
            period: periodCapitalized,
            date: now,
            payslips: newPayslips,
            totalCost
        };

        setPayrolls(prev => [newPayroll, ...prev]);
        setView('payroll');
        alert(`Planilla para ${periodCapitalized} ejecutada exitosamente.`);
    }, [employees, payrolls]);


    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard employees={employees} payrolls={payrolls} />;
            case 'employees':
                return <EmployeeList employees={employees} onEdit={handleOpenModal} onDelete={handleOpenDeleteConfirm} />;
            case 'payroll':
                return <PayrollView payrolls={payrolls} onRunPayroll={handleRunPayroll} />;
            default:
                return <Dashboard employees={employees} payrolls={payrolls} />;
        }
    };

    const NavItem: React.FC<{
      currentView: View;
      targetView: View;
      onClick: (view: View) => void;
      icon: React.ReactNode;
      label: string;
    }> = ({ currentView, targetView, onClick, icon, label }) => (
      <li
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
          currentView === targetView
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
        }`}
        onClick={() => onClick(targetView)}
      >
        {icon}
        <span className="ml-3 font-medium">{label}</span>
      </li>
    );

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex h-screen bg-slate-100">
            <aside className="w-64 bg-white shadow-lg flex flex-col p-4">
                <div className="text-2xl font-bold text-indigo-600 mb-8 p-3">PlanillasPro</div>
                <nav className="flex-grow">
                    <ul>
                        <NavItem currentView={view} targetView="dashboard" onClick={setView} icon={<DashboardIcon className="h-6 w-6" />} label="Dashboard" />
                        <NavItem currentView={view} targetView="employees" onClick={setView} icon={<UsersIcon className="h-6 w-6" />} label="Empleados" />
                        <NavItem currentView={view} targetView="payroll" onClick={setView} icon={<DocumentReportIcon className="h-6 w-6" />} label="Planillas" />
                    </ul>
                </nav>
                <div className="space-y-2">
                    <button onClick={() => handleOpenModal(null)} className="w-full flex items-center justify-center p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow hover:shadow-md">
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
                {view === 'employees' && (
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-800">Gestión de Empleados</h1>
                        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2"/>
                            Añadir Empleado
                        </button>
                    </div>
                )}
                {renderView()}
            </main>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={employeeToEdit ? 'Editar Empleado' : 'Añadir Nuevo Empleado'}>
                <EmployeeForm onSave={handleSaveEmployee} onClose={handleCloseModal} employeeToEdit={employeeToEdit} />
            </Modal>

            {employeeToDelete && (
                <Modal
                    isOpen={!!employeeToDelete}
                    onClose={handleCloseDeleteConfirm}
                    title="Confirmar Eliminación"
                >
                    <div className="text-center p-4">
                        <p className="text-lg text-slate-800 mb-4">
                            ¿Estás seguro de que quieres eliminar a <span className="font-bold">{employeeToDelete.name}</span>?
                        </p>
                        <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center mt-8 space-x-4">
                            <button
                                onClick={handleCloseDeleteConfirm}
                                className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteEmployee}
                                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default App;