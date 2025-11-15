import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { HomePage } from "./pages/HomePage/HomePage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import "./style.css";

import InternalUsers from "./pages/InternalUsersPage/InternalUsers";
import DashboardContent from "./pages/InternalUsersPage/children/DashboardContent";
import RegisterUser from "./pages/InternalUsersPage/children/RegisterUser";
import ManageUsers from "./pages/InternalUsersPage/children/ManageUsers";
import RegisterAttendance from "./pages/InternalUsersPage/children/RegisterAttendance";
import ViewAttendance from "./pages/InternalUsersPage/children/ViewAttendance";
import RoleGuard from "./components/RoleGuard";

import ClientPage from "./pages/ClientPage/ClientPage";
import ClientDashboard from "./pages/ClientPage/children/ClientDashboard";
import MyPets from "./pages/ClientPage/children/MyPets";
import ClientProfile from "./pages/ClientPage/children/ClientProfile";
import PetDetailPage from "./pages/ClientPage/children/PetDetailPage";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/" element={<HomePage />} />

				<Route path="/internal-users" element={<InternalUsers />}>
					<Route index element={<Navigate to="dashboard" replace />} />
					<Route
						path="dashboard"
						element={
							<RoleGuard allowed={["ADMIN", "COACH", "DIRECTOR"]}>
								<DashboardContent />
							</RoleGuard>
						}
					/>
					<Route
						path="registrar-usuarios"
						element={
							<RoleGuard allowed={["ADMIN"]}>
								<RegisterUser />
							</RoleGuard>
						}
					/>
					<Route
						path="administrar-usuarios"
						element={
							<RoleGuard allowed={["ADMIN"]}>
								<ManageUsers />
							</RoleGuard>
						}
					/>
					<Route
						path="registrar-asistencia"
						element={
							<RoleGuard allowed={["ADMIN", "COACH", "DIRECTOR"]}>
								<RegisterAttendance />
							</RoleGuard>
						}
					/>
					<Route
						path="visualizar-asistencia"
						element={
							<RoleGuard allowed={["ADMIN", "COACH", "DIRECTOR"]}>
								<ViewAttendance />
							</RoleGuard>
						}
					/>
				</Route>

				<Route path="/portal-cliente" element={<ClientPage />}>
					<Route index element={<Navigate to="dashboard" replace />} />
					<Route path="dashboard" element={<ClientDashboard />} />
					<Route path="mis-mascotas" element={<MyPets />} />
					<Route path="mis-mascotas/:canineId" element={<PetDetailPage />} />
					<Route path="perfil" element={<ClientProfile />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
