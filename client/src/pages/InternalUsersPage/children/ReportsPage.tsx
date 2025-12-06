// client/src/pages/InternalUsersPage/children/ReportsPage.tsx

import React, { useState, useEffect } from "react";
import { Bar, Doughnut, Pie, PolarArea } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	RadialLinearScale,
	PointElement,
	LineElement,
	type ChartOptions,
	type TooltipItem,
} from "chart.js";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import AssessmentIcon from "@mui/icons-material/Assessment";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	RadialLinearScale,
	PointElement,
	LineElement,
);

interface BreedStat {
	breed: string;
	count: number;
}
type TimeRangeReport = Record<string, BreedStat[]>;
type ReportData = Record<string, TimeRangeReport>;
type ChartType = "bar" | "pie" | "doughnut" | "polarArea" | "line" | "boxplot";

const TIME_RANGE_LABELS: Record<string, string> = {
	last_month: "Últimos 30 días",
	last_3_months: "Últimos 3 meses",
	last_6_months: "Últimos 6 meses",
	last_12_months: "Últimos 12 meses",
};
const CHART_COLORS = [
	"rgba(251, 191, 36, 0.7)",
	"rgba(59, 130, 246, 0.7)",
	"rgba(239, 68, 68, 0.7)",
	"rgba(16, 185, 129, 0.7)",
	"rgba(139, 92, 246, 0.7)",
];

