import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PetsIcon from "@mui/icons-material/Pets";
import SchoolIcon from "@mui/icons-material/School";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GroupsIcon from "@mui/icons-material/Groups";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import logoFooter from "../../assets/logo-footer.png";
import landing from "../../assets/landing.png";
import imageRegisterPage from "../../assets/image-RegisterPage.png";
import apiClient from "../../api/axiosConfig";

export const HomePage = () => {
	const navigate = useNavigate();

	const redirectByType = (type: string | null, roleStr?: string | null) => {
		if (type === "client") {
			navigate("/portal-cliente/dashboard", { replace: true });
			return;
		}
		if (type === "internal") {
			const r = (roleStr || "").toUpperCase();
			if (r === "COACH") {
				navigate("/internal-users/registrar-asistencia", { replace: true });
				return;
			}
			navigate("/internal-users/dashboard", { replace: true });
			return;
		}
		navigate("/", { replace: true });
	};

	const handleGoToDashboard = async () => {
		const access = localStorage.getItem("access_token");
		if (!access) {
			navigate("/login");
			return;
		}
		const storedType = localStorage.getItem("user_type");
		const storedRole = localStorage.getItem("user_role");
		if (storedType) {
			redirectByType(storedType, storedRole);
			return;
		}
		try {
			const res = await apiClient.get("/api/user-type/", {
				headers: { Authorization: `Bearer ${access}`, Accept: "application/json" },
				validateStatus: () => true,
			});
			if (res.status >= 200 && res.status < 300) {
				const data = res.data ?? {};
				if (data.user_type) {
					localStorage.setItem("user_type", String(data.user_type));
					if (data.role) localStorage.setItem("user_role", String(data.role));
					if (data.client_id) localStorage.setItem("client_id", String(data.client_id));
					redirectByType(data.user_type, data.role);
					return;
				}
			}
		} catch {
			// fall through to login
		}
		// if we couldn't determine type, ask the user to login
		navigate("/login");
	};

	const handleLoginClick = () => {
		const access = localStorage.getItem("access_token");
		if (access) {
			// if token present, redirect to dashboard
			handleGoToDashboard();
			return;
		}
		navigate("/login");
	};

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
					<div className="flex items-center gap-4">
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
						<button
							onClick={handleGoToDashboard}
							style={{
								backgroundColor: "#111827",
								color: "#ffffff",
								padding: "0.5rem 1rem",
								borderRadius: "0.5rem",
								fontWeight: "700",
								border: "none",
								cursor: "pointer",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0b1220")}
							onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#111827")}
							className="inline-flex items-center gap-2"
						>
							<span className="text-sm font-lekton-bold">IR AL DASHBOARD</span>
						</button>
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

						<div className="flex flex-wrap gap-6">
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
							<button
								onClick={handleLoginClick}
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
								className="font-lekton-bold letter-space-lg"
							>
								<span className="font-lekton-bold letter-space-lg">INICIAR SESIÓN</span>
							</button>
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
			<section className="py-32 bg-gradient-to-br from-amber-50 to-white w-screen">
				<div className="max-w-7xl mx-auto px-6 w-full">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="text-center mb-24"
					>
						<h2 className="text-6xl font-jua letter-space-md mb-6">
							<span className="text-amber-400">RAZONES</span>{" "}
							<span className="text-gray-800">PARA ELEGIRNOS</span>
						</h2>
						<p className="text-xl font-lekton-bold text-gray-600 letter-space-lg max-w-3xl mx-auto">
							Ofrecemos el mejor entrenamiento canino con métodos probados y profesionales
							certificados
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-12">
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
									className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all"
								>
									<div
										className={`${feature.color} w-20 h-20 rounded-full flex items-center justify-center mb-8`}
									>
										<Icon className={`${feature.iconColor} text-4xl`} />
									</div>
									<h3 className="text-2xl font-jua text-gray-800 mb-4 letter-space-md">
										{feature.title}
									</h3>
									<p className="font-lekton-bold text-gray-600 letter-space-lg leading-relaxed text-lg">
										{feature.description}
									</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Parallax Section */}
			<section
				className="py-40 w-screen bg-fixed bg-center bg-cover relative"
				style={{ backgroundImage: `url(${imageRegisterPage})` }}
			>
				<div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
				<div className="relative z-10 max-w-7xl mx-auto px-6 text-center text-white">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
					>
						<h2 className="text-5xl md:text-7xl font-jua mb-8 tracking-wide">
							EXPERIENCIA Y DEDICACION
						</h2>
						<p className="text-xl md:text-2xl font-lekton-bold max-w-4xl mx-auto leading-relaxed text-gray-200">
							"Más de 10 años formando vínculos inquebrantables entre humanos y sus compañeros
							caninos, creando historias de éxito y felicidad."
						</p>
					</motion.div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-32 bg-gradient-to-r from-amber-400 to-amber-500 w-screen">
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
			<footer className="bg-gray-900 text-white pt-16 pb-8 w-screen">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
						{/* Brand Column */}
						<div className="flex flex-col items-center md:items-start">
							<img
								src={logoFooter}
								alt="Logo Raíces Caninas"
								className="h-24 w-auto mb-6"
								style={{ mixBlendMode: "lighten" }}
							/>
							<p className="text-gray-400 text-center md:text-left font-lekton-bold leading-relaxed">
								Transformando la vida de tu mascota con educación positiva y profesionalismo.
							</p>
						</div>

						{/* Contact Column */}
						<div className="flex flex-col items-center md:items-start">
							<h3 className="text-xl font-jua text-amber-400 mb-6 tracking-wide">CONTACTANOS</h3>
							<div className="space-y-4 text-gray-300 font-lekton-bold">
								<div className="flex items-center gap-3">
									<EmailIcon className="text-amber-500" />
									<span>info@raicescaninas.com</span>
								</div>
								<div className="flex items-center gap-3">
									<WhatsAppIcon className="text-amber-500" />
									<span>+57 300 123 4567</span>
								</div>
							</div>
						</div>

						{/* Social Column */}
						<div className="flex flex-col items-center md:items-start">
							<h3 className="text-xl font-jua text-amber-400 mb-6 tracking-wide">SIGUENOS</h3>
							<div className="flex gap-4">
								<a
									href="#"
									className="bg-gray-800 p-3 rounded-full hover:bg-amber-500 hover:text-white transition-all duration-300 group"
								>
									<InstagramIcon className="text-gray-300 group-hover:text-white" />
								</a>
								<a
									href="#"
									className="bg-gray-800 p-3 rounded-full hover:bg-amber-500 hover:text-white transition-all duration-300 group"
								>
									<FacebookIcon className="text-gray-300 group-hover:text-white" />
								</a>
								<a
									href="#"
									className="bg-gray-800 p-3 rounded-full hover:bg-amber-500 hover:text-white transition-all duration-300 group"
								>
									<WhatsAppIcon className="text-gray-300 group-hover:text-white" />
								</a>
							</div>
						</div>
					</div>

					<div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
						<p className="font-lekton-bold text-gray-500 text-sm">
							© 2024 Raíces Caninas. Todos los derechos reservados.
						</p>
						<div className="flex gap-6 text-sm">
							<a
								href="#"
								className="text-gray-500 hover:text-amber-400 transition-colors font-lekton-bold"
							>
								Términos
							</a>
							<a
								href="#"
								className="text-gray-500 hover:text-amber-400 transition-colors font-lekton-bold"
							>
								Privacidad
							</a>
							<a
								href="#"
								className="text-gray-500 hover:text-amber-400 transition-colors font-lekton-bold"
							>
								Cookies
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};
