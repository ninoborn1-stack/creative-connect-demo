// Rechtstexte DE (verbindliche Fassung). Platzhalter in geschweiften Klammern füllt src/components/site/rich.tsx
// aus LEGAL in src/lib/brand.ts: {owner} {company} {legalForm} {email} {authorityName} {authorityUrl}; {app} ist der App-Name.
// Links: [Text](https://…), Hervorhebung: **Text**.
// Hinweis: sorgfältige Vorlage, keine Rechtsberatung. Vor dem breiten Launch gegen einen Generator oder anwaltlich prüfen.

export type LegalSectionText = { id: string; title: string; paras: string[]; address?: boolean; highlight?: boolean };

export const legalDe = {
  common: {
    eyebrow: "Rechtliches",
    updated: "Stand",
    binding: "",
    actingAs: "handelnd unter",
    legalFormNote: "",
  },
  imprint: {
    metaTitle: "Impressum",
    title: "Impressum",
    provider: "Angaben gemäß § 5 DDG",
    contact: "Kontakt",
    email: "E-Mail",
    phone: "Telefon",
    noPhone: "Am schnellsten erreichst du uns per E-Mail.",
    vat: "Umsatzsteuer-ID",
    vatLabel: "Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz",
    responsible: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
    sameAddress: "Anschrift wie oben",
    credits: "Bildnachweise",
    creditsIntro: "Die Fotos stammen von Unsplash und stehen unter der [Unsplash-Lizenz](https://unsplash.com/license). Eine Nennung verlangt die Lizenz nicht, wir führen die Quellen trotzdem auf. Logo und Grafiken sind eigene Gestaltungen, die Icons stammen von [Lucide](https://lucide.dev/license) (ISC-Lizenz).",
    creditsPhoto: "Foto",
    creditsBy: "von",
    sections: [
      { id: "streit", title: "Verbraucherstreitbeilegung", paras: ["Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."] },
      { id: "inhalte", title: "Haftung für Inhalte", paras: ["Wir erstellen die Inhalte dieser Seite mit Sorgfalt, können für Richtigkeit, Vollständigkeit und Aktualität aber keine Gewähr übernehmen. Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich. Erfahren wir von einer Rechtsverletzung, entfernen wir den betroffenen Inhalt umgehend."] },
      { id: "links", title: "Haftung für Links", paras: ["Diese Seite verlinkt auf einige externe Websites, etwa die Datenschutzhinweise von GitHub und Brevo. Für deren Inhalte ist allein der jeweilige Anbieter verantwortlich. Beim Setzen der Links waren keine Rechtsverstöße erkennbar. Werden uns welche bekannt, entfernen wir den Link."] },
      { id: "urheberrecht", title: "Urheberrecht", paras: ["Texte, Gestaltung und Grafiken dieser Seite sind urheberrechtlich geschützt. Eine Nutzung über die gesetzlichen Ausnahmen hinaus ist nur mit unserer Zustimmung erlaubt. Fotos von Dritten sind unten unter Bildnachweise aufgeführt."] },
      { id: "projekt", title: "Über {app}", paras: ["{app} ist ein Projekt der {company}. Der Name ist ein Arbeitstitel und kann sich bis zum Start der App ändern."] },
    ] as LegalSectionText[],
  },
  privacy: {
    metaTitle: "Datenschutz",
    title: "Datenschutz",
    sections: [
      {
        id: "verantwortlicher", title: "Verantwortlicher", address: true,
        paras: [
          "Verantwortlich für die Datenverarbeitung auf dieser Website ist:",
          "Kontakt für alle Fragen zum Datenschutz: {email}. Einen Datenschutzbeauftragten müssen wir nicht benennen.",
        ],
      },
      {
        id: "ueberblick", title: "Kurz vorab",
        paras: [
          "Diese Website ist eine reine Informationsseite. Sie setzt keine Cookies, speichert nichts in deinem Browser und nutzt kein Tracking, keine Reichweitenmessung und keine Werbung. Schriften, Bilder und Hörproben kommen vom selben Server wie die Seite, es werden keine Inhalte von fremden Servern nachgeladen.",
          "Personenbezogene Daten verarbeiten wir darüber hinaus nur, wenn du dich in die Warteliste einträgst, dich für Backstage bewirbst oder uns schreibst.",
        ],
      },
      {
        id: "hosting", title: "Hosting bei GitHub Pages",
        paras: [
          "Die Website wird über GitHub Pages ausgeliefert, einen Dienst der GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Die Verbindung ist per HTTPS verschlüsselt.",
          "Beim Aufruf verarbeitet GitHub technisch notwendige Daten in Server-Logdaten, insbesondere deine IP-Adresse, Datum und Uhrzeit, die aufgerufene Adresse sowie Angaben zu Browser und Betriebssystem. Das ist nötig, um die Seite sicher und stabil bereitzustellen und Angriffe abzuwehren. Rechtsgrundlage ist unser berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO.",
          "Dabei können Daten in die USA übermittelt werden. GitHub ist unter dem EU-US Data Privacy Framework zertifiziert, für das ein Angemessenheitsbeschluss der EU-Kommission besteht (Art. 45 DSGVO). Zusätzlich gelten die Standardvertragsklauseln aus GitHubs Datenschutzvereinbarung. Mehr dazu in der [Datenschutzerklärung von GitHub](https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement) und im [GitHub Data Protection Agreement](https://github.com/customer-terms/github-data-protection-agreement).",
        ],
      },
      {
        id: "browser", title: "Speicherung im Browser",
        paras: [
          "Die Website setzt keine Cookies und legt nichts im localStorage, im sessionStorage oder in IndexedDB ab. Die gewählte Sprache steckt nur in der Adresse (/de/ oder /en/). Der Zustand der Handy-Vorschau liegt nur im Arbeitsspeicher der geöffneten Seite und ist nach dem Neuladen weg.",
          "Wir speichern also nichts auf deinem Gerät und lesen nichts aus, was über die technisch nötige Auslieferung der Seite hinausgeht (§ 25 Abs. 2 TDDDG). Deshalb brauchen wir keine Einwilligung und zeigen kein Cookie-Banner.",
        ],
      },
      {
        id: "vorschau", title: "Interaktive Handy-Vorschau",
        paras: ["Die Vorschau der App läuft vollständig in deinem Browser und zeigt Beispieldaten, keine echten Personen. Was du dort eingibst, etwa eine Chat-Nachricht, wird weder gespeichert noch übertragen."],
      },
      {
        id: "warteliste", title: "Warteliste",
        paras: [
          "Wenn du dich in die Warteliste einträgst, verarbeiten wir deine E-Mail-Adresse und deine Rolle (z. B. Fan, Artist, Venue), freiwillig deine Stadt sowie automatisch die Sprache der Seite und die Quelle (welches Formular du genutzt hast).",
          "Zweck: Wir informieren dich per E-Mail über den Start der App und über {app}, höchstens einmal im Monat. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).",
          "Du kannst die Einwilligung jederzeit widerrufen, über den Abmeldelink in jeder Mail oder per Mail an {email}. Die Verarbeitung bis zum Widerruf bleibt rechtmäßig. Wir speichern deine Daten bis zum Widerruf und löschen sie danach. Deine E-Mail-Adresse kann nach der Abmeldung in einer Sperrliste bleiben, damit du sicher keine Mails mehr bekommst (Art. 6 Abs. 1 lit. f DSGVO).",
        ],
      },
      {
        id: "backstage", title: "Backstage-Bewerbung",
        paras: [
          "Wenn du dich für Backstage bewirbst, verarbeiten wir E-Mail-Adresse, Name, Künstler- oder Firmenname, Rolle, Stadt, Land und deine Links, freiwillig, wer dich empfohlen hat, und deine Nachricht, dazu automatisch die Sprache der Seite und die Quelle. Nennst du eine Person, die dich empfohlen hat, nutzen wir deren Namen nur, um die Empfehlung nachzuvollziehen.",
          "Zweck ist die Prüfung deiner Aufnahme in Backstage und der Kontakt zu deiner Bewerbung. Rechtsgrundlagen sind deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) und die Durchführung vorvertraglicher Maßnahmen auf deine Anfrage (Art. 6 Abs. 1 lit. b DSGVO).",
          "Wir speichern die Angaben bis zur Entscheidung über deine Aufnahme. Bei einer Absage löschen wir sie spätestens sechs Monate danach, bei einer Aufnahme bis zum Ende deiner Mitgliedschaft. Widerruf jederzeit per Mail an {email}.",
        ],
      },
      {
        id: "doi", title: "Double-Opt-in und Protokollierung",
        paras: ["Nach dem Absenden bekommst du eine E-Mail mit einem Bestätigungslink. Erst wenn du ihn anklickst, bist du eingetragen bzw. ist deine Bewerbung bei uns. Zum Nachweis speichern wir den Zeitpunkt der Anmeldung und der Bestätigung sowie die dabei genutzte IP-Adresse. Rechtsgrundlage ist unsere Pflicht, eine Einwilligung nachweisen zu können (Art. 6 Abs. 1 lit. c in Verbindung mit Art. 7 Abs. 1 DSGVO), und unser berechtigtes Interesse, Missbrauch zu verhindern (Art. 6 Abs. 1 lit. f DSGVO)."],
      },
      {
        id: "brevo", title: "Brevo als Auftragsverarbeiter",
        paras: [
          "Für Warteliste und Bewerbung nutzen wir Brevo: Sendinblue SAS, 106 boulevard Haussmann, 75008 Paris, Frankreich. Brevo verarbeitet die Daten in unserem Auftrag in der EU, mit Brevo besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Mehr dazu in der [Datenschutzerklärung von Brevo](https://www.brevo.com/de/legal/privacypolicy/).",
          "Die Formulardaten gehen erst dann an Brevo, wenn du auf Absenden klickst. Beim bloßen Aufruf der Seite besteht keine Verbindung zu Brevo.",
        ],
      },
      {
        id: "kontakt", title: "Kontakt per E-Mail",
        paras: ["Wenn du uns schreibst, verarbeiten wir deine Angaben, um die Anfrage zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn es um einen Vertrag oder eine Anfrage dazu geht, sonst unser berechtigtes Interesse, Anfragen zu beantworten (Art. 6 Abs. 1 lit. f DSGVO). Wir löschen die Angaben, wenn sie nicht mehr gebraucht werden und keine gesetzliche Aufbewahrungspflicht besteht."],
      },
      {
        id: "alter", title: "Mindestalter",
        paras: ["Warteliste und Bewerbung sind erst ab 16 Jahren möglich (Art. 8 DSGVO). Mit dem Häkchen im Formular bestätigst du, dass du mindestens 16 Jahre alt bist."],
      },
      {
        id: "entscheidung", title: "Keine automatisierte Entscheidung, keine Pflicht",
        paras: [
          "Wir treffen keine automatisierten Entscheidungen und betreiben kein Profiling (Art. 22 DSGVO). Über Backstage-Bewerbungen entscheiden Menschen.",
          "Du bist weder gesetzlich noch vertraglich verpflichtet, uns Daten zu geben. Ohne die Pflichtfelder können wir dich allerdings nicht eintragen oder deine Bewerbung nicht prüfen.",
        ],
      },
      {
        id: "rechte", title: "Deine Rechte",
        paras: [
          "Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Eine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3). Eine Mail an {email} genügt.",
          "Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO). Zuständig für uns ist die [{authorityName}]({authorityUrl}).",
        ],
      },
      {
        id: "widerspruch", title: "Widerspruchsrecht", highlight: true,
        paras: ["**Soweit wir Daten auf Grundlage unseres berechtigten Interesses verarbeiten (Art. 6 Abs. 1 lit. f DSGVO), kannst du aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen (Art. 21 DSGVO).** Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die deine Interessen überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen."],
      },
      {
        id: "app", title: "Die spätere App",
        paras: ["Diese Erklärung gilt nur für diese Website. Für die App {app} gibt es zum Start eine eigene Datenschutzerklärung."],
      },
    ] as LegalSectionText[],
  },
};

export type LegalTexts = typeof legalDe;
