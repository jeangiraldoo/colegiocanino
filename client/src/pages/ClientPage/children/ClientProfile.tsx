// client/src/pages/ClientPage/children/ClientProfile.tsx

import React, { useState, useEffect } from "react";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";

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

export default function ClientProfile() {
	const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [saving, setSaving] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			setLoading(true);
			try {
				const response = await apiClient.get<ProfileData>("/api/profile/");
				setProfile(response.data.user);
				setInitialProfile(response.data.user);
			} catch (err) {
				console.error("Error al cargar el perfil:", err);
				setError("No se pudo cargar la información del perfil. Por favor, intenta de nuevo.");
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
		try {
			const payload = { user: profile };
			await apiClient.patch("/api/profile/", payload);
			setInitialProfile(profile);
			setIsEditMode(false);
			// Limpiar campos de contraseña después de guardar
			setCurrentPassword("");
			setNewPassword("");
		} catch (_err) {
			// CORRECCIÓN CLAVE: Se renombra 'err' a '_err' para indicar que no se usa.
			console.error("Error al guardar el perfil:", _err);
			setError("No se pudieron guardar los cambios.");
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setProfile(initialProfile);
		setCurrentPassword("");
		setNewPassword("");
		setIsEditMode(false);
	};

	if (loading) return <p className="text-center p-8">Cargando perfil...</p>;
	if (error) return <p className="text-red-600 text-center p-8">{error}</p>;

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
								</div>
							</form>
						</div>
					</div>
				</div>

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
