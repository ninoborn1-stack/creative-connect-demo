// Fiktive Stammdaten für den Seed. Alle Namen, Firmen und Labels sind frei erfunden.

export const FIRST_NAMES = [
  "Mara", "Jonas", "Aylin", "Malik", "Lea", "Finn", "Sophie", "Emre", "Nele", "Luca", "Hanna", "Milan", "Ida", "Yusuf",
  "Clara", "Noah", "Zoe", "Tim", "Lina", "Elias", "Merve", "Paul", "Greta", "Can", "Romy", "Ben", "Leni", "Kofi",
  "Frieda", "Nikolai", "Amira", "Jannik", "Selin", "Moritz", "Jule", "David", "Pia", "Samuel", "Alina", "Kemal",
];

export const LAST_NAMES = [
  "Becker", "Hoffmann", "Yilmaz", "Krause", "Neumann", "Schulz", "Wagner", "Öztürk", "Richter", "Klein", "Wolf",
  "Schröder", "Brandt", "Lorenz", "Hartmann", "Kaya", "Vogel", "Engel", "Sommer", "Albrecht", "Mensah", "Petrović",
  "Jansen", "Kowalski", "Winter", "Berger", "Arslan", "Fuchs", "Roth", "Seidel",
];

export const SKILLS: Record<string, string[]> = {
  musikproduktion: ["Beats", "Songwriting", "Recording", "Mixing", "Mastering", "Ableton", "Pro Tools", "Vocal-Editing", "Sounddesign", "Film-Scoring"],
  tonstudio: ["Studio-Engineering", "Vocal-Recording", "Live-Recording", "Podcast-Aufnahme", "Dolby Atmos", "Analog-Outboard", "Mastering"],
  videografie: ["Regie", "Kamera", "Drohne", "Schnitt", "Color Grading", "DaVinci Resolve", "Gimbal", "Musikvideos", "Reels"],
  fotografie: ["Portrait", "Fashion", "Produkt", "Event", "Analog", "Studio-Licht", "Retusche", "Albumcover"],
  booking: ["Location-Scouting", "Event-Planung", "Künstlerkartei", "Tourplanung", "Genehmigungen", "Catering-Koordination"],
  schauspiel: ["Musikvideo", "Werbung", "Kurzfilm", "Improvisation", "Tanz", "Moderation", "Synchron"],
  grafikdesign: ["Albumcover", "Branding", "Merch", "Typografie", "Motion Design", "Illustration", "Social-Templates"],
};

export const HEADLINES: Record<string, string[]> = {
  musikproduktion: ["Produzent für Rap & R&B", "Mix & Mastering mit Gefühl", "Songwriterin & Topline", "Beats zwischen Boom-Bap und Drill", "Producer für Pop & Indie"],
  tonstudio: ["Engineer im eigenen Studio", "Recording & Podcast-Studio", "Analoges Studio mit Live-Raum"],
  videografie: ["Regie & Kamera für Musikvideos", "Cinematic Storytelling", "Reels, Clips & Brand-Content", "Dokumentarisch, roh, nah dran"],
  fotografie: ["Portrait & Albumcover", "Fashion & Streetwear", "Analog & Mittelformat", "Event- & Konzertfotografie"],
  booking: ["Booking & Location-Scouting", "Events von 50 bis 2.000 Gästen", "Künstlerkartei & Tourplanung"],
  schauspiel: ["Schauspielerin für Musikvideo & Werbung", "Darsteller mit Tanz-Background", "Kurzfilm & Werbung"],
  grafikdesign: ["Cover-Art & Merch", "Branding für Musiker:innen", "Motion Design & Visuals"],
};

