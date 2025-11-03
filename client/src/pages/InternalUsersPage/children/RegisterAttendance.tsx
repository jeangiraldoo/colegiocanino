// client/src/pages/InternalUsersPage/children/RegisterAttendance.tsx

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageTransition from "../../../components/PageTransition";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotesIcon from "@mui/icons-material/Notes";

type Canine = {
	id: number | string;
	name: string;
	photo?: string | null;
};

type AttendanceRecord = {
	id: string;
	canineId: number | string;
	canineName: string;
	date: string;
	entryTime?: string | null;
	status: "on_time" | "late" | "absent";
	exitTime?: string | null;
	earlyDepartureReason?: string | null;
	enrollmentId?: number; // Añadido para el backend
};

const MOCK_CANINES: Canine[] = [
	{ id: 11, name: "Toby" },
	{ id: 12, name: "Luna" },
	{ id: 13, name: "Koko" },
	{ id: 14, name: "Toby Jr." },
	{ id: 15, name: "Milo" },
];

const ATT_KEY = "mockAttendances_v1";

function toLocalISO(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function nowHHMM() {
	const n = new Date();
	return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export default function RegisterAttendance() {
	const today = new Date();
	const [date, setDate] = useState<Date>(today);
	const [canines, setCanines] = useState<Canine[]>([]);
	const [loadingCanines, setLoadingCanines] = useState(false);
	const [records, setRecords] = useState<AttendanceRecord[]>([]);
	const datePickerRef = useRef<HTMLInputElement | null>(null);

	const [showExitModal, setShowExitModal] = useState(false);
	const [selectedCanine, setSelectedCanine] = useState<Canine | null>(null);
	const [exitTime, setExitTime] = useState(nowHHMM());
	const [exitReason, setExitReason] = useState("");

	const isoDate = useMemo(() => toLocalISO(date), [date]);

	const loadAllRecords = useCallback((): AttendanceRecord[] => {
		try {
			const raw = localStorage.getItem(ATT_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as AttendanceRecord[]) : [];
		} catch {
			return [];
		}
	}, []);

	const saveAllRecords = useCallback((arr: AttendanceRecord[]) => {
		try {
			localStorage.setItem(ATT_KEY, JSON.stringify(arr));
		} catch (err) {
			console.error("Failed saving attendance records", err);
		}
	}, []);

	const loadCanines = useCallback(async () => {
		setLoadingCanines(true);
		try {
			setCanines(MOCK_CANINES);
		} finally {
			setLoadingCanines(false);
		}
	}, []);

	const loadRecordsForDate = useCallback(() => {
		const all = loadAllRecords();
		const filtered = all.filter((r) => r.date === isoDate);
		setRecords(filtered);
	}, [isoDate, loadAllRecords]);

	useEffect(() => {
		void loadCanines();
		loadRecordsForDate();
	}, [isoDate, loadCanines, loadRecordsForDate]);

	const makeId = (dateStr: string, canineId: number | string) =>
		`${dateStr}::${String(canineId)}`;

	const upsertRecord = useCallback(
		(rec: AttendanceRecord) => {
			const all = loadAllRecords();
			const others = all.filter((r) => r.id !== rec.id);
			others.unshift(rec);
			saveAllRecords(others);
			if (rec.date === isoDate) {
				setRecords((prev) => {
					const without = prev.filter((p) => p.id !== rec.id);
					return [...without, rec].sort((a, b) =>
						a.canineName.localeCompare(b.canineName),
					);
				});
			}
		},
		[isoDate, loadAllRecords, saveAllRecords],
	);

	const clearRecordFor = useCallback(
		(dateStr: string, canineId: number | string) => {
			const id = makeId(dateStr, canineId);
			const all = loadAllRecords();
			const filtered = all.filter((r) => r.id !== id);
			saveAllRecords(filtered);
			if (dateStr === isoDate) {
				setRecords((prev) => prev.filter((r) => r.id !== id));
			}
		},
		[isoDate, loadAllRecords, saveAllRecords],
	);

	function handleSetStatus(c: Canine, status: AttendanceRecord["status"]) {
		const id = makeId(isoDate, c.id);
		const existing = loadAllRecords().find((r) => r.id === id);
		const rec: AttendanceRecord = existing
			? {
					...existing,
					status,
				}
			: {
					id,
					canineId: c.id,
					canineName: c.name,
					date: isoDate,
					entryTime: null,
					status,
					exitTime: null,
					earlyDepartureReason: null,
				};
		upsertRecord(rec);
	}

	function handleSetEntryTime(c: Canine, t: string | null) {
		const id = makeId(isoDate, c.id);
		const existing = loadAllRecords().find((r) => r.id === id);
		const rec: AttendanceRecord = existing
			? { ...existing, entryTime: t || null }
			: {
					id,
					canineId: c.id,
					canineName: c.name,
					date: isoDate,
					entryTime: t || null,
					status: "on_time",
					exitTime: null,
					earlyDepartureReason: null,
				};
		upsertRecord(rec);
	}

	function handleClear(c: Canine) {
		if (!confirm("Eliminar registro de este perro para la fecha?")) return;
		clearRecordFor(isoDate, c.id);
	}

	function setNowTimeFor(c: Canine) {
		handleSetEntryTime(c, nowHHMM());
	}

	const openExitModal = (canine: Canine) => {
		setSelectedCanine(canine);
		setExitTime(nowHHMM());
		setExitReason("");
		setShowExitModal(true);
	};

	const handleRegisterExit = async () => {
		if (!selectedCanine) return;

		const id = makeId(isoDate, selectedCanine.id);
		const existingRecord = loadAllRecords().find((r) => r.id === id);
		if (!existingRecord) return;

		const updatedRecord = {
			...existingRecord,
			exitTime: exitTime,
			earlyDepartureReason: exitReason || null,
		};

		try {
			console.log("Enviando a /api/attendance/check-out/:", {
				enrollment: existingRecord.enrollmentId,
				departure_time: exitTime,
				withdrawal_reason: exitReason || null,
			});
			// await axios.post("/api/attendance/check_out/", payload);

			upsertRecord(updatedRecord);
			setShowExitModal(false);
		} catch (error) {
			console.error("Error al registrar la salida:", error);
		}
	};

	const cardStyle: React.CSSProperties = {
		display: "flex",
		flexDirection: "column",
		gap: 16,
		minHeight: "calc(100vh - 64px)",
		width: "calc(100% - 64px)",
		maxWidth: "none",
		margin: "24px auto",
	};

	return (
		<PageTransition>
			<div className="form-card font-montserrat" style={cardStyle}>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							flex: "1 1 auto",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column" }}>
							<label className="form-label" style={{ marginBottom: 6 }}>
								Fecha
							</label>
							<DatePicker
								ref={datePickerRef}
								selected={date}
								onChange={(d: Date) => setDate(d)}
								dateFormat="dd/MM/yyyy"
								className="input-primary input-lg input-with-left-icon"
								calendarClassName="custom-datepicker"
								maxDate={new Date()}
								showYearDropdown
								scrollableYearDropdown
								yearDropdownItemNumber={100}
							/>
						</div>

						<div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
							<button
								className="btn-ghost action-btn"
								onClick={() => loadRecordsForDate()}
							>
								Actualizar
							</button>
							<button
								className="btn-ghost action-btn"
								onClick={() => {
									if (!confirm(`Eliminar todos los registros de ${isoDate}?`))
										return;
									const all = loadAllRecords().filter(
										(r) => r.date !== isoDate,
									);
									saveAllRecords(all);
									loadRecordsForDate();
								}}
							>
								Limpiar fecha
							</button>
						</div>
					</div>
				</div>

				<div
					style={{
						flex: 1,
						minHeight: 0,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<header
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 8,
						}}
					>
						<div>
							<h3 style={{ margin: 0, fontSize: 16 }}>Perros registrados</h3>
							<div style={{ color: "var(--muted-color)", fontSize: 13 }}>
								{loadingCanines ? "Cargando..." : `${canines.length} perros`}
							</div>
						</div>
						<div style={{ color: "var(--muted-color)", fontSize: 13 }}>
							{records.length} marcados — {isoDate}
						</div>
					</header>

					<div
						className="manage-table-container"
						style={{ flex: 1, minHeight: 0 }}
					>
						<table
							className="manage-table"
							style={{
								width: "100%",
								borderCollapse: "separate",
								borderSpacing: 0,
							}}
						>
							<thead>
								<tr>
									<th style={{ width: 56 }}></th>
									<th>Perro</th>
									<th style={{ width: 240 }}>Estado</th>
									<th style={{ width: 180 }}>Llegada</th>
									<th style={{ width: 180 }}>Salida</th>
									<th style={{ width: 80 }}></th>
								</tr>
							</thead>
							<tbody>
								{canines.map((c) => {
									const rec = records.find(
										(r) => String(r.canineId) === String(c.id),
									);
									const currentStatus = rec?.status ?? "on_time";

									return (
										<tr key={c.id}>
											<td style={{ padding: 12 }}>
												<div
													style={{
														width: 44,
														height: 44,
														borderRadius: 8,
														overflow: "hidden",
														background: "#F3F4F6",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<span style={{ color: "#6B7280", fontWeight: 700 }}>
														{String(c.name || "—")
															.charAt(0)
															.toUpperCase()}
													</span>
												</div>
											</td>
											<td
												style={{
													padding: "12px 16px",
													fontWeight: 700,
													color: "var(--text-color)",
												}}
											>
												{c.name}
												<div
													style={{
														fontSize: 12,
														color: "var(--muted-color)",
														fontWeight: 500,
													}}
												>
													{isoDate}
												</div>
											</td>

											<td style={{ padding: "12px 16px" }}>
												<div style={{ display: "flex", gap: 8 }}>
													<button
														type="button"
														className={
															currentStatus === "on_time"
																? "btn-success btn-sm"
																: "btn-ghost btn-sm"
														}
														onClick={() => handleSetStatus(c, "on_time")}
													>
														A tiempo
													</button>
													<button
														type="button"
														className={
															currentStatus === "late"
																? "btn-warning btn-sm"
																: "btn-ghost btn-sm"
														}
														onClick={() => handleSetStatus(c, "late")}
													>
														Tarde
													</button>
													<button
														type="button"
														className={
															currentStatus === "absent"
																? "btn-danger btn-sm"
																: "btn-ghost btn-sm"
														}
														onClick={() => handleSetStatus(c, "absent")}
													>
														Ausente
													</button>
												</div>
											</td>

											<td
												style={{
													padding: "12px 16px",
													display: "flex",
													gap: 8,
													alignItems: "center",
												}}
											>
												<input
													type="time"
													className="input-primary"
													value={rec?.entryTime ?? ""}
													onChange={(e) =>
														handleSetEntryTime(c, e.target.value || null)
													}
													step={60}
													style={{ minWidth: 120, borderRadius: 10 }}
												/>
												<button
													type="button"
													className="btn-small"
													onClick={() => setNowTimeFor(c)}
													title="Set now"
												>
													🕒
												</button>
											</td>

											<td style={{ padding: "12px 16px" }}>
												{rec?.entryTime && !rec.exitTime && (
													<button
														className="btn-primary btn-sm"
														onClick={() => openExitModal(c)}
													>
														Registrar Salida
													</button>
												)}
												{rec?.exitTime && (
													<div className="font-bold text-gray-700">
														{rec.exitTime}
													</div>
												)}
											</td>

											<td style={{ padding: "12px 16px", textAlign: "right" }}>
												{rec ? (
													<button
														className="icon-btn delete-btn"
														onClick={() => handleClear(c)}
														title="Eliminar"
														aria-label={`Eliminar registro ${c.name}`}
													>
														🗑
													</button>
												) : (
													<span
														style={{
															color: "var(--muted-color)",
															fontSize: 13,
														}}
													>
														—
													</span>
												)}
											</td>
										</tr>
									);
								})}

								{canines.length === 0 && (
									<tr>
										<td
											colSpan={6}
											style={{
												padding: 18,
												textAlign: "center",
												color: "var(--muted-color)",
											}}
										>
											No hay perros registrados.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{showExitModal && selectedCanine && (
				<div className="time-modal-overlay">
					<div className="time-modal-card">
						<h3 className="text-lg font-bold mb-4">
							Registrar Salida de {selectedCanine.name}
						</h3>

						<div className="form-row">
							<label className="form-label">Hora de Salida</label>
							<div className="input-with-icon">
								<AccessTimeIcon className="input-icon" />
								<input
									type="time"
									className="input-primary input-lg w-full"
									value={exitTime}
									onChange={(e) => setExitTime(e.target.value)}
								/>
							</div>
						</div>

						<div className="form-row mt-4">
							<label className="form-label">
								Motivo de Salida Anticipada (Opcional)
							</label>
							<div className="input-with-icon">
								<NotesIcon className="input-icon" />
								<input
									type="text"
									className="input-primary input-lg w-full"
									value={exitReason}
									onChange={(e) => setExitReason(e.target.value)}
									placeholder="Ej: Cita veterinaria"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-4 mt-6">
							<button
								className="btn-ghost"
								onClick={() => setShowExitModal(false)}
							>
								Cancelar
							</button>
							<button className="btn-primary" onClick={handleRegisterExit}>
								Confirmar Salida
							</button>
						</div>
					</div>
				</div>
			)}
		</PageTransition>
	);
}
