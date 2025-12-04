// client/src/utils/validationRules.ts

/**
 * Validation rules to match Backend constraints.
 * Centralizing regex patterns ensures consistency and maintainability.
 */

// Regex for email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Regex for password: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Regex for document ID: Numeric, 6 to 12 digits
const DOCUMENT_ID_REGEX = /^\d{6,12}$/;

// Regex for phone number: 7 to 15 digits
const PHONE_REGEX = /^\d{7,15}$/;

export const validationRules = {
	isValidEmail: (email: string): boolean => {
		return EMAIL_REGEX.test(email);
	},

	isValidPassword: (password: string): boolean => {
		return PASSWORD_REGEX.test(password);
	},

	isValidDocumentId: (docId: string): boolean => {
		return DOCUMENT_ID_REGEX.test(docId);
	},

	isValidUsername: (username: string): boolean => {
		return username.trim().length >= 3;
	},

	isValidPhoneNumber: (phone: string): boolean => {
		return PHONE_REGEX.test(phone);
	},

	isValidAddress: (address: string): boolean => {
		// Basic check: not empty and at least 5 characters long
		return address.trim().length >= 5;
	},

	// Helper messages for UI
	messages: {
		email: "El correo electrónico no es válido.",
		password:
			"La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.",
		documentId: "La cédula debe contener entre 6 y 12 dígitos numéricos.",
		username: "El nombre de usuario debe tener al menos 3 caracteres.",
		phone: "El teléfono debe contener solo números (7 a 15 dígitos).",
		address: "La dirección es obligatoria y debe ser válida.",
		required: "Todos los campos son obligatorios.",
		matchPassword: "Las contraseñas no coinciden.",
		terms: "Debes aceptar los lineamientos de la escuela.",
	},
};
