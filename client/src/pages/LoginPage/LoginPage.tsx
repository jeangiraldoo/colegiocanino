import { useState } from "react";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PetsIcon from "@mui/icons-material/Pets";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import logoSrc from "../../assets/logo.png";
import rightImage from "../../assets/right-image.png";

export const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [remember, setRemember] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const validate = () => {
		if (!email) return "Ingresa un correo.";
		if (!/^\S+@\S+\.\S+$/.test(email)) return "Correo inválido.";
		if (!password) return "Ingresa la contraseña.";
		if (password.length < 6)
			return "La contraseña debe tener al menos 6 caracteres.";
		return "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const v = validate();
		if (v) {
			setError(v);
			return;
		}
		setLoading(true);
		try {
			await new Promise((res) => setTimeout(res, 900));
			console.log("Enviar credenciales:", { email, password, remember });
		} catch (err: unknown) {
			console.error(err);
			setError("Error al iniciar sesión. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="h-screen w-screen flex">
			<div className="absolute left-4 top-4 z-20">
				<img src={logoSrc} alt="Logo" className="w-40 h-auto" />
			</div>

			<div className="w-1/2 bg-white flex items-center justify-center p-8">
				<div className="max-w-md w-full">
					<div className="relative inline-block w-full">
						<h1 className="text-base font-jua mb-3 text-center letter-space-md">
							<span className="text-amber-400">INICIA</span>{" "}
							<span className="inline-block bg-block-amber text-white px-2 py-1 rounded-none font-jua letter-space-md">
								SESION
							</span>
						</h1>
						<div className="paw-decor" aria-hidden>
							<PetsIcon className="paw-item paw-1" />
							<PetsIcon className="paw-item paw-2" />
							<PetsIcon className="paw-item paw-3" />
						</div>
					</div>

					<h4 className="text-xl font-jua mb-4 subtittle-primary text-center letter-space-xl">
						Usa tus credenciales para acceder a las funcionalidades.
					</h4>

					<form
						onSubmit={handleSubmit}
						aria-label="Formulario de inicio de sesión"
					>
						<label className="block mb-2">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Correo electrónico
							</span>

							<div className="relative mt-1">
								<MailOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="block w-full border rounded px-3 py-2 pl-10 pr-10 font-lekton-bold input-primary placeholder"
									placeholder="nombre@ejemplo.com"
									required
									aria-required="true"
								/>
							</div>
						</label>

						<label className="block mb-2 mt-3">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Contraseña
							</span>

							<div className="relative mt-1">
								<LockOutlineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="block w-full border rounded px-3 py-2 pl-10 pr-10 font-lekton-bold input-primary placeholder"
									placeholder="••••••••"
									required
									aria-required="true"
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 password-toggle"
									onClick={() => setShowPassword((s) => !s)}
									aria-label={
										showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
									}
									title={showPassword ? "Ocultar" : "Mostrar"}
								>
									{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</button>
							</div>
						</label>

						<label className="flex items-center gap-2 mt-3">
							<input
								type="checkbox"
								checked={remember}
								onChange={(e) => setRemember(e.target.checked)}
								className="checkbox-primary"
							/>
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Recordarme
							</span>
						</label>

						<div className="mt-3 text-right">
							<a
								href="#"
								onClick={(e) => e.preventDefault()}
								role="link"
								aria-label="Recuperar contraseña"
								className="link-amber underline font-lekton-bold no-italic text-sm letter-space-lg"
							>
								¿Olvidaste tu contraseña?
							</a>
						</div>

						{error && (
							<div
								role="alert"
								aria-live="assertive"
								className="text-red-600 mt-3"
							>
								{error}
							</div>
						)}

						<button
							type="submit"
							className="mt-4 w-full btn-primary letter-space-lg"
							disabled={loading}
						>
							{loading ? "INGRESANDO..." : "INGRESAR"}
						</button>
					</form>
				</div>
			</div>

			<div className="w-1/2 relative">
				<img
					src={rightImage}
					alt="Decoración"
					className="w-full h-full object-cover"
					style={{ display: "block", objectPosition: "50% 30%" }}
				/>

				<div className="absolute top-8 left-8 right-8 z-20 right-hero">
					<h2 className="fredoka-regular text-white text-2xl md:text-3xl leading-tight letter-space-lg drop-shadow-md">
						Deja que tu mejor amigo aprenda jugando, nosotros lo guiamos.{" "}
						<a
							href="#"
							onClick={(e) => e.preventDefault()}
							role="link"
							aria-label="Conoce más"
							className="link-amber underline fredoka-regular text-2x1"
						>
							Conoce más aquí
						</a>
					</h2>
				</div>
			</div>

			<div className="fixed left-4 bottom-4 text-sm font-lekton-italic subtittle-primary">
				¿No tienes una cuenta?{" "}
				<a
					href="/register"
					className="link-amber underline font-lekton-bold no-italic"
				>
					Regístrate
				</a>
			</div>
		</div>
	);
};
