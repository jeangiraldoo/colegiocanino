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

type Canine = {
	id: number | string;
	name: string;
	photo?: string | null;
	enrollmentId?: number | string;
};

type AttendanceRecord = {
	id?: number | string;
	enrollment: number | string;
	canineId: number | string;
	canineName: string;
	date: string;
	entryTime?: string | null;
	status: "present" | "advance_withdrawal" | "dispatched" | "absent";
	exitTime?: string | null;
	earlyDepartureReason?: string | null;
};

type RawRecord = Record<string, unknown>;
function isLockedStatus(s: unknown): s is AttendanceRecord["status"] {
	return (
		typeof s === "string" && (s === "dispatched" || s === "advance_withdrawal")
	);
}

export default function RegisterAttendance() {
	const today = new Date();
	const [date, setDate] = useState<Date>(today);
	const [canines, setCanines] = useState<Canine[]>([]);
	const [loadingCanines, setLoadingCanines] = useState(false);
	const [records, setRecords] = useState<AttendanceRecord[]>([]);
	const datePickerRef = useRef<HTMLInputElement | null>(null);

	const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

	const [busyEnrollments, setBusyEnrollments] = useState<
		Record<string, boolean>
	>({});
	const setBusy = useCallback((enrollmentId: string | number, v: boolean) => {
		setBusyEnrollments((p) => ({ ...p, [String(enrollmentId)]: v }));
	}, []);

	const [unlockedByAdmin, setUnlockedByAdmin] = useState<
		Record<string, boolean>
	>({});

	const role = useMemo(() => {
		return (
			localStorage.getItem("user_role") ||
			sessionStorage.getItem("user_role") ||
			""
		).toUpperCase();
	}, []);
	const isAdmin = role === "ADMIN";

	const isoDate = useMemo(() => toLocalISO(date), [date]);

	const getAuthHeader = useCallback(() => {
		const access =
			localStorage.getItem("access_token") ||
			sessionStorage.getItem("access_token");
		if (access) return { Authorization: `Bearer ${access}` };
		return {};
	}, []);

	const loadEnrollments = useCallback(async () => {
		setLoadingCanines(true);
		try {
			const headers = { ...getAuthHeader(), Accept: "application/json" };
			const res = await fetch(
				"/api/enrollments/?status=true&ordering=-creation_date",
				{
					method: "GET",
					headers,
				},
			);
			if (!res.ok) throw new Error("Failed to load enrollments");
			const data = await res.json();
			if (!Array.isArray(data)) throw new Error("Invalid enrollments response");
			const mapped = data.map((e: RawRecord) => {
				const canine = e["canine"];
				const canineName =
					e["canine_name"] ??
					(e["canine"] && (e["canine"] as RawRecord)["name"]);
				const photo =
					(e["canine"] && (e["canine"] as RawRecord)["photo"]) ?? null;
				return {
					id: (canine ?? e["pk"]) as number | string,
					name: (canineName as string) ?? `#${String(canine ?? e["pk"])}`,
					photo: (photo as string) ?? null,
					enrollmentId: (e["id"] ?? e["pk"]) as number | string,
				} as Canine;
			}) as Canine[];
			setCanines(mapped);
			return;
		} catch (err) {
			console.error("loadEnrollments error", err);
			setCanines([]);
		} finally {
			setLoadingCanines(false);
		}
	}, [getAuthHeader]);

	const loadAttendancesForDate = useCallback(
		async (selectedDate: Date) => {
			const iso = toLocalISO(selectedDate);
			try {
				const headers = { ...getAuthHeader(), Accept: "application/json" };
				const res = await fetch(
					`/api/attendance/?date=${encodeURIComponent(iso)}`,
					{
						method: "GET",
						headers,
					},
				);
				if (!res.ok) {
					setRecords([]);
					return;
				}
				const data = await res.json();
				if (!Array.isArray(data)) {
					setRecords([]);
					return;
				}
				const mapped: AttendanceRecord[] = data.map((a: RawRecord) => ({
					id: (a["id"] ?? a["pk"]) as number | string,
					enrollment:
						(a["enrollment"] as number | string) ?? a["enrollment_id"],
					canineId:
						((a["enrollment"] && (a["enrollment"] as RawRecord)["canine"]) as
							| number
							| string) ??
						(a["enrollment"] as number | string) ??
						null,
					canineName:
						((a["enrollment"] &&
							(a["enrollment"] as RawRecord)["canine"] &&
							((a["enrollment"] as RawRecord)["canine"] as RawRecord)[
								"name"
							]) as string) ??
						(a["canine_name"] as string) ??
						"",
					date: (a["date"] as string) ?? iso,
					entryTime: (a["arrival_time"] as string) ?? null,
					status: ((a["status"] as string) ??
						"present") as AttendanceRecord["status"],
					exitTime: (a["departure_time"] as string) ?? null,
					earlyDepartureReason: (a["withdrawal_reason"] as string) ?? null,
				}));
				setRecords(mapped);
			} catch (err) {
				console.error("loadAttendancesForDate", err);
				setRecords([]);
			}
		},
		[getAuthHeader],
	);

	const refreshAttendancesPerEnrollment = useCallback(
		async (selectedDate: Date) => {
			const iso = toLocalISO(selectedDate);
			const headersBase = { ...getAuthHeader(), Accept: "application/json" };
			const updatedRecords: AttendanceRecord[] = [];
			await Promise.all(
				canines.map(async (c) => {
					const enrollmentId = c.enrollmentId ?? c.id;
					try {
						const res = await fetch(
							`/api/attendance/?date=${encodeURIComponent(iso)}&enrollment_id=${encodeURIComponent(String(enrollmentId))}`,
							{ method: "GET", headers: headersBase },
						);
						if (!res.ok) return;
						const arr = await res.json().catch(() => []);
						if (!Array.isArray(arr) || arr.length === 0) return;
						const a = arr[0] as RawRecord;
						updatedRecords.push({
							id: (a["id"] ?? a["pk"]) as number | string,
							enrollment: (a["enrollment"] as number | string) ?? enrollmentId,
							canineId:
								((a["enrollment"] &&
									(a["enrollment"] as RawRecord)["canine"]) as
									| number
									| string) ?? enrollmentId,
							canineName:
								((a["enrollment"] &&
									(a["enrollment"] as RawRecord)["canine"] &&
									((a["enrollment"] as RawRecord)["canine"] as RawRecord)[
										"name"
									]) as string) ??
								(a["canine_name"] as string) ??
								c.name ??
								"",
							date: (a["date"] as string) ?? iso,
							entryTime: (a["arrival_time"] as string) ?? null,
							status: ((a["status"] as string) ??
								"present") as AttendanceRecord["status"],
							exitTime: (a["departure_time"] as string) ?? null,
							earlyDepartureReason: (a["withdrawal_reason"] as string) ?? null,
						});
					} catch (e) {
						console.error("refresh per enrollment error", e);
					}
				}),
			);

			setRecords((prev) => {
				const m = new Map<string, AttendanceRecord>();
				for (const r of prev) m.set(String(r.enrollment), r);
				for (const u of updatedRecords) m.set(String(u.enrollment), u);
				return Array.from(m.values());
			});
		},
		[canines, getAuthHeader],
	);

	useEffect(() => {
		void loadEnrollments();
	}, [loadEnrollments]);

	useEffect(() => {
		void loadAttendancesForDate(date);
	}, [date, loadAttendancesForDate]);

	useEffect(() => {
		setReasonDrafts((prev) => {
			const copy = { ...prev };
			for (const r of records) {
				const key = String(r.enrollment);
				if (copy[key] === undefined) copy[key] = r.earlyDepartureReason ?? "";
			}
			return copy;
		});
	}, [records]);

	const findRecordByEnrollment = useCallback(
		(enrollmentId: number | string) =>
			records.find((r) => String(r.enrollment) === String(enrollmentId)),
		[records],
	);

	function handleSetReasonLocal(enrollmentId: number | string, value: string) {
		setReasonDrafts((p) => ({ ...p, [String(enrollmentId)]: value }));
	}

	async function upsertAttendance(
		enrollmentId: number | string,
		status: AttendanceRecord["status"],
		entryTime?: string | null,
		reason?: string | null,
	) {
		setBusy(enrollmentId, true);
		const iso = isoDate;
		const headers = {
			...getAuthHeader(),
			"Content-Type": "application/json",
			Accept: "application/json",
		};
		try {
			const qRes = await fetch(
				`/api/attendance/?date=${encodeURIComponent(iso)}&enrollment_id=${encodeURIComponent(String(enrollmentId))}`,
				{
					method: "GET",
					headers,
				},
			);
			const qData = (await qRes.json().catch(() => null)) as unknown;
			const existing =
				Array.isArray(qData) && (qData as unknown[]).length
					? ((qData as unknown[])[0] as RawRecord)
					: null;

			if (existing && isLockedStatus(existing["status"])) {
				console.warn(
					"Attempt to modify locked attendance",
					enrollmentId,
					existing["status"],
				);
				return;
			}

			const payload: Record<string, unknown> = {
				enrollment: enrollmentId,
				date: iso,
				status,
			};

			if (status === "absent") {
				payload.arrival_time = null;
				payload.departure_time = null;
			} else if (status === "present") {
				if (entryTime) payload.arrival_time = entryTime;
			} else if (status === "advance_withdrawal") {
				payload.departure_time = nowHHMM() + ":00";
				if (reason !== undefined) payload.withdrawal_reason = reason;
			} else if (status === "dispatched") {
				payload.departure_time = nowHHMM() + ":00";
				if (reason !== undefined) payload.withdrawal_reason = reason;
			}

			let res: Response;
			if (existing && existing["id"]) {
				res = await fetch(`/api/attendance/${existing["id"]}/`, {
					method: "PATCH",
					headers,
					body: JSON.stringify(payload),
				});
			} else {
				res = await fetch("/api/attendance/", {
					method: "POST",
					headers,
					body: JSON.stringify(payload),
				});
			}

			if (!res.ok) {
				const txt = await res.text().catch(() => "");
				console.error("upsert failed", res.status, txt);
				return;
			}
			const savedRaw = (await res.json().catch(() => null)) as RawRecord | null;

			const updated: AttendanceRecord = {
				id: (savedRaw && (savedRaw["id"] ?? (existing && existing["id"]))) as
					| number
					| string
					| undefined,
				enrollment:
					(savedRaw && (savedRaw["enrollment"] as number | string)) ??
					enrollmentId,
				canineId:
					(savedRaw &&
						savedRaw["enrollment"] &&
						(((savedRaw["enrollment"] as RawRecord)["canine"] as number) ??
							enrollmentId)) ??
					enrollmentId,
				canineName: (savedRaw && (savedRaw["canine_name"] as string)) ?? "",
				date: (savedRaw && (savedRaw["date"] as string)) ?? iso,
				entryTime:
					(savedRaw && (savedRaw["arrival_time"] as string)) ??
					(existing ? (existing["arrival_time"] as string | null) : null),
				status: ((savedRaw && (savedRaw["status"] as string)) ??
					status) as AttendanceRecord["status"],
				exitTime: (savedRaw && (savedRaw["departure_time"] as string)) ?? null,
				earlyDepartureReason:
					(savedRaw && (savedRaw["withdrawal_reason"] as string)) ??
					reason ??
					null,
			};

			setRecords((prev) => {
				const without = prev.filter(
					(p) => String(p.enrollment) !== String(enrollmentId),
				);
				return [updated, ...without];
			});
			setReasonDrafts((prev) => ({
				...prev,
				[String(enrollmentId)]:
					(savedRaw && (savedRaw["withdrawal_reason"] as string)) ?? "",
			}));
		} catch (err) {
			console.error("upsertAttendance error", err);
		} finally {
			setBusy(enrollmentId, false);
		}
	}

	const checkInApi = useCallback(
		async (enrollmentId: number | string, status = "present") => {
			setBusy(enrollmentId, true);
			try {
				const headers = {
					...getAuthHeader(),
					"Content-Type": "application/json",
					Accept: "application/json",
				};
				const res = await fetch("/api/attendance/check_in/", {
					method: "POST",
					headers,
					body: JSON.stringify({ enrollment: enrollmentId, status }),
				});
				if (!res.ok) {
					const txt = await res.text().catch(() => "");
					console.error("check_in failed", res.status, txt);
					return null;
				}
				const saved = (await res.json().catch(() => null)) as RawRecord | null;

				// patch to set local arrival time (so UI reflects local hours)
				if (saved && saved["id"]) {
					try {
						const p = await fetch(`/api/attendance/${saved["id"]}/`, {
							method: "PATCH",
							headers,
							body: JSON.stringify({ arrival_time: nowHHMM() + ":00", status }),
						});
						if (p.ok) {
							const patched = (await p
								.json()
								.catch(() => null)) as RawRecord | null;
							if (patched) {
								setRecords((prev) => {
									const without = prev.filter(
										(r) => String(r.enrollment) !== String(enrollmentId),
									);
									const updated: AttendanceRecord = {
										id: (patched["id"] ?? patched["pk"]) as number | string,
										enrollment:
											(patched["enrollment"] as number | string) ??
											enrollmentId,
										canineId:
											(patched["enrollment"] &&
												((patched["enrollment"] as RawRecord)["canine"] as
													| number
													| string)) ??
											enrollmentId,
										canineName: (patched["canine_name"] as string) ?? "",
										date: (patched["date"] as string) ?? isoDate,
										entryTime:
											(patched["arrival_time"] as string) ?? nowHHMM() + ":00",
										status: ((patched["status"] as string) ??
											"present") as AttendanceRecord["status"],
										exitTime: (patched["departure_time"] as string) ?? null,
										earlyDepartureReason:
											(patched["withdrawal_reason"] as string) ?? "",
									};
									return [updated, ...without];
								});
							}
						}
					} catch (e) {
						console.error("patch arrival_time failed", e);
					}
				}

				await refreshAttendancesPerEnrollment(new Date());
				return saved;
			} catch (e) {
				console.error("checkInApi error", e);
				return null;
			} finally {
				setBusy(enrollmentId, false);
			}
		},
		[getAuthHeader, refreshAttendancesPerEnrollment, isoDate, setBusy],
	);

	// handle status change: locked states (dispatched, advance_withdrawal) are immutable until admin reverts
	function handleSetStatusFor(
		enrollmentId: number | string,
		canineName: string,
		newStatus: AttendanceRecord["status"],
	) {
		const existing = findRecordByEnrollment(enrollmentId);

		if (existing && isLockedStatus(existing.status)) {
			alert(
				"Registro bloqueado — sólo un administrador puede revertirlo con el botón de deshacer.",
			);
			return;
		}

		// confirmation for dispatch / early withdrawal
		if (newStatus === "dispatched") {
			if (
				!confirm(
					`Confirmar la salida de ${canineName}? Esto bloqueará las modificaciones para este registro.`,
				)
			)
				return;
		}
		if (newStatus === "advance_withdrawal") {
			if (
				!confirm(
					`Confirmar la salida anticipada de ${canineName}? Esto bloqueará las modificaciones para este registro.`,
				)
			)
				return;
		}

		if (!isAdmin) {
			if (newStatus === "present") {
				void checkInApi(enrollmentId, "present");
				return;
			}

			const entryTime = existing?.entryTime ?? nowHHMM();
			const reason =
				reasonDrafts[String(enrollmentId)] ??
				existing?.earlyDepartureReason ??
				"";
			void upsertAttendance(
				enrollmentId,
				newStatus,
				entryTime ?? null,
				reason ?? "",
			);
			return;
		}

		const entryTime =
			existing?.entryTime ?? (newStatus === "absent" ? null : nowHHMM());
		const reason =
			reasonDrafts[String(enrollmentId)] ??
			existing?.earlyDepartureReason ??
			"";
		void upsertAttendance(
			enrollmentId,
			newStatus,
			entryTime ?? null,
			reason ?? "",
		);
	}

	function handleSetEntryTime(enrollmentId: number | string, t: string | null) {
		const existing = findRecordByEnrollment(enrollmentId);
		const locked =
			existing?.status === "dispatched" ||
			existing?.status === "advance_withdrawal";
		if (locked) {
			alert("Registro bloqueado — sólo un administrador puede revertirlo.");
			return;
		}
		if (!isAdmin) {
			void checkInApi(enrollmentId, "present");
			return;
		}
		const status =
			(existing?.status as AttendanceRecord["status"]) ?? "present";
		void upsertAttendance(
			enrollmentId,
			status,
			t ?? null,
			existing?.earlyDepartureReason ?? "",
		);
	}

	async function commitReason(enrollmentId: number | string) {
		setBusy(enrollmentId, true);
		const draft = reasonDrafts[String(enrollmentId)] ?? "";

		const existingLocal = findRecordByEnrollment(enrollmentId);
		const existingVal = existingLocal?.earlyDepartureReason ?? "";
		if ((draft || "") === (existingVal || "")) {
			setBusy(enrollmentId, false);
			return;
		}

		const headers = {
			...getAuthHeader(),
			"Content-Type": "application/json",
			Accept: "application/json",
		};

		try {
			const q = await fetch(
				`/api/attendance/?date=${encodeURIComponent(isoDate)}&enrollment_id=${encodeURIComponent(String(enrollmentId))}`,
				{ method: "GET", headers },
			);
			const serverArr = q.ok
				? ((await q.json().catch(() => [])) as unknown[])
				: [];
			const serverRec =
				Array.isArray(serverArr) && serverArr.length
					? (serverArr[0] as RawRecord)
					: null;

			if (serverRec && isLockedStatus(serverRec["status"])) {
				setReasonDrafts((p) => ({
					...p,
					[String(enrollmentId)]:
						(serverRec["withdrawal_reason"] as string) ?? "",
				}));
				alert(
					"No se pueden modificar las observaciones: el registro está bloqueado. Sólo un administrador puede revertirlo.",
				);
				return;
			}

			if (serverRec && serverRec["id"]) {
				const payload: Record<string, unknown> = { withdrawal_reason: draft };
				const p = await fetch(`/api/attendance/${serverRec["id"]}/`, {
					method: "PATCH",
					headers,
					body: JSON.stringify(payload),
				});
				if (!p.ok) {
					console.error(
						"patch withdrawal_reason failed",
						p.status,
						await p.text().catch(() => ""),
					);
					const r = await fetch(
						`/api/attendance/?date=${encodeURIComponent(isoDate)}&enrollment_id=${encodeURIComponent(String(enrollmentId))}`,
						{ method: "GET", headers },
					);
					const a = r.ok ? ((await r.json().catch(() => [])) as unknown[]) : [];
					const srv = Array.isArray(a) && a.length ? (a[0] as RawRecord) : null;
					setReasonDrafts((p) => ({
						...p,
						[String(enrollmentId)]:
							(srv && (srv["withdrawal_reason"] as string)) ?? existingVal,
					}));
					return;
				}
				const saved = (await p.json().catch(() => null)) as RawRecord | null;

				const updated: AttendanceRecord = {
					id:
						(saved && (saved["id"] as number | string)) ??
						(serverRec["id"] as number | string),
					enrollment:
						(saved && (saved["enrollment"] as number | string)) ?? enrollmentId,
					canineId:
						(saved &&
							((saved["enrollment"] as RawRecord)["canine"] as
								| number
								| string)) ??
						enrollmentId,
					canineName:
						(saved && (saved["canine_name"] as string)) ??
						existingLocal?.canineName ??
						"",
					date: (saved && (saved["date"] as string)) ?? isoDate,
					entryTime:
						(saved && (saved["arrival_time"] as string)) ??
						existingLocal?.entryTime ??
						null,
					status: ((saved && (saved["status"] as string)) ??
						existingLocal?.status ??
						"present") as AttendanceRecord["status"],
					exitTime:
						(saved && (saved["departure_time"] as string)) ??
						existingLocal?.exitTime ??
						null,
					earlyDepartureReason:
						(saved && (saved["withdrawal_reason"] as string)) ?? draft,
				};
				setRecords((prev) => {
					const without = prev.filter(
						(r) => String(r.enrollment) !== String(enrollmentId),
					);
					return [updated, ...without];
				});
				setReasonDrafts((p) => ({
					...p,
					[String(enrollmentId)]: updated.earlyDepartureReason ?? "",
				}));
				return;
			}

			{
				const payload: Record<string, unknown> = {
					enrollment: enrollmentId,
					date: isoDate,
					status: "present",
					arrival_time: existingLocal?.entryTime ?? null,
					withdrawal_reason: draft,
				};
				const createRes = await fetch("/api/attendance/", {
					method: "POST",
					headers,
					body: JSON.stringify(payload),
				});
				if (!createRes.ok) {
					console.error(
						"create attendance failed",
						createRes.status,
						await createRes.text().catch(() => ""),
					);
					return;
				}
				const saved = (await createRes
					.json()
					.catch(() => null)) as RawRecord | null;
				const updated: AttendanceRecord = {
					id:
						(saved && (saved["id"] as number | string)) ??
						(saved && (saved["pk"] as number | string)),
					enrollment:
						(saved && (saved["enrollment"] as number | string)) ?? enrollmentId,
					canineId:
						(saved &&
							((saved["enrollment"] as RawRecord)["canine"] as
								| number
								| string)) ??
						enrollmentId,
					canineName:
						(saved && (saved["canine_name"] as string)) ??
						existingLocal?.canineName ??
						"",
					date: (saved && (saved["date"] as string)) ?? isoDate,
					entryTime:
						(saved && (saved["arrival_time"] as string)) ??
						existingLocal?.entryTime ??
						null,
					status:
						(saved && (saved["status"] as AttendanceRecord["status"])) ??
						"present",
					exitTime: (saved && (saved["departure_time"] as string)) ?? null,
					earlyDepartureReason:
						(saved && (saved["withdrawal_reason"] as string)) ?? draft,
				};
				setRecords((prev) => {
					const without = prev.filter(
						(r) => String(r.enrollment) !== String(enrollmentId),
					);
					return [updated, ...without];
				});
				setReasonDrafts((p) => ({
					...p,
					[String(enrollmentId)]: updated.earlyDepartureReason ?? "",
				}));
			}
		} catch (err) {
			console.error("commitReason error", err);
		} finally {
			setBusy(enrollmentId, false);
		}
	}

	async function adminUndoDispatch(enrollmentId: number | string) {
		const existing = await (async () => {
			const headers = { ...getAuthHeader(), Accept: "application/json" };
			const res = await fetch(
				`/api/attendance/?date=${encodeURIComponent(isoDate)}&enrollment_id=${encodeURIComponent(String(enrollmentId))}`,
				{ headers },
			);
			if (!res.ok) return null;
			const arr = await res.json().catch(() => null);
			return Array.isArray(arr) && arr.length ? arr[0] : null;
		})();
		if (!existing) {
			alert("No attendance record found to undo.");
			return;
		}
		try {
			const headers = {
				...getAuthHeader(),
				"Content-Type": "application/json",
				Accept: "application/json",
			};

			const payload: Record<string, unknown> = {
				status: "present",
				departure_time: null,
			};
			const res = await fetch(`/api/attendance/${existing.id}/`, {
				method: "PATCH",
				headers,
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const t = await res.text().catch(() => null);
				console.error("undo dispatch failed", res.status, t);
				alert("Failed to undo dispatch. Check console.");
				return;
			}
			await res.json().catch(() => null);

			void refreshAttendancesPerEnrollment(date);

			setUnlockedByAdmin((p) => {
				const copy = { ...p };
				delete copy[String(enrollmentId)];
				return copy;
			});
		} catch (e) {
			console.error("adminUndoDispatch error", e);
		}
	}

	function handleClear(enrollmentId: number | string) {
		const existing = findRecordByEnrollment(enrollmentId);
		const locked =
			existing?.status === "dispatched" ||
			existing?.status === "advance_withdrawal";
		if (locked) {
			alert(
				"No se puede eliminar: registro bloqueado. Deshacer bloqueo con un admin.",
			);
			return;
		}
		if (!confirm("Eliminar registro de este perro para la fecha?")) return;

		(async () => {
			try {
				const headers = { ...getAuthHeader(), Accept: "application/json" };
				const resQuery = await fetch(
					`/api/attendance/?date=${encodeURIComponent(isoDate)}&enrollment_id=${encodeURIComponent(String(enrollmentId))}`,
					{ headers },
				);
				if (!resQuery.ok) {
					setRecords((prev) =>
						prev.filter((r) => String(r.enrollment) !== String(enrollmentId)),
					);
					return;
				}
				const arr = await resQuery.json().catch(() => null);
				const a = Array.isArray(arr) && arr.length ? arr[0] : null;
				if (!a) {
					setRecords((prev) =>
						prev.filter((r) => String(r.enrollment) !== String(enrollmentId)),
					);
					return;
				}
				const del = await fetch(`/api/attendance/${a.id}/`, {
					method: "DELETE",
					headers,
				});
				if (del.ok) {
					setRecords((prev) =>
						prev.filter((r) => String(r.enrollment) !== String(enrollmentId)),
					);
				} else {
					console.error("delete failed", del.status);
				}
			} catch (err) {
				console.error("clear error", err);
			}
		})();
	}

	return (
		<PageTransition>
			<div
				className="form-card font-montserrat"
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 16,
					minHeight: "calc(100vh - 64px)",
					width: "calc(100% - 64px)",
					margin: "24px auto",
				}}
			>
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

							{isAdmin ? (
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
							) : (
								<div
									style={{
										padding: "10px 12px",
										borderRadius: 8,
										background: "#fff",
										border: "1px solid #e5e7eb",
									}}
								>
									{toLocalISO(new Date())}
									<div style={{ fontSize: 12, color: "var(--muted-color)" }}>
										Sólo marcación para el día de hoy
									</div>
								</div>
							)}
						</div>

						<div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
							<button
								className="btn-ghost action-btn"
								onClick={() => void refreshAttendancesPerEnrollment(date)}
							>
								Actualizar
							</button>
							<button
								className="btn-ghost action-btn"
								onClick={() => {
									if (!confirm(`Eliminar todos los registros de ${isoDate}?`))
										return;
									(async () => {
										try {
											const headers = {
												...getAuthHeader(),
												Accept: "application/json",
											};
											const res = await fetch(
												`/api/attendance/?date=${encodeURIComponent(isoDate)}`,
												{ headers },
											);
											if (!res.ok) return;
											const arr = await res.json().catch(() => []);
											for (const a of arr) {
												await fetch(`/api/attendance/${a.id}/`, {
													method: "DELETE",
													headers,
												});
											}
											void loadAttendancesForDate(date);
										} catch (e) {
											console.error(e);
										}
									})();
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
							<h3 style={{ margin: 0, fontSize: 16 }}>Perros matriculados</h3>
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
									<th style={{ width: 240 }}>Observaciones</th>
									<th style={{ width: 80 }}></th>
								</tr>
							</thead>
							<tbody>
								{canines.map((c) => {
									const enrollmentId = c.enrollmentId ?? c.id;
									const rec = records.find(
										(r) => String(r.enrollment) === String(enrollmentId),
									);

									const wasUnlocked = !!unlockedByAdmin[String(enrollmentId)];
									const currentStatus =
										(rec?.status as AttendanceRecord["status"]) ?? "present";

									const locked = !!rec && isLockedStatus(rec.status);

									return (
										<tr key={String(enrollmentId)}>
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
													{wasUnlocked && (
														<span
															style={{
																marginLeft: 8,
																fontSize: 11,
																color: "#0f172a",
																background: "rgba(59,130,246,0.08)",
																padding: "4px 8px",
																borderRadius: 8,
																display: "inline-block",
																marginTop: 6,
															}}
														>
															Desbloqueado por admin
														</span>
													)}
												</div>
											</td>

											<td style={{ padding: "12px 16px" }}>
												<div style={{ display: "flex", gap: 8 }}>
													<button
														type="button"
														className={
															currentStatus === "present"
																? "btn-success btn-sm"
																: "btn-ghost btn-sm"
														}
														disabled={
															(locked && !isAdmin) ||
															!!busyEnrollments[String(enrollmentId)]
														}
														onClick={() =>
															handleSetStatusFor(
																enrollmentId,
																c.name,
																"present",
															)
														}
													>
														{busyEnrollments[String(enrollmentId)]
															? "..."
															: "Presente"}
													</button>
													<button
														type="button"
														className={
															currentStatus === "advance_withdrawal"
																? "btn-warning btn-sm"
																: "btn-ghost btn-sm"
														}
														disabled={
															(locked && !isAdmin) ||
															!!busyEnrollments[String(enrollmentId)]
														}
														onClick={() =>
															handleSetStatusFor(
																enrollmentId,
																c.name,
																"advance_withdrawal",
															)
														}
													>
														Retiro anticipado
													</button>
													<button
														type="button"
														className={
															currentStatus === "dispatched"
																? "btn-ghost btn-sm"
																: "btn-ghost btn-sm"
														}
														disabled={
															(locked && !isAdmin) ||
															!!busyEnrollments[String(enrollmentId)]
														}
														onClick={() =>
															handleSetStatusFor(
																enrollmentId,
																c.name,
																"dispatched",
															)
														}
														style={
															currentStatus === "dispatched"
																? { background: "#bfdbfe", color: "#1e3a8a" }
																: undefined
														}
													>
														{busyEnrollments[String(enrollmentId)]
															? "..."
															: "Despachado"}
													</button>
													<button
														type="button"
														className={
															currentStatus === "absent"
																? "btn-danger btn-sm"
																: "btn-ghost btn-sm"
														}
														disabled={
															(locked && !isAdmin) ||
															!!busyEnrollments[String(enrollmentId)]
														}
														onClick={() =>
															handleSetStatusFor(enrollmentId, c.name, "absent")
														}
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
														handleSetEntryTime(
															enrollmentId,
															e.target.value || null,
														)
													}
													step={60}
													style={{ minWidth: 120, borderRadius: 10 }}
													disabled={
														(locked && !isAdmin) ||
														!!busyEnrollments[String(enrollmentId)]
													}
												/>
												<button
													type="button"
													className="btn-small"
													onClick={() =>
														handleSetEntryTime(enrollmentId, nowHHMM())
													}
													title="Set now"
													disabled={
														(locked && !isAdmin) ||
														!!busyEnrollments[String(enrollmentId)]
													}
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
													placeholder="Observaciones (opcional)"
													value={
														reasonDrafts[String(enrollmentId)] ??
														rec?.earlyDepartureReason ??
														""
													}
													onChange={(e) =>
														handleSetReasonLocal(enrollmentId, e.target.value)
													}
													onBlur={() => commitReason(enrollmentId)}
													spellCheck={true}
													disabled={
														(locked && !isAdmin) ||
														!!busyEnrollments[String(enrollmentId)]
													}
												/>
											</td>

											<td style={{ padding: "12px 16px", textAlign: "right" }}>
												{rec ? (
													rec.status === "dispatched" ||
													rec.status === "advance_withdrawal" ? (
														isAdmin ? (
															<button
																className="icon-btn delete-btn"
																onClick={() => adminUndoDispatch(enrollmentId)}
																title="Undo dispatch/withdrawal (admin)"
																aria-label={`Undo dispatch ${c.name}`}
															>
																↩
															</button>
														) : (
															<span
																style={{
																	color: "var(--muted-color)",
																	fontSize: 13,
																}}
															>
																Locked
															</span>
														)
													) : (
														<button
															className="icon-btn delete-btn"
															onClick={() => handleClear(enrollmentId)}
															title="Eliminar"
															aria-label={`Eliminar registro ${c.name}`}
															disabled={locked}
														>
															🗑
														</button>
													)
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
											No hay perros matriculados.
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
