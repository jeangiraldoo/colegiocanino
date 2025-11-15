// client/src/pages/ClientPage/children/ClientDashboard.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import PetsIcon from "@mui/icons-material/Pets";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// --- Simulación de datos para el dashboard ---
type CanineInfo = {
	id: number;
	name: string;
};

type LastAttendance = {
	canineName: string;
	entryTime: string;
	status: string;
};

type DashboardData = {
	canines: CanineInfo[];
	lastAttendance: Record<string, LastAttendance>; // Un objeto para buscar por ID de canino
};

const fetchDashboardData = async (): Promise<DashboardData> => {
	await new Promise((res) => setTimeout(res, 500)); // Simular delay de API
	return {
		canines: [
			{ id: 11, name: "Toby" },
			{ id: 12, name: "Luna" },
		],
		lastAttendance: {
			"11": {
				canineName: "Toby - Hoy",
				entryTime: "08:05 AM",
				status: "A tiempo",
			},
			"12": {
				canineName: "Luna - Hoy",
				entryTime: "08:45 AM",
				status: "Tarde",
			},
		},
	};
};

export default function ClientDashboard() {
	const navigate = useNavigate();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	const [selectedCanineId, setSelectedCanineId] = useState<string>("11"); // Por defecto, el primer canino
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const data = await fetchDashboardData();
				setDashboardData(data);
				if (data.canines.length > 0) {
					setSelectedCanineId(String(data.canines[0].id));
				}
			} catch (error) {
				console.error("Error al cargar los datos del dashboard:", error);
			} finally {
				setLoading(false);
			}
		};
		void loadData();
	}, []);

	const selectedAttendance = dashboardData?.lastAttendance[selectedCanineId];

	return (
		<PageTransition>
			<div className="font-montserrat">
				<h1 className="text-2xl font-bold mb-6">Mi Panel de Cliente</h1>

				{loading ? (
					<p>Cargando panel...</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Card para HU-13: Visualización de matrícula */}
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<div className="flex items-center gap-4">
								<div className="bg-amber-100 p-3 rounded-full">
									<AssignmentIcon className="text-amber-500" />
								</div>
								<div>
									<h3 className="text-lg font-bold">Estado de Matrícula</h3>
									<p className="text-gray-500 text-sm">Plan Anual Activo</p>
								</div>
							</div>
							<p className="mt-4 text-gray-600">
								Tu plan vence el: **31 de Octubre, 2026**. Incluye servicio de transporte completo.
							</p>
							<button className="mt-4 btn-ghost w-full">Ver Detalles</button>
						</div>

						{/* Card para HU-14: Visualización de asistencia (AHORA DINÁMICA) */}
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-4">
									<div className="bg-green-100 p-3 rounded-full">
										<EventAvailableIcon className="text-green-600" />
									</div>
									<div>
										<h3 className="text-lg font-bold">Última Asistencia</h3>
									</div>
								</div>
								{dashboardData && dashboardData.canines.length > 1 && (
									<select
										value={selectedCanineId}
										onChange={(e) => setSelectedCanineId(e.target.value)}
										className="input-primary text-sm"
									>
										{dashboardData.canines.map((canine) => (
											<option key={canine.id} value={canine.id}>
												{canine.name}
											</option>
										))}
									</select>
								)}
							</div>

							{selectedAttendance ? (
								<>
									<p className="text-gray-500 text-sm mt-1">{selectedAttendance.canineName}</p>
									<p className="mt-4 text-gray-600">
										Llegada: **{selectedAttendance.entryTime}** ({selectedAttendance.status}).
										Salida: Aún en el colegio.
									</p>
								</>
							) : (
								<p className="mt-4 text-gray-600">No hay registros de asistencia para hoy.</p>
							)}

							<button
								className="mt-4 btn-ghost w-full"
								onClick={() => navigate(`/portal-cliente/mis-mascotas/${selectedCanineId}`)}
							>
								Ver Historial de Asistencia
							</button>
						</div>

						{/* Card para HU-11: Modificación de perfil */}
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
							<div className="flex items-center gap-4">
								<div className="bg-blue-100 p-3 rounded-full">
									<AccountCircleIcon className="text-blue-600" />
								</div>
								<div>
									<h3 className="text-lg font-bold">Mi Perfil</h3>
									<p className="text-gray-500 text-sm">Mantén tus datos actualizados</p>
								</div>
							</div>
							<p className="mt-4 text-gray-600">
								Revisa y actualiza tu información de contacto y contraseña.
							</p>
							<button
								className="mt-4 btn-ghost w-full"
								onClick={() => navigate("/portal-cliente/perfil")}
							>
								Editar Perfil
							</button>
						</div>

						{/* Card para HU-12: Registrar nueva matrícula */}
						<div className="bg-amber-400 text-white p-6 rounded-lg shadow-sm border border-gray-100 md:col-span-2 lg:col-span-3">
							<div className="flex items-center gap-4">
								<div className="bg-white/20 p-3 rounded-full">
									<PetsIcon />
								</div>
								<div>
									<h3 className="text-lg font-bold">¿Nuevo miembro en la familia?</h3>
									<p className="text-white/80 text-sm">Inscribe a tu canino en nuestros planes.</p>
								</div>
							</div>
							<p className="mt-4">
								Ofrecemos planes mensuales, bimestrales y anuales con opción de transporte.
							</p>
							<button
								className="mt-4 bg-white text-amber-500 font-bold py-2 px-4 rounded-lg w-full"
								onClick={() => navigate("/portal-cliente/matricular-canino")}
							>
								Matricular un Nuevo Canino
							</button>
						</div>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
