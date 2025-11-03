// client/src/pages/ClientPage/children/PetDetailPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Simulación de datos más robusta ---
const generateMockAttendance = (count: number): Attendance[] => {
	return Array.from({ length: count }).map((_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - i * 3); // Registros cada 3 días para variar meses
		const dayOfWeek = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miércoles",
			"Jueves",
			"Viernes",
			"Sábado",
		][date.getDay()];
		const isAbsent = i % 7 === 0; // Uno de cada 7 está ausente
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
	console.log(`Haciendo fetch a /api/canines/${canineId}/attendance/...`);
	await new Promise((res) => setTimeout(res, 700));

	if (canineId === "12") {
		return { name: "Luna", attendances: generateMockAttendance(10) }; // Luna tiene 10 registros
	}

	return {
		name: "Toby",
		attendances: generateMockAttendance(25), // Toby tiene 25 registros
	};
};

export default function PetDetailPage() {
	const { canineId } = useParams<{ canineId: string }>();
	const [details, setDetails] = useState<CanineDetails | null>(null);
	const [loading, setLoading] = useState(true);

	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>(
		[],
	);
	const [currentPage, setCurrentPage] = useState(1);
	const recordsPerPage = 5;

	useEffect(() => {
		if (!canineId) return;
		const loadDetails = async () => {
			setLoading(true);
			try {
				const data = await fetchPetAttendance(canineId);
				setDetails(data);
				setFilteredAttendances(data.attendances);
			} catch (error) {
				console.error("Error al cargar el historial:", error);
			} finally {
				setLoading(false);
			}
		};
		void loadDetails();
	}, [canineId]);

	const handleFilter = () => {
		if (!details) return;
		let filtered = details.attendances;
		if (startDate || endDate) {
			// Clona las fechas para no modificar el estado original
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
					{/* CORRECCIÓN CLAVE: Se reduce el tamaño de la fuente de 3xl a 2xl */}
					<h1 className="text-2xl font-bold mt-2">
						Historial de Asistencia de {details?.name || "..."}
					</h1>
				</div>

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

					{loading && <p className="text-center py-8">Cargando historial...</p>}

					{!loading && filteredAttendances.length === 0 && (
						<div className="text-center py-8">
							<p className="text-gray-600">
								No se encontraron registros para los criterios seleccionados.
							</p>
						</div>
					)}

					{!loading && filteredAttendances.length > 0 && (
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
													<div className="font-bold text-gray-800">
														{att.date}
													</div>
													<div className="text-sm text-gray-500">
														{att.dayOfWeek}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{att.status}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{att.entry_time || "—"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{att.departure_time || "—"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{att.transport}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													{att.notes || "—"}
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
										{Array.from({ length: totalPages }, (_, i) => i + 1).map(
											(number) => (
												<button
													key={number}
													onClick={() => paginate(number)}
													className={
														currentPage === number ? "btn-primary" : "btn-ghost"
													}
												>
													{number}
												</button>
											),
										)}
										<button
											className="btn-ghost"
											onClick={() => paginate(currentPage + 1)}
											disabled={currentPage === totalPages}
										>
											Siguiente
										</button>
									</div>
									<button
										className="btn-primary"
										onClick={() => console.log("Descargando informe...")}
									>
										Descargar Informe
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</PageTransition>
	);
}
