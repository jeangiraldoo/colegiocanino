// client/src/App.tsx

import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { HomePage } from "./pages/HomePage/HomePage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import "./style.css";

// Importaciones para Usuarios Internos
import InternalUsers from "./pages/InternalUsersPage/InternalUsers";
import DashboardContent from "./pages/InternalUsersPage/children/DashboardContent";
import RegisterUser from "./pages/InternalUsersPage/children/RegisterUser";
import ManageUsers from "./pages/InternalUsersPage/children/ManageUsers";
import RegisterAttendance from "./pages/InternalUsersPage/children/RegisterAttendance";
import ViewAttendance from "./pages/InternalUsersPage/children/ViewAttendance";

// --- NUEVAS IMPORTACIONES PARA EL PORTAL DEL CLIENTE ---
import ClientPage from "./pages/ClientPage/ClientPage";
import ClientDashboard from "./pages/ClientPage/children/ClientDashboard";
import MyPets from "./pages/ClientPage/children/MyPets";
import ClientProfile from "./pages/ClientPage/children/ClientProfile";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/" element={<HomePage />} />

				{/* Rutas para Usuarios Internos (sin cambios) */}
				<Route path="/internal-users" element={<InternalUsers />}>
					<Route index element={<Navigate to="dashboard" replace />} />
					<Route path="dashboard" element={<DashboardContent />} />
					<Route path="registrar-usuarios" element={<RegisterUser />} />
					<Route path="administrar-usuarios" element={<ManageUsers />} />
					<Route path="registrar-asistencia" element={<RegisterAttendance />} />
					<Route path="visualizar-asistencia" element={<ViewAttendance />} />
				</Route>

				{/* --- NUEVA SECCIÓN DE RUTAS PARA EL PORTAL DEL CLIENTE --- */}
				<Route path="/portal-cliente" element={<ClientPage />}>
					<Route index element={<Navigate to="dashboard" replace />} />
					<Route path="dashboard" element={<ClientDashboard />} />
					<Route path="mis-mascotas" element={<MyPets />} />
					<Route path="perfil" element={<ClientProfile />} />
					{/* Aquí se añadiría la ruta para la matrícula en el futuro */}
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
