// client/src/pages/ClientPage/children/ClientDashboard.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import PetsIcon from "@mui/icons-material/Pets";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// --- Types based on Backend Serializers ---
interface Canine {
	id: number;
	name: string;
}

interface Enrollment {
	id: number;
	plan_name: string;
	expiration_date: string;
	status: boolean;
}

interface Attendance {
	date: string;
	arrival_time: string | null;
	status: string;
}

interface ProfileResponse {
	canines: Canine[];
}

export default function ClientDashboard() {
	const navigate = useNavigate();

	// State
	const [canines, setCanines] = useState<Canine[]>([]);
	const [selectedCanineId, setSelectedCanineId] = useState<string>("");

	// Data for cards
	const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
	const [lastAttendance, setLastAttendance] = useState<Attendance | null>(null);

	// UI State
	const [loadingMain, setLoadingMain] = useState(true);
	const [loadingDetails, setLoadingDetails] = useState(false);

	// 1. Load Canines on mount
	useEffect(() => {
		const fetchCanines = async () => {
			try {
				setLoadingMain(true);
				const response = await apiClient.get<ProfileResponse>("/api/profile/");
				const dogs = response.data.canines || [];
				setCanines(dogs);

				// Select the first dog by default if available
				if (dogs.length > 0) {
					setSelectedCanineId(String(dogs[0].id));
				}
			} catch (error) {
				console.error("Error loading dashboard profile:", error);
			} finally {
				setLoadingMain(false);
			}
		};
		void fetchCanines();
	}, []);

	// 2. Load Details (Enrollment & Attendance) when selected dog changes
	useEffect(() => {
		if (!selectedCanineId) return;

		const fetchDetails = async () => {
			setLoadingDetails(true);
			setActiveEnrollment(null);
			setLastAttendance(null);

			try {
				// Fetch Active Enrollment (HU-13 Requirement)
				const enrollmentRes = await apiClient.get<Enrollment[]>(
					`/api/enrollments/?canine_id=${selectedCanineId}&status=true`,
				);
				if (enrollmentRes.data.length > 0) {
					setActiveEnrollment(enrollmentRes.data[0]);
				}

				// Fetch Last Attendance (Bonus: keeping dashboard consistent)
				// We verify if there is an enrollment first to query attendance properly,
				// or query attendance directly by canine if endpoint supports it.
				// Assuming we query by active enrollment for now or just fetch logs:
				// NOTE: Ideally backend should support /api/attendance/?canine_id=...
				// Using the enrollment ID from the previous call if available:
				if (enrollmentRes.data.length > 0) {
					const enrollmentId = enrollmentRes.data[0].id;
					const attendanceRes = await apiClient.get<Attendance[]>(
						`/api/attendance/?enrollment_id=${enrollmentId}&ordering=-date`,
					);
					if (attendanceRes.data.length > 0) {
						setLastAttendance(attendanceRes.data[0]);
					}
				}
			} catch (error) {
				console.error("Error loading canine details:", error);
			} finally {
				setLoadingDetails(false);
			}
		};

		void fetchDetails();
	}, [selectedCanineId]);

	// Helper to format status
	const getStatusLabel = (status: string) => {
		const map: Record<string, string> = {
			present: "Presente",
			absent: "Ausente",
			dispatched: "Despachado",
			advance_withdrawal: "Retiro Anticipado",
		};
		return map[status] || status;
	};

	return (
		<PageTransition>
			<div className="font-montserrat">
				<h1 className="text-2xl font-bold mb-6">Mi Panel de Cliente</h1>

				{loadingMain ? (
					<div className="animate-pulse flex space-x-4">
						<div className="h-32 bg-gray-200 rounded-lg w-full"></div>
						<div className="h-32 bg-gray-200 rounded-lg w-full"></div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* --- Card 1: Estado de Matrícula (HU-13 Real Data) --- */}
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-4">
										<div className="bg-amber-100 p-3 rounded-full">
											<AssignmentIcon className="text-amber-500" />
										</div>
										<h3 className="text-lg font-bold">Estado de Matrícula</h3>
									</div>

									{/* Selector de Canino */}
									{canines.length > 1 && (
										<select
											value={selectedCanineId}
											onChange={(e) => setSelectedCanineId(e.target.value)}
											className="input-primary text-sm py-1 px-2 h-auto"
										>
											{canines.map((dog) => (
												<option key={dog.id} value={dog.id}>
													{dog.name}
												</option>
											))}
										</select>
									)}
								</div>

								{loadingDetails ? (
									<p className="text-gray-400 text-sm">Cargando información...</p>
								) : activeEnrollment ? (
									<>
										<p className="text-amber-600 font-bold text-md mb-1">
											{activeEnrollment.plan_name}
										</p>
										<p className="text-gray-600 text-sm">
											Vence el: <strong>{activeEnrollment.expiration_date}</strong>
										</p>
										<div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
											Activo
										</div>
									</>
								) : (
									<p className="text-gray-500 text-sm italic">
										{canines.length > 0
											? "Este canino no tiene una matrícula activa."
											: "No tienes mascotas registradas."}
									</p>
								)}
							</div>

							{canines.length > 0 && (
								<button
									className="mt-4 btn-ghost w-full text-sm"
									onClick={() => navigate(`/portal-cliente/mis-mascotas/${selectedCanineId}`)}
								>
									Ver Detalles del Plan
								</button>
							)}
						</div>

						{/* --- Card 2: Última Asistencia (Real Data) --- */}
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
							<div>
								<div className="flex items-center gap-4 mb-4">
									<div className="bg-green-100 p-3 rounded-full">
										<EventAvailableIcon className="text-green-600" />
									</div>
									<h3 className="text-lg font-bold">Última Asistencia</h3>
								</div>

								{loadingDetails ? (
									<p className="text-gray-400 text-sm">Consultando...</p>
								) : lastAttendance ? (
									<>
										<p className="text-gray-800 font-semibold">{lastAttendance.date}</p>
										<p className="text-gray-600 text-sm mt-1">
											Estado:{" "}
											<span className="font-medium">{getStatusLabel(lastAttendance.status)}</span>
										</p>
										<p className="text-gray-600 text-sm">
											Llegada:{" "}
											{lastAttendance.arrival_time
												? lastAttendance.arrival_time.slice(0, 5)
												: "--:--"}
										</p>
									</>
								) : (
									<p className="text-gray-500 text-sm italic">No hay registros recientes.</p>
								)}
							</div>

							{selectedCanineId && (
								<button
									className="mt-4 btn-ghost w-full text-sm"
									onClick={() => navigate(`/portal-cliente/mis-mascotas/${selectedCanineId}`)}
								>
									Ver Historial Completo
								</button>
							)}
						</div>

						{/* --- Card 3: Acciones Rápidas (Static links) --- */}
						<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
							<div>
								<div className="flex items-center gap-4 mb-4">
									<div className="bg-blue-100 p-3 rounded-full">
										<AccountCircleIcon className="text-blue-600" />
									</div>
									<h3 className="text-lg font-bold">Mi Perfil</h3>
								</div>
								<p className="text-gray-600 text-sm">
									Actualiza tus datos personales, dirección y contraseña.
								</p>
							</div>
							<button
								className="mt-4 btn-ghost w-full text-sm"
								onClick={() => navigate("/portal-cliente/perfil")}
							>
								Editar Perfil
							</button>
						</div>

						{/* --- Card 4: Matrícula (CTA) --- */}
						<div className="bg-amber-400 text-white p-6 rounded-lg shadow-sm border border-gray-100 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								<div className="bg-white/20 p-3 rounded-full">
									<PetsIcon />
								</div>
								<div>
									<h3 className="text-lg font-bold">¿Nuevo miembro en la familia?</h3>
									<p className="text-white/90 text-sm">
										Inscribe a tu canino en nuestros planes mensuales o anuales.
									</p>
								</div>
							</div>
							<button
								className="bg-white text-amber-500 font-bold py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
								onClick={() => navigate("/portal-cliente/matricular-canino")}
							>
								Matricular Canino
							</button>
						</div>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
