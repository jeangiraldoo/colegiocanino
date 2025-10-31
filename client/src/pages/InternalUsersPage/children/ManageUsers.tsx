import React, { useEffect, useMemo, useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateUser from "./UpdateUser";
import { Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";

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

const STORAGE_KEY = "mockInternalUsers_v1";

const ROLE_LABELS: Record<string, string> = {
	DIRECTOR: "Director",
	ADVISOR: "Asesor",
	COACH: "Entrenador",
	ADMIN: "Administrador",
};

export default function ManageUsers() {
	const [users, setUsers] = useState<InternalUser[]>([]);
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState<InternalUser | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);

	useEffect(() => {
		const raw = localStorage.getItem(STORAGE_KEY);
		const requiredMocks: InternalUser[] = [
			{
				id: "u-1",
				document_id: "12345678",
				username: "jlopez",
				name: "Juan",
				last_name: "López",
				email: "juan.lopez@example.com",
				role: "DIRECTOR",
				photo: null,
			},
			{
				id: "u-3",
				document_id: "20345678",
				username: "ana.mart",
				name: "Ana",
				last_name: "Martínez",
				email: "ana.martinez@example.com",
				role: "ADVISOR",
				photo: "https://i.pravatar.cc/150?img=12",
			},
		];

		if (raw) {
			try {
				const parsed: InternalUser[] = JSON.parse(raw);
				const merged = [...parsed];
				requiredMocks.forEach((m) => {
					if (!merged.find((x) => x.id === m.id)) merged.unshift(m);
				});
				Promise.resolve().then(() => setUsers(merged));
				return;
			} catch (e) {
				console.error(e);
			}
		}
		Promise.resolve().then(() => setUsers(requiredMocks));
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
	}, [users]);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/internal-users");
				const data = await res.json();

				if (Array.isArray(data)) {
					Promise.resolve().then(() =>
						setUsers((prev = []) => {
							const merged = [...prev];
							(data as InternalUser[]).forEach((m) => {
								if (!merged.find((x) => x.id === m.id)) merged.unshift(m);
							});
							return merged;
						}),
					);
					return;
				}
			} catch (e) {
				console.error(e);
			}
		})();
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;
		return users.filter(
			(u) =>
				u.name.toLowerCase().includes(q) ||
				u.last_name.toLowerCase().includes(q) ||
				u.username.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				u.document_id.includes(q),
		);
	}, [users, query]);

	function handleDelete(id: string) {
		if (!confirm("¿Eliminar usuario?")) return;
		setUsers((s) => s.filter((u) => u.id !== id));
	}

	function openEditor(u: InternalUser) {
		setEditing(u);
		setPanelOpen(true);
	}

	function handleSave(updated: InternalUser) {
		setUsers((s) => s.map((x) => (x.id === updated.id ? updated : x)));
		setPanelOpen(false);
		setEditing(null);
	}

	return (
		<PageTransition>
			<div className="font-montserrat" style={{ display: "flex", gap: 20 }}>
				<div style={{ flex: 1 }}>
					<header
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 14,
						}}
					>
						<div>
							<h1
								style={{ margin: 0, fontSize: 22, color: "var(--text-color)" }}
							>
								Usuarios internos
							</h1>
							<p style={{ margin: 0, color: "var(--muted-color)" }}>
								Lista de usuarios activos. Registra nuevos desde "Registrar
								usuarios".
							</p>
						</div>
						<div style={{ display: "flex", gap: 8 }}>
							<Link
								to="/internal-users/registrar-usuarios"
								className="btn btn-primary"
							>
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
						<table
							style={{ width: "100%", borderCollapse: "collapse" }}
							className="manage-table"
						>
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
								{filtered.map((u) => (
									<tr key={u.id}>
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
											<button
												className="icon-btn"
												onClick={() => openEditor(u)}
												title="Editar"
											>
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
								))}
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