export const BIOS: Record<string, string[]> = {
  musikproduktion: [
    "Ich produziere seit zwölf Jahren und habe Platten für Independent-Artists und zwei kleine Labels gemacht. Am liebsten arbeite ich von der ersten Skizze bis zum fertigen Master an einem Song.",
    "Mein Fokus liegt auf Mix und Mastering. Ich höre zu, bevor ich drehe – dein Song soll nach dir klingen, nicht nach mir.",
    "Ich schreibe Toplines und Hooks, gerne im Team mit Producer:innen. Session-Splits regle ich vorher sauber und schriftlich.",
  ],
  tonstudio: [
    "Mein Studio hat einen 28 m² Live-Raum, eine Vocal-Booth und eine Regie mit analogem Outboard. Ich bin selbst als Engineer dabei.",
    "Wir nehmen Podcasts, Hörbücher und Vocals auf – mit zwei Räumen auch parallel. Schnitt und Mastering gibt es auf Wunsch dazu.",
  ],
  videografie: [
    "Ich mache Musikvideos mit kleinem Team und großem Look. Konzept, Dreh und Schnitt aus einer Hand, Color Grading inklusive.",
    "Von Reels bis Kampagnenfilm: Ich erzähle Geschichten, die im Feed nicht untergehen. Drohne und Gimbal habe ich selbst.",
    "Dokumentarischer Stil, viel Handkamera, nah an den Menschen. Für Backstage, Tourdokus und Making-ofs.",
  ],
  fotografie: [
    "Portraits und Albumcover mit viel Licht und wenig Retusche. Ich fotografiere digital und auf Mittelformat-Film.",
    "Fashion- und Streetwear-Shootings im Studio oder draußen. Moodboard, Licht und Bildauswahl gehören bei mir dazu.",
    "Konzerte, Releases, Festivals: Ich bin da, wo es laut ist, und liefere am nächsten Morgen die ersten Bilder.",
  ],
  booking: [
    "Ich finde Locations, die nicht jeder kennt, und kümmere mich um Genehmigungen, Technik und Ablauf vor Ort.",
    "Seit acht Jahren buche ich Künstler:innen für Clubs und Festivals. Meine Kartei reicht von Newcomern bis Headlinern.",
  ],
  schauspiel: [
    "Ich spiele in Musikvideos, Werbespots und Kurzfilmen. Ausbildung an einer privaten Schauspielschule, Tanz-Background.",
    "Natürlich vor der Kamera, auch ohne Text. Ich bringe Erfahrung aus Theater und Improvisation mit.",
  ],
  grafikdesign: [
    "Ich gestalte Cover, Merch und komplette Release-Auftritte. Typografie ist meine Leidenschaft.",
    "Branding für Musiker:innen und kleine Labels – vom Logo bis zum Social-Template-Kit.",
    "Motion Design und Visualizer für Releases und Live-Shows. Ich arbeite in After Effects und Blender.",
  ],
};

export const RATES: Record<string, [number, number]> = {
  musikproduktion: [250, 900],
  tonstudio: [300, 800],
  videografie: [400, 1400],
  fotografie: [350, 1200],
  booking: [250, 700],
  schauspiel: [200, 800],
  grafikdesign: [250, 800],
};

export const CLIENTS = [
  { name: "Tarek Yilmaz", company: "Nordlicht Records", type: "Label", email: "kunde@demo.cc" },
  { name: "Svenja Albers", company: "Nordwind Energy Drinks", type: "Marke" },
  { name: "Jamal Okafor", company: "Kiezbeat Magazin", type: "Magazin" },
  { name: "Lotta Brenner", company: "Fernweh Streetwear", type: "Marke" },
  { name: "Ricardo Neves", company: "Halle 7 Booking", type: "Agentur" },
  { name: "Ava Lindqvist", company: "AVA (Independent)", type: "Independent-Artist" },
  { name: "Hakan Demir", company: "Blaupause Agentur", type: "Agentur" },
  { name: "Marlene Fischer", company: "Rauschen Podcast GmbH", type: "Marke" },
  { name: "Dario Conti", company: "Asphaltpoesie Records", type: "Label" },
  { name: "Nora Kessler", company: "NORA K. (Independent)", type: "Independent-Artist" },
  { name: "Felix Baumann", company: "Kraftwerk Sneaker Store", type: "Marke" },
  { name: "Imani Haddad", company: "Funkhaus Kollektiv", type: "Independent-Artist" },
];

