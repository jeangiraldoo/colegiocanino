import React, { useEffect, useState } from "react";
import apiClient from "../../../api/axiosConfig";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// Type definition based on EnrollmentSerializer (server/api/serializers.py)
type Enrollment = {
	id: number;
	plan_name: string; // Read-only field from serializer
	transport_service_name: string; // Read-only field from serializer
	enrollment_date: string;
	expiration_date: string;
	status: boolean;
};

type Props = {
	canineId: string;
};

/**
 * Component to display the active enrollment details of a canine.
 * Associated with HU-13: Visualization of canine enrollment plan.
 */
export default function EnrollmentDetails({ canineId }: Props) {
	const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchEnrollment = async () => {
			try {
				setLoading(true);
				// SCRUM-74 Integration: Fetch enrollments filtering by canine and active status.
				// The backend ViewSet allows filtering by 'canine_id' and 'status'.
				const response = await apiClient.get<Enrollment[]>(
					`/api/enrollments/?canine_id=${canineId}&status=true`,
				);

				// Logic: We assume the canine has one active enrollment. We take the first one.
				if (response.data && response.data.length > 0) {
					setEnrollment(response.data[0]);
				} else {
					setEnrollment(null);
				}
				setError(null);
			} catch (_err) {
				// Using _err to comply with no-unused-vars lint rule
				console.error("Error fetching enrollment:", _err);
				setError("Could not load enrollment information.");
			} finally {
				setLoading(false);
			}
		};

		if (canineId) {
			void fetchEnrollment();
		}
	}, [canineId]);

	// Skeleton loading state for better UX
	if (loading) {
		return (
			<div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm animate-pulse mb-6">
				<div className="flex items-center gap-4 mb-4">
					<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
					<div className="h-4 bg-gray-200 rounded w-1/3"></div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="h-4 bg-gray-200 rounded w-full"></div>
					<div className="h-4 bg-gray-200 rounded w-full"></div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-montserrat">
				{error}
			</div>
		);
	}

	// Empty state (No active plan)
	if (!enrollment) {
		return (
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6 font-montserrat">
				<div className="flex items-center gap-3 mb-2">
					<CardMembershipIcon className="text-gray-400" />
					<h3 className="text-lg font-bold text-gray-700">Sin Matrícula Activa</h3>
				</div>
				<p className="text-gray-500 text-sm">Este canino no tiene un plan activo actualmente.</p>
			</div>
		);
	}

	// Success state: Show enrollment details
	return (
		<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6 font-montserrat">
			<div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
				<div className="bg-amber-100 p-2 rounded-full">
					<CardMembershipIcon className="text-amber-500" />
				</div>
				<div>
					<h2 className="text-xl font-bold text-gray-800">Plan Actual</h2>
					<p className="text-sm text-gray-500">Detalles de la matrícula vigente</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
				{/* Plan Name */}
				<div className="flex flex-col">
					<span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</span>
					<span className="text-lg font-bold text-amber-600">{enrollment.plan_name}</span>
				</div>

				{/* Transport Service */}
				<div className="flex items-start gap-3">
					<DirectionsBusIcon className="text-gray-400 mt-1" />
					<div>
						<span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
							Servicio de Transporte
						</span>
						<span className="font-semibold text-gray-700">{enrollment.transport_service_name}</span>
					</div>
				</div>

				{/* Start Date */}
				<div className="flex items-start gap-3">
					<CalendarTodayIcon className="text-gray-400 mt-1" />
					<div>
						<span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
							Fecha de Inicio
						</span>
						<span className="font-semibold text-gray-700">{enrollment.enrollment_date}</span>
					</div>
				</div>

				{/* Expiration Date */}
				<div className="flex items-start gap-3">
					<AccessTimeIcon className="text-red-400 mt-1" />
					<div>
						<span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
							Vencimiento
						</span>
						<span className="font-semibold text-gray-800">{enrollment.expiration_date}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
