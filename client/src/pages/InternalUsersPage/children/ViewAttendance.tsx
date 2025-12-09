import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageTransition from "../../../components/PageTransition";

type Attendance = {
	id: number | string;
	canine_id?: number | string;
	canine_name?: string;
	date?: string;
	entry_time?: string | null;
	entry_type?: string | null;
	exit_time?: string | null;
	exit_type?: string | null;
	early_departure_reason?: string | null;
	status?: string | null;
};

function toLocalISO(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function ViewAttendance() {
	const today = new Date();
	const [date, setDate] = useState<Date>(today);
	const [attendances, setAttendances] = useState<Attendance[]>([]);
	const [query, setQuery] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const dpRef = useRef<HTMLInputElement | null>(null);

	const getAuthHeader = useCallback((): {
		headers?: Record<string, string>;
		credentials?: RequestCredentials;
	} => {
		const access = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
		if (access) return { headers: { Authorization: `Bearer ${access}` } };
		return { credentials: "include" as RequestCredentials };
	}, []);

	const loadAttendances = useCallback(
		async (selectedDate: Date) => {
			const iso = toLocalISO(selectedDate);
			setLoading(true);
			setError(null);
			try {
				const opts = getAuthHeader();
				const res = await fetch(`/api/attendance/?date=${encodeURIComponent(iso)}`, {
					method: "GET",
					headers: { ...(opts.headers || {}), Accept: "application/json" },
					credentials: opts.credentials || "same-origin",
				});

				if (!res.ok) {
					if (res.status === 401) {
						setError("Unauthorized. Please log in.");
					} else {
						setError("No data available for this date.");
					}
					setAttendances([]);
					return;
				}

				const data = await res.json();
				const arr = Array.isArray(data) ? (data as unknown[]) : [];
				const list = arr.map((item) => {
					const a = (item as Record<string, unknown>) || {};
					const canineObj =
						a["enrollment"] && typeof a["enrollment"] === "object"
							? (a["enrollment"] as Record<string, unknown>)["canine"]
							: undefined;
					const id = (a["id"] ?? a["pk"]) as number | string | undefined;
					const canine_id =
						typeof a["canine"] === "number"
							? (a["canine"] as number)
							: ((canineObj?.["id"] as number | string | undefined) ?? undefined);
					const canine_name =
						(a["canine_name"] as string | undefined) ??
						(canineObj?.["name"] as string | undefined) ??
						"";
					const dateVal =
						((a["date"] ?? a["creation_date"] ?? a["attendance_date"]) as string | undefined) ??
						iso;
					const entry_time =
						((a["arrival_time"] ?? a["entry_time"] ?? a["llegada_time"]) as string | undefined) ??
						null;
					const exit_time =
						((a["departure_time"] ?? a["exit_time"] ?? a["salida_time"]) as string | undefined) ??
						null;
					const early_departure_reason =
						((a["withdrawal_reason"] ??
							a["early_departure_reason"] ??
							a["motivo_salida_anticipada"]) as string | undefined) ?? null;

					const status = (a["status"] as string | undefined) ?? "present";

					return {
						id: id ?? Math.random().toString(36).slice(2),
						canine_id,
						canine_name,
						date: dateVal ? dateVal.slice(0, 10) : iso,
						entry_time,
						entry_type: null,
						exit_time,
						exit_type: null,
						early_departure_reason,
						status,
					} as Attendance;
				});

				setAttendances(list);
			} catch (err) {
				console.error(err);
				setAttendances([]);
				setError("Error loading attendances");
			} finally {
				setLoading(false);
			}
		},
		[getAuthHeader],
	);

	useEffect(() => {
		void loadAttendances(date);
	}, [date, loadAttendances]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return attendances;
		return attendances.filter(
			(a) =>
				String(a.canine_name ?? "")
					.toLowerCase()
					.includes(q) ||
				String(a.entry_type ?? "")
					.toLowerCase()
					.includes(q) ||
				String(a.exit_type ?? "")
					.toLowerCase()
					.includes(q) ||
				String(a.early_departure_reason ?? "")
					.toLowerCase()
					.includes(q),
		);
	}, [attendances, query]);

	function badgeForType(t?: string | null) {
		const key = (t || "").toLowerCase();
		const baseStyle: React.CSSProperties = {
			padding: "6px 10px",
			borderRadius: 8,
			fontWeight: 700,
			display: "inline-flex",
			alignItems: "center",
			whiteSpace: "nowrap",
			boxSizing: "border-box",
		};
		if (!key) return <span style={{ color: "var(--muted-color)" }}>—</span>;

		if (key.includes("present") || key.includes("presente")) {
			return (
				<span
					style={{
						...baseStyle,
						background: "rgba(16,185,129,0.08)",
						color: "#065f46",
					}}
				>
					Presente
				</span>
			);
		}

		if (key.includes("advance_withdrawal") || key.includes("retir") || key.includes("retiro")) {
			return (
				<span
					style={{
						...baseStyle,
						background: "rgba(250, 204, 21,0.14)",
						color: "#b45309",
					}}
				>
					Retiro anticipado
				</span>
			);
		}

		if (key.includes("dispatched") || key.includes("despach")) {
			return (
				<span
					style={{
						...baseStyle,
						background: "rgba(96,165,250,0.08)",
						color: "#1e3a8a",
					}}
				>
					Despachado
				</span>
			);
		}

		if (key.includes("absent") || key.includes("ausente")) {
			return (
				<span
					style={{
						...baseStyle,
						background: "rgba(239,68,68,0.08)",
						color: "#991b1b",
					}}
				>
					Ausente
				</span>
			);
		}

		return (
			<span
				style={{
					...baseStyle,
					background: "rgba(16,185,129,0.08)",
					color: "#065f46",
				}}
			>
				Presente
			</span>
		);
	}

	function fmtTime(t?: string | null) {
		if (!t) return "—";
		const m = t.match(/(\d{2}:\d{2})/);
		if (m) return m[1];
		return t;
	}

	return (
		<PageTransition>
			<div className="h-full w-full rounded-lg bg-white border border-dashed border-gray-200 p-6">
				<header
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 12,
						marginBottom: 12,
					}}
				>
					<div>
						<h2 className="text-lg font-montserrat" style={{ margin: 0 }}>
							Asistencias
						</h2>
						<p style={{ margin: 0, color: "var(--muted-color)" }}>
							Visualiza registros de llegada / salida por fecha.
						</p>
					</div>

					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<label style={{ fontSize: 13, color: "var(--muted-color)" }}>Fecha</label>

						<DatePicker
							ref={dpRef}
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

						<input
							placeholder="Buscar por nombre, tipo o motivo..."
							className="input-primary"
							style={{ minWidth: 280 }}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
						<button
							type="button"
							className="btn-primary"
							onClick={() => void loadAttendances(date)}
							disabled={loading}
						>
							{loading ? "Cargando..." : "Actualizar"}
						</button>
					</div>
				</header>

				{error && (
					<div role="alert" className="field-error" style={{ marginBottom: 12 }}>
						{error}
					</div>
				)}

				<div
					style={{
						marginBottom: 10,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div style={{ color: "var(--muted-color)" }}>{filtered.length} registros</div>
					<div style={{ color: "var(--muted-color)", fontSize: 13 }}>
						{attendances.length === 0 && !loading ? "No hay registros para esta fecha" : null}
					</div>
				</div>

				<div className="form-card" style={{ padding: 0 }}>
					<table className="manage-table" style={{ width: "100%", minWidth: 720 }}>
						<thead>
							<tr>
								<th style={{ width: 56 }}></th>
								<th>Perro</th>
								<th style={{ width: 140 }}>Llegada</th>
								<th style={{ width: 140 }}>Salida</th>
								<th style={{ width: 200 }}>Observaciones</th>
								<th style={{ width: 120, textAlign: "right" }}>Estado</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((a) => (
								<tr key={a.id}>
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
												{String(a.canine_name || "—")
													.charAt(0)
													.toUpperCase()}
											</span>
										</div>
									</td>
									<td
										style={{
											padding: "12px 16px",
											color: "var(--text-color)",
											fontWeight: 700,
										}}
									>
										{a.canine_name || `#${a.canine_id ?? a.id}`}
										<div
											style={{
												fontSize: 12,
												color: "var(--muted-color)",
												fontWeight: 500,
											}}
										>
											{a.date?.slice(0, 10) ?? "—"}
										</div>
									</td>
									<td
										style={{
											padding: "12px 16px",
											color: "var(--muted-color)",
										}}
									>
										<div style={{ fontWeight: 700 }}>{fmtTime(a.entry_time)}</div>
										<div style={{ marginTop: 6 }}>{badgeForType(a.entry_type ?? a.status)}</div>
									</td>
									<td
										style={{
											padding: "12px 16px",
											color: "var(--muted-color)",
										}}
									>
										<div style={{ fontWeight: 700 }}>{fmtTime(a.exit_time)}</div>
										<div style={{ marginTop: 6 }}>{badgeForType(a.exit_type)}</div>
									</td>
									<td
										style={{
											padding: "12px 16px",
											color: "var(--muted-color)",
										}}
									>
										{a.early_departure_reason || "—"}
									</td>
									<td style={{ padding: "12px 16px", textAlign: "right" }}>
										{a.entry_type || a.exit_type || a.status ? (
											badgeForType(a.entry_type ?? a.status)
										) : (
											<span style={{ color: "var(--muted-color)" }}>—</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</PageTransition>
	);
}
