# Brevo einrichten (Warteliste und Backstage)

Die Seite schickt beide Formulare direkt an Brevo. Brevo verschickt die Bestätigungsmail (Double-Opt-in) und speichert die Kontakte. Im Code muss danach nur noch `src/lib/brand.ts` ergänzt werden. Zeitaufwand: etwa eine Stunde, plus Wartezeit für die DNS-Einträge.

Zentrale Adresse: **nino@threeapesgroup.com**. `<SITE_URL>` ist die Adresse der Seite, aktuell `https://ninoborn1-stack.github.io/creative-connect-demo`.

## 1. Konto anlegen

Auf brevo.com mit `nino@threeapesgroup.com` registrieren und den kostenlosen Plan wählen.

> Screenshot: Startseite Brevo nach dem Login

## 2. Absender und Domain

1. **Senders, Domains & Dedicated IPs → Senders**: Absender hinzufügen, Name „Bubblegum“, Adresse `nino@threeapesgroup.com`, Bestätigungsmail anklicken.
2. **Domains**: `threeapesgroup.com` hinzufügen und **authentifizieren**. Brevo zeigt drei DNS-Einträge (Brevo-Code, DKIM, DMARC). Diese beim Domain-Anbieter eintragen und in Brevo auf „Authentifizieren“ klicken. Das kann einige Stunden dauern.

Ohne Authentifizierung landen die Bestätigungsmails oft im Spam.

> Screenshot: Domain-Status „Authentifiziert“

## 3. Kontakt-Attribute

**Contacts → Settings → Contact attributes**, alle vom Typ *Text*, außer `ROLLE`:

| Attribut | Typ | Werte bzw. Inhalt |
| --- | --- | --- |
| `ROLLE` | Kategorie | `fan`, `artist`, `producer`, `studio`, `venue`, `veranstalter`, `unternehmen`, `label` |
| `STADT` | Text | frei |
| `SPRACHE` | Text | `de` oder `en` |
| `QUELLE` | Text | `warteliste` oder `backstage` |
| `NAME` | Text | Backstage |
| `KUENSTLERNAME` | Text | Backstage |
| `LAND` | Text | Backstage |
| `LINKS` | Text | Backstage, mehrere Zeilen |
| `EMPFOHLEN_VON` | Text | Backstage, optional |
| `NACHRICHT` | Text | Backstage, optional, höchstens 500 Zeichen |

Die Werte von `ROLLE` müssen genau so geschrieben werden, die Seite sendet sie in dieser Form. `producer` kommt nur aus der Backstage-Bewerbung.

> Screenshot: Liste der Attribute

## 4. Listen

**Contacts → Lists**: zwei Listen anlegen, `Warteliste` und `Backstage-Bewerbungen`.

## 5. Vier Formulare

**Contacts → Forms → Subscription form**, viermal. Jedes Formular mit **Double-Opt-in**, eigener Bestätigungsmail (Texte unten) und Weiterleitung nach der Bestätigung:

| Formular | Liste | Sprache | Weiterleitung nach Bestätigung |
| --- | --- | --- | --- |
| Warteliste DE | Warteliste | Deutsch | `<SITE_URL>/de/bestaetigt/` |
| Warteliste EN | Warteliste | Englisch | `<SITE_URL>/en/confirmed/` |
| Backstage DE | Backstage-Bewerbungen | Deutsch | `<SITE_URL>/de/bestaetigt/?backstage=1` |
| Backstage EN | Backstage-Bewerbungen | Englisch | `<SITE_URL>/en/confirmed/?backstage=1` |

Felder im Formular: Brevo nimmt nur Felder an, die es auch im Formular gibt. Versteckte Felder sind erlaubt.

- **Warteliste:** E-Mail, `ROLLE`, `STADT`, `SPRACHE` (versteckt), `QUELLE` (versteckt)
- **Backstage:** E-Mail, `NAME`, `KUENSTLERNAME`, `ROLLE`, `STADT`, `LAND`, `LINKS`, `EMPFOHLEN_VON`, `NACHRICHT`, `SPRACHE` (versteckt), `QUELLE` (versteckt)

Das Aussehen des Brevo-Formulars ist egal, die Seite nutzt ihr eigenes Formular.

> Screenshot: Formular-Einstellungen mit Double-Opt-in und Weiterleitung

## 6. Adressen in `brand.ts` eintragen

In jedem Formular unter **Share → Embed** den HTML-Code öffnen und die Adresse aus `<form … action="https://….sibforms.com/serve/…">` kopieren. In `src/lib/brand.ts`:

```ts
export const BREVO = {
  waitlist: { de: "https://….sibforms.com/serve/…", en: "https://….sibforms.com/serve/…" },
  backstage: { de: "https://….sibforms.com/serve/…", en: "https://….sibforms.com/serve/…" },
} as const;
```

Committen und pushen, die Seite baut sich neu. Solange eine Adresse leer ist, zeigt das jeweilige Formular beim Absenden „Öffnet in Kürze“.

## 7. Testen

Für jedes der vier Formulare:

1. Seite öffnen (`/de/warteliste/`, `/en/warteliste/`, `/de/backstage/`, `/en/backstage/`), mit einer eigenen Adresse ausfüllen und absenden. Die Seite zeigt „Fast geschafft. Bitte bestätige deine E-Mail.“
2. Bestätigungsmail prüfen (Absender Bubblegum, nicht im Spam), Button klicken.
3. Die Weiterleitung landet auf der Danke-Seite, bei Backstage mit dem Text „Deine Bewerbung ist eingegangen. Wir melden uns.“
4. In Brevo unter **Contacts** den Kontakt öffnen: richtige Liste, alle Attribute gefüllt, `SPRACHE` und `QUELLE` stimmen.

Gut zu wissen: Die Seite sendet mit `mode: "no-cors"`, die Antwort von Brevo ist im Browser nicht lesbar. Ob ein Kontakt angekommen ist, siehst du nur in Brevo. Fehler, die die Seite anzeigen kann: fehlende Pflichtfelder und keine Internetverbindung.

## Texte für die Bestätigungsmails

### Deutsch

- **Betreff:** Bitte bestätige deine E-Mail für Bubblegum
- **Text:** Schön, dass du dabei bist. Bestätige kurz deine Adresse, dann stehst du auf der Liste.
- **Button:** E-Mail bestätigen
- **Hinweis:** Du kannst dich jederzeit über den Link in jeder Mail abmelden.
- **Fußzeile:** Bubblegum ist ein Projekt der ThreeApesGroup. Impressum: `<SITE_URL>/de/impressum/`

Backstage, Variante:

- **Betreff:** Bitte bestätige deine Backstage-Bewerbung
- **Text:** Danke für deine Bewerbung. Bestätige kurz deine Adresse, dann prüfen wir deine Angaben.

### English

- **Subject:** Please confirm your email for Bubblegum
- **Text:** Great to have you. Confirm your address and you’re on the list.
- **Button:** Confirm email
- **Note:** You can unsubscribe any time via the link in every email.
- **Footer:** Bubblegum is a ThreeApesGroup project. Imprint: `<SITE_URL>/en/impressum/`

Backstage, variant:

- **Subject:** Please confirm your Backstage application
- **Text:** Thanks for applying. Confirm your address and we’ll review your details.
