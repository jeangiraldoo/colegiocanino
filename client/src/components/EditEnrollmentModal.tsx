import { useEffect, useState } from "react";
import apiClient from "../api/axiosConfig";
import { showToast } from "../utils/toast";

type Props = {
	canineId: number | string;
	canineName?: string;
	enrollmentId?: number | string | null;
	onClose: () => void;
	onSaved?: () => void;
};

export default function EditEnrollmentModal({
	canineId,
	canineName,
	enrollmentId,
	onClose,
	onSaved,
}: Props) {
	type Plan = { id: number | string; name?: string; duration?: string };
	type Transport = { id: number | string; type?: string };
	type Enrollment = {
		id?: number | string;
		pk?: number | string;
		plan?: number | string;
		plan_id?: number | string;
		transport_service?: number | string;
		transport_service_id?: number | string;
		enrollment_date?: string;
		status?: boolean;
	};

	const [plans, setPlans] = useState<Plan[]>([]);
	const [transports, setTransports] = useState<Transport[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [form, setForm] = useState({
		plan_id: "",
		transport_service_id: "",
		enrollment_date: new Date().toISOString().slice(0, 10),
	});
	const [existingEnrollmentId, setExistingEnrollmentId] = useState<number | string | null>(
		enrollmentId ?? null,
	);
	const [existingEnrollment, setExistingEnrollment] = useState<Enrollment | null>(null);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const [plansRes, transRes] = await Promise.all([
					apiClient.get("/api/enrollment-plans/", { validateStatus: () => true }),
					apiClient.get("/api/transport-services/", { validateStatus: () => true }),
				]);
				if (!mounted) return;
				if (!(plansRes.status >= 200 && plansRes.status < 300)) {
					console.error("Failed to load plans", plansRes.status);
				} else {
					setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
				}

				if (!(transRes.status >= 200 && transRes.status < 300)) {
					console.error("Failed to load transports", transRes.status);
				} else {
					setTransports(Array.isArray(transRes.data) ? transRes.data : []);
				}

				// load existing enrollment for this canine (any status) so we can reactivate if needed
				const enr = await apiClient.get(
					`/api/enrollments/?canine_id=${encodeURIComponent(String(canineId))}`,
					{ validateStatus: () => true },
				);
				if (!mounted) return;
				if (!(enr.status >= 200 && enr.status < 300)) {
					// permission or auth issue — show toast once
					console.error("Failed to load enrollments", enr.status);
					// don't override existingEnrollment (leave as null)
					return;
				}
				const data = Array.isArray(enr.data) ? enr.data : [];
				if (data.length > 0) {
					const e = data[0] as Enrollment;
					setExistingEnrollmentId(e.id ?? e.pk ?? null);
					setExistingEnrollment(e);
					setForm({
						plan_id: String(e.plan ?? e.plan_id ?? ""),
						transport_service_id: String(e.transport_service ?? e.transport_service_id ?? ""),
						enrollment_date: e.enrollment_date ?? new Date().toISOString().slice(0, 10),
					});
				}
			} catch (err) {
				console.error(err);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [canineId]);

	const handleChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

	const save = async () => {
		setLoading(true);
		setError(null);
		try {
			const headers = { Accept: "application/json", "Content-Type": "application/json" };
			const payload: Partial<Enrollment> & { canine: number | string } = {
				canine: canineId,
				plan: form.plan_id,
				transport_service: form.transport_service_id,
				enrollment_date: form.enrollment_date,
				// preserve existing status when updating, default to active on create
				status: existingEnrollment ? !!existingEnrollment.status : true,
			};

			let res;
			if (existingEnrollmentId) {
				res = await apiClient.patch(`/api/enrollments/${existingEnrollmentId}/`, payload, {
					headers,
					validateStatus: () => true,
				});
			} else {
				res = await apiClient.post(`/api/enrollments/`, payload, {
					headers,
					validateStatus: () => true,
				});
			}

			if (!(res.status >= 200 && res.status < 300)) {
				setError("Error al guardar la matrícula");
				setLoading(false);
				return;
			}

			// update local enrollment object if patched/created
			try {
				const returned = res.data ?? null;
				setExistingEnrollment(returned);
				setExistingEnrollmentId(returned?.id ?? returned?.pk ?? existingEnrollmentId);
			} catch {}

			if (onSaved) onSaved();
			onClose();
		} catch (err) {
			console.error(err);
			setError("Error de red al guardar");
			showToast("Error al guardar la matrícula", "error");
		} finally {
			setLoading(false);
		}
	};

	const toggleStatus = async () => {
		const idToUse = existingEnrollment?.id ?? existingEnrollmentId;
		if (!idToUse) {
			showToast("No hay matrícula para modificar el estado.", "error");
			return;
		}
		setLoading(true);
		try {
			const headers = { Accept: "application/json", "Content-Type": "application/json" };
			// fetch existing to get full payload
			const res = await apiClient.get(`/api/enrollments/${idToUse}/`, {
				headers,
				validateStatus: () => true,
			});
			if (!(res.status >= 200 && res.status < 300)) {
				showToast("Error al consultar la matrícula", "error");
				return;
			}
			const e = res.data ?? {};
			const payload: Partial<Enrollment> = {
				plan: form.plan_id || e.plan || e.plan_id || null,
				transport_service:
					form.transport_service_id || e.transport_service || e.transport_service_id || null,
				enrollment_date: form.enrollment_date || e.enrollment_date || undefined,
				status: !Boolean(e.status),
			};

			const patch = await apiClient.patch(`/api/enrollments/${idToUse}/`, payload, {
				headers,
				validateStatus: () => true,
			});
			if (!(patch.status >= 200 && patch.status < 300)) {
				showToast("Error al actualizar el estado de la matrícula", "error");
				return;
			}
			// update local enrollment object
			setExistingEnrollment(patch.data ?? null);
			showToast(patch.data?.status ? "Matrícula activada" : "Matrícula desactivada", "success");
			if (onSaved) onSaved();
		} catch (err) {
			console.error(err);
			showToast("Error de red al cambiar el estado", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 60,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{/* backdrop with blur */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "rgba(15,23,42,0.4)",
					backdropFilter: "blur(4px)",
				}}
				onClick={onClose}
			/>

			<div
				style={{
					position: "relative",
					background: "#fff",
					borderRadius: 12,
					padding: 20,
					boxShadow: "0 10px 30px rgba(2,6,23,0.2)",
					width: 640,
					maxWidth: "95%",
				}}
				role="dialog"
				aria-modal="true"
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 12,
					}}
				>
					<h3 style={{ margin: 0 }}>{`Editar Matrícula — ${canineName ?? `#${canineId}`}`}</h3>
					<button
						onClick={onClose}
						aria-label="Cerrar"
						style={{
							background: "transparent",
							border: "none",
							width: 40,
							height: 40,
							borderRadius: 8,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							color: "var(--muted-color)",
						}}
					>
						✕
					</button>
				</div>

				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
					<div>
						<label className="form-label">Plan</label>
						<select
							value={form.plan_id}
							onChange={(e) => handleChange("plan_id", e.target.value)}
							className="input-primary"
							style={{ width: "100%" }}
						>
							<option value="">-- Selecciona un plan --</option>
							{plans.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name} - {p.duration}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="form-label">Servicio de Transporte</label>
						<select
							value={form.transport_service_id}
							onChange={(e) => handleChange("transport_service_id", e.target.value)}
							className="input-primary"
							style={{ width: "100%" }}
						>
							<option value="">-- Selecciona un servicio --</option>
							{transports.map((t) => (
								<option key={t.id} value={t.id}>
									{t.type}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="form-label">Fecha de Matrícula</label>
						<input
							type="date"
							value={form.enrollment_date}
							onChange={(e) => handleChange("enrollment_date", e.target.value)}
							className="input-primary"
							style={{ width: "100%" }}
						/>
					</div>
				</div>

				<div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
					<div style={{ flex: 1 }}>
						<label className="form-label">Estado</label>
						<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
							{existingEnrollment ? (
								<div
									style={{
										padding: "6px 10px",
										borderRadius: 8,
										background: existingEnrollment.status
											? "rgba(34,197,94,0.08)"
											: "rgba(239,68,68,0.06)",
										color: existingEnrollment.status ? "#16a34a" : "#dc2626",
										fontWeight: 700,
									}}
								>
									{existingEnrollment.status ? "Activo" : "Inactivo"}
								</div>
							) : (
								<div
									style={{
										padding: "6px 10px",
										borderRadius: 8,
										background: "rgba(239,68,68,0.06)",
										color: "#dc2626",
										fontWeight: 700,
									}}
								>
									Sin matrícula
								</div>
							)}
						</div>
					</div>
					<div style={{ display: "flex", gap: 8 }}>
						<button className="btn-ghost" onClick={() => onClose()} disabled={loading}>
							Cancelar
						</button>
						{existingEnrollment && (
							<button className="btn-ghost" onClick={toggleStatus} disabled={loading}>
								{loading ? "..." : existingEnrollment.status ? "Desactivar" : "Reactivar"}
							</button>
						)}
						<button
							className="btn-primary"
							onClick={save}
							disabled={loading || (!existingEnrollment && !form.plan_id)}
						>
							{loading ? "Guardando..." : existingEnrollment ? "Guardar" : "Matricular"}
						</button>
					</div>
				</div>

				{error && <div style={{ color: "#B91C1C", marginTop: 12 }}>{error}</div>}
			</div>
		</div>
	);
}
