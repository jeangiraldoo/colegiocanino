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
import { RegisterPage } from "./pages/RegisterPage/RegisterPage"; // Importación añadida
import "./style.css";
import InternalUsers from "./pages/InternalUsersPage/InternalUsers";
import DashboardContent from "./pages/InternalUsersPage/children/DashboardContent";
import RegisterUser from "./pages/InternalUsersPage/children/RegisterUser";
import ManageUsers from "./pages/InternalUsersPage/children/ManageUsers";
import RegisterAttendance from "./pages/InternalUsersPage/children/RegisterAttendance";
import ViewAttendance from "./pages/InternalUsersPage/children/ViewAttendance";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				{/* Ruta añadida para la página de registro */}
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/" element={<HomePage />} />
				<Route path="/internal-users" element={<InternalUsers />}>
					<Route index element={<Navigate to="dashboard" replace />} />
					<Route path="dashboard" element={<DashboardContent />} />
					<Route path="registrar-usuarios" element={<RegisterUser />} />
					<Route path="administrar-usuarios" element={<ManageUsers />} />
					<Route path="registrar-asistencia" element={<RegisterAttendance />} />
					<Route path="visualizar-asistencia" element={<ViewAttendance />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
