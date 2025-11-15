import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import PetsIcon from "@mui/icons-material/Pets";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const getAuthHeader = () => {
	const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

type CanineFormState = {
	name: string;
	breed: string;
	age: string;
	size: string;
	photo: File | null;
};

type EnrollmentFormState = {
	plan_id: string;
	transport_service_id: string;
	enrollment_date: string;
};

type EnrollmentPlan = {
	id: number;
	name: string;
	duration: string;
	price: string;
	active: boolean;
};

type TransportService = {
	id: number;
	type: string;
};

const CANINE_INITIAL: CanineFormState = {
	name: "",
	breed: "",
	age: "",
	size: "medium",
	photo: null,
};

const ENROLLMENT_INITIAL: EnrollmentFormState = {
	plan_id: "",
	transport_service_id: "",
	enrollment_date: new Date().toISOString().slice(0, 10),
};

export default function EnrollCanine() {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [canineForm, setCanineForm] = useState<CanineFormState>(CANINE_INITIAL);
	const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormState>(ENROLLMENT_INITIAL);
	const [errors, setErrors] = useState<
		Partial<Record<keyof (CanineFormState & EnrollmentFormState), string>>
	>({});
	const [preview, setPreview] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [plans, setPlans] = useState<EnrollmentPlan[]>([]);
	const [transportServices, setTransportServices] = useState<TransportService[]>([]);
	const [clientId, setClientId] = useState<number | null>(null);

	// Cargar datos necesarios: planes, servicios de transporte, y client_id del usuario actual
	useEffect(() => {
		(async () => {
			const headers = { Accept: "application/json", ...getAuthHeader() };
			try {
				// Cargar planes de matrícula
				const plansRes = await apiClient.get("/api/enrollment-plans/", {
					headers,
					validateStatus: () => true,
				});
				if (plansRes.status >= 200 && plansRes.status < 300) {
					const plansData: EnrollmentPlan[] = plansRes.data ?? [];
					setPlans(plansData.filter((p) => p.active));
				}

				// Cargar servicios de transporte
				const transportRes = await apiClient.get("/api/transport-services/", {
					headers,
					validateStatus: () => true,
				});
				if (transportRes.status >= 200 && transportRes.status < 300) {
					setTransportServices(transportRes.data ?? []);
				}

				// Obtener el client_id del usuario actual
				const meRes = await apiClient.get("/api/users/me/", {
					headers,
					validateStatus: () => true,
				});
				if (meRes.status >= 200 && meRes.status < 300) {
					const userData = meRes.data;
					// Supongamos que el backend retorna client_profile con el id del cliente
					// O bien, podemos llamar /api/clients/ y filtrar por user_id
					// Para simplificar, vamos a obtener el client_id desde /api/clients/ filtrando por user
					const clientsRes = await apiClient.get("/api/clients/", {
						headers,
						validateStatus: () => true,
					});
					if (clientsRes.status >= 200 && clientsRes.status < 300) {
						const clients = clientsRes.data ?? [];
						const myClient = clients.find(
							(c: { user: { id: number } }) => c.user.id === userData.id,
						);
						if (myClient) {
							setClientId(myClient.id);
						}
					}
				}
			} catch (err) {
				console.error("Error al cargar datos iniciales:", err);
			}
		})();
	}, []);

	const validate = (): boolean => {
		const e: typeof errors = {};

		// Validaciones para el canino (basado en el modelo Canine)
		if (!canineForm.name.trim() || canineForm.name.length > 100)
			e.name = "Nombre requerido (máx. 100 caracteres)";
		if (!canineForm.breed.trim() || canineForm.breed.length > 100)
			e.breed = "Raza requerida (máx. 100 caracteres)";
		const ageNum = parseInt(canineForm.age, 10);
		if (isNaN(ageNum) || ageNum < 0 || ageNum > 25) e.age = "Edad debe ser un número entre 0 y 25";
		if (!["mini", "small", "medium", "big"].includes(canineForm.size)) e.size = "Tamaño inválido";

		// Validaciones para la matrícula
		if (!enrollmentForm.plan_id) e.plan_id = "Selecciona un plan de matrícula";
		if (!enrollmentForm.transport_service_id)
			e.transport_service_id = "Selecciona un servicio de transporte";
		if (!enrollmentForm.enrollment_date) e.enrollment_date = "Fecha de matrícula requerida";

		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleCanineChange = <K extends keyof CanineFormState>(k: K, v: CanineFormState[K]) => {
		setCanineForm((s) => ({ ...s, [k]: v }));
		setErrors((prev) => ({ ...prev, [k]: undefined }));
		setSuccess(null);
		setError(null);
	};

	const handleEnrollmentChange = <K extends keyof EnrollmentFormState>(
		k: K,
		v: EnrollmentFormState[K],
	) => {
		setEnrollmentForm((s) => ({ ...s, [k]: v }));
		setErrors((prev) => ({ ...prev, [k]: undefined }));
		setSuccess(null);
		setError(null);
	};

	const handleFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
		const f = ev.target.files?.[0];
		if (!f) return;
		setFileName(f.name);
		setCanineForm((s) => ({ ...s, photo: f }));
		const reader = new FileReader();
		reader.onload = () => {
			setPreview(String(reader.result || ""));
		};
		reader.readAsDataURL(f);
	};

	const handleSubmit = async (ev: React.FormEvent) => {
		ev.preventDefault();
		if (!validate()) return;
		if (clientId === null) {
			setError("No se pudo identificar tu perfil de cliente. Por favor, inicia sesión nuevamente.");
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const headers = { Accept: "application/json", ...getAuthHeader() };

			// Paso 1: Registrar el canino
			const caninePayload = new FormData();
			caninePayload.append("client", String(clientId));
			caninePayload.append("name", canineForm.name.trim());
			caninePayload.append("breed", canineForm.breed.trim());
			caninePayload.append("age", canineForm.age);
			caninePayload.append("size", canineForm.size);
			caninePayload.append("status", "true");
			if (canineForm.photo) {
				caninePayload.append("photo", canineForm.photo);
			}

			const canineRes = await apiClient.post("/api/canines/", caninePayload, {
				headers,
				validateStatus: () => true,
			});

			if (!(canineRes.status >= 200 && canineRes.status < 300)) {
				const errorData = canineRes.data;
				const errorMsg =
					typeof errorData === "object" && errorData !== null
						? Object.entries(errorData)
								.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
								.join("; ")
						: "Error al registrar el canino. Verifica los datos.";
				setError(errorMsg);
				setLoading(false);
				return;
			}

			const newCanine = canineRes.data;
			const canineId = newCanine.id;

			// Paso 2: Calcular fecha de expiración basada en el plan seleccionado
			const selectedPlan = plans.find((p) => String(p.id) === enrollmentForm.plan_id);
			const expirationDate = new Date(enrollmentForm.enrollment_date);
			if (selectedPlan) {
				switch (selectedPlan.duration) {
					case "1_mes":
						expirationDate.setMonth(expirationDate.getMonth() + 1);
						break;
					case "1_bimestre":
						expirationDate.setMonth(expirationDate.getMonth() + 2);
						break;
					case "1_trimestre":
						expirationDate.setMonth(expirationDate.getMonth() + 3);
						break;
					case "6_meses":
						expirationDate.setMonth(expirationDate.getMonth() + 6);
						break;
					case "1_año":
						expirationDate.setFullYear(expirationDate.getFullYear() + 1);
						break;
					default:
						expirationDate.setMonth(expirationDate.getMonth() + 1);
				}
			}

			// Paso 3: Registrar la matrícula (enrollment)
			const enrollmentPayload = {
				canine: canineId,
				plan: enrollmentForm.plan_id,
				transport_service: enrollmentForm.transport_service_id,
				enrollment_date: enrollmentForm.enrollment_date,
				expiration_date: expirationDate.toISOString().slice(0, 10),
				status: true,
			};

			const enrollmentRes = await apiClient.post("/api/enrollments/", enrollmentPayload, {
				headers: { ...headers, "Content-Type": "application/json" },
				validateStatus: () => true,
			});

			if (!(enrollmentRes.status >= 200 && enrollmentRes.status < 300)) {
				const errorData = enrollmentRes.data;
				const errorMsg =
					typeof errorData === "object" && errorData !== null
						? Object.entries(errorData)
								.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
								.join("; ")
						: "Error al registrar la matrícula. Verifica los datos.";
				setError(errorMsg);
				setLoading(false);
				return;
			}

			setSuccess(
				`¡Matrícula exitosa! ${canineForm.name} ha sido registrado con el plan ${selectedPlan?.name || "seleccionado"}.`,
			);
			setLoading(false);

			// Limpiar formulario
			setCanineForm(CANINE_INITIAL);
			setEnrollmentForm(ENROLLMENT_INITIAL);
			setPreview(null);
			setFileName("");
			if (fileInputRef.current) fileInputRef.current.value = "";

			// Redirigir a "Mis Mascotas" después de 2 segundos
			setTimeout(() => {
				navigate("/portal-cliente/mis-mascotas");
			}, 2000);
		} catch (err) {
			console.error("Error en el proceso de matrícula:", err);
			setError("Error de red. Intenta nuevamente.");
			setLoading(false);
		}
	};

	const selectedPlan = plans.find((p) => String(p.id) === enrollmentForm.plan_id);

	return (
		<PageTransition>
			<div className="font-montserrat max-w-4xl mx-auto">
				<div className="mb-6">
					<h1 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
						Matricular un Nuevo Canino
					</h1>
					<p style={{ color: "var(--muted-color)" }}>
						Completa la información de tu mascota y selecciona un plan de matrícula.
					</p>
				</div>

				{error && (
					<div className="mb-4 p-4 rounded-lg" style={{ background: "#FEF3F2", color: "#B91C1C" }}>
						{error}
					</div>
				)}
				{success && (
					<div
						className="mb-4 p-4 rounded-lg flex items-center gap-2"
						style={{ background: "#D1FAE5", color: "#065F46" }}
					>
						<CheckCircleIcon />
						<span>{success}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="form-card">
					{/* Información del Canino */}
					<div className="mb-6">
						<h2 className="text-lg font-bold mb-4 flex items-center gap-2">
							<PetsIcon style={{ color: "var(--amber-400)" }} />
							Información del Canino
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Nombre */}
							<div className="form-group">
								<label className="form-label">
									Nombre del Canino <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<input
									type="text"
									placeholder="Ej: Max"
									value={canineForm.name}
									onChange={(e) => handleCanineChange("name", e.target.value)}
									className={`input-primary ${errors.name ? "input-error" : ""}`}
									maxLength={100}
								/>
								{errors.name && <span className="error-text">{errors.name}</span>}
							</div>

							{/* Raza */}
							<div className="form-group">
								<label className="form-label">
									Raza <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<input
									type="text"
									placeholder="Ej: Labrador"
									value={canineForm.breed}
									onChange={(e) => handleCanineChange("breed", e.target.value)}
									className={`input-primary ${errors.breed ? "input-error" : ""}`}
									maxLength={100}
								/>
								{errors.breed && <span className="error-text">{errors.breed}</span>}
							</div>

							{/* Edad */}
							<div className="form-group">
								<label className="form-label">
									Edad (años) <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<input
									type="number"
									placeholder="Ej: 3"
									value={canineForm.age}
									onChange={(e) => handleCanineChange("age", e.target.value)}
									className={`input-primary ${errors.age ? "input-error" : ""}`}
									min={0}
									max={25}
								/>
								{errors.age && <span className="error-text">{errors.age}</span>}
							</div>

							{/* Tamaño */}
							<div className="form-group">
								<label className="form-label">
									Tamaño <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<select
									value={canineForm.size}
									onChange={(e) => handleCanineChange("size", e.target.value)}
									className={`input-primary ${errors.size ? "input-error" : ""}`}
								>
									<option value="mini">Mini</option>
									<option value="small">Pequeño</option>
									<option value="medium">Mediano</option>
									<option value="big">Grande</option>
								</select>
								{errors.size && <span className="error-text">{errors.size}</span>}
							</div>
						</div>

						{/* Foto (opcional) */}
						<div className="form-group mt-4">
							<label className="form-label">Foto del Canino (Opcional)</label>
							<div
								className="upload-box"
								onClick={() => fileInputRef.current?.click()}
								style={{ cursor: "pointer" }}
							>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFile}
									style={{ display: "none" }}
								/>
								{preview ? (
									<div className="upload-preview">
										<img src={preview} alt="Preview" className="upload-img" />
										<p className="upload-filename">{fileName}</p>
									</div>
								) : (
									<div className="upload-placeholder">
										<PhotoCameraIcon style={{ fontSize: 48, color: "#9CA3AF" }} />
										<p style={{ color: "var(--muted-color)" }}>Haz clic para subir una foto</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Información de Matrícula */}
					<div className="mb-6">
						<h2 className="text-lg font-bold mb-4 flex items-center gap-2">
							<CalendarTodayIcon style={{ color: "var(--amber-400)" }} />
							Información de Matrícula
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Plan de Matrícula */}
							<div className="form-group">
								<label className="form-label">
									Plan de Matrícula <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<select
									value={enrollmentForm.plan_id}
									onChange={(e) => handleEnrollmentChange("plan_id", e.target.value)}
									className={`input-primary ${errors.plan_id ? "input-error" : ""}`}
								>
									<option value="">-- Selecciona un plan --</option>
									{plans.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} - {p.duration.replace("_", " ")} (${p.price})
										</option>
									))}
								</select>
								{errors.plan_id && <span className="error-text">{errors.plan_id}</span>}
								{selectedPlan && (
									<p className="mt-1 text-sm" style={{ color: "var(--muted-color)" }}>
										Precio: <strong>${selectedPlan.price}</strong>
									</p>
								)}
							</div>

							{/* Servicio de Transporte */}
							<div className="form-group">
								<label className="form-label">
									Servicio de Transporte <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<select
									value={enrollmentForm.transport_service_id}
									onChange={(e) => handleEnrollmentChange("transport_service_id", e.target.value)}
									className={`input-primary ${errors.transport_service_id ? "input-error" : ""}`}
								>
									<option value="">-- Selecciona un servicio --</option>
									{transportServices.map((ts) => (
										<option key={ts.id} value={ts.id}>
											{ts.type === "full"
												? "Servicio completo"
												: ts.type === "medium"
													? "Servicio medio (solo mañana o tarde)"
													: "Sin servicio"}
										</option>
									))}
								</select>
								{errors.transport_service_id && (
									<span className="error-text">{errors.transport_service_id}</span>
								)}
							</div>

							{/* Fecha de Matrícula */}
							<div className="form-group">
								<label className="form-label">
									Fecha de Matrícula <span style={{ color: "#B91C1C" }}>*</span>
								</label>
								<input
									type="date"
									value={enrollmentForm.enrollment_date}
									onChange={(e) => handleEnrollmentChange("enrollment_date", e.target.value)}
									className={`input-primary ${errors.enrollment_date ? "input-error" : ""}`}
								/>
								{errors.enrollment_date && (
									<span className="error-text">{errors.enrollment_date}</span>
								)}
							</div>
						</div>
					</div>

					{/* Botones */}
					<div className="flex gap-3 justify-end">
						<button
							type="button"
							onClick={() => navigate("/portal-cliente/dashboard")}
							className="btn-ghost"
							disabled={loading}
						>
							Cancelar
						</button>
						<button type="submit" className="btn-primary" disabled={loading}>
							{loading ? "Procesando..." : "Matricular Canino"}
						</button>
					</div>
				</form>
			</div>
		</PageTransition>
	);
}