export default function ReportsPage() {
	const [reportData, setReportData] = useState<ReportData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedTimeRange, setSelectedTimeRange] = useState<string>("last_month");
	const [viewMode, setViewMode] = useState<"single" | "all">("single");
	const [singleChartType, setSingleChartType] = useState<ChartType>("bar");

	useEffect(() => {
		const fetchReport = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await apiClient.get<ReportData>(
					"/api/reports/enrollments-by-plan/?limit=5",
				);
				setReportData(response.data);
			} catch (_err) {
				console.error("Error fetching enrollment report:", _err);
				setError("No se pudo cargar el reporte. Intente de nuevo.");
			} finally {
				setLoading(false);
			}
		};
		void fetchReport();
	}, []);

	const renderChart = (planName: string, data: TimeRangeReport, chartType: ChartType) => {
		const timeRangeData = data[selectedTimeRange] || [];

		const chartData = {
			labels: timeRangeData.map((d) => d.breed),
			datasets: [
				{
					label: "Matrículas",
					data: timeRangeData.map((d) => d.count),
					backgroundColor: timeRangeData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
					borderColor: timeRangeData.map((_, i) =>
						CHART_COLORS[i % CHART_COLORS.length].replace("0.7", "1"),
					),
					borderWidth: 1,
				},
			],
		};

		// FIX: Specify the generic type for ChartOptions to remove 'any'
		const chartOptions: ChartOptions<ChartType> = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: true, position: "top" as const },
				title: { display: true, text: `Top 5 Razas - ${planName}` },
				tooltip: {
					callbacks: {
						// FIX: Use TooltipItem with a specific chart type generic
						label: (context: TooltipItem<"pie" | "doughnut" | "polarArea" | "bar">) => {
							const label = context.label || "";
							const value = context.raw as number;
							if (chartType === "pie" || chartType === "doughnut") {
								const total = context.chart.getDatasetMeta(0).total || 1;
								const percentage = ((value / total) * 100).toFixed(1);
								return `${label}: ${value} (${percentage}%)`;
							}
							return `${label}: ${value}`;
						},
					},
				},
			},
			scales: chartType === "bar" ? { y: { beginAtZero: true, ticks: { stepSize: 1 } } } : {},
		};

		const backendNeededPlaceholder = (chartName: string) => (
			<div className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-50 rounded-lg p-4">
				<div>
					<p className="font-bold">{chartName}</p>
					<p className="text-sm">
						Datos no disponibles. Se requiere una actualización del backend.
					</p>
				</div>
			</div>
		);

		if (timeRangeData.length === 0) {
			return (
				<div className="flex items-center justify-center h-full text-gray-500">
					No hay datos para este período.
				</div>
			);
		}

		switch (chartType) {
			case "pie":
				return <Pie options={chartOptions} data={chartData} />;
			case "doughnut":
				return <Doughnut options={chartOptions} data={chartData} />;
			case "polarArea":
				return <PolarArea options={chartOptions} data={chartData} />;
			case "line":
				return backendNeededPlaceholder("Gráfico de Líneas (Evolución)");
			case "boxplot":
				return backendNeededPlaceholder("Diagrama de Caja (Edades)");
			default:
				return <Bar options={chartOptions} data={chartData} />;
		}
	};

	const renderReportForPlan = (planName: string, data: TimeRangeReport) => {
		const chartTypes: ChartType[] = ["bar", "pie", "doughnut", "polarArea", "line", "boxplot"];

		return (
			<div key={planName} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
				<h3 className="text-xl font-bold text-gray-800 mb-4">{planName}</h3>
				{viewMode === "single" ? (
					<div className="h-80">
						<AnimatePresence mode="wait">
							<motion.div
								key={singleChartType}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.25 }}
								className="h-full w-full"
							>
								{renderChart(planName, data, singleChartType)}
							</motion.div>
						</AnimatePresence>
					</div>
				) : (
					<div className="space-y-12">
						{chartTypes.map((type) => (
							<div key={type}>
								<h4 className="font-bold text-center mb-2 capitalize text-gray-600">
									{type === "bar"
										? "Barras"
										: type === "pie"
											? "Torta"
											: type === "doughnut"
												? "Dona"
												: type === "line"
													? "Línea"
													: type === "boxplot"
														? "Caja"
														: "Polar"}
								</h4>
								<div className="h-80">{renderChart(planName, data, type)}</div>
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	return (
		<PageTransition>
			<div className="font-montserrat">
				<div className="flex items-center gap-4 mb-6">
					<AssessmentIcon className="text-3xl text-amber-500" />
					<div>
						<h1 className="text-2xl font-bold">Reporte de Matrículas por Plan</h1>
						<p className="text-gray-500">
							Popularidad de razas por tipo de plan en diferentes períodos.
						</p>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-4">
					<div>
						<span className="font-semibold mr-4">Período:</span>
						{Object.entries(TIME_RANGE_LABELS).map(([key, label]) => (
							<button
								key={key}
								onClick={() => setSelectedTimeRange(key)}
								className={`mr-2 ${selectedTimeRange === key ? "btn-primary btn-sm" : "btn-ghost btn-sm"}`}
							>
								{label}
							</button>
						))}
					</div>
					<div className="flex items-center gap-2">
						<span className="font-semibold mr-2">Tipo de Gráfico:</span>
						{(["bar", "pie", "doughnut", "polarArea", "line", "boxplot"] as ChartType[]).map(
							(type) => (
								<button
									key={type}
									onClick={() => {
										setSingleChartType(type);
										setViewMode("single");
									}}
									className={`mr-2 capitalize ${viewMode === "single" && singleChartType === type ? "btn-primary btn-sm" : "btn-ghost btn-sm"}`}
								>
									{type === "bar"
										? "Barras"
										: type === "pie"
											? "Torta"
											: type === "doughnut"
												? "Dona"
												: type === "line"
													? "Línea"
													: type === "boxplot"
														? "Caja"
														: "Polar"}
								</button>
							),
						)}
						<button
							onClick={() => setViewMode("all")}
							className={viewMode === "all" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
						>
							Ver Todos
						</button>
					</div>
				</div>

				{loading && <p className="text-center py-12">Generando reporte...</p>}
				{error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>}

				{!loading && reportData && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{Object.keys(reportData).length > 0 ? (
							Object.entries(reportData).map(([planName, data]) =>
								renderReportForPlan(planName, data),
							)
						) : (
							<p className="text-center text-gray-500 lg:col-span-2 py-12">
								No hay datos de matrículas para generar reportes.
							</p>
						)}
					</div>
				)}
			</div>
		</PageTransition>
	);
}
