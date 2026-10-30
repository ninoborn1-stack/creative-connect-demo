// Feste Produktions-Pakete (Ausbaustufe 1). Eine Paket-Anfrage landet als Managed Crew bei Nesto und dem Team,
// die die passenden Artists aus dem Netzwerk zusammenstellen. Preise sind Startpreise („ab“).
export type PackageRole = { title: string; category: string; share: number };

export type ProductionPackage = {
  slug: string;
  name: string;
  price: number;
  tagline: string;
  includes: string[];
  delivery: string;
  imageSeed: string;
  roles: PackageRole[];
  featured?: boolean;
};

export const PACKAGES: ProductionPackage[] = [
  {
    slug: "song-video",
    name: "Song + Video",
    price: 1800,
    tagline: "Vom ersten Beat bis zum fertigen Musikvideo.",
    includes: ["Songwriting & Produktion", "Mix & Master", "Musikvideo mit 1 Drehtag", "Schnitt & Color"],
    delivery: "ca. 4 Wochen",
    imageSeed: "id:39",
    roles: [
      { title: "Produktion & Mix", category: "musikproduktion", share: 0.5 },
      { title: "Musikvideo", category: "videografie", share: 0.5 },
    ],
    featured: true,
  },
  {
    slug: "release",
    name: "Release-Paket",
    price: 950,
    tagline: "Alles, was eine Single zum Release braucht.",
    includes: ["Cover-Artwork", "Pressefotos (halber Tag)", "Visualizer für Streaming", "Formate für Social"],
    delivery: "ca. 2 Wochen",
    imageSeed: "id:823",
    roles: [
      { title: "Cover & Visualizer", category: "grafikdesign", share: 0.5 },
      { title: "Pressefotos", category: "fotografie", share: 0.5 },
    ],
  },
  {
    slug: "brand-sound",
    name: "Brand Sound",
    price: 1400,
    tagline: "Ein Sound, an dem man eure Marke erkennt.",
    includes: ["Sound-Logo", "Jingle in 3 Längen", "Stems für Video & Social", "Buyout für Online"],
    delivery: "ca. 3 Wochen",
    imageSeed: "id:180",
    roles: [{ title: "Sound-Branding", category: "musikproduktion", share: 1 }],
  },
  {
    slug: "social-content",
    name: "Social Content",
    price: 1600,
    tagline: "Ein Drehtag, Content für Wochen.",
    includes: ["Drehtag mit Video & Foto", "10 Kurzclips für Reels & TikTok", "30 bearbeitete Fotos", "Untertitel & Formate"],
    delivery: "ca. 2 Wochen",
    imageSeed: "id:435",
    roles: [
      { title: "Video", category: "videografie", share: 0.6 },
      { title: "Foto", category: "fotografie", share: 0.4 },
    ],
  },
];

export function findPackage(slug: string) {
  return PACKAGES.find((p) => p.slug === slug);
}
