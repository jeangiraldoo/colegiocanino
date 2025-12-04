// client/src/pages/ClientPage/children/ClientProfile.tsx

import React, { useState, useEffect, useMemo } from "react";
import { isAxiosError } from "axios";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import { validationRules } from "../../../utils/validationRules";

// Icons (Only used ones)
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// Define types matching backend serializers
type UserProfile = {
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	address: string;
	document_id: string;
};

type ProfileData = { user: UserProfile };

// Define a strict type for the update payload
type UpdateProfilePayload = {
	user: Partial<UserProfile> & { password?: string };
};

// Type for password validation criteria
type PasswordCriteria = {
	length: boolean;
	uppercase: boolean;
	lowercase: boolean;
	number: boolean;
	special: boolean;
};

export default function ClientProfile() {
	// State for profile data
	const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);

	// UI States
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [saving, setSaving] = useState(false);

	// Password management states
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const passwordCriteria: PasswordCriteria = useMemo(
		() => ({
			length: newPassword.length >= 8,
			uppercase: /[A-Z]/.test(newPassword),
			lowercase: /[a-z]/.test(newPassword),
			number: /\d/.test(newPassword),
			special: /[@$!%*?&]/.test(newPassword),
		}),
		[newPassword],
	);

	const hasChanges = useMemo(() => {
		if (!initialProfile || !profile) return false;
		const profileChanged = JSON.stringify(initialProfile) !== JSON.stringify(profile);
		const passwordChanged = newPassword.length > 0;
		return profileChanged || passwordChanged;
	}, [initialProfile, profile, newPassword]);

	useEffect(() => {
		const fetchProfile = async () => {
			setLoading(true);
			try {
				const response = await apiClient.get<ProfileData>("/api/profile/");
				setProfile(response.data.user);
				setInitialProfile(response.data.user);
			} catch (err) {
				console.error("Error fetching profile:", err);
				setError("No se pudo cargar la información del perfil.");
			} finally {
				setLoading(false);
			}
		};
		void fetchProfile();
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
	};

	const handleSaveChanges = async () => {
		if (!profile) return;
		setSaving(true);
		setError(null);
		setSuccessMsg(null);

		if (newPassword) {
			if (!currentPassword) {
				setError("Ingresa tu contraseña actual para verificar el cambio.");
				setSaving(false);
				return;
			}
			if (newPassword === currentPassword) {
				setError("La nueva contraseña no puede ser igual a la actual.");
				setSaving(false);
				return;
			}
			if (!validationRules.isValidPassword(newPassword)) {
				setError(validationRules.messages.password);
				setSaving(false);
				return;
			}
			if (newPassword !== confirmNewPassword) {
				setError("Las nuevas contraseñas no coinciden.");
				setSaving(false);
				return;
			}
		}

		try {
			const payload: UpdateProfilePayload = { user: { ...profile } };
			if (newPassword) {
				payload.user.password = newPassword;
			}

			await apiClient.patch("/api/profile/", payload);

			setInitialProfile(profile);
			setIsEditMode(false);
			setSuccessMsg("Perfil actualizado correctamente.");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");
		} catch (err: unknown) {
			console.error("Error saving profile:", err);

			if (isAxiosError(err) && err.response?.data) {
				// FIX: Cast to Record<string, unknown> to avoid 'any'
				const data = err.response.data as Record<string, unknown>;
				const userErrors =
					typeof data.user === "object" && data.user !== null
						? (data.user as Record<string, string[]>)
						: undefined;
				const passwordError = userErrors?.password?.[0];
				const detail = typeof data.detail === "string" ? data.detail : undefined;

				setError(`Error: ${detail || passwordError || "Error de validación."}`);
			} else {
				setError("No se pudieron guardar los cambios.");
			}
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setProfile(initialProfile);
		setCurrentPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
		setIsEditMode(false);
		setError(null);
		setSuccessMsg(null);
	};

	if (loading) return <p className="text-center p-8">Cargando perfil...</p>;

	return (
		<PageTransition>
			<div className="font-montserrat">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Mi Perfil</h1>
					{!isEditMode && (
						<button className="btn-primary" onClick={() => setIsEditMode(true)}>
							Editar Perfil
						</button>
					)}
				</div>

				{error && (
					<div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
						{error}
					</div>
				)}
				{successMsg && (
					<div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm">
						{successMsg}
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<h2 className="text-lg font-bold mb-4">Información Personal</h2>
							<form className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="form-label">Nombre</label>
										<input
											type="text"
											name="first_name"
											className="input-primary w-full mt-1"
											value={profile?.first_name || ""}
											onChange={handleInputChange}
											disabled={!isEditMode}
										/>
									</div>
									<div>
										<label className="form-label">Apellidos</label>
										<input
											type="text"
											name="last_name"
											className="input-primary w-full mt-1"
											value={profile?.last_name || ""}
											onChange={handleInputChange}
											disabled={!isEditMode}
										/>
									</div>
								</div>
								<div>
									<label className="form-label">Correo electrónico</label>
									<input
										type="email"
										name="email"
										className="input-primary w-full mt-1"
										value={profile?.email || ""}
										onChange={handleInputChange}
										disabled={!isEditMode}
									/>
								</div>
								<div>
									<label className="form-label">Teléfono</label>
									<input
										type="text"
										name="phone_number"
										className="input-primary w-full mt-1"
										value={profile?.phone_number || ""}
										onChange={handleInputChange}
										disabled={!isEditMode}
									/>
								</div>
							</form>
						</div>

						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<h2 className="text-lg font-bold mb-4">Dirección</h2>
							<form>
								<div>
									<label className="form-label">Dirección de Residencia</label>
									<textarea
										name="address"
										className="input-primary w-full mt-1"
										value={profile?.address || ""}
										onChange={handleInputChange}
										disabled={!isEditMode}
										rows={4}
									></textarea>
								</div>
							</form>
						</div>
					</div>

					<div className="lg:col-span-1">
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<h2 className="text-lg font-bold mb-4">Cambiar Contraseña</h2>
							<form className="space-y-4">
								<div>
									<label className="form-label">Contraseña Actual</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											className="input-primary w-full mt-1 pr-10"
											placeholder="••••••••"
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											disabled={!isEditMode}
										/>
										<button
											type="button"
											className="absolute right-3 top-1/2 -translate-y-1/2 password-toggle"
											onClick={() => setShowPassword((s) => !s)}
											disabled={!isEditMode}
										>
											{showPassword ? (
												<VisibilityOffIcon fontSize="small" />
											) : (
												<VisibilityIcon fontSize="small" />
											)}
										</button>
									</div>
								</div>
								<div>
									<label className="form-label">Nueva Contraseña</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											className="input-primary w-full mt-1 pr-10"
											placeholder="••••••••"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											disabled={!isEditMode}
										/>
									</div>
								</div>
								<div>
									<label className="form-label">Confirmar Nueva Contraseña</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											className="input-primary w-full mt-1 pr-10"
											placeholder="••••••••"
											value={confirmNewPassword}
											onChange={(e) => setConfirmNewPassword(e.target.value)}
											disabled={!isEditMode}
										/>
									</div>
								</div>

								{isEditMode && newPassword.length > 0 && (
									<div className="space-y-1 text-xs text-gray-500 mt-2">
										<p className={passwordCriteria.length ? "text-green-600" : "text-gray-500"}>
											{passwordCriteria.length ? "✓" : "•"} Mínimo 8 caracteres
										</p>
										<p className={passwordCriteria.uppercase ? "text-green-600" : "text-gray-500"}>
											{passwordCriteria.uppercase ? "✓" : "•"} Una mayúscula
										</p>
										<p className={passwordCriteria.lowercase ? "text-green-600" : "text-gray-500"}>
											{passwordCriteria.lowercase ? "✓" : "•"} Una minúscula
										</p>
										<p className={passwordCriteria.number ? "text-green-600" : "text-gray-500"}>
											{passwordCriteria.number ? "✓" : "•"} Un número
										</p>
										<p className={passwordCriteria.special ? "text-green-600" : "text-gray-500"}>
											{passwordCriteria.special ? "✓" : "•"} Un carácter especial (@$!%*?&)
										</p>
									</div>
								)}
							</form>
						</div>
					</div>
				</div>

				{isEditMode && (
					<div className="flex justify-end gap-4 mt-8">
						<button className="btn-ghost" onClick={handleCancel} disabled={saving}>
							Cancelar
						</button>
						<button
							className="btn-primary"
							onClick={handleSaveChanges}
							disabled={saving || !hasChanges}
						>
							{saving ? "Guardando..." : "Guardar Cambios"}
						</button>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
