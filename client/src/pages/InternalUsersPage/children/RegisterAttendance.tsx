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

	const isoDate = useMemo(() => toLocalISO(date), [date]);

	const loadAllRecords = useCallback((): AttendanceRecord[] => {
		try {
			const raw = localStorage.getItem(ATT_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(p) => p && typeof p === "object",
			) as AttendanceRecord[];
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
			const res = await fetch("/api/canines/");
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data)) {
					const mapped = data.map((c: Record<string, unknown>) => ({
						id: (c.id ?? c.pk) as number | string,
						name: (c.name ?? c.nickname ?? c.title) as string,
						photo: (c.photo as string | undefined) ?? null,
					}));
					setCanines(mapped);
					return;
				}
			}
		} catch {
			// ignore, fallback below
		} finally {
			setLoadingCanines(false);
		}
		setCanines(MOCK_CANINES);
	}, []);

	const loadRecordsForDate = useCallback(() => {
		const all = loadAllRecords();
		const filtered = all.filter((r) => r.date === isoDate);
		setRecords(filtered);
	}, [isoDate, loadAllRecords]);

	useEffect(() => {
		void loadCanines();
	}, [loadCanines]);

	useEffect(() => {
		loadRecordsForDate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isoDate]);

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
					return [rec, ...without];
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
					date: isoDate,
					canineName: c.name,
					canineId: c.id,
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

	function handleSetReason(c: Canine, reason: string) {
		const id = makeId(isoDate, c.id);
		const existing = loadAllRecords().find((r) => r.id === id);
		const rec: AttendanceRecord = existing
			? { ...existing, earlyDepartureReason: reason || null }
			: {
					id,
					canineId: c.id,
					canineName: c.name,
					date: isoDate,
					entryTime: null,
					status: "on_time",
					exitTime: null,
					earlyDepartureReason: reason || null,
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
									<th style={{ width: 320 }}>Llegada</th>
									<th style={{ width: 240 }}>Motivo</th>
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

											<td
												style={{
													padding: "12px 16px",
													color: "var(--muted-color)",
												}}
											>
												<input
													className="input-primary reason-input"
													placeholder="Motivo (opcional)"
													value={rec?.earlyDepartureReason ?? ""}
													onChange={(e) => handleSetReason(c, e.target.value)}
													onBlur={(e) => handleSetReason(c, e.target.value)}
												/>
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
		</PageTransition>
	);
}
