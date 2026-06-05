export const simpleHash = (password: string, salt: string) => `hashed_${password}_with_${salt}`;
export const generateSalt = () => Math.random().toString(36).substring(2, 15);