export const VENUES = [
  { name: "Hafenklang Studio", type: "tonstudio", city: "Hamburg", features: ["Neve-Konsole", "Live-Raum 30 m²", "Vocal-Booth", "Flügel", "Engineer inklusive"], hour: 55, day: 380, cap: 8 },
  { name: "Raum 404", type: "tonstudio", city: "Berlin", features: ["SSL-Pult", "Dolby Atmos 7.1.4", "Vocal-Booth", "Lounge"], hour: 70, day: 490, cap: 6 },
  { name: "Lichthof Fotostudio", type: "fotostudio", city: "Köln", features: ["Hohlkehle 6 m", "Tageslicht", "Profoto-Blitzanlage", "Make-up-Platz"], hour: 65, day: 450, cap: 15 },
  { name: "Alte Weberei", type: "location", city: "Leipzig", features: ["Industrie-Charme", "400 m²", "Starkstrom", "Lastenaufzug"], hour: 90, day: 650, cap: 200 },
  { name: "Podcastküche", type: "tonstudio", city: "Berlin", features: ["4 Mikrofone", "3 Kameras", "Live-Streaming", "Schnittplatz"], hour: 45, day: 320, cap: 5 },
  { name: "Isarblick Studio", type: "fotostudio", city: "München", features: ["Greenscreen", "Cyc-Wand", "ARRI-Licht", "Garderobe"], hour: 80, day: 560, cap: 20 },
  { name: "Bunker 12", type: "proberaum", city: "Dortmund", features: ["Backline", "PA 2 kW", "Schallisoliert", "24/7-Zugang"], hour: 18, day: 110, cap: 10 },
  { name: "Elbsalon", type: "location", city: "Dresden", features: ["Gründerzeit-Saal", "Kronleuchter", "Bühne", "Bar"], hour: 120, day: 900, cap: 150 },
  { name: "Mainwerk Studios", type: "tonstudio", city: "Frankfurt", features: ["Analog-Bandmaschine", "Drumkit", "Live-Raum", "Mastering-Suite"], hour: 60, day: 420, cap: 8 },
  { name: "Dachgarten Ost", type: "location", city: "Stuttgart", features: ["Rooftop", "Skyline-Blick", "Lichterketten", "Wetterschutz"], hour: 110, day: 780, cap: 80 },
];

export const PROJECT_IDEAS = [
  { title: "Musikvideo „Nachtfahrt“", city: "Hamburg", roles: [["Regie & Kamera", "videografie"], ["Darstellerin", "schauspiel"], ["Cover-Design", "grafikdesign"]], budget: 8000, desc: "Cinematic Musikvideo für die neue Single, Dreh in einer Nacht am Hafen." },
  { title: "Lookbook Frühjahr 2027", city: "Köln", roles: [["Fotografie", "fotografie"], ["Reels", "videografie"], ["Model", "schauspiel"], ["Art Direction", "grafikdesign"]], budget: 12000, desc: "Lookbook-Shooting mit 30 Motiven und sechs Reels für die neue Kollektion." },
  { title: "Podcast „Rauschen“ – Staffel 2", city: "Berlin", roles: [["Studio & Aufnahme", "tonstudio"], ["Schnitt & Mix", "musikproduktion"], ["Video-Podcast", "videografie"]], budget: 9500, desc: "Zehn Interview-Folgen mit Video-Version für YouTube." },
  { title: "EP „Zwischenräume“", city: "Leipzig", roles: [["Produktion", "musikproduktion"], ["Mix & Master", "musikproduktion"], ["Cover-Shooting", "fotografie"]], budget: 6500, desc: "Fünf Songs von der Skizze bis zum Master, plus Coverfoto." },
  { title: "Kampagne „Durst auf Nacht“", city: "München", roles: [["Regie", "videografie"], ["Fotografie", "fotografie"], ["Darsteller:innen", "schauspiel"], ["Location", "booking"], ["Musik", "musikproduktion"]], budget: 28000, desc: "Social-Kampagne für ein Energy-Drink-Launch mit Club-Setting." },
  { title: "Release-Party Halle 7", city: "Frankfurt", roles: [["Booking", "booking"], ["Eventfotografie", "fotografie"], ["Aftermovie", "videografie"]], budget: 5200, desc: "Release-Party mit drei Acts, Fotos und Aftermovie." },
  { title: "Albumcover „Asphaltpoesie“", city: "Düsseldorf", roles: [["Cover-Design", "grafikdesign"], ["Fotografie", "fotografie"]], budget: 2400, desc: "Cover und Single-Artworks für ein Rap-Album." },
  { title: "Sneaker-Drop Video", city: "Essen", roles: [["Video", "videografie"], ["Motion Design", "grafikdesign"], ["Sound", "musikproduktion"]], budget: 7000, desc: "Kurzvideo zum Limited Drop, 30 Sek. + 15 Sek. Cut." },
  { title: "Live-Session im Studio", city: "Hamburg", roles: [["Studio", "tonstudio"], ["Kamera", "videografie"], ["Mix", "musikproduktion"]], budget: 4200, desc: "Drei Songs live im Studio mit Mehrkamera-Aufnahme." },
  { title: "Tourdoku Herbst", city: "Dresden", roles: [["Doku-Kamera", "videografie"], ["Tourfotografie", "fotografie"]], budget: 9800, desc: "Begleitung von sechs Shows, Doku in drei Teilen." },
  { title: "Kurzfilm „Treppenhaus“", city: "Nürnberg", roles: [["Kamera", "videografie"], ["Hauptrolle", "schauspiel"], ["Nebenrolle", "schauspiel"], ["Filmmusik", "musikproduktion"]], budget: 11000, desc: "Zwölfminütiger Kurzfilm für Festival-Einreichungen." },
  { title: "Branding Funkhaus Kollektiv", city: "Mannheim", roles: [["Branding", "grafikdesign"], ["Bandfotos", "fotografie"]], budget: 3600, desc: "Logo, Farbwelt und Pressefotos für ein neues Kollektiv." },
  { title: "Magazin-Shooting Kiezbeat", city: "Berlin", roles: [["Fotografie", "fotografie"], ["Location", "booking"]], budget: 2800, desc: "Titelstory mit drei Künstler:innen an drei Orten." },
  { title: "Single „Glas“ Produktion", city: "Stuttgart", roles: [["Produktion", "musikproduktion"], ["Vocal-Recording", "tonstudio"]], budget: 3200, desc: "Produktion und Vocal-Aufnahme einer Pop-Single." },
  { title: "Imagefilm Blaupause", city: "Hannover", roles: [["Regie & Kamera", "videografie"], ["Sprecher:in", "schauspiel"], ["Musik", "musikproduktion"]], budget: 7600, desc: "Zweiminütiger Imagefilm für eine Agentur." },
];

