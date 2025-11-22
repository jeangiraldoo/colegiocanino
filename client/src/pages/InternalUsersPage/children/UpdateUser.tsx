import React, { useState, useEffect } from "react";

const getAuthHeader = () => {
	const token =
		localStorage.getItem("access_token") ||
		sessionStorage.getItem("access_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

type User = {
	id: string;
	document_id: string;
	username: string;
	name: string;
	last_name: string;
	email: string;
	role: string;
	photo?: string | null;
};

type Props = {
	user: User;
	onCancel: () => void;
	onSave: (u: User) => void;
};

export default function UpdateUser({ user, onCancel, onSave }: Props) {
	const [form, setForm] = useState<User>({ ...user });
	const [preview, setPreview] = useState<string | null>(user.photo || null);
	const [saving, setSaving] = useState(false);
	const [fileName, setFileName] = useState<string>("");
	const [fileObj, setFileObj] = useState<File | null>(null);

	useEffect(() => {
		Promise.resolve().then(() => {
			setForm({ ...user });
			setPreview(user.photo || null);
			setFileName("");
			setFileObj(null);
		});
	}, [user]);

	function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
		const f = ev.target.files?.[0];
		if (!f) return;
		setFileName(f.name);
		setFileObj(f);
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = String(reader.result || "");
			setPreview(base64);
			// keep a base64 preview but will upload fileObj as FormData
			setForm((s) => ({ ...s, photo: base64 }));
		};
		reader.readAsDataURL(f);
	}

	// produce only changed user fields to avoid unique-username validation conflicts
	function buildChangedUserPayload(): Record<string, string | undefined> {
		const changed: Record<string, string | undefined> = {};
		if (String(form.name ?? "") !== String(user.name ?? ""))
			changed.first_name = form.name;
		if (String(form.last_name ?? "") !== String(user.last_name ?? ""))
			changed.last_name = form.last_name;
		if (String(form.email ?? "") !== String(user.email ?? ""))
			changed.email = form.email;
		if (String(form.document_id ?? "") !== String(user.document_id ?? ""))
			changed.document_id = form.document_id;
		if (String(form.username ?? "") !== String(user.username ?? ""))
			changed.username = form.username;
		return changed;
	}

	async function submit(e?: React.FormEvent) {
		e?.preventDefault();
		setSaving(true);

		try {
			const changedUser = buildChangedUserPayload();
			const changedInternal: Partial<{ role: string }> = {};
			if (String(form.role ?? "") !== String(user.role ?? ""))
				changedInternal.role = form.role;

			if (fileObj) {
				const fd = new FormData();
				// Append changed user as JSON string (only changed fields)
				if (Object.keys(changedUser).length) {
					fd.append("user", JSON.stringify(changedUser));
				}
				// append role if changed or always append current role
				fd.append("role", changedInternal.role ?? form.role ?? "");
				fd.append("photo", fileObj);

				const res = await fetch(
					`/api/internal-users/${encodeURIComponent(form.id)}/`,
					{
						method: "PATCH",
						headers: {
							...getAuthHeader(),
							Accept: "application/json",
							// Do NOT set Content-Type; browser will set the multipart boundary
						},
						body: fd,
					},
				);

				if (!res.ok) {
					const errText = await res.text().catch(() => "");
					console.error("update internal user failed", errText);
					try {
						const j = JSON.parse(errText || "{}");
						console.error(j);
					} catch (e) {
						console.warn("Failed to parse error body", e);
					}
					onSave(form);
					return;
				}

				const saved = await res.json().catch(() => null);
				const updatedUser: User = {
					id: (saved && (saved.id ?? form.id)) as string,
					document_id:
						(saved && saved.user && saved.user.document_id) ?? form.document_id,
					username:
						(saved && saved.user && saved.user.username) ?? form.username,
					name: (saved && saved.user && saved.user.first_name) ?? form.name,
					last_name:
						(saved && saved.user && saved.user.last_name) ?? form.last_name,
					email: (saved && saved.user && saved.user.email) ?? form.email,
					role: (saved && saved.role) ?? form.role,
					photo: (saved && saved.photo) ?? form.photo ?? null,
				};
				onSave(updatedUser);
			} else {
				const payload: Record<string, unknown> = {};
				if (Object.keys(changedUser).length) payload["user"] = changedUser;
				if (changedInternal.role) payload["role"] = changedInternal.role;

				if (Object.keys(payload).length === 0) {
					onSave(form);
					return;
				}

				const headers = {
					"Content-Type": "application/json",
					...getAuthHeader(),
				};
				const res = await fetch(
					`/api/internal-users/${encodeURIComponent(form.id)}/`,
					{
						method: "PATCH",
						headers,
						body: JSON.stringify(payload),
					},
				);

				if (!res.ok) {
					const errJson = await res.json().catch(() => null);
					console.error(
						"update internal user failed",
						errJson ?? "bad response",
					);
					onSave(form);
					return;
				}

				const saved = await res.json().catch(() => null);
				const updatedUser: User = {
					id: (saved && (saved.id ?? form.id)) as string,
					document_id:
						(saved && saved.user && saved.user.document_id) ?? form.document_id,
					username:
						(saved && saved.user && saved.user.username) ?? form.username,
					name: (saved && saved.user && saved.user.first_name) ?? form.name,
					last_name:
						(saved && saved.user && saved.user.last_name) ?? form.last_name,
					email: (saved && saved.user && saved.user.email) ?? form.email,
					role: (saved && saved.role) ?? form.role,
					photo: (saved && saved.photo) ?? form.photo ?? null,
				};
				onSave(updatedUser);
			}
		} catch (err) {
			console.error("submit update user", err);
			onSave(form);
		} finally {
			setSaving(false);
		}
	}

	return (
		<form onSubmit={submit} className="edit-panel">
			<div
				className="edit-panel-header"
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<h3 style={{ margin: 0, fontSize: 16 }}>Editar usuario</h3>
				<button type="button" className="btn-small" onClick={onCancel}>
					Cerrar
				</button>
			</div>

			<div style={{ display: "flex", gap: 12, margin: "8px 0" }}>
				<div
					style={{
						width: 84,
						height: 84,
						borderRadius: 10,
						overflow: "hidden",
						background: "#F3F4F6",
					}}
				>
					{preview ? (
						<img
							src={preview}
							alt="preview"
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					) : (
						<div style={{ padding: 12, color: "#9CA3AF" }}>Sin foto</div>
					)}
				</div>

				<div style={{ flex: 1 }}>
					<label className="text-xs">Foto</label>
					<div
						className="file-input-wrapper"
						style={{
							marginTop: 6,
							display: "flex",
							alignItems: "center",
							gap: 12,
						}}
					>
						<input
							id={`update-user-photo-${form.id}`}
							type="file"
							accept="image/*"
							className="file-input-hidden"
							onChange={handleFile}
							style={{ display: "none" }}
						/>

						<label
							htmlFor={`update-user-photo-${form.id}`}
							className="file-input-control btn-ghost"
							style={{
								cursor: "pointer",
								padding: "8px 12px",
								borderRadius: 8,
								display: "inline-flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							<span style={{ fontSize: 14, color: "var(--muted-color)" }}>
								📁
							</span>
							<span style={{ fontWeight: 600 }}>Seleccionar foto</span>
						</label>

						<span
							style={{
								color: "var(--muted-color)",
								fontSize: 13,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: 140,
							}}
						>
							{fileName ? fileName : "Ningún archivo"}
						</span>
					</div>
				</div>
			</div>

			<div style={{ display: "grid", gap: 8 }}>
				<div>
					<label className="text-xs">Nombre</label>
					<input
						className="input-primary w-full"
						value={form.name}
						onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
					/>
				</div>

				<div>
					<label className="text-xs">Apellido</label>
					<input
						className="input-primary w-full"
						value={form.last_name}
						onChange={(e) =>
							setForm((s) => ({ ...s, last_name: e.target.value }))
						}
					/>
				</div>

				<div>
					<label className="text-xs">Email</label>
					<input
						className="input-primary w-full"
						value={form.email}
						onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
					/>
				</div>

				<div>
					<label className="text-xs">Usuario</label>
					<input
						className="input-primary w-full"
						value={form.username}
						onChange={(e) =>
							setForm((s) => ({ ...s, username: e.target.value }))
						}
					/>
					<small style={{ color: "#6b7280" }}>
						No cambies el usuario si no es necesario (evita conflicto)
					</small>
				</div>

				<div>
					<label className="text-xs">Cédula</label>
					<input
						className="input-primary w-full"
						value={form.document_id}
						onChange={(e) =>
							setForm((s) => ({
								...s,
								document_id: e.target.value.replace(/\D/g, ""),
							}))
						}
					/>
				</div>

				<div>
					<label className="text-xs">Role</label>
					<select
						className="input-primary w-full"
						value={form.role}
						onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
					>
						<option value="DIRECTOR">Director</option>
						<option value="ADVISOR">Asesor</option>
						<option value="COACH">Entrenador</option>
						<option value="ADMIN">Administrador</option>
					</select>
				</div>

				<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
					<button
						type="button"
						className="btn-cancel"
						onClick={onCancel}
						disabled={saving}
					>
						Cancelar
					</button>
					<button type="submit" className="btn-primary" disabled={saving}>
						{saving ? "Guardando..." : "Guardar"}
					</button>
				</div>
			</div>
		</form>
	);
}
