// client/src/pages/ClientPage/children/MyPets.tsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageTransition from "../../../components/PageTransition";
import PetsIcon from "@mui/icons-material/Pets";

// Simulación de los tipos de datos
type Canine = {
	id: number;
	name: string;
	breed: string;
};

// Simulación de una llamada a la API
const fetchMyPets = async (): Promise<Canine[]> => {
	await new Promise((res) => setTimeout(res, 500)); // Simular delay
	return [
		{ id: 11, name: "Toby", breed: "Golden Retriever" },
		{ id: 12, name: "Luna", breed: "Border Collie" },
	];
};

export default function MyPets() {
	const [pets, setPets] = useState<Canine[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadPets = async () => {
			try {
				const myPets = await fetchMyPets();
				setPets(myPets);
			} catch (error) {
				console.error("Error al cargar las mascotas:", error);
			} finally {
				setLoading(false);
			}
		};
		loadPets();
	}, []);

	return (
		<PageTransition>
			<div className="font-montserrat">
				<h1 className="text-2xl font-bold mb-6">Mis Mascotas</h1>

				{loading && <p>Cargando tus mascotas...</p>}

				{!loading && pets.length === 0 && <p>Aún no tienes mascotas registradas.</p>}

				{!loading && pets.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{pets.map((pet) => (
							<Link
								to={`/portal-cliente/mis-mascotas/${pet.id}`}
								key={pet.id}
								className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-transform"
							>
								<div className="flex items-center gap-4">
									<div className="bg-amber-100 p-3 rounded-full">
										<PetsIcon className="text-amber-500" />
									</div>
									<div>
										<h3 className="text-lg font-bold">{pet.name}</h3>
										<p className="text-gray-500 text-sm">{pet.breed}</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</PageTransition>
	);
}