export const REVIEW_TEXTS = [
  "Super Zusammenarbeit, pünktlich, kreativ und mit klarem Blick fürs Ergebnis. Gerne wieder!",
  "Hat aus einem knappen Budget das Maximum rausgeholt. Kommunikation war top.",
  "Sehr professionell, hat eigene Ideen eingebracht und trotzdem auf unsere Wünsche gehört.",
  "Lieferung einen Tag früher als vereinbart. Qualität überragend.",
  "Angenehme Stimmung am Set, alle haben sich wohlgefühlt. Ergebnis spricht für sich.",
  "Kleine Abstimmungsschwierigkeiten am Anfang, danach lief alles reibungslos.",
  "Klare Absprachen, faire Preise, saubere Rechnung. So muss das sein.",
  "Die Bilder sind genau das, was wir uns vorgestellt haben – eher noch besser.",
  "Hat spontan eine Lösung für den Location-Ausfall gefunden. Rettung des Tages!",
  "Zuverlässiger Auftraggeber, Briefing war klar und die Zahlung kam sofort nach Abnahme.",
];

export const POSTS = [
  "Wer hat nächste Woche in Hamburg Zeit für einen spontanen Dreh? Suche noch eine zweite Kamera für Donnerstag.",
  "Neues Studio-Setup steht! Danke an alle, die beim Umzug geholfen haben. Kommt vorbei, Kaffee ist da.",
  "Release-Tag 🎉 Das Video ist komplett über Creative Connect entstanden – von Regie bis Cover. Danke an die Crew!",
  "Frage in die Runde: Wie kalkuliert ihr Nutzungsrechte bei Social-only-Kampagnen? Pauschal oder nach Laufzeit?",
  "Habe zwei Aputure-Leuchten übrig, die ich verleihe. Steht in der Equipment-Börse.",
  "Danke für den Workshop zur Künstlersozialkasse gestern – endlich verstanden, was ich als Auftraggeberin abführen muss.",
  "Suche Schauspielerin (25–35) für ein Musikvideo in Leipzig, Ende des Monats. Bezahlt natürlich.",
  "Behind the Scenes vom Lookbook-Shooting letzte Woche. Was für ein Team!",
  "Tipp: Schreibt eure Splits vor der Session auf. Erspart später sehr viel Stress.",
  "Unser Podcast ist jetzt auf Platz 3 in der Kategorie Musik. Riesen Dank ans Studio-Team!",
  "Wer kennt eine gute Location für 150 Leute in Dresden? Gerne mit Charakter.",
  "Erste Analog-Session seit Jahren. Mittelformat macht einfach Spaß.",
  "Mein erstes Projekt über die Plattform ist abgeschlossen – Zahlung kam direkt nach Abnahme. Genau so soll's sein.",
  "Kleiner Reminder: Am Freitag ist Netzwerk-Abend im Hafenklang. Bringt eure Leute mit!",
  "Neues Showreel ist online. Feedback ausdrücklich erwünscht.",
  "Suche Mix-Engineer mit Erfahrung in Drill. Budget ist da.",
  "Habe gerade meinen Tagessatz angepasst. Fühlt sich gut an, das transparent zu machen.",
  "Wir haben noch zwei freie Studiotage im November. Sofortbuchung ist aktiv.",
  "Coverentwurf für die neue EP – welcher gefällt euch besser, links oder rechts?",
  "Was für ein Abend beim Live-Session-Event. Gänsehaut.",
  "Neuer Wissensartikel zu Nutzungsrechten ist super hilfreich. Lest den mal, bevor ihr den nächsten Vertrag macht.",
  "Wer hat Lust auf ein Kollabo-Projekt? Idee: 7 Bereiche, 1 Song, 1 Video.",
  "Danke an alle, die mich eingeladen haben – fühlt sich gut an, hier zu sein.",
  "Neuer Drohnenschein ist da, ab jetzt auch Luftaufnahmen im Angebot.",
  "Kurzer Erfahrungsbericht zur Managed Crew: Leon hat in zwei Tagen ein komplettes Team zusammengestellt.",
];

