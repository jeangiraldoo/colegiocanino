// client/src/pages/InternalUsersPage/InternalUsers.tsx

import { useEffect, useState } from "react";
import apiClient from "../../api/axiosConfig";
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
import PetsIcon from "@mui/icons-material/Pets";
import AssessmentIcon from "@mui/icons-material/Assessment";
import logoSrc from "../../assets/logo.png";

export const InternalUsersPage = () => {
	const [username, setUsername] = useState<string>("");
	const lastLogin = new Date().toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
	const loc = useLocation();
	const isActive = (p: string) => loc.pathname.includes(p);

	const [role] = useState<string | null>(() => {
		return localStorage.getItem("user_role") || sessionStorage.getItem("user_role") || null;
	});

	async function resolveAccessToken() {
		const storages = [
			{
				name: "session",
				access: sessionStorage.getItem("access_token"),
				refresh: sessionStorage.getItem("refresh_token"),
			},
			{
				name: "local",
				access: localStorage.getItem("access_token"),
				refresh: localStorage.getItem("refresh_token"),
			},
		];

		for (const s of storages) {
			if (s.access) {
				try {
					const payload = JSON.parse(atob(s.access.split(".")[1]));
					if (!payload.token_type || String(payload.token_type).toLowerCase() === "access") {
						return { token: s.access, storage: s.name };
					}
				} catch {
					return { token: s.access, storage: s.name };
				}
			}
		}

		for (const s of storages) {
			if (s.refresh) {
				try {
					const res = await apiClient.post(
						"/api/token/refresh/",
						{ refresh: s.refresh },
						{
							headers: { "Content-Type": "application/json", Accept: "application/json" },
							validateStatus: () => true,
						},
					);
					if (res.status >= 200 && res.status < 300) {
						const data = res.data ?? {};
						const newAccess = data.access;
						if (s.name === "session") sessionStorage.setItem("access_token", newAccess);
						else localStorage.setItem("access_token", newAccess);
						return { token: newAccess, storage: s.name };
					}
				} catch {
					/* ignore and continue */
				}
			}
		}
		return null;
	}

	useEffect(() => {
		(async () => {
			const resolved = await resolveAccessToken();
			if (!resolved) return;
			const token = resolved.token;

			try {
				const res = await apiClient.get("/api/users/me/", {
					headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
					validateStatus: () => true,
				});
				if (res.status === 401) {
					const refreshed = await resolveAccessToken();
					if (!refreshed) return;
					const retry = await apiClient.get("/api/users/me/", {
						headers: { Authorization: `Bearer ${refreshed.token}`, Accept: "application/json" },
						validateStatus: () => true,
					});
					if (!(retry.status >= 200 && retry.status < 300)) return;
					const data = retry.data ?? {};
					const display =
						[data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || "";
					setUsername(display);
					return;
				}
				if (!(res.status >= 200 && res.status < 300)) return;
				const data = res.data ?? {};
				const display =
					[data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || "";
				setUsername(display);
			} catch {
				/* silent fail */
			}
		})();
	}, []);

	// Define role permissions
	const canAccess = {
		ADMIN: {
			dashboard: true,
			registerUsers: true,
			manageUsers: true,
			registerAttendance: true,
			viewAttendance: true,
			listCanines: true,
			reports: true,
		},
		DIRECTOR: {
			dashboard: true,
			registerUsers: false,
			manageUsers: false,
			registerAttendance: true,
			viewAttendance: true,
			listCanines: true,
			reports: true,
		},
		ADVISOR: {
			dashboard: true,
			registerUsers: false,
			manageUsers: false,
			registerAttendance: false,
			viewAttendance: false,
			listCanines: false,
			reports: false,
		},
		COACH: {
			dashboard: false,
			registerUsers: false,
			manageUsers: false,
			registerAttendance: true,
			viewAttendance: true,
			listCanines: true,
			reports: false,
		},
	}[role ?? "ADVISOR"] ?? {
		dashboard: false,
		registerUsers: false,
		manageUsers: false,
		registerAttendance: false,
		viewAttendance: false,
		listCanines: false,
		reports: false,
	};

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
							<p className="welcome-username font-montserrat">
								{username ? `${username}!` : "¡Usuario!"}
							</p>
							{role && (
								<div className="text-xs" style={{ color: "var(--muted-color)" }}>
									Rol: {role}
								</div>
							)}
						</div>
					</div>
				</div>
				<nav className="flex-1 px-3 py-4 space-y-1 font-montserrat">
					{canAccess.dashboard && (
						<Link
							to="dashboard"
							className={`sidebar-link has-hover-indicator ${isActive("dashboard") ? "active" : ""}`}
						>
							<DashboardIcon className="sidebar-icon" />
							<span className="sidebar-text">Dashboard</span>
						</Link>
					)}
					{canAccess.registerUsers && (
						<Link
							to="registrar-usuarios"
							className={`sidebar-link has-hover-indicator ${isActive("registrar-usuarios") ? "active" : ""}`}
						>
							<PersonAddIcon className="sidebar-icon" />
							<span className="sidebar-text">Registrar usuarios</span>
						</Link>
					)}
					{canAccess.manageUsers && (
						<Link
							to="administrar-usuarios"
							className={`sidebar-link has-hover-indicator ${isActive("administrar-usuarios") ? "active" : ""}`}
						>
							<SupervisorAccountIcon className="sidebar-icon" />
							<span className="sidebar-text">Administrar Usuarios</span>
						</Link>
					)}
					{canAccess.registerAttendance && (
						<Link
							to="registrar-asistencia"
							className={`sidebar-link has-hover-indicator ${isActive("registrar-asistencia") ? "active" : ""}`}
						>
							<EventAvailableIcon className="sidebar-icon" />
							<span className="sidebar-text">Registrar asistencia</span>
						</Link>
					)}
					{canAccess.viewAttendance && (
						<Link
							to="visualizar-asistencia"
							className={`sidebar-link has-hover-indicator ${isActive("visualizar-asistencia") ? "active" : ""}`}
						>
							<VisibilityIcon className="sidebar-icon" />
							<span className="sidebar-text">Visualizar asistencia</span>
						</Link>
					)}

					{canAccess.listCanines && (
						<Link
							to="listar-caninos"
							className={`sidebar-link has-hover-indicator ${isActive("listar-caninos") ? "active" : ""}`}
						>
							<PetsIcon className="sidebar-icon" />
							<span className="sidebar-text">Caninos</span>
						</Link>
					)}
					{/* --- NEW LINK FOR HU-7 --- */}
					{canAccess.reports && (
						<Link
							to="reportes"
							className={`sidebar-link has-hover-indicator ${isActive("reportes") ? "active" : ""}`}
						>
							<AssessmentIcon className="sidebar-icon" />
							<span className="sidebar-text">Reportes</span>
						</Link>
					)}
				</nav>
				<div className="p-4 border-t" style={{ borderColor: "rgba(15,23,32,0.06)" }}>
					<Link to="configuracion" className="sidebar-action has-hover-indicator font-montserrat">
						<SettingsIcon className="sidebar-icon-action" />
						<span className="sidebar-text-action">Configuración</span>
					</Link>
					<button
						type="button"
						onClick={() => {
							localStorage.clear();
							sessionStorage.clear();
							window.location.href = "/login";
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

export default InternalUsersPage;
