import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import PersonIcon from "@mui/icons-material/Person";
import PetsIcon from "@mui/icons-material/Pets";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HomeIcon from "@mui/icons-material/Home";
import logoSrc from "../../assets/logo.png";
import rightImage from "../../assets/right-image.png";
import apiClient from "../../api/axiosConfig";

export const LoginPage = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [remember, setRemember] = useState<boolean>(() => !!localStorage.getItem("access_token"));
	const [showPassword, setShowPassword] = useState(false);
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const recaptchaRef = useRef<ReCAPTCHA>(null);

	const navigate = useNavigate();

	// detect if running under Cypress (E2E) to bypass client-side captcha enforcement
	const isCypress =
		typeof window !== "undefined" && (window as unknown as { Cypress?: boolean }).Cypress;

	const validate = () => {
		if (!username || !username.trim()) return "Ingresa el usuario.";
		if (!password) return "Ingresa la contraseña.";
		// In Cypress E2E runs we skip client-side captcha enforcement
		if (!captchaToken && !isCypress) return "Por favor, completa el captcha.";
		// Password validation is handled by backend
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
			// Verify captcha token server-side before exchanging credentials
			if (captchaToken) {
				try {
					// proceed to verify captcha token server-side
					const verifyRes = await apiClient.post(
						"/api/recaptcha/verify/",
						{ token: captchaToken },
						{
							headers: { "Content-Type": "application/json", Accept: "application/json" },
							validateStatus: () => true,
						},
					);
					if (!(verifyRes.status >= 200 && verifyRes.status < 300)) {
						setError("Error verificando el captcha. Intenta nuevamente.");
						recaptchaRef.current?.reset();
						setCaptchaToken(null);
						setLoading(false);
						return;
					}
					const vdata = verifyRes.data ?? {};
					if (!vdata.success) {
						setError("Verificación de captcha fallida. Intenta de nuevo.");
						recaptchaRef.current?.reset();
						setCaptchaToken(null);
						setLoading(false);
						return;
					}
				} catch (err) {
					console.error("Captcha verify error", err);
					setError("Error verificando captcha. Intenta de nuevo.");
					recaptchaRef.current?.reset();
					setCaptchaToken(null);
					setLoading(false);
					return;
				}
			}

			const res = await apiClient.post(
				"/api/token/",
				{ username, password },
				{
					headers: { "Content-Type": "application/json", Accept: "application/json" },
					validateStatus: () => true,
				},
			);
			if (!(res.status >= 200 && res.status < 300)) {
				const body = res.data ?? {};
				setError(body.detail || "Credenciales inválidas");
				setLoading(false);
				recaptchaRef.current?.reset();
				setCaptchaToken(null);
				return;
			}
			const data = res.data ?? {};
			const access = data.access;
			const refresh = data.refresh;
			if (!access || !refresh) {
				setError("Respuesta del servidor inválida");
				setLoading(false);
				return;
			}

			if (remember) {
				localStorage.setItem("access_token", access);
				localStorage.setItem("refresh_token", refresh);
			} else {
				sessionStorage.setItem("access_token", access);
				sessionStorage.setItem("refresh_token", refresh);
			}

			const userTypeRes = await apiClient.get("/api/user-type/", {
				headers: { Authorization: `Bearer ${access}`, Accept: "application/json" },
				validateStatus: () => true,
			});

			if (!(userTypeRes.status >= 200 && userTypeRes.status < 300)) {
				navigate("/", { replace: true });
				return;
			}

			const ut = userTypeRes.data ?? {};
			if (ut.user_type) localStorage.setItem("user_type", String(ut.user_type));
			if (ut.role) localStorage.setItem("user_role", String(ut.role));
			if (ut.client_id) localStorage.setItem("client_id", String(ut.client_id));

			if (ut.user_type === "client") {
				navigate("/portal-cliente/dashboard", { replace: true });
				return;
			}

			if (ut.user_type === "internal") {
				const role = (ut.role || "").toUpperCase();

				if (role === "COACH") {
					navigate("/internal-users/registrar-asistencia", { replace: true });
					return;
				}

				navigate("/internal-users/dashboard", { replace: true });
				return;
			}

			navigate("/", { replace: true });
		} catch (err: unknown) {
			console.error(err);
			setError("Error al iniciar sesión. Intenta de nuevo.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="h-screen w-screen flex login-page">
			<div className="absolute left-4 top-4 z-20 flex items-center gap-4">
				<img src={logoSrc} alt="Logo" className="w-40 h-auto" />
				<Button
					component={Link}
					to="/"
					variant="outlined"
					startIcon={<HomeIcon />}
					sx={{
						color: "#fbbf24",
						borderColor: "#fbbf24",
						fontFamily: "var(--font-lekton-bold)",
						letterSpacing: "0.05em",
						textTransform: "none",
						padding: "0.5rem 1.25rem",
						borderRadius: "0.5rem",
						transition: "all 0.3s ease",
						display: "flex",
						alignItems: "center",
						"& .MuiButton-startIcon": {
							marginRight: "0.5rem",
							marginLeft: 0,
							display: "flex",
							alignItems: "center",
						},
						"& .MuiSvgIcon-root": {
							color: "#fbbf24",
							fontSize: "1.2rem",
						},
						"&:hover": {
							borderColor: "#f59e0b",
							backgroundColor: "rgba(251, 191, 36, 0.15)",
							color: "#f59e0b",
							transform: "translateY(-2px)",
							boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)",
							"& .MuiSvgIcon-root": {
								color: "#f59e0b",
							},
						},
					}}
				>
					Inicio
				</Button>
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

					<form onSubmit={handleSubmit} aria-label="Formulario de inicio de sesión">
						<label className="block mb-2">
							<span className="text-sm font-lekton-bold subtittle-primary letter-space-lg">
								Usuario
							</span>
							<div className="relative mt-1">
								<PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
								<input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="block w-full border rounded px-3 py-2 pl-10 pr-10 font-lekton-bold input-primary placeholder"
									placeholder="usuario"
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
									aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

						{/* Do not render actual reCAPTCHA when running under Cypress; tests bypass verification via header */}
						{!isCypress && (
							<div className="mt-4 flex justify-center">
								<ReCAPTCHA
									ref={recaptchaRef}
									sitekey="6LcvQyQsAAAAAMnj13iM7U89OTlTSt72jng-RDZb"
									onChange={(token: string | null) => {
										console.log("Captcha resuelto. Token:", token);
										setCaptchaToken(token);
									}}
								/>
							</div>
						)}

						{error && (
							<div role="alert" aria-live="assertive" className="text-red-600 mt-3">
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
				<Link to="/register" className="link-amber underline font-lekton-bold no-italic">
					Regístrate
				</Link>
			</div>
		</div>
	);
};
export default LoginPage;
