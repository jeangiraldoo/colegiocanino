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
import { validationRules } from "../../../utils/validationRules";

const getAuthHeader = () => {
	const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

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
	const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string>("");
	const [fileObj, setFileObj] = useState<File | null>(null);

	const validate = (): boolean => {
		const e: typeof errors = {};
		
		// Document ID validation (backend: max_length=50, elicitation: 6-12 digits)
		if (!form.document_id.trim()) {
			e.document_id = validationRules.messages.required;
		} else if (!validationRules.isValidDocumentId(form.document_id)) {
			e.document_id = validationRules.messages.documentId;
		}
		
		// Username validation (backend: max_length=150, minimum 3)
		if (!form.username.trim()) {
			e.username = validationRules.messages.required;
		} else if (!validationRules.isValidUsername(form.username)) {
			e.username = validationRules.messages.username;
		}
		
		// First name validation (backend: max_length=150)
		if (!form.name.trim()) {
			e.name = validationRules.messages.required;
		} else if (!validationRules.isValidFirstName(form.name)) {
			e.name = validationRules.messages.firstName;
		}
		
		// Last name validation (backend: max_length=150)
		if (!form.last_name.trim()) {
			e.last_name = validationRules.messages.required;
		} else if (!validationRules.isValidLastName(form.last_name)) {
			e.last_name = validationRules.messages.lastName;
		}
		
		// Email validation
		if (!form.email.trim()) {
			e.email = validationRules.messages.required;
		} else if (!validationRules.isValidEmail(form.email)) {
			e.email = validationRules.messages.email;
		}
		
		// Birthdate validation
		if (!form.birthdate) {
			e.birthdate = validationRules.messages.required;
		}
		
		// Password validation (elicitation: 8 chars with complexity, backend accepts 6+)
		if (!form.password) {
			e.password = validationRules.messages.required;
		} else if (!validationRules.isValidPassword(form.password)) {
			e.password = validationRules.messages.password;
		}
		
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	function handleChange<K extends keyof FormState>(k: K, v: FormState[K]) {
		setForm((s) => ({ ...s, [k]: v }));
		setErrors((prev) => ({ ...prev, [k]: undefined }));
		setSuccess(null);
		setError(null);
	}

	const handleFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
		const f = ev.target.files?.[0];
		if (!f) return;
		setFileName(f.name);
		setFileObj(f);
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = String(reader.result || "");
			setPreview(base64);
			setForm((s) => ({ ...s, photo: base64 }));
		};
		reader.readAsDataURL(f);
	};

	const formatDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

	const handleSubmit = async (ev: React.FormEvent) => {
		ev.preventDefault();
		if (!validate()) return;

		setError(null);
		setSuccess(null);

		try {
			// prepare user payload (used for JSON creation)
			const userPayload = {
				username: form.username,
				email: form.email,
				first_name: form.name,
				last_name: form.last_name,
				document_id: form.document_id,
				password: form.password,
			};

			const createPayload = {
				user: userPayload,
				role: form.internal_user_type_id,
			};

			const createRes = await fetch("/api/internal-users/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeader(),
				},
				body: JSON.stringify(createPayload),
			});

			if (!createRes.ok) {
				const bodyText = await createRes.text().catch(() => "");
				try {
					const jsonErr = JSON.parse(bodyText || "{}") as Record<string, unknown>;
					const newErrors: typeof errors = {};
					if (jsonErr && typeof jsonErr === "object") {
						for (const k of Object.keys(jsonErr)) {
							const v = jsonErr[k];
							if (k === "user" && typeof v === "object" && v !== null) {
								const userObj = v as Record<string, unknown>;
								for (const uk of Object.keys(userObj)) {
									const msgsVal = userObj[uk];
									const msgs = Array.isArray(msgsVal)
										? (msgsVal as string[]).join(" ")
										: String(msgsVal);
									if (uk === "username") newErrors.username = msgs;
									else if (uk === "email") newErrors.email = msgs;
									else if (uk === "password") newErrors.password = msgs;
									else if (uk === "document_id" || uk === "documentId")
										newErrors.document_id = msgs;
									else newErrors[uk as keyof typeof newErrors] = msgs;
								}
							} else {
								const msgs = Array.isArray(v) ? (v as string[]).join(" ") : String(v);
								if (k === "photo") newErrors.photo = String(msgs);
								else newErrors[k as keyof typeof newErrors] = String(msgs);
							}
						}
					}
					if (Object.keys(newErrors).length) {
						setErrors((s) => ({ ...s, ...newErrors }));
						return;
					}
				} catch {
					/* not JSON, fallthrough */
				}

				// fallback: plain text / html
				console.error("create internal user failed", bodyText);
				setError(`Failed to register user: ${createRes.status}`);
				return;
			}

			const created = await createRes.json().catch(() => null);
			console.log("created internal user response:", created);
			setSuccess("Usuario interno creado correctamente.");

			const internalId =
				(created && (created.id ?? created.pk)) ??
				(created && created.internal_user?.id) ??
				(created && created.internal_user?.pk) ??
				(created && created.user && (created.user.id ?? created.user.pk)) ??
				(created && created.user_id) ??
				null;

			if (!internalId) {
				console.warn("Could not determine internal user id from response:", created);
			}

			if (fileObj && internalId) {
				try {
					const fd = new FormData();
					fd.append("photo", fileObj);
					fd.append("role", form.internal_user_type_id);

					const patchRes = await fetch(
						`/api/internal-users/${encodeURIComponent(String(internalId))}/`,
						{
							method: "PATCH",
							headers: {
								...getAuthHeader(),
								Accept: "application/json",
							},
							body: fd,
						},
					);

					if (!patchRes.ok) {
						console.warn("photo upload failed", await patchRes.text().catch(() => ""));
					} else {
						const patched = await patchRes.json().catch(() => null);
						console.log("photo upload result:", patched);
						setSuccess("Usuario interno y foto registrados correctamente.");
					}
				} catch (e) {
					console.warn("photo upload error", e);
				}
			} else if (fileObj && !internalId) {
				console.warn("Skipping photo upload because internalId is missing.");
			}

			if (created && form.birthdate && internalId) {
				try {
					const birthdatePatch = { birthdate: formatDate(form.birthdate) };
					const bdRes = await fetch(
						`/api/internal-users/${encodeURIComponent(String(internalId))}/`,
						{
							method: "PATCH",
							headers: {
								"Content-Type": "application/json",
								...getAuthHeader(),
							},
							body: JSON.stringify(birthdatePatch),
						},
					);
					if (!bdRes.ok) {
						console.warn("birthdate patch failed (ignored):", await bdRes.text().catch(() => ""));
					}
				} catch (e) {
					console.warn("birthdate patch error (ignored):", e);
				}
			}

			try {
				const createdUserId =
					(created && created.user && (created.user.id ?? created.user.pk)) || null;
				if (createdUserId && form.internal_user_type_id === "ADMIN") {
					const patchRes = await fetch(`/api/users/${encodeURIComponent(createdUserId)}/`, {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							...getAuthHeader(),
						},
						body: JSON.stringify({ is_staff: true }),
					});
					if (!patchRes.ok) {
						console.warn(
							"could not mark user is_staff (backend may ignore):",
							await patchRes.text().catch(() => ""),
						);
					}
				}
			} catch (e) {
				console.warn("is_staff patch attempt failed", e);
			}

			// reset form and navigate
			setForm(INITIAL);
			setPreview(null);
			setFileObj(null);
			setFileName("");
			setTimeout(() => navigate("/internal-users/administrar-usuarios"), 700);
		} catch (err) {
			console.error(err);
			setError("Network error while creating user.");
		}
	};

	return (
		<PageTransition>
			<div className="form-card" style={{ position: "relative" }}>
				<header
					className="form-header font-montserrat"
					style={{ display: "flex", gap: 12, alignItems: "center" }}
				>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<div className="form-header-icon">
							<PersonIcon />
						</div>
						<div>
							<h2 className="form-header-title">Registrar usuario interno</h2>
							<p className="text-sm text-gray-500">Rellena los datos para crear el usuario</p>
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
						style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 8 }}
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
							onChange={(e) => handleChange("document_id", e.target.value.replace(/\D/g, ""))}
							placeholder="Ej. 12345678"
							aria-label="documento"
						/>
						{errors.document_id && <p className="field-error">{errors.document_id}</p>}
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
						{errors.username && <p className="field-error">{errors.username}</p>}
					</div>

					<div className="form-row">
						<label className="form-label">Tipo de usuario</label>
						<select
							className="input-primary input-lg"
							value={form.internal_user_type_id}
							onChange={(e) => handleChange("internal_user_type_id", e.target.value)}
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
						{errors.last_name && <p className="field-error">{errors.last_name}</p>}
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
						{errors.birthdate && <p className="field-error">{errors.birthdate}</p>}
					</div>

					<div className="form-row">
						<label className="form-label">Contraseña</label>
						<div className="input-with-icon" style={{ alignItems: "center" }}>
							<KeyIcon className="input-icon" />
							<input
								type={showPassword ? "text" : "password"}
								autoComplete="new-password"
								className="input-primary input-lg input-with-left-icon"
								value={form.password}
								onChange={(e) => handleChange("password", e.target.value)}
								placeholder="Mín. 8 caracteres: mayúscula, minúscula, número y símbolo"
							/>
							<button
								type="button"
								className="password-toggle"
								onClick={() => setShowPassword((s) => !s)}
								aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
								title={showPassword ? "Ocultar" : "Mostrar"}
							>
								{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
							</button>
						</div>
						{errors.password && <p className="field-error">{errors.password}</p>}
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

					{success && <div className="mt-4 text-sm text-green-700">{success}</div>}
					{error && <div className="mt-4 text-sm text-red-700">{error}</div>}
				</form>
			</div>
		</PageTransition>
	);
};

export default RegisterUser;
