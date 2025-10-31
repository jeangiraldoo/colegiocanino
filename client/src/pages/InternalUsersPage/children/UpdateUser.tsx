import React, { useState, useEffect } from "react";

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

function UpdateUser({ user, onCancel, onSave }: Props) {
	const [form, setForm] = useState<User>({ ...user });
	const [preview, setPreview] = useState<string | null>(user.photo || null);
	const [saving, setSaving] = useState(false);
	const [fileName, setFileName] = useState<string>("");

	useEffect(() => {
		Promise.resolve().then(() => {
			setForm({ ...user });
			setPreview(user.photo || null);
			setFileName("");
		});
	}, [user]);

	function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
		const f = ev.target.files?.[0];
		if (!f) return;
		setFileName(f.name);
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = String(reader.result || "");
			setPreview(base64);
			setForm((s) => ({ ...s, photo: base64 }));
		};
		reader.readAsDataURL(f);
	}

	function submit(e?: React.FormEvent) {
		e?.preventDefault();
		setSaving(true);
		try {
			const key = "mockInternalUsers_v1";
			const raw = localStorage.getItem(key) || "[]";
			const arr = JSON.parse(raw);
			const updated = arr.map((x: User) => (x.id === form.id ? form : x));
			localStorage.setItem(key, JSON.stringify(updated));
		} catch (err) {
			console.error(err);
		}
		setTimeout(() => {
			onSave(form);
			setSaving(false);
		}, 300);
	}

	return (
		<form onSubmit={submit} className="edit-panel">
			<div className="edit-panel-header">
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
					<label className="text-xs">Rol</label>
					<select
						className="input-primary w-full"
						value={form.role}
						onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
					>
						<option value="ADMIN">Administrador</option>
						<option value="DIRECTOR">Director</option>
						<option value="ADVISOR">Asesor</option>
						<option value="COACH">Entrenador</option>
					</select>
				</div>

				<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
					<button
						type="submit"
						className="btn-primary font-montserrat"
						disabled={saving}
					>
						{saving ? "Guardando..." : "Guardar"}
					</button>
					<button type="button" className="btn-ghost" onClick={onCancel}>
						Cancelar
					</button>
				</div>
			</div>
		</form>
	);
}

export default UpdateUser;
