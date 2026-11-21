import type { PhotoName } from "@/components/site/photo";

// Beispielinhalte der interaktiven App-Vorschau. Alle Personen, Events und Studios sind frei erfunden.
// Texte zweisprachig ({ de, en }); Bilder aus assets/photos, Hörproben aus public/audio (selbst erzeugt).

export type L = { de: string; en: string };
export type Kind = "artist" | "music" | "event" | "studio" | "package";

export type Card = {
  id: string;
  kind: Kind;
  title: string;
  sub: L; // z. B. „Singer-Songwriterin · Köln“
  text: L;
  image: PhotoName;
  tags: string[];
  badge?: L; // z. B. „noch 6 Tage“
  price?: L;
  audio?: string; // /audio/…
  match?: boolean; // Rechts-Swipe löst Match aus
  fresh?: boolean; // Newcomer, im Modus „Neu entdecken“ zuerst
  likes: number;
};

export const CARDS: Card[] = [
  { id: "mila", kind: "artist", title: "Mila Sternberg", sub: { de: "Singer-Songwriterin · Köln", en: "Singer-songwriter · Cologne" }, text: { de: "Schreibt Songs über Nachtzüge und Hinterhöfe. Sucht Band für Live-Sets.", en: "Writes songs about night trains and backyards. Looking for a live band." }, image: "card-artist", tags: ["Indie", "Live"], match: true, likes: 214 },
  { id: "warehouse", kind: "event", title: "Warehouse Night", sub: { de: "Club · Leipzig · Sa 23:00", en: "Club · Leipzig · Sat 11 pm" }, text: { de: "Fünf DJs, eine Halle, Visuals aus dem Netzwerk.", en: "Five DJs, one hall, visuals from the network." }, image: "card-event", tags: ["Techno", "Club"], badge: { de: "noch 6 Tage", en: "6 days left" }, price: { de: "wenige Tickets", en: "few tickets" }, likes: 532 },
  { id: "nachtfahrt", kind: "music", title: "Nachtfahrt", sub: { de: "Track · Juno Vale · 3:12", en: "Track · Juno Vale · 3:12" }, text: { de: "Erster Release, im Schlafzimmer produziert.", en: "First release, produced in a bedroom." }, image: "card-music", tags: ["Lo-Fi", "Newcomer"], audio: "/audio/preview-1.mp3", fresh: true, likes: 88 },
  { id: "nord", kind: "studio", title: "Studio Nord", sub: { de: "Tonstudio · Hamburg", en: "Recording studio · Hamburg" }, text: { de: "Analoges Pult, Live-Raum, Kaffee inklusive.", en: "Analog desk, live room, coffee included." }, image: "studio", tags: ["Recording", "Mix"], price: { de: "ab 45 € / Std", en: "from €45 / h" }, match: true, likes: 140 },
  { id: "release", kind: "package", title: "Release-Paket", sub: { de: "Paket · Cover, Video, Promo", en: "Package · cover, video, promo" }, text: { de: "Ein Team für deinen nächsten Release, zum Festpreis.", en: "One team for your next release, at a fixed price." }, image: "business", tags: ["Cover", "Video"], price: { de: "ab 1.490 €", en: "from €1,490" }, likes: 61 },
  { id: "kofi", kind: "artist", title: "Kofi Brandt", sub: { de: "DJ & Producer · Berlin", en: "DJ & producer · Berlin" }, text: { de: "House am Sonntagmorgen. Offen für Kollabos.", en: "House on Sunday mornings. Open to collabs." }, image: "artists", tags: ["House", "DJ"], fresh: true, likes: 302 },
  { id: "glasfabrik", kind: "music", title: "Glasfabrik", sub: { de: "Track · Ida Morgen · 2:48", en: "Track · Ida Morgen · 2:48" }, text: { de: "Synths, Regen, eine kaputte Drum-Machine.", en: "Synths, rain, a broken drum machine." }, image: "music", tags: ["Electronica"], audio: "/audio/preview-2.mp3", fresh: true, likes: 57 },
  { id: "ateliers", kind: "event", title: "Offene Ateliers", sub: { de: "Ausstellung · Berlin · So 14:00", en: "Exhibition · Berlin · Sun 2 pm" }, text: { de: "Zwölf Ateliers, ein Hof, Musik ab 18 Uhr.", en: "Twelve studios, one courtyard, music from 6 pm." }, image: "press", tags: ["Kunst", "Foto"], badge: { de: "noch 12 Tage", en: "12 days left" }, fresh: true, likes: 97 },
  { id: "lina", kind: "artist", title: "Lina Okafor", sub: { de: "Fotografin · München", en: "Photographer · Munich" }, text: { de: "Konzertfotos, Cover, Porträts. Lieber analog.", en: "Gig photos, covers, portraits. Prefers film." }, image: "feed-4", tags: ["Foto", "Cover"], match: true, likes: 176 },
  { id: "kreise", kind: "music", title: "Kreise", sub: { de: "Track · Mila Sternberg · 3:40", en: "Track · Mila Sternberg · 3:40" }, text: { de: "Akustik-Version, live im Treppenhaus.", en: "Acoustic version, recorded live in a stairwell." }, image: "feed-2", tags: ["Akustik"], audio: "/audio/preview-3.mp3", likes: 130 },
];

