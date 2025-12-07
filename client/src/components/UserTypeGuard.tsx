import React from "react";
import { Navigate } from "react-router-dom";

type UserTypeGuardProps = {
	allowedUserType: "client" | "internal";
	children: React.ReactNode;
};

/**
 * Guard that protects routes based on user type (client vs internal).
 * Redirects to login if not authenticated, or to the appropriate dashboard if wrong user type.
 */
export default function UserTypeGuard({ allowedUserType, children }: UserTypeGuardProps) {
	// Check for access token (authentication)
	const accessToken =
		localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

	// Check for user type
	const userType = (
		localStorage.getItem("user_type") ||
		sessionStorage.getItem("user_type") ||
		""
	).toLowerCase();

	// If no token or no user type, redirect to login
	if (!accessToken || !userType) {
		return <Navigate to="/login" replace />;
	}

	// If user type matches, allow access
	if (userType === allowedUserType.toLowerCase()) {
		return <>{children}</>;
	}

	// If wrong user type, redirect to their appropriate dashboard
	if (userType === "client") {
		return <Navigate to="/portal-cliente/dashboard" replace />;
	}

	if (userType === "internal") {
		return <Navigate to="/internal-users/dashboard" replace />;
	}

	// Fallback: redirect to login
	return <Navigate to="/login" replace />;
}