export const COMMENTS = ["Bin dabei!", "Starkes Ergebnis 🔥", "Schreib mir mal eine Nachricht.", "Danke fürs Teilen!", "Mega, Glückwunsch!", "Habe Donnerstag Zeit.", "Links, ganz klar.", "Sehr hilfreich, danke."];

export const EVENTS = [
  { title: "Netzwerk-Abend Hamburg", city: "Hamburg", venue: "Hafenklang Studio", desc: "Lockeres Kennenlernen mit Drinks und Studio-Tour. Bringt Leute mit, die ihr einladen wollt.", offset: 8, cap: 60 },
  { title: "Workshop: Künstlersozialkasse verstehen", city: "Berlin", venue: "Raum 404", desc: "Was Kreative und Auftraggeber:innen über die KSK wissen sollten. Mit einer Steuerberaterin aus dem Netzwerk.", offset: 15, cap: 30 },
  { title: "Live-Session-Nacht", city: "Leipzig", venue: "Alte Weberei", desc: "Fünf Acts aus dem Netzwerk spielen live, wir filmen und nehmen alles auf.", offset: 22, cap: 200 },
  { title: "Portfolio-Review Foto & Design", city: "Köln", venue: "Lichthof Fotostudio", desc: "Bringt eure Mappe mit. Ehrliches Feedback in kleinen Gruppen.", offset: 30, cap: 25 },
  { title: "Preise kalkulieren – aber fair", city: "München", venue: "Isarblick Studio", desc: "Tagessätze, Nutzungsrechte, Buyouts: ein Abend zu Zahlen ohne Tabus.", offset: 41, cap: 40 },
  { title: "Winter-Jam Dortmund", city: "Dortmund", venue: "Bunker 12", desc: "Offene Jam-Session für Musiker:innen und alle, die Lust haben.", offset: 55, cap: 50 },
  { title: "Sommerfest Creative Connect", city: "Berlin", venue: "Podcastküche", desc: "Das erste Sommerfest des Netzwerks mit 120 Gästen.", offset: -95, cap: 150 },
  { title: "Drohnen-Workshop", city: "Dresden", venue: "Elbsalon", desc: "Rechtliches und Praxis zum Drohnenflug bei Drehs.", offset: -60, cap: 20 },
  { title: "Rooftop-Shooting-Day", city: "Stuttgart", venue: "Dachgarten Ost", desc: "Fotograf:innen und Models shooten gemeinsam für ihre Portfolios.", offset: -30, cap: 40 },
  { title: "Beat-Battle Frankfurt", city: "Frankfurt", venue: "Mainwerk Studios", desc: "Zwölf Produzent:innen, drei Runden, eine Jury aus dem Netzwerk.", offset: -12, cap: 80 },
];

