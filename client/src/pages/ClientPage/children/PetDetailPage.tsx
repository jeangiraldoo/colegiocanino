import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EnrollmentDetails from "../components/EnrollmentDetails";
import apiClient from "../../../api/axiosConfig";

// --- Interfaces based on Backend Serializers ---

interface Attendance {
	id: number;
	date: string; // Format: YYYY-MM-DD
	status: "present" | "advance_withdrawal" | "dispatched" | "absent";
	arrival_time: string | null; // Format: HH:MM:SS
	departure_time: string | null;
	withdrawal_reason: string | null;
	transport?: string; // Optional, depending on if BE sends it flattened
}

interface Canine {
	id: number;
	name: string;
	breed: string;
	photo?: string | null;
}

interface CanineAttendanceResponse {
	canine: Canine;
	attendances: Attendance[];
}

export default function PetDetailPage() {
	const { canineId } = useParams<{ canineId?: string }>();

	// State for data
	const [canine, setCanine] = useState<Canine | null>(null);
	const [attendances, setAttendances] = useState<Attendance[]>([]);

	// UI States
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filter States
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);

	// Pagination States
	const [currentPage, setCurrentPage] = useState(1);
	const recordsPerPage = 5;

	// 1. Fetch Real Data from Backend
	useEffect(() => {
		if (!canineId) return;

		const fetchDetails = async () => {
			setLoading(true);
			setError(null);
			try {
				// Using Axios (apiClient) to fetch real data from the specific endpoint defined in HU-14
				const response = await apiClient.get<CanineAttendanceResponse>(
					`/api/canines/${canineId}/attendance/`,
				);

				setCanine(response.data.canine);
				setAttendances(response.data.attendances);
				setFilteredAttendances(response.data.attendances); // Initialize filtered list with all data
			} catch (err: unknown) {
				console.error("Error fetching attendance history:", err);
				setError("No se pudo cargar el historial de asistencia. Intente nuevamente.");
			} finally {
				setLoading(false);
			}
		};

		void fetchDetails();
	}, [canineId]);

	// 2. Handle Filtering (Client-side filtering on real data)
	const handleFilter = () => {
		let result = attendances;

		if (startDate || endDate) {
			const start = startDate ? new Date(startDate.getTime()) : null;
			const end = endDate ? new Date(endDate.getTime()) : null;

			// Normalize time boundaries
			if (start) start.setHours(0, 0, 0, 0);
			if (end) end.setHours(23, 59, 59, 999);

			result = attendances.filter((att) => {
				// Parse YYYY-MM-DD from backend
				const [year, month, day] = att.date.split("-").map(Number);
				const attDate = new Date(year, month - 1, day);

				if (start && attDate < start) return false;
				if (end && attDate > end) return false;

				return true;
			});
		}

		setFilteredAttendances(result);
		setCurrentPage(1); // Reset to first page on filter change
	};

	// 3. Pagination Logic
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

	// --- Helpers for UI formatting ---

	const formatStatus = (status: string) => {
		const statusMap: Record<string, string> = {
			present: "Presente",
			absent: "Ausente",
			dispatched: "Despachado",
			advance_withdrawal: "Retiro Anticipado",
		};
		return statusMap[status] || status;
	};

	const formatTime = (timeStr: string | null) => {
		if (!timeStr) return "—";
		// Expecting HH:MM:SS, return HH:MM
		return timeStr.slice(0, 5);
	};

	const getDayOfWeek = (dateStr: string) => {
		const [year, month, day] = dateStr.split("-").map(Number);
		const date = new Date(year, month - 1, day);
		const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
		return days[date.getDay()];
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "present":
				return "bg-green-100 text-green-800";
			case "absent":
				return "bg-red-100 text-red-800";
			case "dispatched":
				return "bg-blue-100 text-blue-800";
			case "advance_withdrawal":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (error) {
		return (
			<div className="p-8 text-center font-montserrat">
				<p className="text-red-600 mb-4">{error}</p>
				<Link to="/portal-cliente/mis-mascotas" className="text-amber-600 underline">
					Volver a mis mascotas
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
						className="text-amber-500 hover:underline flex items-center gap-2 transition-colors"
					>
						<span className="font-bold">&larr;</span> Volver a Mis Mascotas
					</Link>
					<h1 className="text-2xl font-bold mt-2">
						{loading ? "Cargando..." : `Historial de ${canine?.name}`}
					</h1>
				</div>

				{/* Enrollment Component (HU-13 Integration) */}
				{canineId && <EnrollmentDetails canineId={canineId} />}

				<div className="mt-8">
					<h2 className="text-xl font-bold mb-4 text-gray-800">Registro de Asistencia</h2>

					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
						{/* Filter Section */}
						<div className="flex flex-wrap items-center gap-4 mb-6">
							<div className="flex-grow">
								<label className="text-sm font-medium text-gray-600 block mb-1">Desde</label>
								<DatePicker
									selected={startDate}
									onChange={(date) => setStartDate(date)}
									selectsStart
									startDate={startDate}
									endDate={endDate}
									className="input-primary w-full"
									placeholderText="Seleccionar fecha"
									dateFormat="dd/MM/yyyy"
								/>
							</div>
							<div className="flex-grow">
								<label className="text-sm font-medium text-gray-600 block mb-1">Hasta</label>
								<DatePicker
									selected={endDate}
									onChange={(date) => setEndDate(date)}
									selectsEnd
									startDate={startDate}
									endDate={endDate}
									minDate={startDate ?? undefined}
									className="input-primary w-full"
									placeholderText="Seleccionar fecha"
									dateFormat="dd/MM/yyyy"
								/>
							</div>
							<button
								className="btn-primary self-end h-[42px]"
								onClick={handleFilter}
								disabled={loading}
							>
								Filtrar
							</button>
						</div>

						{/* Data Table */}
						{loading ? (
							<p className="text-center py-12 text-gray-500">Cargando registros...</p>
						) : filteredAttendances.length === 0 ? (
							<div className="text-center py-12 bg-gray-50 rounded-lg">
								<p className="text-gray-500">No se encontraron registros de asistencia.</p>
							</div>
						) : (
							<>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
													Fecha
												</th>
												<th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
													Estado
												</th>
												<th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
													Llegada
												</th>
												<th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
													Salida
												</th>
												<th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
													Observaciones
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{currentRecords.map((att) => (
												<tr key={att.id} className="hover:bg-gray-50 transition-colors">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="font-bold text-gray-800">{att.date}</div>
														<div className="text-xs text-gray-500">{getDayOfWeek(att.date)}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span
															className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(att.status)}`}
														>
															{formatStatus(att.status)}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
														{formatTime(att.arrival_time)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
														{formatTime(att.departure_time)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
														{att.withdrawal_reason || "—"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Pagination Controls */}
								{totalPages > 1 && (
									<div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
										<span className="text-sm text-gray-600">
											Página {currentPage} de {totalPages}
										</span>
										<div className="flex items-center gap-2">
											<button
												className="btn-ghost text-sm px-3 py-1"
												onClick={() => paginate(currentPage - 1)}
												disabled={currentPage === 1}
											>
												Anterior
											</button>
											<button
												className="btn-ghost text-sm px-3 py-1"
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
