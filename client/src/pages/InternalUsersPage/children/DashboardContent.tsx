import React, { useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/axiosConfig";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	PointElement,
	LineElement,
	Filler,
} from "chart.js";
import type { ChartData, TooltipItem } from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PetsIcon from "@mui/icons-material/Pets";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

// Register ChartJS components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	PointElement,
	LineElement,
	Filler,
);

interface MonthlyIncomeData {
	summary: {
		total_income: string;
		total_enrollments: number;
		average_monthly_income: string;
		months_count: number;
	};
	monthly_data: Array<{
		year: number;
		month: number;
		month_name: string;
		month_short: string;
		date: string;
		income: string;
		enrollment_count: number;
	}>;
}

interface PlanReportData {
	summary: {
		total_plans: number;
		total_enrollments: number;
		total_active_enrollments: number;
		total_inactive_enrollments: number;
	};
	plans: Array<{
		plan_id: number;
		plan_name: string;
		price: string;
		total_enrollments: number;
		active_enrollments: number;
		inactive_enrollments: number;
	}>;
}

// --- Components ---

const StatCard = ({
	title,
	value,
	icon,
	trend,
	colorClass = "bg-amber-50 text-amber-600",
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	trend?: string;
	colorClass?: string;
}) => (
	<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-start justify-between hover:shadow-md transition-all duration-300 cursor-default group">
		<div>
			<p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-amber-600 transition-colors">
				{title}
			</p>
			<h3 className="text-3xl font-bold text-gray-800 mb-2">{value}</h3>
			{trend && (
				<div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit border border-emerald-100">
					<TrendingUpIcon style={{ fontSize: 14, marginRight: 4 }} />
					<span>{trend}</span>
				</div>
			)}
		</div>
		<div
			className={`p-4 rounded-lg ${colorClass} shadow-sm group-hover:scale-105 transition-transform duration-300`}
		>
			{icon}
		</div>
	</div>
);

