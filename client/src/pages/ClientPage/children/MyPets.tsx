import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import apiClient from "../../../api/axiosConfig"; // Use axios
import PetsIcon from "@mui/icons-material/Pets";

// Define types strictly
type Canine = {
	id: number;
	name: string;
	breed: string;
	photo?: string | null; // Handle photos if available
};

type ProfileResponse = {
	canines: Canine[];
};

export default function MyPets() {
	const [pets, setPets] = useState<Canine[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadPets = async () => {
			setLoading(true);
			try {
				// Fetch data from real API
				// Based on backend code: profile_view returns { user: ..., client: ..., canines: [...] }
				const response = await apiClient.get<ProfileResponse>("/api/profile/");

				// Ensure we handle the array correctly
				if (response.data && Array.isArray(response.data.canines)) {
					setPets(response.data.canines);
				} else {
					setPets([]);
				}
			} catch (err) {
				console.error("Error fetching pets:", err);
				setError("No se pudieron cargar tus mascotas.");
			} finally {
				setLoading(false);
			}
		};
		void loadPets();
	}, []);

	return (
		<PageTransition>
			<div className="font-montserrat">
				<h1 className="text-2xl font-bold mb-6">Mis Mascotas</h1>

				{loading && <p className="text-center py-8">Cargando tus mascotas...</p>}

				{error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>}

				{!loading && !error && pets.length === 0 && (
					<div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
						<PetsIcon className="text-gray-300 text-6xl mb-4" />
						<p className="text-gray-500">Aún no tienes mascotas registradas.</p>
						<Link to="/portal-cliente/matricular-canino" className="mt-4 inline-block btn-primary">
							Matricular mascota
						</Link>
					</div>
				)}

				{!loading && pets.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{pets.map((pet) => (
							<Link
								to={`/portal-cliente/mis-mascotas/${pet.id}`}
								key={pet.id}
								className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-transform flex flex-col items-center text-center"
							>
								<div className="bg-amber-100 p-4 rounded-full mb-4 w-20 h-20 flex items-center justify-center overflow-hidden">
									{pet.photo ? (
										<img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
									) : (
										<PetsIcon className="text-amber-500 text-3xl" />
									)}
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
									<p className="text-gray-500 text-sm mt-1">{pet.breed}</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</PageTransition>
	);
}
