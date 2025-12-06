// client/src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { HomePage } from "./pages/HomePage/HomePage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import PageTransition from "./components/PageTransition";
import "./style.css";

// Import Internal User Pages
import InternalUsers from "./pages/InternalUsersPage/InternalUsers";
import DashboardContent from "./pages/InternalUsersPage/children/DashboardContent";
import RegisterUser from "./pages/InternalUsersPage/children/RegisterUser";
import ManageUsers from "./pages/InternalUsersPage/children/ManageUsers";
import RegisterAttendance from "./pages/InternalUsersPage/children/RegisterAttendance";
import ViewAttendance from "./pages/InternalUsersPage/children/ViewAttendance";
import ReportsPage from "./pages/InternalUsersPage/children/ReportsPage";
import EnrollmentByPlanReport from "./pages/InternalUsersPage/children/EnrollmentByPlanReport";
import RoleGuard from "./components/RoleGuard";

// Import Client Pages
import ClientPage from "./pages/ClientPage/ClientPage";
import ClientDashboard from "./pages/ClientPage/children/ClientDashboard";
import MyPets from "./pages/ClientPage/children/MyPets";
import ClientProfile from "./pages/ClientPage/children/ClientProfile";
import PetDetailPage from "./pages/ClientPage/children/PetDetailPage";
import EnrollCanine from "./pages/ClientPage/children/EnrollCanine";

function AnimatedRoutes() {
	const location = useLocation();

	return (
		<AnimatePresence mode="wait">
			<Routes location={location} key={location.pathname}>
				<Route
					path="/login"
					element={
						<PageTransition>
							<LoginPage />
						</PageTransition>
					}
				/>
				<Route
					path="/register"
					element={
						<PageTransition>
							<RegisterPage />
						</PageTransition>
					}
				/>
				<Route
					path="/"
					element={
						<PageTransition>
							<HomePage />
						</PageTransition>
					}
				/>

				{/* --- Internal Users Routes --- */}
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
					{/* --- Nested Routes for Reports --- */}
					<Route
						path="reportes"
						element={
							<RoleGuard allowed={["ADMIN", "DIRECTOR"]}>
								<ReportsPage />
							</RoleGuard>
						}
					/>
					<Route
						path="reportes/matriculas-por-plan"
						element={
							<RoleGuard allowed={["ADMIN", "DIRECTOR"]}>
								<EnrollmentByPlanReport />
							</RoleGuard>
						}
					/>
				</Route>

				{/* --- Client Portal Routes --- */}
				<Route path="/portal-cliente" element={<ClientPage />}>
					<Route index element={<Navigate to="dashboard" replace />} />
					<Route path="dashboard" element={<ClientDashboard />} />
					<Route path="mis-mascotas" element={<MyPets />} />
					<Route path="mis-mascotas/:canineId" element={<PetDetailPage />} />
					<Route path="perfil" element={<ClientProfile />} />
					<Route path="matricular-canino" element={<EnrollCanine />} />
				</Route>
			</Routes>
		</AnimatePresence>
	);
}

function App() {
	return (
		<Router>
			<AnimatedRoutes />
		</Router>
	);
}

export default App;
