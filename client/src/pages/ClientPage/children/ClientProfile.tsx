// client/src/pages/ClientPage/children/ClientProfile.tsx

import React, { useState, useEffect } from "react";
import { isAxiosError } from "axios"; // Import needed for type-safe error handling
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import { validationRules } from "../../../utils/validationRules";

// Define types matching the backend serializer structure
type UserProfile = {
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	address: string;
	document_id: string;
};

type ProfileData = {
	user: UserProfile;
};

// Payload type definition to avoid 'any'
type UpdateProfilePayload = {
	user: UserProfile & { password?: string };
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

	// Fetch profile data on mount
	useEffect(() => {
		const fetchProfile = async () => {
			setLoading(true);
			try {
				const response = await apiClient.get<ProfileData>("/api/profile/");
				setProfile(response.data.user);
				setInitialProfile(response.data.user);
				setError(null);
			} catch (err: unknown) {
				console.error("Error fetching profile:", err);
				setError("No se pudo cargar la información del perfil. Por favor, intenta de nuevo.");
			} finally {
				setLoading(false);
			}
		};

		void fetchProfile();
	}, []);

	// Handle text input changes for profile fields
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
		// Clear error/success messages when user types
		if (error) setError(null);
		if (successMsg) setSuccessMsg(null);
	};

	// Handle form submission
	const handleSaveChanges = async () => {
		if (!profile) return;
		setSaving(true);
		setError(null);
		setSuccessMsg(null);

		// 1. Validate Password Logic (Frontend Validation)
		if (newPassword) {
			// UX: Require current password to prevent accidental changes
			if (!currentPassword) {
				setError("Para cambiar la contraseña, debes ingresar tu contraseña actual.");
				setSaving(false);
				return;
			}

			// Backend constraint validation
			if (!validationRules.isValidPassword(newPassword)) {
				setError(validationRules.messages.password);
				setSaving(false);
				return;
			}
		}

		try {
			// 2. Construct Payload with strict typing
			// The backend expects 'password' INSIDE the 'user' object.
			const payload: UpdateProfilePayload = {
				user: {
					...profile,
				},
			};

			// Only add password to payload if user wants to change it
			if (newPassword) {
				payload.user.password = newPassword;
			}

			// 3. Send Request via Axios
			await apiClient.patch("/api/profile/", payload);

			// 4. Update Success State
			setInitialProfile(profile); // Sync backup state
			setIsEditMode(false);
			setSuccessMsg("Perfil actualizado correctamente.");

			// Clear sensitive fields
			setCurrentPassword("");
			setNewPassword("");
		} catch (err: unknown) {
			console.error("Error saving profile:", err);

			// Type-safe error handling using axios guard
			if (isAxiosError(err) && err.response?.data) {
				const data = err.response.data as Record<string, unknown>;
				// Try to extract a meaningful message
				// backend usually returns { detail: "..." } or { user: { password: [...] } }
				const userErrors = data.user as Record<string, string[]> | undefined;
				const passwordError = userErrors?.password?.[0];
				const detail =
					(data.detail as string) || passwordError || "Error de validación en el servidor.";

				setError(`Error: ${detail}`);
			} else {
				setError("No se pudieron guardar los cambios. Verifique su conexión.");
			}
		} finally {
			setSaving(false);
		}
	};

	// Revert changes and exit edit mode
	const handleCancel = () => {
		setProfile(initialProfile);
		setCurrentPassword("");
		setNewPassword("");
		setIsEditMode(false);
		setError(null);
		setSuccessMsg(null);
	};

	if (loading) return <p className="text-center p-8">Cargando perfil...</p>;

	return (
		<PageTransition>
			<div className="font-montserrat">
				{/* Header Section */}
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Mi Perfil</h1>
					{!isEditMode && (
						<button className="btn-primary" onClick={() => setIsEditMode(true)}>
							Editar Perfil
						</button>
					)}
				</div>

				{/* Notifications */}
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
					{/* Left Column: Personal Info & Address */}
					<div className="lg:col-span-2 space-y-8">
						{/* Personal Information Card */}
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

						{/* Address Card */}
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

					{/* Right Column: Password Management */}
					<div className="lg:col-span-1">
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<h2 className="text-lg font-bold mb-4">Cambiar Contraseña</h2>
							<form className="space-y-4">
								<div>
									<label className="form-label">Contraseña Actual</label>
									<input
										type="password"
										className="input-primary w-full mt-1"
										placeholder="••••••••"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										disabled={!isEditMode}
									/>
								</div>
								<div>
									<label className="form-label">Nueva Contraseña</label>
									<input
										type="password"
										className="input-primary w-full mt-1"
										placeholder="••••••••"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										disabled={!isEditMode}
									/>
									{/* Helper text for password requirements when editing */}
									{isEditMode && (
										<p className="text-xs text-gray-500 mt-2">
											Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
										</p>
									)}
								</div>
							</form>
						</div>
					</div>
				</div>

				{/* Action Buttons (Only visible in Edit Mode) */}
				{isEditMode && (
					<div className="flex justify-end gap-4 mt-8">
						<button className="btn-ghost" onClick={handleCancel} disabled={saving}>
							Cancelar
						</button>
						<button className="btn-primary" onClick={handleSaveChanges} disabled={saving}>
							{saving ? "Guardando..." : "Guardar Cambios"}
						</button>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
