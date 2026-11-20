// Pfade zu Dateien aus public/, im statischen Export setzt weder <img> noch <picture> den basePath selbst davor
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (path: string) => `${BASE_PATH}${path}`;
