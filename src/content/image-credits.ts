// Bildnachweise für alle Fotos in assets/photos (daraus erzeugt scripts/images.mjs die Dateien in public/img).
// Alle Fotos: Unsplash, Unsplash-Lizenz (frei, Nennung nicht verlangt). Geprüft am 21.11.2026 auf der jeweiligen
// Unsplash-Seite. Personen sind nur von hinten, als Silhouette oder als Hände zu sehen.
// Icons (lucide-react, ISC-Lizenz), Logo und Grafiken: eigene bzw. frei lizenzierte Gestaltung.
// Neues Foto? Hier eintragen; e2e/legal.spec.ts prüft, dass jedes Foto einen Eintrag hat.
import type { PhotoName } from "@/components/site/photo";

export type ImageCredit = { file: PhotoName; author: string; source: "Unsplash"; license: "Unsplash-Lizenz"; url: string; shows: { de: string; en: string } };

const u = (file: PhotoName, author: string, slug: string, de: string, en: string): ImageCredit => ({
  file, author, source: "Unsplash", license: "Unsplash-Lizenz", url: `https://unsplash.com/photos/${slug}`, shows: { de, en },
});

export const IMAGE_CREDITS: ImageCredit[] = [
  u("hero", "Yannis Papanastasopoulos", "silhouette-photo-of-rock-band-on-stage-performing-in-front-of-audience-yWF2LLan-_o", "Band auf der Bühne", "Band on stage"),
  u("artists", "Austin Neill", "man-in-gray-quarter-sleeved-shirt-singing-hgO1wFPXl3I", "Sänger von hinten", "Singer from behind"),
  u("business", "Peter Stumpf", "video-editing-timeline-on-dark-screen-yk9VXp4W5-Q", "Videoschnitt", "Video editing"),
  u("card-event", "Aditya Chinchure", "group-of-people-in-front-of-stage-ZhQCZjr9fHo", "Publikum vor der Bühne", "Crowd in front of a stage"),
  u("card-music", "blocks", "headphones-and-vintage-vinyl-records-T3mKJXfdims", "Kopfhörer und Platten", "Headphones and records"),
  u("crowd", "Hanny Naibaho", "group-of-people-raising-there-hands-in-concert-aWXVxy8BSzc", "Festival-Publikum", "Festival crowd"),
  u("feed-2", "ActionVance", "crowd-facing-lighted-stage-eXVd7gDPO9A", "Publikum vor beleuchteter Bühne", "Crowd facing a lit stage"),
  u("for-artists", "Jefferson Santos", "person-playing-guitar-fCEJGBzAkrU", "Hände an der Gitarre", "Hands on a guitar"),
  u("music", "israel palacio", "bokeh-photography-of-condenser-microphone-Y20JJ_ddy9M", "Mikrofon", "Microphone"),
  u("organizers", "Yvette de Wit", "stage-light-front-of-audience-NYrVisodQ2M", "Bühnenlicht über dem Publikum", "Stage light over a crowd"),
  u("press", "Dariusz Sankowski", "black-and-grey-dslr-camera-near-several-photos-on-brown-map-mj2NwYH3wBA", "Kamera und Fotos", "Camera and photos"),
  u("reminders", "Nainoa Shizuru", "concert-photos-NcdG9mK3PBY", "Konzert in gelbem Licht", "Concert in yellow light"),
  u("studio", "Caught In Joy", "recording-studio-with-guitars-and-console-ptVBlniJi50", "Tonstudio", "Recording studio"),
];
