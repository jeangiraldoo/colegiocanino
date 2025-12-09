import React, { useEffect, useMemo, useState } from "react";
import type { AxiosResponse } from "axios";
import apiClient from "../../../api/axiosConfig";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateUser from "./UpdateUser";
import { Link, useNavigate } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";

const getAuthHeader = () => {
	const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

type ApiUser = {
	id?: number | string;
	username?: string;
	email?: string | null;
	first_name?: string | null;
	document_id?: string | null;
	internal_profile?: unknown;
	internal_profile_id?: unknown;
	is_internal_user?: boolean;
	role?: string | null;
	photo?: string | null;
};

type ApiInternal = {
	id?: number | string;
	pk?: number | string;
	user?: ApiUser | null;
	username?: string | null;
	email?: string | null;
	document_id?: string | null;
	name?: string | null;
	last_name?: string | null;
	role?: string | null;
	photo?: string | null;
};

type InternalUser = {
	id: string;
	document_id: string;
	username: string;
	name: string;
	last_name: string;
	email: string;
	role: string;
	photo?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
	DIRECTOR: "Director",
	ADVISOR: "Asesor",
	COACH: "Entrenador",
	ADMIN: "Administrador",
};

const API_BASE =
	typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE
		? String(import.meta.env.VITE_API_BASE)
		: "https://colegiocanino.onrender.com";

const resolvePhoto = (p?: string | null): string | null => {
	if (!p) return null;
	if (p.startsWith("http://") || p.startsWith("https://")) return p;
	if (p.startsWith("/")) return API_BASE.replace(/\/$/, "") + p;
	return API_BASE.replace(/\/$/, "") + "/" + p;
};

export default function ManageUsers() {
	const [users, setUsers] = useState<InternalUser[]>([]);
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState<InternalUser | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;
		return users.filter((u) => {
			const hay = `${u.name} ${u.last_name} ${u.username} ${u.email} ${u.document_id}`;
			return hay.toLowerCase().includes(q);
		});
	}, [users, query]);

	// load real internal-users from API (handle missing token / forbidden)
	useEffect(() => {
		(async () => {
			const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
			if (!token) {
				setError("Not authenticated. Redirecting to login...");
				setTimeout(() => navigate("/login"), 700);
				return;
			}

			const headers = { Accept: "application/json", ...getAuthHeader() };

			try {
				let meId: string | null = null;
				try {
					const meRes = await apiClient.get("/api/users/me/", {
						headers,
						validateStatus: () => true,
					});
					if (meRes.status >= 200 && meRes.status < 300) {
						const meJson = meRes.data ?? null;
						meId = meJson && (meJson.id ?? meJson.pk) ? String(meJson.id ?? meJson.pk) : null;
					}
				} catch (err) {
					console.warn("Could not fetch current user id:", err);
				}

				const [intResp, usersResp] = await Promise.allSettled([
					apiClient.get("/api/internal-users/", { headers, validateStatus: () => true }),
					apiClient.get("/api/users/", { headers, validateStatus: () => true }),
				]);

				function isFulfilled<T>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> {
					return r.status === "fulfilled";
				}

				const intOk =
					isFulfilled(intResp) &&
					(intResp.value as AxiosResponse).status >= 200 &&
					(intResp.value as AxiosResponse).status < 300;
				const usersOk =
					isFulfilled(usersResp) &&
					(usersResp.value as AxiosResponse).status >= 200 &&
					(usersResp.value as AxiosResponse).status < 300;

				if (!intOk && !usersOk) {
					if (isFulfilled(intResp) && (intResp.value as AxiosResponse).status === 401) {
						setError("Access denied. Admin privileges are required to manage internal users.");
						return;
					}
					setError("Failed to load internal users.");
					return;
				}

				const intData: ApiInternal[] =
					intOk && isFulfilled(intResp) ? (intResp.value.data ?? []) : [];
				const usersData: ApiUser[] =
					usersOk && isFulfilled(usersResp) ? (usersResp.value.data ?? []) : [];

				const userById = new Map<string, ApiUser>();
				const userByUsername = new Map<string, ApiUser>();
				if (Array.isArray(usersData)) {
					for (const u of usersData) {
						if (!u) continue;
						const isInternal =
							u.internal_profile != null ||
							u.internal_profile_id != null ||
							u.is_internal_user === true;
						if (!isInternal) continue;
						if (u.id != null) userById.set(String(u.id), u);
						if (u.username) userByUsername.set(String(u.username), u);
					}
				}

				const source = Array.isArray(intData) ? intData : [];
				const normalized = source.map((d) => {
					const nestedUser = d.user ?? null;

					let fullUser: ApiUser | null = null;
					if (nestedUser && nestedUser.id != null)
						fullUser = userById.get(String(nestedUser.id)) ?? null;
					if (!fullUser && nestedUser && nestedUser.username)
						fullUser = userByUsername.get(String(nestedUser.username)) ?? null;
					if (!fullUser) fullUser = nestedUser ?? {};

					const username = fullUser?.username ?? d?.username ?? "";
					const email = fullUser?.email ?? d?.email ?? "";
					const document_id =
						(fullUser &&
							(fullUser.document_id ?? (fullUser as Record<string, unknown>)["documentId"])) ??
						(d &&
							((d as Record<string, unknown>)["document_id"] ??
								(d as Record<string, unknown>)["documentId"])) ??
						"";
					const firstName =
						(fullUser &&
							(fullUser.first_name ?? (fullUser as Record<string, unknown>)["firstName"])) ??
						d?.name ??
						"";
					const lastName =
						((fullUser as Record<string, unknown>)["last_name"] as string | undefined) ??
						((fullUser as Record<string, unknown>)["lastName"] as string | undefined) ??
						d?.last_name ??
						"";
					const rawPhoto =
						(d?.photo as string | null | undefined) ??
						((fullUser as Record<string, unknown>)["photo"] as string | null | undefined) ??
						null;

					return {
						id: String(d?.id ?? d?.pk ?? (fullUser && (fullUser.id ?? null)) ?? username ?? ""),
						document_id: String(document_id ?? ""),
						username: String(username ?? ""),
						name: String(firstName ?? ""),
						last_name: String(lastName ?? ""),
						email: String(email ?? ""),
						role: d?.role ?? (fullUser && (fullUser.role ?? "")) ?? "",
						photo: resolvePhoto(rawPhoto),
					};
				});

				const resolved = (normalized.length ? normalized : []).filter((r) =>
					meId ? String(r.id) !== String(meId) : true,
				);

				const needProfile = resolved
					.map((r: InternalUser) => ({ id: r.id, missing: !r.email || !r.document_id }))
					.filter((x) => x.missing)
					.map((x) => x.id);

				if (needProfile.length > 0) {
					try {
						const profilePromises = needProfile.map((uid) =>
							apiClient
								.get(`/api/users/${encodeURIComponent(uid)}/profile/`, {
									headers,
									validateStatus: () => true,
								})
								.then((r) => (r.status >= 200 && r.status < 300 ? r.data : null)),
						);
						const profiles = (await Promise.all(profilePromises)) as Array<Record<
							string,
							unknown
						> | null>;
						for (let i = 0; i < needProfile.length; i++) {
							const uid = needProfile[i];
							const p = profiles[i];
							if (!p) continue;
							const pUser = (p["user"] as Record<string, unknown> | undefined) ?? undefined;
							if (!pUser) continue;
							const idx = resolved.findIndex((r) => String(r.id) === String(uid));
							if (idx === -1) continue;
							resolved[idx] = {
								...resolved[idx],
								email: (pUser["email"] as string) ?? resolved[idx].email,
								document_id: (pUser["document_id"] as string) ?? resolved[idx].document_id,
								name: (pUser["first_name"] as string) ?? resolved[idx].name,
								last_name: (pUser["last_name"] as string) ?? resolved[idx].last_name,
								username: (pUser["username"] as string) ?? resolved[idx].username,
							};
						}
					} catch (e) {
						console.warn("profile enrichment failed", e);
					}
				}

				setUsers(resolved);
				setError(null);
			} catch (err) {
				console.error("load internal users", err);
				setError("Network error while loading users.");
			}
		})();
	}, [navigate]);

	function openEditor(u: InternalUser) {
		setEditing(u);
		setPanelOpen(true);
	}

	function handleSave(updated: InternalUser) {
		setUsers((s) => s.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
		setPanelOpen(false);
		setEditing(null);
	}

	async function handleDelete(id: string) {
		if (!confirm("¿Eliminar usuario? Esta acción no se puede deshacer.")) return;
		try {
			const headers = { ...getAuthHeader(), Accept: "application/json" };
			const res = await apiClient.delete(`/api/internal-users/${encodeURIComponent(String(id))}/`, {
				headers,
				validateStatus: () => true,
			});
			if (!(res.status >= 200 && res.status < 300)) {
				console.error("delete failed", res.data ?? "");
				return;
			}
			setUsers((s) => s.filter((u) => String(u.id) !== String(id)));
		} catch (e) {
			console.error("delete error", e);
		}
	}

	return (
		<PageTransition>
			<div className="font-montserrat" style={{ display: "flex", gap: 20 }}>
				<div style={{ flex: 1 }}>
					{error && (
						<div
							style={{
								padding: 12,
								background: "#FEF3F2",
								color: "#B91C1C",
								borderRadius: 8,
								marginBottom: 12,
							}}
						>
							{error}{" "}
							{error.includes("Redirecting") ? null : (
								<Link to="/login" style={{ marginLeft: 8, textDecoration: "underline" }}>
									Login
								</Link>
							)}
						</div>
					)}
					<header
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 14,
						}}
					>
						<div>
							<h1 style={{ margin: 0, fontSize: 22, color: "var(--text-color)" }}>
								Usuarios internos
							</h1>
							<p style={{ margin: 0, color: "var(--muted-color)" }}>
								Lista de usuarios activos. Registra nuevos desde "Registrar usuarios".
							</p>
						</div>
						<div style={{ display: "flex", gap: 8 }}>
							<Link to="/internal-users/registrar-usuarios" className="btn btn-primary">
								+ Nuevo
							</Link>
						</div>
					</header>

					<div
						style={{
							marginBottom: 14,
							display: "flex",
							gap: 12,
							alignItems: "center",
						}}
					>
						<input
							placeholder="Buscar por nombre, usuario, email o cédula..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="input-primary input-lg"
							style={{
								width: "100%",
								color: "var(--text-color)",
								fontWeight: 600,
							}}
						/>
						<div
							style={{
								minWidth: 120,
								textAlign: "right",
								color: "var(--muted-color)",
							}}
						>
							{filtered.length} resultados
						</div>
					</div>

					<div className="form-card" style={{ padding: 0 }}>
						<table style={{ width: "100%", borderCollapse: "collapse" }} className="manage-table">
							<thead>
								<tr>
									<th style={{ width: 60 }}></th>
									<th>Nombre</th>
									<th>Email</th>
									<th style={{ width: 140 }}>Cédula</th>
									<th style={{ width: 140 }}>Rol</th>
									<th style={{ width: 120, textAlign: "right" }}>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((u, idx) => {
									const rowKey = String(u.id ?? u.username ?? u.document_id ?? `user-${idx}`);
									return (
										<tr key={rowKey}>
											<td style={{ padding: 12 }}>
												<div
													style={{
														width: 44,
														height: 44,
														borderRadius: 8,
														overflow: "hidden",
														background: "#F3F4F6",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													{u.photo ? (
														<img
															src={u.photo}
															alt="avatar"
															style={{
																width: "100%",
																height: "100%",
																objectFit: "cover",
															}}
															onError={(e) => {
																const img = e.currentTarget as HTMLImageElement;
																// use dataset safely without `as any`
																if (img.dataset?.tried) return;
																if (img.dataset) img.dataset.tried = "1";
																console.warn(
																	"User photo not found, falling back to placeholder:",
																	u.photo,
																);
																img.src = "https://via.placeholder.com/150?text=avatar";
															}}
														/>
													) : (
														<PersonIcon style={{ color: "#6B7280" }} />
													)}
												</div>
											</td>

											<td
												style={{
													padding: "12px 16px",
													color: "var(--text-color)",
													fontWeight: 700,
												}}
											>
												{u.name} {u.last_name}
												<div
													style={{
														fontSize: 12,
														color: "var(--muted-color)",
														fontWeight: 500,
													}}
												>
													@{u.username}
												</div>
											</td>

											<td
												style={{
													padding: "12px 16px",
													color: "var(--muted-color)",
												}}
											>
												{u.email}
											</td>

											<td
												style={{
													padding: "12px 16px",
													color: "var(--muted-color)",
												}}
											>
												{u.document_id}
											</td>

											<td
												style={{
													padding: "12px 16px",
													color: "var(--text-color)",
												}}
											>
												<span
													style={{
														background: "rgba(14,165,233,0.06)",
														color: "var(--text-color)",
														padding: "6px 10px",
														borderRadius: 10,
														fontWeight: 700,
													}}
												>
													{ROLE_LABELS[u.role] ?? u.role}
												</span>
											</td>

											<td style={{ padding: "12px 16px", textAlign: "right" }}>
												<button className="icon-btn" onClick={() => openEditor(u)} title="Editar">
													<EditIcon fontSize="small" />
												</button>
												<button
													className="icon-btn delete"
													onClick={() => handleDelete(u.id)}
													title="Eliminar"
												>
													<DeleteIcon fontSize="small" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				{panelOpen && editing && (
					<aside style={{ width: 380 }}>
						<UpdateUser
							key={editing.id}
							user={editing}
							onCancel={() => {
								setPanelOpen(false);
								setEditing(null);
							}}
							onSave={handleSave}
						/>
					</aside>
				)}
			</div>
		</PageTransition>
	);
}
