// client/src/pages/ClientPage/ClientPage.tsx

import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PetsIcon from "@mui/icons-material/Pets";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import logoSrc from "../../assets/raices-caninas-logo-circular.png";

export const ClientPage = () => {
	const [clientName, setClientName] = useState<string>("");
	const lastLogin = new Date().toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
	const loc = useLocation();
	const isActive = (p: string) => loc.pathname.endsWith(p);

	// Resolve access token (prefer sessionStorage, then localStorage). Try refresh if needed.
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
					if (
						!payload.token_type ||
						String(payload.token_type).toLowerCase() === "access"
					) {
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
					const res = await fetch("/api/token/refresh/", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						body: JSON.stringify({ refresh: s.refresh }),
					});
					if (res.ok) {
						const data = await res.json();
						const newAccess = data.access;
						if (s.name === "session")
							sessionStorage.setItem("access_token", newAccess);
						else localStorage.setItem("access_token", newAccess);
						return { token: newAccess, storage: s.name };
					}
				} catch {
					// continue
				}
			}
		}
		return null;
	}

	// fetch current user display name
	useEffect(() => {
		(async () => {
			const resolved = await resolveAccessToken();
			if (!resolved) return;
			const token = resolved.token;
			try {
				const res = await fetch("/api/users/me/", {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				});
				if (res.status === 401) {
					const refreshed = await resolveAccessToken();
					if (!refreshed) return;
					const retry = await fetch("/api/users/me/", {
						headers: {
							Authorization: `Bearer ${refreshed.token}`,
							Accept: "application/json",
						},
					});
					if (!retry.ok) return;
					const data = await retry.json();
					const display =
						[data.first_name, data.last_name].filter(Boolean).join(" ") ||
						data.username ||
						"";
					setClientName(display);
					return;
				}
				if (!res.ok) return;
				const data = await res.json();
				const display =
					[data.first_name, data.last_name].filter(Boolean).join(" ") ||
					data.username ||
					"";
				setClientName(display);
			} catch {
				// silent
			}
		})();
	}, []);

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
							<p className="welcome-username font-montserrat">
								{clientName ? `${clientName}!` : "¡Usuario!"}
							</p>
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
							// logout: clear tokens and redirect to login
							localStorage.removeItem("access_token");
							localStorage.removeItem("refresh_token");
							localStorage.removeItem("user_type");
							localStorage.removeItem("user_role");
							localStorage.removeItem("client_id");
							sessionStorage.removeItem("access_token");
							sessionStorage.removeItem("refresh_token");
							sessionStorage.removeItem("client_id");
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

export default ClientPage;