export const ARTICLES = [
  {
    slug: "ksk-kurz-erklaert",
    title: "Künstlersozialkasse kurz erklärt",
    category: "Recht & Steuern",
    teaser: "Wer muss rein, wer zahlt was – und was bedeutet das für Auftraggeber:innen?",
    body: "Die Künstlersozialkasse (KSK) sorgt dafür, dass selbstständige Künstler:innen und Publizist:innen ähnlich wie Angestellte sozialversichert sind. Sie zahlen etwa die Hälfte der Beiträge selbst.\n\n## Was zahlen Auftraggeber:innen?\nUnternehmen, die regelmäßig Aufträge an selbstständige Kreative vergeben, zahlen die Künstlersozialabgabe. 2026 liegt der Satz bei 4,9 % der Honorarsumme, für 2027 sind 5,0 % angekündigt. Unter einer Bagatellgrenze von 1.000 € pro Jahr fällt keine Abgabe an.\n\n## Was heißt das auf der Plattform?\nCreative Connect zeigt die mögliche Abgabe im Angebot an und erstellt eine Jahresübersicht als Export. Das ersetzt keine Beratung – im Zweifel die Steuerberatung fragen.",
  },
  {
    slug: "rechnungen-richtig-schreiben",
    title: "Rechnungen richtig schreiben",
    category: "Business",
    teaser: "Pflichtangaben, Kleinunternehmerregelung und wie du schneller bezahlt wirst.",
    body: "Eine Rechnung braucht Name und Anschrift beider Seiten, Steuernummer oder USt-ID, Rechnungsnummer, Datum, Leistung, Zeitraum, Netto, Steuersatz und Brutto.\n\n## Kleinunternehmer:in?\nWer die Kleinunternehmerregelung nutzt, weist keine Umsatzsteuer aus und vermerkt das auf der Rechnung.\n\n## Auf Creative Connect\nRechnungen entstehen automatisch aus der Buchung. Das Geld ist bei Buchung gesichert und wird nach Abnahme ausgezahlt.",
  },
  {
    slug: "tagessatz-kalkulieren",
    title: "Tagessatz kalkulieren in 4 Schritten",
    category: "Business",
    teaser: "Von den Lebenshaltungskosten zum Tagessatz, der wirklich trägt.",
    body: "Starte mit deinem Jahresbedarf: Lebenshaltung, Versicherungen, Altersvorsorge, Steuern, Equipment.\n\n## Fakturierbare Tage\nRealistisch sind 100 bis 140 Tage im Jahr – Akquise, Verwaltung und Urlaub gehen ab.\n\n## Rechnung\nJahresbedarf geteilt durch fakturierbare Tage ergibt deinen Mindest-Tagessatz. Nutzungsrechte kommen oben drauf.\n\n## Transparenz\nAuf Creative Connect setzt du deinen Preisrahmen selbst. Niemand drückt ihn – du entscheidest.",
  },
  {
    slug: "nutzungsrechte-basics",
    title: "Nutzungsrechte: Die Basics",
    category: "Recht & Steuern",
    teaser: "Einfach oder exklusiv, Social-only oder Buyout – was du wissen musst.",
    body: "Urheberrechte bleiben bei dir. Was du verkaufst, sind Nutzungsrechte – nach Art, Dauer, Gebiet und Exklusivität.\n\n## Typische Pakete\nSocial-only für 12 Monate, Online plus Print, Buyout ohne Zeitlimit. Je weiter, desto teurer.\n\n## Im Vertrag festhalten\nDie Vertragsvorlagen auf der Plattform fragen diese Punkte ab, damit später nichts unklar ist.",
  },
  {
    slug: "scheinselbststaendigkeit-vermeiden",
    title: "Scheinselbstständigkeit vermeiden",
    category: "Recht & Steuern",
    teaser: "Woran die Rentenversicherung abhängige Beschäftigung erkennt.",
    body: "Entscheidend ist, ob du weisungsfrei arbeitest, eigene Preise setzt, Aufträge ablehnen kannst und für mehrere Auftraggeber:innen tätig bist.\n\n## Kennzahl im Dashboard\nDein Dashboard zeigt den Anteil deines größten Auftraggebers. Liegt er dauerhaft sehr hoch, lohnt ein Blick auf deine Kundenstruktur.\n\n## Statusfeststellung\nIm Zweifel klärt das Statusfeststellungsverfahren bei der Clearingstelle der Deutschen Rentenversicherung den Status verbindlich.",
  },
  {
    slug: "splits-und-credits",
    title: "Splits und Credits sauber regeln",
    category: "Musik",
    teaser: "Wer hat was geschrieben? Vor der Session klären, nicht danach.",
    body: "Bei Songwriting-Sessions sollte vorher feststehen, wie Anteile verteilt werden. Eine kurze schriftliche Vereinbarung reicht.\n\n## Credits auf der Plattform\nJedes abgeschlossene Projekt erzeugt Credits für alle Beteiligten. Die tauchen automatisch in deinem Profil auf.",
  },
  {
    slug: "ki-im-kreativen-alltag",
    title: "KI im kreativen Alltag – Werkzeug, kein Ersatz",
    category: "Praxis",
    teaser: "Wo KI hilft, wo sie nichts verloren hat und was der AI Act verlangt.",
    body: "KI kann Briefings strukturieren, Budgets aufteilen und Vorschläge machen. Die kreative Arbeit machen Menschen.\n\n## Kennzeichnung\nSeit August 2026 gelten Transparenzpflichten aus dem EU AI Act. Auf Creative Connect sind KI-Vorschläge markiert, und KI-generierte Portfolio-Inhalte müssen gekennzeichnet werden.",
  },
  {
    slug: "drehgenehmigung-checkliste",
    title: "Checkliste Drehgenehmigung",
    category: "Praxis",
    teaser: "Öffentlicher Raum, Drohne, Musikrechte – die wichtigsten Fragen vor dem Dreh.",
    body: "Für Drehs im öffentlichen Raum braucht es oft eine Sondernutzungserlaubnis der Stadt. Plane zwei bis vier Wochen Vorlauf ein.\n\n## Drohne\nKennzeichnung, Versicherung und Kompetenznachweis sind Pflicht.\n\n## Musik\nFür Musik im Video braucht es Synchronisationsrechte – bei eigener Produktion im Vertrag regeln.",
  },
];

