/**
 * Verifies that the password meets security requirements
 *
 * @param password the password to check
 */
export const passwordMeetsRequirements = (password: string) =>
	password.length > 10 &&
	// lowercase letter
	!!password.match(/[a-z]/g) &&
	// uppercase letter
	!!password.match(/[A-Z]/g) &&
	// number
	!!password.match(/[0-9]/g) &&
	// symbol
	!!password.match(/[ \^!@#$%&*(){}+=_\-<>,.?\/\[\]\\\|;'"]/g);
