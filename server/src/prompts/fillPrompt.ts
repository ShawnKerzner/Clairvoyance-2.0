export const fillPrompt = (
  template: string,
  values: Record<string, string>,
) => {
  let filled = template;
  for (const [key, value] of Object.entries(values)) {
    filled = filled.replaceAll(`{{${key}}}`, value);
  }
  return filled;
};
