// client/src/pages/ClientPage/children/PetDetailPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EnrollmentDetails from "../components/EnrollmentDetails"; // Import of the new component

// --- We keep the existing attendance data simulation to avoid breaking that functionality ---
// NOTE: In a future user story we should connect this to the real attendance endpoint
// but for now we focus on integrating Enrollment (User Story HU-13)

const generateMockAttendance = (count: number): Attendance[] => {
	return Array.from({ length: count }).map((_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - i * 3);
		const dayOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][
			date.getDay()
		];
		const isAbsent = i % 7 === 0;
		const isLate = !isAbsent && i % 4 === 0;

		return {
			date: date.toLocaleDateString("es-ES", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}),
			dayOfWeek: dayOfWeek,
			status: isAbsent ? "No" : "Completa",
			entry_time: isAbsent ? null : isLate ? "08:45 AM" : "08:05 AM",
			departure_time: isAbsent ? null : "05:00 PM",
			transport: i % 2 === 0 ? "Sí" : "No",
			notes: isAbsent ? "Aviso previo" : "Sin novedades",
		};
	});
};

type Attendance = {
	date: string;
	dayOfWeek: string;
	status: "Completa" | "No" | "Parcial";
	entry_time: string | null;
	departure_time: string | null;
	transport: "Sí" | "No";
	notes: string;
};

type CanineDetails = {
	name: string;
	attendances: Attendance[];
};

const fetchPetAttendance = async (canineId: string): Promise<CanineDetails> => {
	// We simulate a delay
	await new Promise((res) => setTimeout(res, 700));

	// We simulate names based on ID for the demo
	const name = canineId === "12" ? "Luna" : "Toby";
	const count = canineId === "12" ? 10 : 25;

	return {
		name: name,
		attendances: generateMockAttendance(count),
	};
};

export default function PetDetailPage() {
	const { canineId } = useParams<{ canineId: string }>();
	const [details, setDetails] = useState<CanineDetails | null>(null);
	// Specific loading for attendance (enrollment has its own internal loading)
	const [loadingAttendance, setLoadingAttendance] = useState(true);

	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const recordsPerPage = 5;

	useEffect(() => {
		if (!canineId) return;
		const loadDetails = async () => {
			setLoadingAttendance(true);
			try {
				const data = await fetchPetAttendance(canineId);
				setDetails(data);
				setFilteredAttendances(data.attendances);
			} catch (error) {
				console.error("Error al cargar el historial:", error);
			} finally {
				setLoadingAttendance(false);
			}
		};
		void loadDetails();
	}, [canineId]);

	const handleFilter = () => {
		if (!details) return;
		let filtered = details.attendances;
		if (startDate || endDate) {
			const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
			const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;

			filtered = details.attendances.filter((att) => {
				const [day, month, year] = att.date.split("/");
				const attDate = new Date(`${year}-${month}-${day}`);

				if (start && end) {
					return attDate >= start && attDate <= end;
				}
				if (start) {
					return attDate >= start;
				}
				if (end) {
					return attDate <= end;
				}
				return true;
			});
		}
		setFilteredAttendances(filtered);
		setCurrentPage(1);
	};

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
					<h1 className="text-2xl font-bold mt-2">Detalle de {details?.name || "..."}</h1>
				</div>

				{/* --- ENROLLMENT HU-13 INTEGRATION: Enrollment Plan Component --- */}
				{/* It renders only if we have a valid canineId */}
				{canineId && <EnrollmentDetails canineId={canineId} />}
				{/* --------------------------------------------------------- */}

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
									placeholderText="Fecha de inicio"
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
									minDate={startDate}
									className="input-primary w-full mt-1"
									placeholderText="Fecha de fin"
								/>
							</div>
							<button className="btn-primary self-end" onClick={handleFilter}>
								Filtrar
							</button>
						</div>

						{loadingAttendance && <p className="text-center py-8">Cargando historial...</p>}

						{!loadingAttendance && filteredAttendances.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-600">
									No se encontraron registros para los criterios seleccionados.
								</p>
							</div>
						)}

						{!loadingAttendance && filteredAttendances.length > 0 && (
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
													Transporte
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Notas
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{currentRecords.map((att, index) => (
												<tr key={index} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="font-bold text-gray-800">{att.date}</div>
														<div className="text-sm text-gray-500">{att.dayOfWeek}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">{att.status}</td>
													<td className="px-6 py-4 whitespace-nowrap">{att.entry_time || "—"}</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{att.departure_time || "—"}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">{att.transport}</td>
													<td className="px-6 py-4 whitespace-nowrap">{att.notes || "—"}</td>
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
											{Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
												<button
													key={number}
													onClick={() => paginate(number)}
													className={currentPage === number ? "btn-primary" : "btn-ghost"}
												>
													{number}
												</button>
											))}
											<button
												className="btn-ghost"
												onClick={() => paginate(currentPage + 1)}
												disabled={currentPage === totalPages}
											>
												Siguiente
											</button>
										</div>
										{/* Botón deshabilitado simulado para mantener el layout */}
										<button className="btn-primary opacity-50 cursor-not-allowed" disabled>
											Descargar Informe
										</button>
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
