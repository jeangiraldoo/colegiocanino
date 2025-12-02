import React, { useState, useEffect, useMemo } from "react";
import PageTransition from "../../../components/PageTransition";
import PetsIcon from "@mui/icons-material/Pets";
import SearchIcon from "@mui/icons-material/Search";
import apiClient from "../../../api/axiosConfig";

const getAuthHeader = () => {
	const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

type Canine = {
	id: number;
	name: string;
	breed: string;
	age: number;
	size: "mini" | "small" | "medium" | "big";
	photo: string | null;
	creation_date: string;
	status: boolean;
	client: number;
	client_name: string;
};

const SIZE_LABELS: Record<string, string> = {
	mini: "Mini",
	small: "Pequeño",
	medium: "Mediano",
	big: "Grande",
};

const API_BASE =
	typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL
		? String(import.meta.env.VITE_API_URL)
		: "http://127.0.0.1:8000";

const resolvePhoto = (p?: string | null): string | null => {
	if (!p) return null;
	if (p.startsWith("http://") || p.startsWith("https://")) return p;
	if (p.startsWith("/")) return API_BASE.replace(/\/$/, "") + p;
	return API_BASE.replace(/\/$/, "") + "/" + p;
};

export default function ListCanines() {
	const [canines, setCanines] = useState<Canine[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterBreed, setFilterBreed] = useState("");
	const [filterSize, setFilterSize] = useState("");

	// Get unique breeds from canines for filter dropdown
	const uniqueBreeds = useMemo(() => {
		const breeds = new Set(canines.map((c) => c.breed).filter(Boolean));
		return Array.from(breeds).sort();
	}, [canines]);

	useEffect(() => {
		const loadCanines = async () => {
			setLoading(true);
			setError(null);

			try {
				const headers = { Accept: "application/json", ...getAuthHeader() };
				const response = await apiClient.get("/api/canines/", {
					headers,
					validateStatus: () => true,
				});

				if (response.status >= 200 && response.status < 300) {
					const data = Array.isArray(response.data) ? response.data : [];
					setCanines(data);
				} else if (response.status === 401) {
					setError("No autorizado. Por favor, inicia sesión nuevamente.");
				} else {
					setError("Error al cargar los caninos. Intenta de nuevo.");
				}
			} catch (err) {
				console.error("Error loading canines:", err);
				setError("Error de conexión. Verifica tu conexión a internet.");
			} finally {
				setLoading(false);
			}
		};

		loadCanines();
	}, []);

	// Client-side filtering
	const filtered = useMemo(() => {
		let result = canines;
		
		// Filter by breed
		if (filterBreed) {
			result = result.filter((c) => c.breed === filterBreed);
		}
		
		// Filter by size
		if (filterSize) {
			result = result.filter((c) => c.size === filterSize);
		}
		
		// Filter by search query (name, breed, owner)
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			result = result.filter((c) => {
				const searchText = `${c.name} ${c.breed} ${c.client_name}`.toLowerCase();
				return searchText.includes(q);
			});
		}

		return result;
	}, [canines, filterBreed, filterSize, searchQuery]);

	return (
		<PageTransition>
			<div className="font-montserrat" style={{ display: "flex", gap: 20 }}>
				<div style={{ flex: 1 }}>
					{error && (
						<div
							style={{
								padding: 12,
								background: "#FEF3F2",
								color: "#B91C1C",
								borderRadius: 8,
								marginBottom: 12,
							}}
						>
							{error}
						</div>
					)}
					<header
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 14,
						}}
					>
						<div>
							<h1 style={{ margin: 0, fontSize: 22, color: "var(--text-color)" }}>
								Listar caninos
							</h1>
							<p style={{ margin: 0, color: "var(--muted-color)" }}>
								Visualiza y filtra los caninos matriculados
							</p>
						</div>
					</header>

					{/* Search and Filters */}
					<div
						style={{
							marginBottom: 14,
							display: "flex",
							gap: 12,
							alignItems: "center",
							flexWrap: "wrap",
						}}
					>
						<div style={{ position: "relative", flex: 1, minWidth: 250 }}>
							<SearchIcon
								style={{
									position: "absolute",
									left: 12,
									top: "50%",
									transform: "translateY(-50%)",
									color: "var(--muted-color)",
									fontSize: 20,
								}}
							/>
							<input
								placeholder="Buscar por nombre, raza o dueño..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input-primary input-lg"
								style={{
									width: "100%",
									paddingLeft: 40,
									color: "var(--text-color)",
									fontWeight: 600,
								}}
							/>
						</div>
						<select
							value={filterBreed}
							onChange={(e) => setFilterBreed(e.target.value)}
							className="input-primary input-lg"
							style={{
								minWidth: 180,
								color: "var(--text-color)",
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							<option value="">Todas las razas</option>
							{uniqueBreeds.map((breed) => (
								<option key={breed} value={breed}>
									{breed}
								</option>
							))}
						</select>
						<select
							value={filterSize}
							onChange={(e) => setFilterSize(e.target.value)}
							className="input-primary input-lg"
							style={{
								minWidth: 150,
								color: "var(--text-color)",
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							<option value="">Todos los tamaños</option>
							<option value="mini">Mini</option>
							<option value="small">Pequeño</option>
							<option value="medium">Mediano</option>
							<option value="big">Grande</option>
						</select>
						<div
							style={{
								minWidth: 120,
								textAlign: "right",
								color: "var(--muted-color)",
								fontWeight: 600,
							}}
						>
							{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
						</div>
					</div>

					{loading && <div className="text-center py-8">Cargando...</div>}
					{!loading && !error && filtered.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							{canines.length === 0
								? "No hay caninos registrados"
								: "No se encontraron caninos con los filtros aplicados"}
						</div>
					)}
					{!loading && !error && filtered.length > 0 && (
						<div className="form-card" style={{ padding: 0 }}>
							<table style={{ width: "100%", borderCollapse: "collapse" }} className="manage-table">
								<thead>
									<tr>
										<th style={{ width: 60 }}></th>
										<th>Nombre</th>
										<th>Raza</th>
										<th style={{ width: 100 }}>Edad</th>
										<th style={{ width: 120 }}>Tamaño</th>
										<th>Dueño</th>
										<th style={{ width: 100 }}>Estado</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((canine, idx) => {
											const rowKey = String(canine.id ?? `canine-${idx}`);
											const photoUrl = resolvePhoto(canine.photo);
											return (
												<tr key={rowKey}>
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
															{photoUrl ? (
																<img
																	src={photoUrl}
																	alt={canine.name}
																	style={{
																		width: "100%",
																		height: "100%",
																		objectFit: "cover",
																	}}
																	onError={(e) => {
																		const img = e.currentTarget as HTMLImageElement;
																		if (img.dataset?.tried) return;
																		if (img.dataset) img.dataset.tried = "1";
																		img.src = "https://via.placeholder.com/150?text=🐕";
																	}}
																/>
															) : (
																<PetsIcon style={{ color: "#6B7280" }} />
															)}
														</div>
													</td>
													<td
														style={{
															padding: "12px 16px",
															color: "var(--text-color)",
															fontWeight: 700,
														}}
													>
														{canine.name}
													</td>
													<td
														style={{
															padding: "12px 16px",
															color: "var(--muted-color)",
														}}
													>
														{canine.breed}
													</td>
													<td
														style={{
															padding: "12px 16px",
															color: "var(--muted-color)",
														}}
													>
														{canine.age} {canine.age === 1 ? "año" : "años"}
													</td>
													<td
														style={{
															padding: "12px 16px",
															color: "var(--text-color)",
														}}
													>
														<span
															style={{
																background: "rgba(14,165,233,0.06)",
																color: "var(--text-color)",
																padding: "6px 10px",
																borderRadius: 10,
																fontWeight: 700,
																fontSize: 12,
															}}
														>
															{SIZE_LABELS[canine.size] ?? canine.size}
														</span>
													</td>
													<td
														style={{
															padding: "12px 16px",
															color: "var(--muted-color)",
														}}
													>
														{canine.client_name || "N/A"}
													</td>
													<td
														style={{
															padding: "12px 16px",
															color: "var(--text-color)",
														}}
													>
														<span
															style={{
																background: canine.status
																	? "rgba(34,197,94,0.1)"
																	: "rgba(239,68,68,0.1)",
																color: canine.status ? "#16a34a" : "#dc2626",
																padding: "6px 10px",
																borderRadius: 10,
																fontWeight: 700,
																fontSize: 12,
															}}
														>
															{canine.status ? "Activo" : "Inactivo"}
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
						</div>
					)}
				</div>
			</div>
		</PageTransition>
	);
}

