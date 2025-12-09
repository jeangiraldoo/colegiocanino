import React, { useState } from "react";
import {
	Modal,
	Box,
	Typography,
	TextField,
	InputAdornment,
	Button,
	CircularProgress,
	Alert,
	IconButton,
	Fade,
	Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import apiClient from "../api/axiosConfig";
import axios from "axios";

const style = {
	position: "absolute" as const,
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 370,
	bgcolor: "var(--panel-bg)",
	borderRadius: 4,
	boxShadow: 24,
	p: 4,
	transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
	border: "2px solid var(--amber-400)",
};

type ForgotPasswordModalProps = {
	open: boolean;
	onClose: () => void;
};

const ForgotPasswordModal = ({ open, onClose }: ForgotPasswordModalProps) => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [debug, setDebug] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		if (!email || !email.includes("@")) {
			setError("Ingresa un correo válido.");
			return;
		}
		setLoading(true);
		try {
			const res = await apiClient.post(
				"/api/auth/password_reset/",
				{ email },
				{ headers: { "Content-Type": "application/json" }, validateStatus: () => true },
			);
			if (res.status >= 200 && res.status < 300) {
				setSuccess(
					"Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.",
				);
			} else {
				let msg = res.data?.detail || "No se pudo procesar la solicitud.";
				msg += ` (status: ${res.status})`;
				if (res.data && typeof res.data === "object") {
					msg += `\nDebug: ${JSON.stringify(res.data)}`;
				}
				setError(msg);
			}
		} catch (error) {
			setLoading(false);
			let errorMsg = "Error desconocido";
			let debugInfo = "";
			if (axios.isAxiosError(error)) {
				if (error.response) {
					errorMsg = error.response.data?.detail || error.response.statusText || errorMsg;
					debugInfo = `Status: ${error.response.status}\n${JSON.stringify(error.response.data)}`;
				} else if (error.request) {
					errorMsg = "No se recibió respuesta del servidor.";
				} else {
					errorMsg = error.message;
				}
			} else if (error instanceof Error) {
				errorMsg = error.message;
			}
			setError(errorMsg);
			setDebug(debugInfo || JSON.stringify(error));
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setEmail("");
		setError("");
		setSuccess("");
		setDebug("");
		onClose();
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			closeAfterTransition
			BackdropProps={{
				sx: { backdropFilter: "blur(6px)", backgroundColor: "rgba(15,23,33,0.35)" },
			}}
		>
			<Fade in={open} timeout={400}>
				<Box className="font-jua" sx={{ ...style }}>
					{/* subtle decorative header strip */}
					<Box
						sx={{
							position: "absolute",
							top: -12,
							left: 28,
							right: 28,
							height: 20,
							borderRadius: 8,
							background: "linear-gradient(90deg, var(--amber-400) 0%, var(--amber-500) 100%)",
							opacity: 0.95,
						}}
					/>
					<Slide direction="down" in={open} mountOnEnter unmountOnExit timeout={400}>
						<Box>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 2,
								}}
							>
								<Typography
									className="font-jua"
									variant="h6"
									fontWeight={700}
									sx={{ letterSpacing: 1, color: "var(--amber-500)", fontFamily: "inherit" }}
								>
									Restablecer contraseña
								</Typography>
								<IconButton onClick={handleClose} size="small" sx={{ color: "var(--amber-500)" }}>
									<CloseIcon />
								</IconButton>
							</Box>

							<form
								onSubmit={handleSubmit}
								style={{ display: "flex", flexDirection: "column", gap: 18 }}
							>
								<TextField
									label="Correo electrónico"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									fullWidth
									variant="outlined"
									autoFocus
									inputProps={{ className: "input-primary font-jua" }}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<MailOutlineIcon sx={{ color: "var(--amber-400)", ml: 0.5 }} />
											</InputAdornment>
										),
									}}
									sx={{
										background: "#fff",
										borderRadius: 2,
										boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
										"& .MuiOutlinedInput-root": {
											borderRadius: 8,
										},
										"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
											borderColor: "var(--amber-500)",
										},
										"& label.Mui-focused": {
											color: "var(--amber-500)",
										},
										"& .MuiInputBase-input": {
											color: "var(--text-color)",
										},
									}}
								/>

								{loading && (
									<Box
										sx={{ display: "flex", justifyContent: "center", color: "var(--amber-400)" }}
									>
										<CircularProgress sx={{ color: "var(--amber-400)" }} />
									</Box>
								)}

								{error && (
									<Alert
										severity="error"
										icon={<ErrorOutlineIcon fontSize="inherit" />}
										sx={{ whiteSpace: "pre-line", mt: 1, borderRadius: 2 }}
									>
										{error}
									</Alert>
								)}

								{success && (
									<Alert
										severity="success"
										icon={<CheckCircleIcon fontSize="inherit" />}
										sx={{ mt: 1, borderRadius: 2 }}
									>
										{success}
									</Alert>
								)}

								<Button
									type="submit"
									variant="contained"
									color="primary"
									disabled={loading}
									sx={{
										mt: 1,
										borderRadius: 8,
										fontWeight: 700,
										fontSize: 16,
										boxShadow: "none",
										transition: "background-color 0.12s ease, transform 0.06s ease",
										backgroundColor: "var(--amber-400)",
										color: "var(--primary-contrast)",
										textTransform: "none",
										letterSpacing: ".03em",
										"&:hover": {
											backgroundColor: "var(--amber-500)",
											transform: "translateY(-1px)",
										},
									}}
								>
									Enviar contraseña
								</Button>
							</form>

							{debug && (
								<Box mt={2}>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ whiteSpace: "pre-line" }}
									>
										{debug}
									</Typography>
								</Box>
							)}
						</Box>
					</Slide>
				</Box>
			</Fade>
		</Modal>
	);
};

export default ForgotPasswordModal;
