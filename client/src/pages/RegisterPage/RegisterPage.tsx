// client/src/pages/RegisterPage/RegisterPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // 1. Importamos axios
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import logoSrc from "../../assets/raices-caninas-logo.png";
import rightImage from "../../assets/image-RegisterPage.png";

// CAMBIO CLAVE 2: Se define un tipo para la estructura de los errores de la API.
type ApiErrorResponse = {
	email?: string[];
	username?: string[];
	document_id?: string[];
};

export const RegisterPage = () => {
	const navigate = useNavigate();

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		documentId: "",
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		setError(null);
		setSuccess(null);
	};

	const validate = () => {
		if (Object.values(form).some((v) => v.trim() === ""))
			return "Todos los campos son obligatorios.";
		if (!/^\S+@\S+\.\S+$/.test(form.email))
			return "El correo electrónico no es válido.";
		if (form.password.length < 6)
			return "La contraseña debe tener al menos 6 caracteres.";
		if (form.password !== form.confirmPassword)
			return "Las contraseñas no coinciden.";
		if (!/^\d{6,12}$/.test(form.documentId))
			return "La cédula debe contener entre 6 y 12 dígitos.";
		if (!agreeTerms) return "Debes aceptar los lineamientos de la escuela.";
		return "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);

		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}
		setLoading(true);

		try {
			const payload = {
				first_name: form.firstName,
				last_name: form.lastName,
				document_id: form.documentId,
				username: form.username,
				email: form.email,
				password: form.password,
			};

			const response = await axios.post(
				"http://127.0.0.1:8000/api/register/",
				payload,
			);

			if (response.status === 201) {
				setSuccess("¡Registro exitoso! Serás redirigido para iniciar sesión.");
				setTimeout(() => {
					navigate("/login");
				}, 2000);
			}
		} catch (err: unknown) {
			// CAMBIO CLAVE 3: Se usa `unknown` y se verifica el tipo de error.
			console.error("Error en el registro:", err);
			if (axios.isAxiosError(err) && err.response) {
				const apiErrors = err.response.data as ApiErrorResponse;
				let errorMessage = "Ocurrió un error en el registro.";

				if (apiErrors.email?.[0]) {
					errorMessage = `Correo electrónico: ${apiErrors.email[0]}`;
				} else if (apiErrors.username?.[0]) {
					errorMessage = `Nombre de usuario: ${apiErrors.username[0]}`;
				} else if (apiErrors.document_id?.[0]) {
					errorMessage = `Cédula: ${apiErrors.document_id[0]}`;
				}
				setError(errorMessage);
			} else {
				setError(
					"No se pudo conectar con el servidor. Intenta de nuevo más tarde.",
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col lg:flex-row login-page overflow-x-hidden">
			<div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 py-12 lg:py-8 overflow-y-auto">
				<div className="max-w-md w-full">
					<div className="flex justify-center mb-4">
						<img
							src={logoSrc}
							alt="Logo Raíces Caninas"
							className="w-40 h-auto"
						/>
					</div>

					<h1 className="text-2xl font-jua mb-2 text-center letter-space-md">
						<span className="inline-block bg-block-amber text-white px-2 py-1 rounded-none font-jua letter-space-md">
							REGÍSTRATE
						</span>
						<span className="text-amber-400"> AHORA</span>
					</h1>
					<h4 className="text-lg font-jua mb-6 subtittle-primary text-center letter-space-xl">
						Y forma parte de esta familia.
					</h4>

					<form onSubmit={handleSubmit} aria-label="Formulario de registro">
						<label className="block">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Nombre
							</span>
							<div className="relative mt-1">
								<PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type="text"
									name="firstName"
									value={form.firstName}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 font-lekton-bold input-primary placeholder"
									placeholder="Tu nombre"
								/>
							</div>
						</label>

						<label className="block mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Apellido
							</span>
							<div className="relative mt-1">
								<PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type="text"
									name="lastName"
									value={form.lastName}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 font-lekton-bold input-primary placeholder"
									placeholder="Tu apellido"
								/>
							</div>
						</label>

						<label className="block mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Cédula de ciudadanía
							</span>
							<div className="relative mt-1">
								<BadgeOutlinedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type="text"
									name="documentId"
									value={form.documentId}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 font-lekton-bold input-primary placeholder"
									placeholder="Tu número de documento"
								/>
							</div>
						</label>

						<label className="block mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Nombre de usuario
							</span>
							<div className="relative mt-1">
								<PersonOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type="text"
									name="username"
									value={form.username}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 font-lekton-bold input-primary placeholder"
									placeholder="Elige un nombre de usuario"
								/>
							</div>
						</label>

						<label className="block mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Correo electrónico
							</span>
							<div className="relative mt-1">
								<MailOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type="email"
									name="email"
									value={form.email}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 font-lekton-bold input-primary placeholder"
									placeholder="nombre@ejemplo.com"
								/>
							</div>
						</label>

						<label className="block mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Contraseña
							</span>
							<div className="relative mt-1">
								<LockOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type={showPassword ? "text" : "password"}
									name="password"
									value={form.password}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 pr-10 font-lekton-bold input-primary placeholder"
									placeholder="Mínimo 6 caracteres"
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 password-toggle"
									onClick={() => setShowPassword((s) => !s)}
								>
									{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</button>
							</div>
						</label>

						<label className="block mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Confirmar Contraseña
							</span>
							<div className="relative mt-1">
								<LockOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
								<input
									type={showPassword ? "text" : "password"}
									name="confirmPassword"
									value={form.confirmPassword}
									onChange={handleChange}
									className="block w-full border rounded px-3 py-2 pl-10 pr-10 font-lekton-bold input-primary placeholder"
									placeholder="Repite tu contraseña"
								/>
							</div>
						</label>

						<label className="flex items-center gap-2 mt-4">
							<input
								type="checkbox"
								checked={agreeTerms}
								onChange={(e) => setAgreeTerms(e.target.checked)}
								className="checkbox-primary"
							/>
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Estoy de acuerdo con los{" "}
								<a href="#" className="link-amber underline">
									lineamientos de la escuela
								</a>
								.
							</span>
						</label>

						{error && (
							<div
								role="alert"
								aria-live="assertive"
								className="text-red-600 mt-3 text-center font-lekton-bold"
							>
								{error}
							</div>
						)}
						{success && (
							<div
								role="alert"
								aria-live="polite"
								className="text-green-600 mt-3 text-center font-lekton-bold"
							>
								{success}
							</div>
						)}

						<button
							type="submit"
							className="mt-4 w-full btn-primary letter-space-lg"
							disabled={loading}
						>
							{loading ? "REGISTRANDO..." : "REGISTRARSE"}
						</button>

						<div className="mt-6 text-center text-sm font-lekton-italic subtittle-primary">
							¿Ya tienes una cuenta?{" "}
							<Link
								to="/login"
								className="link-amber underline font-lekton-bold no-italic"
							>
								Inicia Sesión
							</Link>
						</div>
					</form>
				</div>
			</div>
			<div className="hidden lg:block lg:w-1/2 relative min-h-screen">
				<img
					src={rightImage}
					alt="Personas felices con sus perros"
					className="w-full h-full object-cover"
				/>
			</div>
		</div>
	);
};
