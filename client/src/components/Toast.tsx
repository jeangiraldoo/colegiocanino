import { useEffect, useState } from "react";

export default function ToastContainer() {
	const [toasts, setToasts] = useState<Array<{ id: number; message: string; type?: string }>>([]);

	useEffect(() => {
		let counter = 0;
		const handler = (e: Event) => {
			const ce = e as CustomEvent<{ message: string; type?: "success" | "error" | "info" }>;
			const id = ++counter;
			const { message, type } = ce.detail ?? { message: "", type: undefined };
			setToasts((s) => [...s, { id, message, type }]);
			setTimeout(() => {
				setToasts((s) => s.filter((t) => t.id !== id));
			}, 3200);
		};
		window.addEventListener("app-toast", handler as EventListener);
		return () => window.removeEventListener("app-toast", handler as EventListener);
	}, []);

	return (
		<div style={{ position: "fixed", right: 16, bottom: 18, zIndex: 1200 }}>
			{toasts.map((t) => (
				<div
					key={t.id}
					style={{
						marginTop: 8,
						minWidth: 220,
						padding: "10px 14px",
						borderRadius: 10,
						boxShadow: "0 8px 20px rgba(2,6,23,0.12)",
						background: t.type === "error" ? "#FEF3F2" : "#fff",
						border: t.type === "error" ? "1px solid #FECACA" : "1px solid rgba(2,6,23,0.06)",
						color: "var(--text-color)",
						fontWeight: 600,
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<div style={{ width: 10 }} />
					<div style={{ flex: 1 }}>{t.message}</div>
				</div>
			))}
		</div>
	);
}
