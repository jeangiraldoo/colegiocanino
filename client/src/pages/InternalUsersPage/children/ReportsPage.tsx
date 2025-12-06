// client/src/pages/InternalUsersPage/children/ReportsPage.tsx

import React from "react";
import { Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AddchartIcon from "@mui/icons-material/Addchart";

// This component acts as a hub for all available reports.
export default function ReportsPage() {
	const reports = [
		{
			title: "Reporte de Matrículas por Plan",
			description: "Analiza la popularidad de razas por cada tipo de plan de matrícula.",
			path: "matriculas-por-plan",
			icon: AssessmentIcon,
		},
		{
			title: "Próximo Reporte",
			description: "Este es un espacio reservado para futuras visualizaciones de datos.",
			path: "#",
			icon: AddchartIcon,
			disabled: true,
		},
	];

	return (
		<PageTransition>
			<div className="font-montserrat">
				<h1 className="text-2xl font-bold mb-6">Dashboard de Reportes</h1>
				<p className="text-gray-500 mb-8">
					Selecciona un reporte para visualizar los datos y analíticas del sistema.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{reports.map((report) => {
						const Icon = report.icon;
						const cardContent = (
							<div
								className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full ${
									report.disabled
										? "opacity-50 cursor-not-allowed"
										: "hover:shadow-lg hover:-translate-y-1 transition-transform"
								}`}
							>
								<div className="flex items-center gap-4 mb-4">
									<div className="bg-amber-100 p-3 rounded-full">
										<Icon className="text-amber-500" />
									</div>
									<h2 className="text-lg font-bold text-gray-800">{report.title}</h2>
								</div>
								<p className="text-gray-600 text-sm flex-grow">{report.description}</p>
							</div>
						);

						return report.disabled ? (
							<div key={report.title}>{cardContent}</div>
						) : (
							<Link to={report.path} key={report.title}>
								{cardContent}
							</Link>
						);
					})}
				</div>
			</div>
		</PageTransition>
	);
}
