import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import KeyIcon from "@mui/icons-material/Key";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageTransition from "../../../components/PageTransition";

type FormState = {
	document_id: string;
	username: string;
	internal_user_type_id: string;
	name: string;
	last_name: string;
	email: string;
	birthdate: Date | null;
	password: string;
	is_active: boolean;
	photo?: string | null;
};

const INITIAL: FormState = {
	document_id: "",
	username: "",
	internal_user_type_id: "DIRECTOR",
	name: "",
	last_name: "",
	email: "",
	birthdate: null,
	password: "",
	is_active: true,
	photo: null,
};

interface DatePickerRef {
	setOpen?: (open: boolean) => void;
}

export const RegisterUser = () => {
	const navigate = useNavigate();
	const datePickerRef = useRef<DatePickerRef | null>(null);
	const today = new Date();

	const [form, setForm] = useState<FormState>(INITIAL);
	const [errors, setErrors] = useState<
		Partial<Record<keyof FormState, string>>
	>({});
	const [success, setSuccess] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string>("");

	const validate = (): boolean => {
		const e: typeof errors = {};
		if (!/^\d{6,12}$/.test(form.document_id.trim()))
			e.document_id = "Cédula inválida (6-12 dígitos)";
		if (!form.username.trim()) e.username = "Nombre de usuario requerido";
		if (!form.name.trim()) e.name = "Nombre requerido";
		if (!form.last_name.trim()) e.last_name = "Apellido requerido";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
			e.email = "Email inválido";
		if (!form.birthdate) e.birthdate = "Fecha de nacimiento requerida";
		if (form.password.length < 6) e.password = "Contraseña mínimo 6 caracteres";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	function handleChange<K extends keyof FormState>(k: K, v: FormState[K]) {
		setForm((s) => ({ ...s, [k]: v }));
		setErrors((prev) => ({ ...prev, [k]: undefined }));
		setSuccess(null);
	}

	const handleFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
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
	};

	const handleSubmit = async (ev: React.FormEvent) => {
		ev.preventDefault();
		if (!validate()) return;
		const payload = {
			...form,
			birthdate: form.birthdate
				? form.birthdate.toISOString().slice(0, 10)
				: null,
		};

		try {
			const key = "mockInternalUsers_v1";
			const existing = JSON.parse(localStorage.getItem(key) || "[]");
			const newUser = {
				...payload,
				id: "u-" + Date.now().toString(36),
			};
			existing.unshift(newUser);
			localStorage.setItem(key, JSON.stringify(existing));
			setSuccess("Usuario registrado localmente (mock).");
			setForm(INITIAL);
			setPreview(null);
			setTimeout(() => navigate("/internal-users/administrar-usuarios"), 700);
		} catch (err) {
			console.error(err);
			setError("No se pudo registrar el usuario. Intenta de nuevo.");
		}
	};

	return (
		<PageTransition>
			<div className="form-card" style={{ position: "relative" }}>
				<header
					className="form-header font-montserrat"
					style={{
						display: "flex",
						gap: 12,
						alignItems: "center",
					}}
				>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<div className="form-header-icon">
							<PersonIcon />
						</div>
						<div>
							<h2 className="form-header-title">Registrar usuario interno</h2>
							<p className="text-sm text-gray-500">
								Rellena los datos para crear el usuario
							</p>
						</div>
					</div>
				</header>

				<div
					className="form-photo"
					aria-hidden={false}
					style={{
						position: "absolute",
						right: 20,
						top: 20,
						display: "flex",
						gap: 12,
						alignItems: "center",
					}}
				>
					<div
						style={{
							width: 72,
							height: 72,
							borderRadius: 8,
							overflow: "hidden",
							background: "#F3F4F6",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{preview ? (
							<img
								src={preview}
								alt="preview"
								style={{ width: "100%", height: "100%", objectFit: "cover" }}
							/>
						) : (
							<div style={{ color: "#9CA3AF", fontSize: 13 }}>Sin foto</div>
						)}
					</div>

					<input
						id="user-photo-input"
						type="file"
						accept="image/*"
						className="file-input-hidden"
						onChange={handleFile}
						style={{ display: "none" }}
					/>

					<label
						htmlFor="user-photo-input"
						className="file-input-control btn-ghost"
						style={{
							cursor: "pointer",
							padding: "8px 12px",
							borderRadius: 8,
						}}
					>
						Seleccionar foto
					</label>

					<span style={{ color: "#9CA3AF", fontSize: 13 }}>
						{fileName ? fileName : "Ningún archivo"}
					</span>
				</div>

				<form
					onSubmit={handleSubmit}
					className="form-body font-montserrat"
					style={{ paddingTop: 12 }}
				>
					<div className="form-row">
						<label className="form-label">Cédula de ciudadanía</label>
						<input
							className="input-primary input-lg"
							value={form.document_id}
							onChange={(e) =>
								handleChange("document_id", e.target.value.replace(/\D/g, ""))
							}
							placeholder="Ej. 12345678"
							aria-label="documento"
						/>
						{errors.document_id && (
							<p className="field-error">{errors.document_id}</p>
						)}
					</div>

					<div className="form-row">
						<label className="form-label">Usuario</label>
						<input
							className="input-primary input-lg"
							value={form.username}
							onChange={(e) => handleChange("username", e.target.value)}
							placeholder="usuario123"
							aria-label="username"
						/>
						{errors.username && (
							<p className="field-error">{errors.username}</p>
						)}
					</div>

					<div className="form-row">
						<label className="form-label">Tipo de usuario</label>
						<select
							className="input-primary input-lg"
							value={form.internal_user_type_id}
							onChange={(e) =>
								handleChange("internal_user_type_id", e.target.value)
							}
						>
							<option value="DIRECTOR">Director</option>
							<option value="ADVISOR">Asesor de ventas</option>
							<option value="COACH">Entrenador</option>
							<option value="ADMIN">Admin</option>
						</select>
					</div>

					<div className="form-row">
						<label className="form-label">Nombre</label>
						<input
							className="input-primary input-lg"
							value={form.name}
							onChange={(e) => handleChange("name", e.target.value)}
							placeholder="Nombre(s)"
						/>
						{errors.name && <p className="field-error">{errors.name}</p>}
					</div>

					<div className="form-row">
						<label className="form-label">Apellido</label>
						<input
							className="input-primary input-lg"
							value={form.last_name}
							onChange={(e) => handleChange("last_name", e.target.value)}
							placeholder="Apellido(s)"
						/>
						{errors.last_name && (
							<p className="field-error">{errors.last_name}</p>
						)}
					</div>

					<div className="form-row">
						<label className="form-label">Email</label>
						<div className="input-with-icon">
							<EmailIcon className="input-icon" />
							<input
								className="input-primary input-lg input-with-left-icon"
								value={form.email}
								onChange={(e) => handleChange("email", e.target.value)}
								placeholder="email@dominio.com"
							/>
						</div>
						{errors.email && <p className="field-error">{errors.email}</p>}
					</div>

					<div className="form-row">
						<label className="form-label">Fecha de nacimiento</label>
						<div className="input-with-icon" style={{ alignItems: "center" }}>
							<CalendarTodayIcon
								className="input-icon"
								style={{ cursor: "pointer" }}
								onClick={() => datePickerRef.current?.setOpen?.(true)}
							/>
							<DatePicker
								ref={datePickerRef}
								selected={form.birthdate}
								onChange={(d: Date | null) => handleChange("birthdate", d)}
								dateFormat="dd/MM/yyyy"
								placeholderText="dd/mm/yyyy"
								className="input-primary input-lg input-with-left-icon"
								maxDate={today}
								showYearDropdown
								scrollableYearDropdown
								yearDropdownItemNumber={100}
								calendarClassName="custom-datepicker"
							/>
						</div>
						{errors.birthdate && (
							<p className="field-error">{errors.birthdate}</p>
						)}
					</div>

					<div className="form-row">
						<label className="form-label">Contraseña</label>
						<div className="input-with-icon" style={{ alignItems: "center" }}>
							<KeyIcon className="input-icon" />
							<input
								type={showPassword ? "text" : "password"}
								className="input-primary input-lg input-with-left-icon"
								value={form.password}
								onChange={(e) => handleChange("password", e.target.value)}
								placeholder="Mínimo 6 caracteres"
							/>
							<button
								type="button"
								className="password-toggle"
								onClick={() => setShowPassword((s) => !s)}
								aria-label={
									showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
								}
								title={showPassword ? "Ocultar" : "Mostrar"}
							>
								{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
							</button>
						</div>
						{errors.password && (
							<p className="field-error">{errors.password}</p>
						)}
					</div>

					<div className="form-actions">
						<button
							type="button"
							className="btn-cancel font-montserrat"
							onClick={() => navigate("/internal-users/dashboard")}
						>
							Cancelar
						</button>
						<button type="submit" className="btn-primary font-montserrat">
							Registrar
						</button>
					</div>

					{success && (
						<div className="mt-4 text-sm text-green-700">{success}</div>
					)}
				</form>
			</div>
		</PageTransition>
	);
};

export default RegisterUser;
