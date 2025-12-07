// client/src/utils/validationRules.ts

/**
 * Validation rules to match Backend constraints and elicitation requirements.
 * Centralizing regex patterns ensures consistency and maintainability.
 * 
 * Backend constraints:
 * - username: max_length=150
 * - first_name: max_length=150
 * - last_name: max_length=150
 * - phone_number: max_length=15
 * - document_id: max_length=50, unique=True
 * - password: MIN_PASSWORD_LENGTH = 6 (backend), but elicitation requires 8 with complexity
 * 
 * Elicitation requirements (Pregunta 9):
 * - Mínimo 8 caracteres
 * - Usar Mayúsculas y Minúsculas
 * - incluir un número
 * - Incluir un símbolo
 */

// Regex for email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Regex for password according to elicitation: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Regex for document ID: Numeric, 6 to 12 digits (according to elicitation)
const DOCUMENT_ID_REGEX = /^\d{6,12}$/;

// Backend max lengths
const MAX_USERNAME_LENGTH = 150;
const MAX_FIRST_NAME_LENGTH = 150;
const MAX_LAST_NAME_LENGTH = 150;
const MAX_PHONE_NUMBER_LENGTH = 15;
const MAX_DOCUMENT_ID_LENGTH = 50;

// Regex for phone number: 7 to 15 digits
const PHONE_REGEX = /^\d{7,15}$/;

export const validationRules = {
	isValidEmail: (email: string): boolean => {
		if (!email || email.trim().length === 0) return false;
		return EMAIL_REGEX.test(email.trim());
	},

	isValidPassword: (password: string): boolean => {
		if (!password) return false;
		// According to elicitation: minimum 8 chars with complexity requirements
		return PASSWORD_REGEX.test(password);
	},

	isValidDocumentId: (docId: string): boolean => {
		if (!docId || docId.trim().length === 0) return false;
		const trimmed = docId.trim();
		// Backend max_length=50, but elicitation says 6-12 digits
		if (trimmed.length > MAX_DOCUMENT_ID_LENGTH) return false;
		return DOCUMENT_ID_REGEX.test(trimmed);
	},

	isValidUsername: (username: string): boolean => {
		if (!username) return false;
		const trimmed = username.trim();
		// Backend max_length=150, minimum 3 for usability
		return trimmed.length >= 3 && trimmed.length <= MAX_USERNAME_LENGTH;
	},

	isValidFirstName: (firstName: string): boolean => {
		if (!firstName) return false;
		const trimmed = firstName.trim();
		return trimmed.length > 0 && trimmed.length <= MAX_FIRST_NAME_LENGTH;
	},

	isValidLastName: (lastName: string): boolean => {
		if (!lastName) return false;
		const trimmed = lastName.trim();
		return trimmed.length > 0 && trimmed.length <= MAX_LAST_NAME_LENGTH;
	},

	isValidPhoneNumber: (phone: string): boolean => {
		if (!phone || phone.trim().length === 0) return true; // Optional field
		const trimmed = phone.trim();
		return trimmed.length <= MAX_PHONE_NUMBER_LENGTH;
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
			"La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial.",
		documentId: "La cédula debe contener entre 6 y 12 dígitos numéricos.",
		username: `El nombre de usuario debe tener entre 3 y ${MAX_USERNAME_LENGTH} caracteres.`,
		firstName: `El nombre debe tener máximo ${MAX_FIRST_NAME_LENGTH} caracteres.`,
		phone: "El teléfono debe contener solo números (7 a 15 dígitos).",
		address: "La dirección es obligatoria y debe ser válida.",
		lastName: `El apellido debe tener máximo ${MAX_LAST_NAME_LENGTH} caracteres.`,
		phoneNumber: `El número de teléfono debe tener máximo ${MAX_PHONE_NUMBER_LENGTH} caracteres.`,
		documentIdLength: `La cédula debe tener máximo ${MAX_DOCUMENT_ID_LENGTH} caracteres.`,
		required: "Este campo es obligatorio.",
		matchPassword: "Las contraseñas no coinciden.",
		terms: "Debes aceptar los lineamientos de la escuela.",
	},
};
