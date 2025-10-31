import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import logoSrc from "../../assets/logo.png";

export const InternalUsersPage = () => {
	const username = "Admin01";
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
						<img src={logoSrc} alt="Logo" className="sidebar-logo" />
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
							<p className="welcome-username font-montserrat">{username}!</p>
						</div>
					</div>
				</div>
				<nav className="flex-1 px-3 py-4 space-y-1 font-montserrat">
					<Link
						to="dashboard"
						className={`sidebar-link has-hover-indicator ${isActive("dashboard") ? "active" : ""}`}
					>
						<DashboardIcon className="sidebar-icon" />
						<span className="sidebar-text">Dashboard</span>
					</Link>

					<Link
						to="registrar-usuarios"
						className="sidebar-link has-hover-indicator"
					>
						<PersonAddIcon className="sidebar-icon" />
						<span className="sidebar-text">Registrar usuarios</span>
					</Link>

					<Link
						to="administrar-usuarios"
						className="sidebar-link has-hover-indicator"
					>
						<SupervisorAccountIcon className="sidebar-icon" />
						<span className="sidebar-text">Administrar Usuarios</span>
					</Link>

					<Link
						to="registrar-asistencia"
						className="sidebar-link has-hover-indicator"
					>
						<EventAvailableIcon className="sidebar-icon" />
						<span className="sidebar-text">Registrar asistencia</span>
					</Link>

					<Link
						to="visualizar-asistencia"
						className="sidebar-link has-hover-indicator"
					>
						<VisibilityIcon className="sidebar-icon" />
						<span className="sidebar-text">Visualizar asistencia</span>
					</Link>
				</nav>
				<div
					className="p-4 border-t"
					style={{ borderColor: "rgba(15,23,32,0.06)" }}
				>
					<Link
						to="configuracion"
						className="sidebar-action has-hover-indicator font-montserrat"
					>
						<SettingsIcon className="sidebar-icon-action" />
						<span className="sidebar-text-action">Configuración</span>
					</Link>

					<button
						type="button"
						onClick={() => {}}
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

export default InternalUsersPage;
