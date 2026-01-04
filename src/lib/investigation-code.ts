const INVESTIGATION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateInvestigationCode = (length = 5) => {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * INVESTIGATION_ALPHABET.length);
    code += INVESTIGATION_ALPHABET[index];
  }
  return code;
};

export const normalizeInvestigationCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