export type EventItem = { id: string; title: string; type: L; date: L; place: string; image: PhotoName; countdown: L; tickets?: L; days: number };

export const EVENTS: EventItem[] = [
  { id: "beat", title: "Beat-Workshop", type: { de: "Workshop", en: "Workshop" }, date: { de: "Mi, 20:00", en: "Wed, 8 pm" }, place: "Studio Nord, Hamburg", image: "organizers", countdown: { de: "noch 3 Tage", en: "3 days left" }, days: 3 },
  { id: "warehouse", title: "Warehouse Night", type: { de: "Club", en: "Club" }, date: { de: "Sa, 23:00", en: "Sat, 11 pm" }, place: "Halle 7, Leipzig", image: "card-event", countdown: { de: "noch 6 Tage", en: "6 days left" }, tickets: { de: "wenige Tickets", en: "few tickets" }, days: 6 },
  { id: "ateliers", title: "Offene Ateliers", type: { de: "Ausstellung", en: "Exhibition" }, date: { de: "So, 14:00", en: "Sun, 2 pm" }, place: "Hinterhof 12, Berlin", image: "press", countdown: { de: "noch 12 Tage", en: "12 days left" }, days: 12 },
  { id: "hafen", title: "Hafen Open Air", type: { de: "Konzert", en: "Concert" }, date: { de: "Fr, 18:00", en: "Fri, 6 pm" }, place: "Kaimauer, Hamburg", image: "crowd", countdown: { de: "noch 20 Tage", en: "20 days left" }, days: 20 },
];

export type Chat = { id: string; name: string; image: PhotoName; preview: L; request?: boolean; messages: { me: boolean; text: L }[]; reply: L };

export const CHATS: Chat[] = [
  {
    id: "mila", name: "Mila Sternberg", image: "card-artist", preview: { de: "Hast du am Freitag Zeit?", en: "Free on Friday?" },
    messages: [
      { me: false, text: { de: "Hey! Dein Track „Nachtfahrt“ läuft hier gerade rauf und runter.", en: "Hey! Your track “Nachtfahrt” is on repeat here." } },
      { me: false, text: { de: "Hast du am Freitag Zeit für eine Session?", en: "Free on Friday for a session?" } },
    ],
    reply: { de: "Perfekt, ich bring Kaffee mit. Studio Nord, 18 Uhr? ☕", en: "Perfect, I’ll bring coffee. Studio Nord, 6 pm? ☕" },
  },
  {
    id: "nord", name: "Studio Nord", image: "studio", preview: { de: "Euer Termin ist reserviert.", en: "Your slot is reserved." },
    messages: [{ me: false, text: { de: "Euer Termin am Freitag ist reserviert. Bis dann!", en: "Your Friday slot is reserved. See you!" } }],
    reply: { de: "Alles klar, wir halten den Raum frei.", en: "Got it, we’ll keep the room free." },
  },
  {
    id: "lina", name: "Lina Okafor", image: "feed-4", request: true, preview: { de: "Anfrage: Cover-Shooting", en: "Request: cover shoot" },
    messages: [{ me: false, text: { de: "Hi, ich würde gern das Cover für deinen nächsten Release fotografieren.", en: "Hi, I’d love to shoot the cover for your next release." } }],
    reply: { de: "Cool, schick mir gern ein paar Referenzen!", en: "Nice, send me a few references!" },
  },
];

export type Notice = { text: L; target: "events" | "messages" | "profile"; chat?: string };

export const NOTICES: Notice[] = [
  { text: { de: "Lina hat deinen Track geliked", en: "Lina liked your track" }, target: "profile" },
  { text: { de: "Neues Match mit Studio Nord", en: "New match with Studio Nord" }, target: "messages", chat: "nord" },
  { text: { de: "Noch 1 Tag bis Warehouse Night. Nur noch wenige Tickets!", en: "1 day until Warehouse Night. Only a few tickets left!" }, target: "events" },
];

export const PROFILE = {
  name: "Juno Vale",
  handle: "@junovale",
  image: "card-music" as PhotoName,
  bio: { de: "Producerin aus Hamburg. Lo-Fi, Nachtfahrten, Field Recordings. Erste EP im Frühjahr.", en: "Producer from Hamburg. Lo-fi, night drives, field recordings. First EP this spring." },
  stats: [
    { value: "48", label: { de: "Posts", en: "Posts" } },
    { value: "2.310", label: { de: "Follower", en: "Followers" } },
    { value: "12", label: { de: "Matches", en: "Matches" } },
  ],
  highlights: [{ de: "Studio", en: "Studio" }, { de: "Live", en: "Live" }, { de: "Releases", en: "Releases" }, { de: "Touren", en: "Tours" }],
  grid: ["card-music", "music", "studio", "feed-2", "crowd", "card-event", "organizers", "for-artists", "reminders"] as PhotoName[],
  tracks: ["nachtfahrt", "glasfabrik", "kreise"],
};

