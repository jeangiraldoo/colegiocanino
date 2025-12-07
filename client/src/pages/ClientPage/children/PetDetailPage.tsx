import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EnrollmentDetails from "../components/EnrollmentDetails";
import apiClient from "../../../api/axiosConfig";

// Define interfaces matching the backend response structure
interface Attendance {
	id: number;
	date: string;
	status: string; // e.g., "present", "absent"
	arrival_time: string | null;
	departure_time: string | null;
	withdrawal_reason: string | null;
}

interface Canine {
	id: number;
	name: string;
	breed: string;
	// Add other canine fields if needed
}

interface CanineAttendanceResponse {
	canine: Canine;
	attendances: Attendance[];
}

export default function PetDetailPage() {
	const { canineId } = useParams<{ canineId?: string }>();
	const [canine, setCanine] = useState<Canine | null>(null);
	const [attendances, setAttendances] = useState<Attendance[]>([]);

	// Loading state for the main data fetch
	const [loadingData, setLoadingData] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filter states
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const recordsPerPage = 5;

	// Fetch real data from the backend
	useEffect(() => {
		if (!canineId) return;

		const loadCanineData = async () => {
			setLoadingData(true);
			setError(null);
			try {
				// We use the specialized endpoint that returns canine info + attendance history
				const response = await apiClient.get<CanineAttendanceResponse>(
					`/api/canines/${canineId}/attendance/`,
				);

				setCanine(response.data.canine);
				setAttendances(response.data.attendances);
				setFilteredAttendances(response.data.attendances); // Init filtered list
			} catch (err: unknown) {
				console.error("Error fetching canine details:", err);
				setError("No se pudo cargar la información de la mascota.");
			} finally {
				setLoadingData(false);
			}
		};

		void loadCanineData();
	}, [canineId]);

	// Filter logic applied to real data
	const handleFilter = () => {
		let filtered = attendances;

		if (startDate || endDate) {
			// Create boundary dates for comparison
			const start = startDate ? new Date(startDate.getTime()) : null;
			const end = endDate ? new Date(endDate.getTime()) : null;

			if (start) start.setHours(0, 0, 0, 0);
			if (end) end.setHours(23, 59, 59, 999);

			filtered = attendances.filter((att) => {
				// Backend sends date as YYYY-MM-DD string
				// We parse it to compare properly
				const [year, month, day] = att.date.split("-").map(Number);
				const attDate = new Date(year, month - 1, day);

				if (start && attDate < start) return false;
				if (end && attDate > end) return false;

				return true;
			});
		}
		setFilteredAttendances(filtered);
		setCurrentPage(1); // Reset pagination on filter
	};

	// Pagination Logic
	const currentRecords = useMemo(() => {
		const indexOfLastRecord = currentPage * recordsPerPage;
		const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
		return filteredAttendances.slice(indexOfFirstRecord, indexOfLastRecord);
	}, [currentPage, filteredAttendances]);

	const totalPages = Math.ceil(filteredAttendances.length / recordsPerPage);

	const paginate = (pageNumber: number) => {
		if (pageNumber < 1 || pageNumber > totalPages) return;
		setCurrentPage(pageNumber);
	};

	// Helper to format status text for display
	const formatStatus = (status: string) => {
		const statusMap: Record<string, string> = {
			present: "Presente",
			absent: "Ausente",
			dispatched: "Despachado",
			advance_withdrawal: "Retiro Anticipado",
		};
		return statusMap[status] || status;
	};

	// Helper to get day of week from date string
	const getDayOfWeek = (dateStr: string) => {
		const [year, month, day] = dateStr.split("-").map(Number);
		const date = new Date(year, month - 1, day);
		const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
		return days[date.getDay()];
	};

	if (error) {
		return (
			<div className="p-8 text-center text-red-600 font-montserrat">
				{error}
				<br />
				<Link to="/portal-cliente/mis-mascotas" className="underline mt-4 block">
					Volver
				</Link>
			</div>
		);
	}

	return (
		<PageTransition>
			<div className="font-montserrat">
				<div className="mb-6">
					<Link
						to="/portal-cliente/mis-mascotas"
						className="text-amber-500 hover:underline flex items-center gap-2"
					>
						<span className="font-bold">&larr;</span> Volver a Mis Mascotas
					</Link>
					<h1 className="text-2xl font-bold mt-2">
						{/* Show real name or skeleton if loading */}
						{loadingData ? "Cargando..." : `Detalle de ${canine?.name}`}
					</h1>
				</div>

				{/* HU-13: Real Enrollment Logic */}
				{/* Only render if we have a valid ID. The component handles its own loading/error */}
				{canineId && <EnrollmentDetails canineId={canineId} />}

				<div className="mt-8">
					<h2 className="text-xl font-bold mb-4 text-gray-800">Historial de Asistencia</h2>

					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
						<div className="flex flex-wrap items-center gap-4 mb-6">
							<div className="flex-grow">
								<label className="text-sm font-medium text-gray-600">Desde</label>
								<DatePicker
									selected={startDate}
									onChange={(date) => setStartDate(date)}
									selectsStart
									startDate={startDate}
									endDate={endDate}
									className="input-primary w-full mt-1"
									placeholderText="Fecha inicio"
								/>
							</div>
							<div className="flex-grow">
								<label className="text-sm font-medium text-gray-600">Hasta</label>
								<DatePicker
									selected={endDate}
									onChange={(date) => setEndDate(date)}
									selectsEnd
									startDate={startDate}
									endDate={endDate}
									minDate={startDate ?? undefined}
									className="input-primary w-full mt-1"
									placeholderText="Fecha fin"
								/>
							</div>
							<button className="btn-primary self-end" onClick={handleFilter}>
								Filtrar
							</button>
						</div>

						{loadingData && <p className="text-center py-8">Cargando historial...</p>}

						{!loadingData && filteredAttendances.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-600">No se encontraron registros de asistencia.</p>
							</div>
						)}

						{!loadingData && filteredAttendances.length > 0 && (
							<>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Fecha
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Estado
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Entrada
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Salida
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Notas
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{currentRecords.map((att, index) => (
												<tr key={att.id || index} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="font-bold text-gray-800">{att.date}</div>
														<div className="text-sm text-gray-500">{getDayOfWeek(att.date)}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span
															className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
																att.status === "present"
																	? "bg-green-100 text-green-800"
																	: att.status === "absent"
																		? "bg-red-100 text-red-800"
																		: "bg-yellow-100 text-yellow-800"
															}`}
														>
															{formatStatus(att.status)}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">{att.arrival_time || "—"}</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{att.departure_time || "—"}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{att.withdrawal_reason || "—"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{totalPages > 1 && (
									<div className="flex justify-between items-center mt-6">
										<span className="text-sm text-gray-600">
											Página {currentPage} de {totalPages}
										</span>
										<div className="flex items-center gap-2">
											<button
												className="btn-ghost"
												onClick={() => paginate(currentPage - 1)}
												disabled={currentPage === 1}
											>
												Anterior
											</button>

											{/* Simple Pagination Numbers */}
											<span className="text-sm font-bold">{currentPage}</span>

											<button
												className="btn-ghost"
												onClick={() => paginate(currentPage + 1)}
												disabled={currentPage === totalPages}
											>
												Siguiente
											</button>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</PageTransition>
	);
}
