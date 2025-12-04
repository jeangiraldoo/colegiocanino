// client/src/pages/RegisterPage/RegisterPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import apiClient from "../../api/axiosConfig";
import { validationRules } from "../../utils/validationRules";

// Icons
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Assets
import logoSrc from "../../assets/logo.png";
import rightImage from "../../assets/image-RegisterPage.png";
import { Button } from "@mui/material";

type ApiErrorResponse = {
	email?: string[];
	username?: string[];
	document_id?: string[];
	phone_number?: string[];
};

export const RegisterPage = () => {
	const navigate = useNavigate();

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		documentId: "",
		username: "",
		email: "",
		phoneNumber: "",
		address: "",
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
	};

	const validate = () => {
		if (Object.values(form).some((v) => v.trim() === "")) return validationRules.messages.required;
		if (!validationRules.isValidEmail(form.email)) return validationRules.messages.email;
		if (!validationRules.isValidDocumentId(form.documentId))
			return validationRules.messages.documentId;
		if (!validationRules.isValidPhoneNumber(form.phoneNumber))
			return validationRules.messages.phone;
		if (!validationRules.isValidAddress(form.address)) return validationRules.messages.address;
		if (!validationRules.isValidUsername(form.username)) return validationRules.messages.username;
		if (!validationRules.isValidPassword(form.password)) return validationRules.messages.password;
		if (form.password !== form.confirmPassword) return validationRules.messages.matchPassword;
		if (!agreeTerms) return validationRules.messages.terms;
		return "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}
		setLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const payload = {
				first_name: form.firstName,
				last_name: form.lastName,
				document_id: form.documentId,
				username: form.username,
				email: form.email,
				phone_number: form.phoneNumber,
				address: form.address,
				password: form.password,
			};
			const response = await apiClient.post("/api/register/", payload);
			if (response.status === 201) {
				setSuccess("¡Registro exitoso! Serás redirigido para iniciar sesión.");
				setTimeout(() => navigate("/login"), 2000);
			}
		} catch (err: unknown) {
			if (isAxiosError(err) && err.response) {
				const apiErrors = err.response.data as ApiErrorResponse;
				let errorMessage = "Ocurrió un error en el registro.";
				if (apiErrors.email?.[0]) errorMessage = `Correo: ${apiErrors.email[0]}`;
				else if (apiErrors.username?.[0]) errorMessage = `Usuario: ${apiErrors.username[0]}`;
				else if (apiErrors.document_id?.[0]) errorMessage = `Cédula: ${apiErrors.document_id[0]}`;
				else if (apiErrors.phone_number?.[0])
					errorMessage = `Teléfono: ${apiErrors.phone_number[0]}`;
				setError(errorMessage);
			} else {
				setError("No se pudo conectar con el servidor.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-screen flex flex-col lg:flex-row m-0 p-0 bg-white">
			<div className="hidden lg:block lg:w-1/2 relative h-screen sticky top-0">
				<img
					src={rightImage}
					alt="Personas felices con sus perros"
					className="w-full h-full object-cover"
				/>
			</div>

			<div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 py-12 lg:py-8 relative min-h-screen">
				<div className="absolute top-6 left-6 z-20">
					<Button
						component={Link}
						to="/"
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						sx={{
							color: "#fbbf24",
							borderColor: "#fbbf24",
							fontFamily: "var(--font-lekton-bold)",
							textTransform: "none",
							backgroundColor: "white",
							"&:hover": {
								borderColor: "#f59e0b",
								backgroundColor: "rgba(251, 191, 36, 0.15)",
								color: "#f59e0b",
							},
						}}
					>
						Inicio
					</Button>
				</div>

				<div className="max-w-md w-full mt-10 lg:mt-0">
					<div className="flex justify-center mb-4">
						<img src={logoSrc} alt="Logo Raíces Caninas" className="w-40 h-auto" />
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
						<div className="space-y-4">
							<div className="flex flex-col md:flex-row gap-4">
								<div className="w-full md:w-1/2">
									<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
										Nombre
									</label>
									<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
										<PersonOutlineIcon className="text-amber-400 mx-3" />
										<input
											type="text"
											name="firstName"
											value={form.firstName}
											onChange={handleChange}
											className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
											placeholder="Nombre"
										/>
									</div>
								</div>
								<div className="w-full md:w-1/2">
									<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
										Apellido
									</label>
									<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
										<PersonOutlineIcon className="text-amber-400 mx-3" />
										<input
											type="text"
											name="lastName"
											value={form.lastName}
											onChange={handleChange}
											className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
											placeholder="Apellido"
										/>
									</div>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Cédula de ciudadanía
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<BadgeOutlinedIcon className="text-amber-400 mx-3" />
									<input
										type="text"
										name="documentId"
										value={form.documentId}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="Tu número de documento"
									/>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Teléfono
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<PhoneIcon className="text-amber-400 mx-3" />
									<input
										type="text"
										name="phoneNumber"
										value={form.phoneNumber}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="Ej: 3001234567"
									/>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Dirección
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<HomeIcon className="text-amber-400 mx-3" />
									<input
										type="text"
										name="address"
										value={form.address}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="Dirección de residencia"
									/>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Nombre de usuario
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<PersonOutlineIcon className="text-amber-400 mx-3" />
									<input
										type="text"
										name="username"
										value={form.username}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="Elige un nombre de usuario"
									/>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Correo electrónico
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<MailOutlineIcon className="text-amber-400 mx-3" />
									<input
										type="email"
										name="email"
										value={form.email}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="nombre@ejemplo.com"
									/>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Contraseña
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<LockOutlineIcon className="text-amber-400 mx-3" />
									<input
										type={showPassword ? "text" : "password"}
										name="password"
										value={form.password}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="Mínimo 8 caracteres"
									/>
									<button
										type="button"
										className="password-toggle pr-3"
										onClick={() => setShowPassword((s) => !s)}
									>
										{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
									</button>
								</div>
							</div>

							<div>
								<label className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
									Confirmar Contraseña
								</label>
								<div className="relative mt-1 flex items-center border rounded input-primary focus-within:border-amber-400 focus-within:shadow-md">
									<LockOutlineIcon className="text-amber-400 mx-3" />
									<input
										type={showPassword ? "text" : "password"}
										name="confirmPassword"
										value={form.confirmPassword}
										onChange={handleChange}
										className="w-full bg-transparent border-none focus:ring-0 font-lekton-bold placeholder"
										placeholder="Repite tu contraseña"
									/>
								</div>
							</div>
						</div>

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
								className="text-red-600 mt-3 text-center font-lekton-bold text-sm"
							>
								{error}
							</div>
						)}
						{success && (
							<div
								role="alert"
								aria-live="polite"
								className="text-green-600 mt-3 text-center font-lekton-bold text-sm"
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
							<Link to="/login" className="link-amber underline font-lekton-bold no-italic">
								Inicia Sesión
							</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