// Bedientexte der Vorschau
export const UI = {
  de: {
    region: "Interaktive App-Vorschau",
    hint: "Wisch nach rechts zum Liken",
    tabs: { discover: "Entdecken", events: "Events", create: "Erstellen", messages: "Nachrichten", profile: "Profil" },
    modes: { swipe: "Swipe", scroll: "Scroll" },
    filters: { all: "Alles", artist: "Artists", music: "Musik", event: "Events", studio: "Studios", package: "Pakete" },
    algo: { forYou: "Für dich", fresh: "Neu entdecken", forYouHint: "Für dich: sortiert nach dem, was du magst.", freshHint: "Neu entdecken: Algorithmus aus. Newcomer und Unbekanntes zuerst." },
    actions: { nope: "Weiter", undo: "Rückgängig", like: "Like", save: "Merken", play: "Hörprobe abspielen", pause: "Hörprobe stoppen", likePost: "Gefällt mir" },
    like: "LIKE",
    nopeStamp: "NOPE",
    empty: "Alles gesehen. Filter ändern oder zurücksetzen.",
    saved: "Gemerkt",
    match: { title: "Ihr seid auf einer Wellenlänge", text: "Du und {name} habt euch gegenseitig geliked.", write: "Nachricht schreiben", later: "Weiter swipen" },
    events: { yours: "Deine Events", all: "Events in deiner Nähe", save: "Merken", saved: "Gemerkt", tickets: "Tickets", reminder: "Wir erinnern dich 7 Tage, 1 Tag und 3 Stunden vorher." },
    ticket: { title: "Weiter zum Ticketanbieter", text: "In der App öffnet sich hier der Shop des Veranstalters. In dieser Vorschau gibt es keinen echten Ticketkauf.", back: "Zurück" },
    messages: { title: "Nachrichten", requests: "Anfrage", placeholder: "Nachricht schreiben …", send: "Senden", back: "Zurück", typing: "schreibt …" },
    profile: { edit: "Bearbeiten", editHint: "In der App kannst du dein Profil hier gestalten.", posts: "Posts", tracks: "Tracks", events: "Events" },
    create: { title: "Erstellen", items: { post: "Post", reel: "Reel", story: "Story", track: "Track", event: "Event" }, previewText: "Hier wählst du in der App Fotos, Videos oder Audio aus und veröffentlichst sie.", close: "Schließen" },
    status: "9:41",
    now: "jetzt",
    reset: "Vorschau zurücksetzen",
    verified: "Geprüft",
    backstage: { label: "Backstage", title: "Nur auf Einladung.", text: "Backstage ist der private Bereich für etablierte Artists, Studios und Venues. Bewirb dich auf der Website.", close: "Verstanden" },
  },
  en: {
    region: "Interactive app preview",
    hint: "Swipe right to like",
    tabs: { discover: "Discover", events: "Events", create: "Create", messages: "Messages", profile: "Profile" },
    modes: { swipe: "Swipe", scroll: "Scroll" },
    filters: { all: "All", artist: "Artists", music: "Music", event: "Events", studio: "Studios", package: "Packages" },
    algo: { forYou: "For you", fresh: "Discover new", forYouHint: "For you: sorted by what you like.", freshHint: "Discover new: algorithm off. Newcomers and unknowns first." },
    actions: { nope: "Pass", undo: "Undo", like: "Like", save: "Save", play: "Play preview", pause: "Stop preview", likePost: "Like" },
    like: "LIKE",
    nopeStamp: "NOPE",
    empty: "You’ve seen it all. Change the filter or reset.",
    saved: "Saved",
    match: { title: "You’re on the same wavelength", text: "You and {name} liked each other.", write: "Send a message", later: "Keep swiping" },
    events: { yours: "Your events", all: "Events near you", save: "Save", saved: "Saved", tickets: "Tickets", reminder: "We’ll remind you 7 days, 1 day and 3 hours before." },
    ticket: { title: "On to the ticket shop", text: "In the app, the organizer’s ticket shop opens here. There is no real ticket purchase in this preview.", back: "Back" },
    messages: { title: "Messages", requests: "Request", placeholder: "Write a message …", send: "Send", back: "Back", typing: "typing …" },
    profile: { edit: "Edit", editHint: "In the app you design your profile here.", posts: "Posts", tracks: "Tracks", events: "Events" },
    create: { title: "Create", items: { post: "Post", reel: "Reel", story: "Story", track: "Track", event: "Event" }, previewText: "In the app you pick photos, videos or audio here and publish them.", close: "Close" },
    status: "9:41",
    now: "now",
    reset: "Reset preview",
    verified: "Verified",
    backstage: { label: "Backstage", title: "Invite only.", text: "Backstage is the private space for established artists, studios and venues. Apply on the website.", close: "Got it" },
  },
};
export type UIText = (typeof UI)["de"];
