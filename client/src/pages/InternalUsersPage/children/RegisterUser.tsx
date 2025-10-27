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
};

// TIP: define a narrow interface for the DatePicker ref (we only call setOpen)
interface DatePickerRef {
	setOpen?: (open: boolean) => void;
}

export default function RegisterUser() {
	const navigate = useNavigate();
	const datePickerRef = useRef<DatePickerRef | null>(null);
	const today = new Date();

	const [form, setForm] = useState<FormState>({
		document_id: "",
		username: "",
		internal_user_type_id: "1",
		name: "",
		last_name: "",
		email: "",
		birthdate: null,
		password: "",
		is_active: true,
	});

	const [errors, setErrors] = useState<
		Partial<Record<keyof FormState, string>>
	>({});
	const [success, setSuccess] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const validate = (): boolean => {
		const e: typeof errors = {};
		if (!/^\d{6,12}$/.test(form.document_id.trim()))
			e.document_id = "Cédula inválida (solo números, 6-12 dígitos)";
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

	// strongly-typed handler: v must be the correct type for the key K
	function handleChange<K extends keyof FormState>(k: K, v: FormState[K]) {
		setForm((s) => ({ ...s, [k]: v }));
		setErrors((prev) => ({ ...prev, [k]: undefined }));
		setSuccess(null);
	}

	const handleSubmit = (ev: React.FormEvent) => {
		ev.preventDefault();
		if (!validate()) return;
		const payload = {
			...form,
			birthdate: form.birthdate
				? form.birthdate.toISOString().slice(0, 10)
				: null,
		};
		console.log("Nuevo usuario interno (simulado):", payload);
		setSuccess("Usuario creado (simulado). Integra la API para persistir.");
	};

	return (
		<PageTransition>
			<div className="form-card">
				<header className="form-header font-montserrat">
					<div className="form-header-icon">
						<PersonIcon />
					</div>

					<div style={{ flex: 1 }}>
						<h2 className="form-header-title">Registrar usuario interno</h2>
						<p className="text-sm text-gray-500">
							Rellena los datos para crear el usuario
						</p>
					</div>
				</header>

				<form onSubmit={handleSubmit} className="form-body font-montserrat">
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
							<option value="director">Director</option>
							<option value="asesor_ventas">Asesor de ventas</option>
							<option value="entrenador">Entrenador</option>
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
							Guardar usuario
						</button>
					</div>

					{success && (
						<div className="mt-4 text-sm text-green-700">{success}</div>
					)}
				</form>
			</div>
		</PageTransition>
	);
}
