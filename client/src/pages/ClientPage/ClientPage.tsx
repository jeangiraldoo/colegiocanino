// client/src/pages/ClientPage/ClientPage.tsx

import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PetsIcon from "@mui/icons-material/Pets";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import logoSrc from "../../assets/raices-caninas-logo-circular.png";

export const ClientPage = () => {
	// Mock data, se reemplazará con datos reales del usuario logueado
	const clientName = "Cliente Ejemplo";
	const lastLogin = new Date().toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
	const loc = useLocation();
	const isActive = (p: string) => loc.pathname.endsWith(p);

	return (
		<div
			className="app-layout h-screen w-screen flex"
			style={{ backgroundColor: "var(--page-bg)" }}
		>
			<aside className="w-80 sidebar flex flex-col">
				<div
					className="p-4 flex flex-col items-start gap-3 border-b"
					style={{ borderColor: "rgba(15,23,32,0.06)" }}
				>
					<div className="flex items-center gap-3 w-full">
						<img
							src={logoSrc}
							alt="Logo Raíces Caninas"
							className="sidebar-logo"
						/>
					</div>

					<div className="last-login-box font-montserrat">
						<CalendarTodayIcon className="last-login-icon" />
						<span className="last-login-text">Ult. sesión: {lastLogin}</span>
					</div>

					<div className="mt-3 flex items-center gap-3">
						<div className="user-avatar">
							<PersonIcon className="user-icon" />
						</div>
						<div>
							<p className="welcome-text font-montserrat">¡Bienvenido</p>
							<p className="welcome-username font-montserrat">{clientName}!</p>
						</div>
					</div>
				</div>
				<nav className="flex-1 px-3 py-4 space-y-1 font-montserrat">
					<Link
						to="dashboard"
						className={`sidebar-link has-hover-indicator ${isActive("dashboard") ? "active" : ""}`}
					>
						<DashboardIcon className="sidebar-icon" />
						<span className="sidebar-text">Mi Panel</span>
					</Link>

					<Link to="mis-mascotas" className="sidebar-link has-hover-indicator">
						<PetsIcon className="sidebar-icon" />
						<span className="sidebar-text">Mis Mascotas</span>
					</Link>

					<Link to="perfil" className="sidebar-link has-hover-indicator">
						<SettingsIcon className="sidebar-icon" />
						<span className="sidebar-text">Mi Perfil</span>
					</Link>
				</nav>
				<div
					className="p-4 border-t"
					style={{ borderColor: "rgba(15,23,32,0.06)" }}
				>
					<button
						type="button"
						onClick={() => {
							/* Lógica de cerrar sesión */
						}}
						className="sidebar-logout has-hover-indicator mt-3 w-full text-left rounded text-sm font-montserrat"
					>
						<LogoutIcon className="sidebar-icon-logout" />
						<span className="sidebar-text-logout">Cerrar sesión</span>
					</button>
				</div>
			</aside>

			<main className="flex-1 p-6 main-scroll" role="main">
				<Outlet />
			</main>
		</div>
	);
};

export default ClientPage;
