import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import apiClient from "../../api/axiosConfig";
import PetsIcon from "@mui/icons-material/Pets";

const ResetPassword = () => {
	const { uid, token } = useParams<{ uid: string; token: string }>();
	const navigate = useNavigate();

	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [validating, setValidating] = useState(true);
	const [tokenValid, setTokenValid] = useState<boolean | null>(null);
	const [exiting, setExiting] = useState(false);

	const validate = () => {
		if (!password) return "Ingresa la nueva contraseña.";
		if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
		if (password !== confirm) return "Las contraseñas no coinciden.";
		return "";
	};

	const rules = {
		minLen: password.length >= 8,
		hasNumber: /\d/.test(password),
		hasUpper: /[A-ZÁÉÍÓÚÑ]/.test(password),
		hasLower: /[a-záéíóúñ]/.test(password),
		hasSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
	};
	const allRulesOk = Object.values(rules).every(Boolean);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		const v = validate();
		if (v) {
			setError(v);
			return;
		}
		if (!uid || !token) {
			setError("Enlace inválido. Faltan parámetros.");
			return;
		}
		setLoading(true);
		try {
			console.debug("ResetPassword: submitting to endpoint", {
				url: `/api/auth/password_reset_confirm/${uid}/${token}/`,
				payload: { new_password: password },
			});
			const res = await apiClient.post(
				`/api/auth/password_reset_confirm/${uid}/${token}/`,
				{ new_password: password },
				{ headers: { "Content-Type": "application/json" }, validateStatus: () => true },
			);
			console.debug("ResetPassword: response", { status: res.status, data: res.data });

			if (res.status >= 200 && res.status < 300) {
				setSuccess(res.data?.detail || "Contraseña restablecida correctamente.");
				// play exit animation then redirect
				setExiting(true);
				setTimeout(() => navigate("/login", { replace: true }), 900);
				return;
			}

			const body = res.data ?? {};
			// provide more diagnostic info for debugging
			const serverMsg =
				body.detail || JSON.stringify(body) || "Error al restablecer la contraseña.";
			setError(`(${res.status}) ${serverMsg}`);
		} catch (err) {
			console.error(err);
			setError("Error de red al comunicarse con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// Validate token on mount so the form is only usable with a valid link
		const validateToken = async () => {
			if (!uid || !token) {
				setTokenValid(false);
				setValidating(false);
				return;
			}
			setValidating(true);
			try {
				const res = await apiClient.get(`/api/auth/password_reset_validate/${uid}/${token}/`, {
					validateStatus: () => true,
				});
				if (res.status >= 200 && res.status < 300) {
					setTokenValid(true);
				} else {
					setTokenValid(false);
					setError(res.data?.detail || "Enlace inválido o expirado.");
				}
			} catch (err) {
				console.error(err);
				setTokenValid(false);
				setError("Error validando el enlace. Intenta de nuevo más tarde.");
			} finally {
				setValidating(false);
			}
		};
		validateToken();
	}, [uid, token]);

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-[var(--page-bg)] p-8">
			<div className="w-full max-w-3xl bg-[var(--panel-bg)] rounded-3xl p-12 shadow-2xl font-jua relative overflow-hidden reset-password">
				<div className="absolute -left-8 -top-8 w-56 h-56 rounded-full bg-amber-100 opacity-55 blur-3xl pointer-events-none" />
				<div className="absolute right-6 top-6 text-amber-400 opacity-30 pointer-events-none">
					<PetsIcon sx={{ fontSize: 56 }} />
				</div>

				<div className="flex items-center gap-4 mb-6">
					<div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-400 text-white shadow-md">
						<LockOutlineIcon sx={{ fontSize: 24 }} />
					</div>
					<div>
						<h2 className="text-4xl font-montserrat leading-tight">Restablecer contraseña</h2>
						<div className="w-36 h-1 rounded bg-amber-400 mt-2" aria-hidden />
					</div>
				</div>

				{validating ? (
					<div className="py-10 text-center text-lg">Validando enlace...</div>
				) : tokenValid ? (
					<form
						onSubmit={handleSubmit}
						aria-label="Formulario restablecer contraseña"
						className={exiting ? "animate-fade-out" : "animate-fade-in"}
					>
						<label className="block mb-4">
							<span className="text-sm font-lekton-bold">Nueva contraseña</span>
							<div className="relative mt-2">
								<LockOutlineIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className={`block w-full border rounded-md px-4 py-3 pl-12 pr-12 text-lg font-lekton-bold input-primary placeholder ${
										password ? (allRulesOk ? "border-green-500" : "border-amber-400") : ""
									}`}
									placeholder="Nueva contraseña"
									required
									aria-required="true"
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 password-toggle p-2"
									onClick={() => setShowPassword((s) => !s)}
									aria-label={showPassword ? "Ocultar" : "Mostrar"}
									style={{ background: "transparent", boxShadow: "none", border: "none" }}
								>
									{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</button>
							</div>
						</label>

						<label className="block mb-4">
							<span className="text-sm font-lekton-bold">Repetir nueva contraseña</span>
							<div className="relative mt-2">
								<LockOutlineIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
								<input
									type={showConfirm ? "text" : "password"}
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
									className="block w-full border rounded-md px-4 py-3 pl-12 pr-12 text-lg font-lekton-bold input-primary placeholder"
									placeholder="Repite la nueva contraseña"
									required
									aria-required="true"
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 password-toggle p-2"
									onClick={() => setShowConfirm((s) => !s)}
									aria-label={showConfirm ? "Ocultar" : "Mostrar"}
									style={{ background: "transparent", boxShadow: "none", border: "none" }}
								>
									{showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</button>
							</div>
						</label>

						{error && (
							<div role="alert" className="text-red-600 mb-3">
								{error}
							</div>
						)}
						{success && (
							<div role="status" className="text-green-600 mb-3">
								{success}
							</div>
						)}

						{/* Password rules feedback */}
						<div className="mb-4 text-sm font-montserrat text-gray-600">
							<ul className="space-y-1">
								<li className={rules.minLen ? "text-green-600" : "text-gray-400"}>
									{rules.minLen ? "✓" : "○"} Mínimo 8 caracteres
								</li>
								<li
									className={rules.hasUpper && rules.hasLower ? "text-green-600" : "text-gray-400"}
								>
									{rules.hasUpper && rules.hasLower ? "✓" : "○"} Usar Mayúsculas y Minúsculas
								</li>
								<li className={rules.hasNumber ? "text-green-600" : "text-gray-400"}>
									{rules.hasNumber ? "✓" : "○"} Incluir un número
								</li>
								<li className={rules.hasSymbol ? "text-green-600" : "text-gray-400"}>
									{rules.hasSymbol ? "✓" : "○"} Incluir un símbolo
								</li>
							</ul>
						</div>

						<button
							type="submit"
							className="w-full btn-primary mb-3 text-lg py-3 font-montserrat"
							disabled={loading || !allRulesOk}
						>
							{loading ? "ENVIANDO..." : "Restablecer contraseña"}
						</button>

						<div className="text-center text-sm">
							<Link to="/login" className="link-amber underline font-montserrat">
								Volver al login
							</Link>
						</div>
					</form>
				) : (
					<div className="py-6 text-center">
						<p className="mb-4 text-red-600">{error || "Enlace inválido o expirado."}</p>
						<Link to="/login" className="btn-primary inline-block px-4 py-2">
							Ir al inicio
						</Link>
					</div>
				)}
			</div>
		</div>
	);
};

export default ResetPassword;
