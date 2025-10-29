// client/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { HomePage } from "./pages/HomePage/HomePage"; // Importa la página de inicio
import "./style.css";

function App() {
	return (
		<Router>
			<Routes>
				{/* Ruta para la página de inicio de sesión */}
				<Route path="/login" element={<LoginPage />} />

				{/* Ruta para la página principal (después del login) */}
				<Route path="/" element={<HomePage />} />

				{/* Puedes añadir más rutas aquí en el futuro */}
			</Routes>
		</Router>
	);
}

export default App;
