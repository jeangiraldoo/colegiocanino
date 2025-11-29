import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PetsIcon from "@mui/icons-material/Pets";
import SchoolIcon from "@mui/icons-material/School";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GroupsIcon from "@mui/icons-material/Groups";
import logoFooter from "../../assets/logo-footer.png";
import landing from "../../assets/landing.png";

export const HomePage = () => {
	return (
		<div className="min-h-screen w-screen bg-white font-montserrat overflow-x-hidden">
			{/* Navbar */}
			<nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm w-screen">
				<div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
					<img
						src={logoFooter}
						alt="Logo Raíces Caninas"
						className="h-16 w-auto"
						style={{ mixBlendMode: "multiply" }}
					/>
					<div className="flex items-center gap-6">
						<Link
							to="/login"
							style={{
								color: "#1f2937",
								textDecoration: "none",
								transition: "color 0.3s",
								fontSize: "1rem",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
							onMouseLeave={(e) => (e.currentTarget.style.color = "#1f2937")}
							className="font-lekton-bold letter-space-lg"
						>
							INICIAR SESIÓN
						</Link>
						<Link
							to="/register"
							style={{
								display: "inline-block",
								backgroundColor: "#fbbf24",
								color: "#ffffff",
								padding: "0.75rem 2rem",
								borderRadius: "0.5rem",
								fontWeight: "bold",
								textDecoration: "none",
								transition: "all 0.3s ease",
								fontSize: "1rem",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#f59e0b";
								e.currentTarget.style.transform = "translateY(-1px)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#fbbf24";
								e.currentTarget.style.transform = "translateY(0)";
							}}
							className="letter-space-lg font-lekton-bold"
						>
							REGISTRARSE
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 w-screen">
				<div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.8 }}
					>
						<div className="mb-8">
							<h1 className="text-5xl md:text-7xl font-jua letter-space-md leading-tight">
								<span className="text-gray-800">ENTRENA A TU</span>
								<br />
								<span className="text-amber-400 text-6xl md:text-8xl">MEJOR AMIGO</span>
								<br />
								<span className="text-gray-600 text-4xl md:text-5xl">con profesionales</span>
							</h1>
						</div>

						<p className="text-xl md:text-2xl font-lekton-bold text-gray-700 mb-8 letter-space-lg leading-relaxed">
							Donde tu mejor amigo aprende jugando. Entrenamiento profesional con amor y dedicación.
						</p>

						<div className="flex flex-wrap gap-4">
							<Link
								to="/register"
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: "0.5rem",
									backgroundColor: "#fbbf24",
									color: "#ffffff",
									padding: "1rem 2rem",
									borderRadius: "0.5rem",
									fontWeight: "bold",
									textDecoration: "none",
									transition: "all 0.3s ease",
									fontSize: "1rem",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#f59e0b";
									e.currentTarget.style.transform = "translateY(-2px)";
									e.currentTarget.style.boxShadow = "0 10px 25px rgba(251, 191, 36, 0.3)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "#fbbf24";
									e.currentTarget.style.transform = "translateY(0)";
									e.currentTarget.style.boxShadow = "none";
								}}
							>
								<span className="font-lekton-bold letter-space-lg">COMIENZA AHORA</span>
								<ArrowForwardIcon />
							</Link>
							<Link
								to="/login"
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: "0.5rem",
									backgroundColor: "transparent",
									color: "#1f2937",
									padding: "1rem 2rem",
									border: "2px solid #1f2937",
									borderRadius: "0.5rem",
									fontWeight: "bold",
									textDecoration: "none",
									transition: "all 0.3s ease",
									fontSize: "1rem",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#1f2937";
									e.currentTarget.style.color = "#ffffff";
									e.currentTarget.style.transform = "translateY(-2px)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "transparent";
									e.currentTarget.style.color = "#1f2937";
									e.currentTarget.style.transform = "translateY(0)";
								}}
							>
								<span className="font-lekton-bold letter-space-lg">INICIAR SESIÓN</span>
							</Link>
						</div>

						<div className="mt-10 flex items-center gap-8">
							<div className="text-center">
								<div className="text-4xl font-jua text-amber-400">12m+</div>
								<div className="text-sm font-lekton-bold text-gray-600 letter-space-lg">
									Clientes Felices
								</div>
							</div>
							<div className="text-center">
								<div className="text-4xl font-jua text-amber-400">500+</div>
								<div className="text-sm font-lekton-bold text-gray-600 letter-space-lg">
									Perros Entrenados
								</div>
							</div>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="relative"
					>
						<div className="relative rounded-3xl overflow-hidden shadow-2xl">
							<img
								src={landing}
								alt="Perro entrenado feliz"
								className="w-full h-auto object-cover"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-amber-400/30 to-transparent"></div>
						</div>

						{/* Floating Cards */}
						<motion.div
							animate={{ y: [0, -10, 0] }}
							transition={{ duration: 3, repeat: Infinity }}
							className="absolute -left-6 top-20 bg-white rounded-2xl shadow-xl p-4 max-w-[180px]"
						>
							<div className="flex items-center gap-3">
								<div className="bg-amber-100 p-3 rounded-full">
									<StarIcon className="text-amber-400" />
								</div>
								<div>
									<div className="font-jua text-2xl text-gray-800">4.9/5</div>
									<div className="text-xs font-lekton-bold text-gray-600">Calificación</div>
								</div>
							</div>
						</motion.div>

						<motion.div
							animate={{ y: [0, 10, 0] }}
							transition={{ duration: 3, repeat: Infinity, delay: 1 }}
							className="absolute -right-6 bottom-20 bg-white rounded-2xl shadow-xl p-4 max-w-[180px]"
						>
							<div className="flex items-center gap-3">
								<div className="bg-green-100 p-3 rounded-full">
									<FavoriteIcon className="text-green-500" />
								</div>
								<div>
									<div className="font-jua text-2xl text-gray-800">100%</div>
									<div className="text-xs font-lekton-bold text-gray-600">Satisfacción</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-gradient-to-br from-amber-50 to-white w-screen">
				<div className="max-w-7xl mx-auto px-6 w-full">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-5xl font-jua letter-space-md mb-4">
							<span className="text-amber-400">RAZONES</span>{" "}
							<span className="text-gray-800">PARA ELEGIRNOS</span>
						</h2>
						<p className="text-lg font-lekton-bold text-gray-600 letter-space-lg max-w-2xl mx-auto">
							Ofrecemos el mejor entrenamiento canino con métodos probados y profesionales
							certificados
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								icon: SchoolIcon,
								title: "Entrenamiento profesional",
								description:
									"Instructores certificados con años de experiencia en comportamiento canino",
								color: "bg-blue-100",
								iconColor: "text-blue-500",
							},
							{
								icon: FavoriteIcon,
								title: "Amor y cuidado",
								description: "Cada perro recibe atención personalizada y un trato lleno de cariño",
								color: "bg-pink-100",
								iconColor: "text-pink-500",
							},
							{
								icon: GroupsIcon,
								title: "Clases grupales",
								description:
									"Socialización efectiva con otros perros en un ambiente controlado y seguro",
								color: "bg-green-100",
								iconColor: "text-green-500",
							},
						].map((feature, idx) => {
							const Icon = feature.icon;
							return (
								<motion.div
									key={idx}
									initial={{ opacity: 0, y: 30 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: idx * 0.1 }}
									viewport={{ once: true }}
									whileHover={{ y: -10 }}
									className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all"
								>
									<div
										className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mb-6`}
									>
										<Icon className={`${feature.iconColor} text-3xl`} />
									</div>
									<h3 className="text-2xl font-jua text-gray-800 mb-4 letter-space-md">
										{feature.title}
									</h3>
									<p className="font-lekton-bold text-gray-600 letter-space-lg leading-relaxed">
										{feature.description}
									</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 bg-gradient-to-r from-amber-400 to-amber-500 w-screen">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					whileInView={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6 }}
					viewport={{ once: true }}
					className="max-w-4xl mx-auto px-6 text-center"
				>
					<PetsIcon className="text-white text-6xl mb-6 mx-auto" />
					<h2 className="text-5xl font-jua text-white mb-6 letter-space-md">
						¿LISTO PARA COMENZAR?
					</h2>
					<p className="text-xl font-lekton-bold text-white/90 mb-8 letter-space-lg">
						Únete a nuestra familia y dale a tu perro la mejor educación
					</p>
					<Link
						to="/register"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "0.5rem",
							backgroundColor: "#ffffff",
							color: "#f59e0b",
							padding: "1rem 2.5rem",
							borderRadius: "0.5rem",
							fontWeight: "bold",
							textDecoration: "none",
							boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
							transition: "all 0.3s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#f3f4f6";
							e.currentTarget.style.transform = "translateY(-2px)";
							e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "#ffffff";
							e.currentTarget.style.transform = "translateY(0)";
							e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
						}}
					>
						<span className="font-jua letter-space-lg">REGISTRARSE AHORA</span>
						<ArrowForwardIcon />
					</Link>
				</motion.div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12 w-screen">
				<div className="max-w-7xl mx-auto px-10 text-center">
					<img
						src={logoFooter}
						alt="Logo Raíces Caninas"
						className="h-20 w-auto mx-auto mb-6"
						style={{ mixBlendMode: "lighten" }}
					/>
					<p className="font-lekton-bold letter-space-lg text-gray-400 mb-4">
						© 2024 Raíces Caninas. Todos los derechos reservados.
					</p>
					<div className="flex justify-center gap-6 text-sm">
						<a
							href="#"
							style={{ color: "#9ca3af", textDecoration: "none", transition: "color 0.3s" }}
							onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
							onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
							className="font-lekton-bold"
						>
							Términos de Servicio
						</a>
						<a
							href="#"
							style={{ color: "#9ca3af", textDecoration: "none", transition: "color 0.3s" }}
							onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
							onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
							className="font-lekton-bold"
						>
							Política de Privacidad
						</a>
						<a
							href="#"
							style={{ color: "#9ca3af", textDecoration: "none", transition: "color 0.3s" }}
							onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
							onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
							className="font-lekton-bold"
						>
							Contacto
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
};