export const EQUIPMENT = [
  { title: "Sony FX3 Kit", desc: "Mit 2 Akkus, Käfig und 128-GB-Karte.", mode: "verleih", price: 90, condition: "Sehr gut" },
  { title: "Aputure 300d II (2 Stück)", desc: "Inklusive Softboxen und Stative.", mode: "verleih", price: 60, condition: "Gut" },
  { title: "Neumann U87 Ai", desc: "Mit Spinne und Koffer.", mode: "verleih", price: 45, condition: "Sehr gut" },
  { title: "DJI Mini 4 Pro", desc: "Fly-More-Combo, versichert.", mode: "verleih", price: 50, condition: "Neuwertig" },
  { title: "Roland TR-8S", desc: "Wenig benutzt, mit OVP.", mode: "verkauf", price: 520, condition: "Sehr gut" },
  { title: "Mamiya RZ67 mit 110 mm", desc: "Mittelformat-Klassiker, frisch gewartet.", mode: "verkauf", price: 980, condition: "Gut" },
  { title: "Universal Audio Apollo Twin X", desc: "Duo-Version, funktioniert einwandfrei.", mode: "verkauf", price: 650, condition: "Gut" },
  { title: "DJI RS 3 Pro Gimbal", desc: "Mit Focus-Motor.", mode: "verleih", price: 35, condition: "Sehr gut" },
  { title: "Wacom Cintiq 22", desc: "Ideal für Illustration und Retusche.", mode: "verkauf", price: 590, condition: "Gut" },
  { title: "Rode Rodecaster Pro II", desc: "Perfekt für Podcasts mit vier Gästen.", mode: "verleih", price: 30, condition: "Neuwertig" },
  { title: "Profoto B10 Duo Kit", desc: "Zwei Blitze, Akkus, Tasche.", mode: "verleih", price: 70, condition: "Sehr gut" },
  { title: "Nebelmaschine 1500 W", desc: "Mit Fernbedienung und Fluid.", mode: "verleih", price: 25, condition: "Gut" },
];

export const CHAT_LINES = [
  "Moin zusammen! Ich habe das Moodboard in die Dateien gelegt.",
  "Sieht stark aus. Ich würde für die Nachtszenen noch eine zweite Lichtquelle mitbringen.",
  "Passt. Location ist ab 18 Uhr für uns frei.",
  "Ich bringe Nebel mit, falls wir den Look noch dichter wollen.",
  "Treffpunkt 17:30 am Eingang? Dann haben wir Zeit zum Einleuchten.",
  "Perfekt, bis dann!",
];
