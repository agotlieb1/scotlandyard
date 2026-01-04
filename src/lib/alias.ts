export const formatAlias = (
  title: string | null | undefined,
  color: string | null | undefined
) => {
  if (!title || !color) {
    return "";
  }
  return `${title} ${color}`.trim();
};
