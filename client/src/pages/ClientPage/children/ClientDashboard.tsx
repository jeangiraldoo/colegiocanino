// client/src/pages/ClientPage/children/ClientDashboard.tsx

import React from "react";
import PageTransition from "../../../components/PageTransition";
import PetsIcon from "@mui/icons-material/Pets";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function ClientDashboard() {
	return (
		<PageTransition>
			<div className="font-montserrat">
				<h1 className="text-2xl font-bold mb-6">Mi Panel de Cliente</h1>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Card para HU-13: Visualización de matrícula */}
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<div className="bg-amber-100 p-3 rounded-full">
								<AssignmentIcon className="text-amber-500" />
							</div>
							<div>
								<h3 className="text-lg font-bold">Estado de Matrícula</h3>
								<p className="text-gray-500 text-sm">Plan Anual Activo</p>
							</div>
						</div>
						<p className="mt-4 text-gray-600">
							Tu plan vence el: **31 de Octubre, 2026**. Incluye servicio de
							transporte completo.
						</p>
						<button className="mt-4 btn-ghost w-full">Ver Detalles</button>
					</div>

					{/* Card para HU-14: Visualización de asistencia */}
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<div className="bg-green-100 p-3 rounded-full">
								<EventAvailableIcon className="text-green-600" />
							</div>
							<div>
								<h3 className="text-lg font-bold">Última Asistencia</h3>
								<p className="text-gray-500 text-sm">Toby - Hoy</p>
							</div>
						</div>
						<p className="mt-4 text-gray-600">
							Llegada: **08:05 AM** (A tiempo). Salida: Aún en el colegio.
						</p>
						<button className="mt-4 btn-ghost w-full">
							Ver Historial de Asistencia
						</button>
					</div>

					{/* Card para HU-11: Modificación de perfil */}
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
						<div className="flex items-center gap-4">
							<div className="bg-blue-100 p-3 rounded-full">
								<AccountCircleIcon className="text-blue-600" />
							</div>
							<div>
								<h3 className="text-lg font-bold">Mi Perfil</h3>
								<p className="text-gray-500 text-sm">
									Mantén tus datos actualizados
								</p>
							</div>
						</div>
						<p className="mt-4 text-gray-600">
							Revisa y actualiza tu información de contacto y contraseña.
						</p>
						<button className="mt-4 btn-ghost w-full">Editar Perfil</button>
					</div>

					{/* Card para HU-12: Registrar nueva matrícula */}
					<div className="bg-amber-400 text-white p-6 rounded-lg shadow-sm border border-gray-100 md:col-span-2 lg:col-span-3">
						<div className="flex items-center gap-4">
							<div className="bg-white/20 p-3 rounded-full">
								<PetsIcon />
							</div>
							<div>
								<h3 className="text-lg font-bold">
									¿Nuevo miembro en la familia?
								</h3>
								<p className="text-white/80 text-sm">
									Inscribe a tu canino en nuestros planes.
								</p>
							</div>
						</div>
						<p className="mt-4">
							Ofrecemos planes mensuales, bimestrales y anuales con opción de
							transporte.
						</p>
						<button className="mt-4 bg-white text-amber-500 font-bold py-2 px-4 rounded-lg w-full">
							Matricular un Nuevo Canino
						</button>
					</div>
				</div>
			</div>
		</PageTransition>
	);
}
