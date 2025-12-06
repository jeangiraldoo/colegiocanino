// client/src/pages/InternalUsersPage/children/ReportsPage.tsx

import React, { useState, useEffect } from "react";
import { Bar, Doughnut, Pie, PolarArea } from "react-chartjs-2";
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
} from "chart.js";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Register all necessary Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	RadialLinearScale,
);

// --- Type Definitions based on Backend API response ---
interface BreedStat {
	breed: string;
	count: number;
}
type TimeRangeReport = Record<string, BreedStat[]>; // e.g., { "last_month": [...] }
type ReportData = Record<string, TimeRangeReport>; // e.g., { "Plan Anual": { ... } }
type ChartType = "bar" | "pie" | "doughnut" | "polarArea";

const TIME_RANGE_LABELS: Record<string, string> = {
	last_month: "Últimos 30 días",
	last_3_months: "Últimos 3 meses",
	last_6_months: "Últimos 6 meses",
	last_12_months: "Últimos 12 meses",
};

// Color palette for charts
const CHART_COLORS = [
	"rgba(251, 191, 36, 0.7)", // Amber
	"rgba(59, 130, 246, 0.7)", // Blue
	"rgba(239, 68, 68, 0.7)", // Red
	"rgba(16, 185, 129, 0.7)", // Green
	"rgba(139, 92, 246, 0.7)", // Violet
];

export default function ReportsPage() {
	const [reportData, setReportData] = useState<ReportData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedTimeRange, setSelectedTimeRange] = useState<string>("last_month");
	const [chartType, setChartType] = useState<ChartType>("bar");

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

	const renderReportForPlan = (planName: string, data: TimeRangeReport) => {
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

		const chartOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: true, // Enable legend for interactivity
					position: "top" as const,
				},
				title: { display: true, text: `Top 5 Razas - ${planName}` },
			},
			scales:
				chartType === "bar" ? { y: { beginAtZero: true, ticks: { stepSize: 1 } } } : undefined,
		};

		const renderChart = () => {
			switch (chartType) {
				case "pie":
					return <Pie options={chartOptions} data={chartData} />;
				case "doughnut":
					return <Doughnut options={chartOptions} data={chartData} />;
				case "polarArea":
					return <PolarArea options={chartOptions} data={chartData} />;
				case "bar":
				default:
					return <Bar options={chartOptions} data={chartData} />;
			}
		};

		return (
			<div key={planName} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
				<div className="h-80">
					{timeRangeData.length > 0 ? (
						renderChart()
					) : (
						<p className="text-center text-gray-500 pt-24">No hay datos para este período.</p>
					)}
				</div>
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
					<div>
						<span className="font-semibold mr-4">Tipo de Gráfico:</span>
						{(["bar", "pie", "doughnut", "polarArea"] as ChartType[]).map((type) => (
							<button
								key={type}
								onClick={() => setChartType(type)}
								className={`mr-2 capitalize ${chartType === type ? "btn-primary btn-sm" : "btn-ghost btn-sm"}`}
							>
								{type === "bar"
									? "Barras"
									: type === "pie"
										? "Torta"
										: type === "doughnut"
											? "Dona"
											: "Polar"}
							</button>
						))}
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
