import React from "react";
import { Navigate } from "react-router-dom";

type RoleGuardProps = {
	allowed: string[];
	children: React.ReactNode;
};

export default function RoleGuard({ allowed, children }: RoleGuardProps) {
	const raw = (
		localStorage.getItem("user_role") ||
		sessionStorage.getItem("user_role") ||
		""
	).toString();
	const role = raw ? raw.toUpperCase() : "";
	if (!role) return <Navigate to="/login" replace />;
	if (allowed.map((r) => r.toUpperCase()).includes(role))
		return <>{children}</>;
	return <Navigate to="/internal-users" replace />;
}
