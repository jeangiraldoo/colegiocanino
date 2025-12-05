// client/src/pages/InternalUsersPage/children/ReportsPage.tsx

import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Type Definitions based on Backend API response ---
interface BreedStat {
	breed: string;
	count: number;
}
type TimeRangeReport = Record<string, BreedStat[]>; // e.g., { "last_month": [...] }
type ReportData = Record<string, TimeRangeReport>; // e.g., { "Plan Anual": { ... } }

const TIME_RANGE_LABELS: Record<string, string> = {
	last_month: "Últimos 30 días",
	last_3_months: "Últimos 3 meses",
	last_6_months: "Últimos 6 meses",
	last_12_months: "Últimos 12 meses",
};

export default function ReportsPage() {
	const [reportData, setReportData] = useState<ReportData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedTimeRange, setSelectedTimeRange] = useState<string>("last_month");

	useEffect(() => {
		const fetchReport = async () => {
			setLoading(true);
			setError(null);
			try {
				// SCRUM-80: Connect to the new reports endpoint
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

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			title: { display: true, text: "Top 5 Razas por Plan" },
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: { stepSize: 1 },
			},
		},
	};

	const renderReportForPlan = (planName: string, data: TimeRangeReport) => {
		const timeRangeData = data[selectedTimeRange] || [];

		const chartData = {
			labels: timeRangeData.map((d) => d.breed),
			datasets: [
				{
					label: "Matrículas",
					data: timeRangeData.map((d) => d.count),
					backgroundColor: "rgba(251, 191, 36, 0.6)",
					borderColor: "rgba(245, 158, 11, 1)",
					borderWidth: 1,
				},
			],
		};

		return (
			<div key={planName} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
				<h3 className="text-xl font-bold text-gray-800 mb-4">{planName}</h3>
				<div className="h-64">
					{timeRangeData.length > 0 ? (
						<Bar options={chartOptions} data={chartData} />
					) : (
						<p className="text-center text-gray-500 pt-16">No hay datos para este período.</p>
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

				<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
					<p className="font-semibold">Seleccionar Período:</p>
					<div className="flex gap-2">
						{Object.entries(TIME_RANGE_LABELS).map(([key, label]) => (
							<button
								key={key}
								onClick={() => setSelectedTimeRange(key)}
								className={selectedTimeRange === key ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				{loading && <p className="text-center py-12">Generando reporte...</p>}
				{error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>}

				{!loading && reportData && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{Object.entries(reportData).map(([planName, data]) =>
							renderReportForPlan(planName, data),
						)}
					</div>
				)}
			</div>
		</PageTransition>
	);
}