export default function DashboardContent() {
	const navigate = useNavigate();
	const [chartGradient, setChartGradient] = useState<CanvasGradient | null>(null);
	const chartRef = useRef<ChartJS<"bar">>(null);

	const [incomeData, setIncomeData] = useState<MonthlyIncomeData | null>(null);
	const [planData, setPlanData] = useState<PlanReportData | null>(null);
	const [canineCount, setCanineCount] = useState(0);

	const [loading, setLoading] = useState(true);
	const [incomePeriod, setIncomePeriod] = useState("all_time"); // Default to all time to show data if available

	useEffect(() => {
		const fetchStats = async () => {
			try {
				setLoading(true);

				// Prepare params for monthly income
				const incomeParams: Record<string, number> = {};
				const now = new Date();
				if (incomePeriod === "this_year") {
					incomeParams.year = now.getFullYear();
				} else if (incomePeriod === "last_year") {
					incomeParams.year = now.getFullYear() - 1;
				}

				const [incomeRes, planRes, caninesRes] = await Promise.all([
					apiClient.get("/api/reports/monthly-income/", { params: incomeParams }),
					apiClient.get("/api/reports/enrollments-by-plan-detailed/?include_empty=true"),
					apiClient.get("/api/canines/?limit=1"),
				]);

				console.log("📊 Income Data:", incomeRes.data);
				console.log("📊 Plan Data:", planRes.data);
				console.log("📊 Canines Data:", caninesRes.data);

				setIncomeData(incomeRes.data);
				setPlanData(planRes.data);

				// DRF pagination returns count in 'count' field, or list if not paginated
				setCanineCount(
					caninesRes.data.count !== undefined ? caninesRes.data.count : caninesRes.data.length,
				);
			} catch (error) {
				console.error("Error fetching dashboard stats:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, [incomePeriod]);

	useEffect(() => {
		const chart = chartRef.current;
		if (chart) {
			const ctx = chart.ctx;
			const gradient = ctx.createLinearGradient(0, 0, 0, 400);
			gradient.addColorStop(0, "rgba(245, 158, 11, 0.8)"); // Amber 500
			gradient.addColorStop(1, "rgba(245, 158, 11, 0.1)"); // Transparent
			setChartGradient(gradient);
		}
	}, [incomeData]);

	const handleGlobalFilter = () => {
		alert("Filtro global activado (Simulación)");
	};

	// Prepare Chart Data
	const chartLabels = incomeData?.monthly_data?.map((d) => d.month_short) || [];
	const chartValues = incomeData?.monthly_data?.map((d) => parseFloat(d.income)) || [];

	const incomeChartData: ChartData<"bar"> = {
		labels: chartLabels,
		datasets: [
			{
				label: "Ingresos",
				data: chartValues,
				backgroundColor: chartGradient || "rgba(245, 158, 11, 0.8)",
				hoverBackgroundColor: "rgba(251, 191, 36, 1)", // Amber 400
				borderRadius: 4,
				borderSkipped: false,
				barThickness: 32,
			},
		],
	};

	const planLabels = planData?.plans?.map((p) => p.plan_name) || [];
	const planValues = planData?.plans?.map((p) => p.active_enrollments) || [];

	// Sparkline for economic indicator: use last 6 months of income and compute analysis
	const lastSix = incomeData?.monthly_data?.slice(-6) || [];
	const sparkLabels = lastSix.map((d) => d.month_short) || [];
	const sparkValues = lastSix.map((d) => parseFloat(d.income)) || [];

	const sparklineData = {
		labels: sparkLabels,
		datasets: [
			{
				data: sparkValues,
				borderColor: "rgba(16,185,129,0.9)",
				backgroundColor: "rgba(16,185,129,0.12)",
				tension: 0.4,
				pointRadius: 0,
				hoverRadius: 6,
				borderWidth: 2,
				fill: true,
			},
		],
	};

	const sparklineOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				enabled: true,
				mode: "nearest" as const,
				intersect: false,
				callbacks: {
					label: function (context: TooltipItem<"line">) {
						type ParsedVal = { y?: number } | number | null | undefined;
						const parsed = context.parsed as ParsedVal;
						let v = 0;
						if (parsed !== null && parsed !== undefined) {
							if (typeof parsed === "object") {
								v = Number((parsed as { y?: number }).y ?? 0);
							} else if (typeof parsed === "number") {
								v = parsed;
							}
						}
						return new Intl.NumberFormat("es-CO", {
							style: "currency",
							currency: "COP",
							maximumFractionDigits: 0,
						}).format(Number(v));
					},
				},
			},
		},
		interaction: { mode: "nearest" as const, intersect: false },
		elements: { point: { radius: 0, hoverRadius: 6 } },
		scales: {
			x: { display: false },
			y: { display: false, beginAtZero: true },
		},
	};

	// Analysis values
	const lastValue = lastSix.length ? parseFloat(lastSix[lastSix.length - 1].income) : null;
	const prevValue = lastSix.length > 1 ? parseFloat(lastSix[lastSix.length - 2].income) : null;
	const pctChange =
		lastValue !== null && prevValue !== null && prevValue !== 0
			? ((lastValue - prevValue) / prevValue) * 100
			: null;

	const bestMonth =
	incomeData?.monthly_data && incomeData.monthly_data.length
		? incomeData.monthly_data.reduce((a, b) =>
			parseFloat(a.income) > parseFloat(b.income) ? a : b
		)
		: null;

	const worstMonth =
	incomeData?.monthly_data && incomeData.monthly_data.length
		? incomeData.monthly_data.reduce((a, b) =>
			parseFloat(a.income) < parseFloat(b.income) ? a : b
		)
		: null;

	//const bestMonth = incomeData?.monthly_data?.reduce((a, b) =>
	//	parseFloat(a.income) > parseFloat(b.income) ? a : b,
	//);
	//const worstMonth = incomeData?.monthly_data?.reduce((a, b) =>
	//	parseFloat(a.income) < parseFloat(b.income) ? a : b,
	//);

	const plansChartData = {
		labels: planLabels,
		datasets: [
			{
				data: planValues,
				backgroundColor: [
					"#fbbf24", // amber-400
					"#f59e0b", // amber-500
					"#d97706", // amber-600
					"#b45309", // amber-700
					"#92400e", // amber-800
				],
				borderWidth: 0,
				hoverOffset: 10,
			},
		],
	};

	const statusData = {
		labels: ["Activos", "Inactivos"],
		datasets: [
			{
				data: planData?.summary
					? [planData.summary.total_active_enrollments, planData.summary.total_inactive_enrollments]
					: [],
				backgroundColor: ["#10b981", "#ef4444"],
				borderWidth: 0,
				cutout: "75%",
			},
		],
	};

	// Chart Options
	const barOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			animation: {
				duration: 800,
				easing: "easeOutQuart" as const,
			},
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: "rgba(255, 255, 255, 0.95)",
					titleColor: "#1f2937",
					bodyColor: "#4b5563",
					borderColor: "#e5e7eb",
					borderWidth: 1,
					padding: 12,
					boxPadding: 6,
					usePointStyle: true,
					titleFont: { size: 14, weight: "bold" as const },
					bodyFont: { size: 13 },
					callbacks: {
						label: (context: TooltipItem<"bar">) => {
							let label = context.dataset.label || "";
							if (label) {
								label += ": ";
							}
							if (context.parsed.y !== null) {
								label += new Intl.NumberFormat("es-CO", {
									style: "currency",
									currency: "COP",
									maximumFractionDigits: 0,
								}).format(context.parsed.y);
							}
							return label;
						},
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					border: { display: false },
					grid: {
						color: "#f3f4f6",
						drawBorder: false,
						borderDash: [5, 5],
					},
					ticks: {
						font: { size: 11 },
						color: "#9ca3af",
						padding: 10,
						callback: (value: string | number) => {
							return new Intl.NumberFormat("es-CO", {
								style: "currency",
								currency: "COP",
								notation: "compact",
								maximumFractionDigits: 1,
							}).format(Number(value));
						},
					},
				},
				x: {
					border: { display: false },
					grid: { display: false },
					ticks: {
						font: { size: 12, weight: "bold" as const },
						color: "#6b7280",
					},
				},
			},
		}),
		[],
	);

	const doughnutOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			cutout: "65%",
			plugins: {
				legend: {
					position: "right" as const,
					labels: {
						font: { size: 12, weight: "bold" as const },
						usePointStyle: true,
						pointStyle: "circle",
						padding: 15,
						color: "#4b5563",
					},
				},
			},
		}),
		[],
	);

	// Keep rendering the dashboard while loading so partial updates don't replace the whole view.

	const totalPlans = planData?.summary?.total_plans || 0;

	return (
		<div className="space-y-8 pb-12 animate-fade-in">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard General</h1>
					<p className="text-gray-500 mt-1">Resumen de actividad y rendimiento financiero</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleGlobalFilter}
						className="!bg-white p-2 !text-gray-400 hover:!text-amber-500 hover:!bg-amber-50 rounded-full transition-colors border border-gray-200 shadow-sm active:scale-95"
					>
						<FilterListIcon />
					</button>
					<div className="text-xs font-semibold text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 shadow-sm flex items-center gap-2">
						<span>Actualizado: {new Date().toLocaleDateString()}</span>
						{loading && <span className="text-xs text-gray-500">· Cargando...</span>}
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard
					title="Ingresos Totales (Periodo)"
					value={new Intl.NumberFormat("es-CO", {
						style: "currency",
						currency: "COP",
						maximumFractionDigits: 0,
					}).format(parseFloat(incomeData?.summary?.total_income || "0"))}
					icon={<AttachMoneyIcon fontSize="large" />}
					trend="Basado en matrículas del periodo"
				/>
				<StatCard
					title="Matrículas Activas"
					value={planData?.summary?.total_active_enrollments?.toString() || "0"}
					icon={<AssignmentIcon fontSize="large" />}
					trend={`De ${planData?.summary?.total_enrollments || 0} históricas`}
					colorClass="bg-blue-50 text-blue-600"
				/>
				<StatCard
					title="Total Canines"
					value={canineCount.toString()}
					icon={<PetsIcon fontSize="large" />}
					colorClass="bg-purple-50 text-purple-600"
				/>
			</div>

			{/* Main Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Revenue Over Time Chart */}
				<div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<div className="flex justify-between items-center mb-8">
						<div>
							<h3 className="text-xl font-bold text-gray-800">Ingresos en el Tiempo</h3>
							<p className="text-sm text-gray-400">Evolución de ingresos por matrículas</p>
						</div>
						<select
							value={incomePeriod}
							onChange={(e) => setIncomePeriod(e.target.value)}
							className="text-sm border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
						>
							<option value="all_time">Histórico</option>
							<option value="this_year">Este año</option>
							<option value="last_year">Año pasado</option>
						</select>
					</div>
					<div className="h-[350px] w-full">
						<Bar ref={chartRef} options={barOptions} data={incomeChartData} />
					</div>
				</div>

				{/* Enrollments by Plan */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col relative">
					<div className="flex justify-between items-start mb-6">
						<h3 className="text-xl font-bold text-gray-800">Distribución por Plan</h3>
						<button
							onClick={() => navigate("../reportes/matriculas-por-plan")}
							className="!bg-transparent !text-gray-400 hover:!text-amber-600 !p-1 rounded-full hover:!bg-amber-50 transition-colors"
							title="Ver detalles"
						>
							<VisibilityIcon fontSize="small" />
						</button>
					</div>
					<div className="flex-1 flex items-center justify-center relative">
						<Doughnut
							options={{
								...doughnutOptions,
								plugins: {
									legend: { position: "bottom", labels: { padding: 20, usePointStyle: true } },
								},
							}}
							data={plansChartData}
						/>
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
							<p className="text-3xl font-bold text-gray-800 leading-none">{totalPlans}</p>
							<p className="text-xs text-gray-400 uppercase font-bold mt-1">Planes</p>
						</div>
					</div>
				</div>
			</div>

			{/* Secondary Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Economic Indicator (replaces Attendance Today) */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-xl font-bold text-gray-800">Indicador Económico</h3>
					</div>
					<div className="h-[250px] flex items-center justify-center relative">
						<div className="w-full flex items-center justify-between gap-6">
							<div className="flex-1 text-center">
								<p className="text-3xl font-extrabold text-gray-800">
									{incomeData?.summary?.average_monthly_income
										? new Intl.NumberFormat("es-CO", {
												style: "currency",
												currency: "COP",
												maximumFractionDigits: 0,
											}).format(parseFloat(incomeData.summary.average_monthly_income))
										: "-"}
								</p>
								<p className="text-gray-500 mt-2">Ingreso promedio mensual</p>
								<p className="text-xs text-gray-400 mt-3">
									{incomeData?.summary?.months_count
										? `${incomeData.summary.months_count} meses analizados`
										: "Sin meses analizados"}
								</p>

								{/* Comparative analysis: change vs previous, best/worst months */}
								{pctChange !== null && (
									<div className="mt-3 flex items-center justify-center">
										<div
											className={`inline-flex items-center px-3 py-1 rounded-full ${
												pctChange >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
											}`}
										>
											{pctChange >= 0 ? (
												<ArrowUpwardIcon style={{ fontSize: 16 }} />
											) : (
												<ArrowDownwardIcon style={{ fontSize: 16 }} />
											)}
											<span className="ml-1 text-sm font-semibold">
												{Math.abs(pctChange).toFixed(1)}%
											</span>
											<span className="ml-2 text-xs text-gray-500">vs mes anterior</span>
										</div>
									</div>
								)}

								<div className="mt-2 text-xs text-gray-500 flex justify-center gap-6">
									{bestMonth && (
										<span>
											Mejor: {bestMonth.month_short}{" "}
											{new Intl.NumberFormat("es-CO", {
												style: "currency",
												currency: "COP",
												maximumFractionDigits: 0,
											}).format(parseFloat(bestMonth.income))}
										</span>
									)}
									{worstMonth && (
										<span>
											Peor: {worstMonth.month_short}{" "}
											{new Intl.NumberFormat("es-CO", {
												style: "currency",
												currency: "COP",
												maximumFractionDigits: 0,
											}).format(parseFloat(worstMonth.income))}
										</span>
									)}
								</div>
							</div>
							<div className="w-44 h-full bg-emerald-50 rounded-lg p-3 flex flex-col items-center justify-between shadow-inner overflow-visible">
								<div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm -mt-4">
									<AttachMoneyIcon style={{ color: "#059669" }} />
								</div>
								<div className="w-full flex-1 flex items-center">
									<div className="w-full h-full">
										<Line data={sparklineData} options={sparklineOptions} />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Canines Status */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-xl font-bold text-gray-800">Estado de Matrículas</h3>
					</div>
					<div className="h-[250px] flex items-center justify-center relative">
						<Doughnut
							options={{
								...doughnutOptions,
								cutout: "75%",
								plugins: {
									legend: { position: "bottom", labels: { padding: 30, usePointStyle: true } },
								},
							}}
							data={statusData}
						/>
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
							<p className="text-4xl font-bold text-gray-800 leading-none">
								{planData?.summary &&
								planData.summary.total_active_enrollments +
									planData.summary.total_inactive_enrollments >
									0
									? Math.round(
											(planData.summary.total_active_enrollments /
												(planData.summary.total_active_enrollments +
													planData.summary.total_inactive_enrollments)) *
												100,
										)
									: 0}
								%
							</p>
							<p className="text-xs text-emerald-500 font-bold uppercase mt-1">Activas</p>
						</div>
					</div>
				</div>
			</div>
			{/* Debug panel removed - no DB dump in production UI */}
		</div>
	);
}
