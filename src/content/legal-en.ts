import type { LegalTexts } from "@/content/legal-de";

// Legal texts EN (translation; the German version is legally binding). Placeholders: see legal-de.ts.

export const legalEn: LegalTexts = {
  common: {
    eyebrow: "Legal",
    updated: "Last updated",
    binding: "This is a translation for convenience. The German version is legally binding.",
    actingAs: "trading as",
    legalFormNote: "sole proprietorship",
  },
  imprint: {
    metaTitle: "Imprint",
    title: "Imprint",
    provider: "Information pursuant to § 5 DDG (German Digital Services Act)",
    contact: "Contact",
    email: "Email",
    phone: "Phone",
    noPhone: "The fastest way to reach us is by email.",
    vat: "VAT ID",
    vatLabel: "VAT identification number pursuant to § 27a of the German VAT Act",
    responsible: "Responsible for content pursuant to § 18 (2) MStV",
    sameAddress: "address as above",
    credits: "Image credits",
    creditsIntro: "The photos come from Unsplash and are used under the [Unsplash License](https://unsplash.com/license). The license does not require attribution, we list the sources anyway. Logo and graphics are our own designs, the icons come from [Lucide](https://lucide.dev/license) (ISC License).",
    creditsPhoto: "Photo",
    creditsBy: "by",
    sections: [
      { id: "streit", title: "Consumer dispute resolution", paras: ["We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board."] },
      { id: "inhalte", title: "Liability for content", paras: ["We create the content of this site with care but cannot guarantee that it is correct, complete and up to date. We are responsible for our own content under general law. If we learn of an infringement, we remove the content concerned without delay."] },
      { id: "links", title: "Liability for links", paras: ["This site links to a few external websites, such as the privacy notices of GitHub and Brevo. Their content is the sole responsibility of the respective provider. No infringements were apparent when the links were set. If we become aware of any, we remove the link."] },
      { id: "urheberrecht", title: "Copyright", paras: ["Texts, design and graphics on this site are protected by copyright. Any use beyond the statutory exceptions requires our consent. Third party photos are listed below under image credits."] },
      { id: "projekt", title: "About {app}", paras: ["{app} is a project of {company}. The name is a working title and may change before the app launches."] },
    ],
  },
  privacy: {
    metaTitle: "Privacy",
    title: "Privacy",
    sections: [
      {
        id: "verantwortlicher", title: "Controller", address: true,
        paras: [
          "The controller responsible for data processing on this website is:",
          "Contact for all privacy questions: {email}. We are not required to appoint a data protection officer.",
        ],
      },
      {
        id: "ueberblick", title: "In short",
        paras: [
          "This website is purely informational. It sets no cookies, stores nothing in your browser and uses no tracking, no analytics and no advertising. Fonts, images and audio samples come from the same server as the site, nothing is loaded from third party servers.",
          "Beyond that, we only process personal data if you join the waitlist, apply for Backstage or email us.",
        ],
      },
      {
        id: "hosting", title: "Hosting on GitHub Pages",
        paras: [
          "The website is served via GitHub Pages, a service of GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. The connection is encrypted via HTTPS.",
          "When you visit, GitHub processes technically necessary data in server logs, in particular your IP address, date and time, the requested address and details about your browser and operating system. This is needed to provide the site securely and reliably and to fend off attacks. The legal basis is our legitimate interest under Art. 6 (1) (f) GDPR.",
          "Data may be transferred to the USA in the process. GitHub is certified under the EU-US Data Privacy Framework, which is covered by an adequacy decision of the European Commission (Art. 45 GDPR). In addition, the standard contractual clauses in GitHub’s data protection agreement apply. See the [GitHub privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) and the [GitHub Data Protection Agreement](https://github.com/customer-terms/github-data-protection-agreement).",
        ],
      },
      {
        id: "browser", title: "Storage in your browser",
        paras: [
          "The website sets no cookies and stores nothing in localStorage, sessionStorage or IndexedDB. The language you choose is only part of the address (/de/ or /en/). The state of the phone preview lives only in the memory of the open page and is gone after reloading.",
          "So we store nothing on your device and read nothing from it beyond what is technically required to deliver the site (§ 25 (2) TDDDG). That is why we need no consent and show no cookie banner.",
        ],
      },
      {
        id: "vorschau", title: "Interactive phone preview",
        paras: ["The app preview runs entirely in your browser and shows sample data, not real people. Anything you type there, such as a chat message, is neither stored nor transmitted."],
      },
      {
        id: "warteliste", title: "Waitlist",
        paras: [
          "If you join the waitlist, we process your email address and your role (e.g. fan, artist, venue), optionally your city, and automatically the language of the page and the source (which form you used).",
          "Purpose: we email you about the app launch and about {app}, at most once a month. The legal basis is your consent (Art. 6 (1) (a) GDPR).",
          "You can withdraw your consent at any time via the unsubscribe link in every email or by writing to {email}. Processing up to the withdrawal remains lawful. We keep your data until you withdraw and delete it afterwards. Your email address may stay on a suppression list after you unsubscribe so that you reliably get no more emails (Art. 6 (1) (f) GDPR).",
        ],
      },
      {
        id: "backstage", title: "Backstage application",
        paras: [
          "If you apply for Backstage, we process your email address, name, artist or company name, role, city, country and your links, optionally who referred you and your message, and automatically the language of the page and the source. If you name a person who referred you, we use their name only to check the referral.",
          "The purpose is to review your admission to Backstage and to contact you about your application. The legal bases are your consent (Art. 6 (1) (a) GDPR) and steps taken at your request prior to entering into a contract (Art. 6 (1) (b) GDPR).",
          "We keep the details until we decide on your admission. If you are not admitted, we delete them no later than six months after that decision; if you are admitted, we keep them until your membership ends. You can withdraw any time by writing to {email}.",
        ],
      },
      {
        id: "doi", title: "Double opt-in and records",
        paras: ["After you submit, you get an email with a confirmation link. Only once you click it are you on the list or is your application with us. As proof, we store the time of sign up and of confirmation and the IP address used. The legal basis is our obligation to be able to prove consent (Art. 6 (1) (c) in conjunction with Art. 7 (1) GDPR) and our legitimate interest in preventing misuse (Art. 6 (1) (f) GDPR)."],
      },
      {
        id: "brevo", title: "Brevo as processor",
        paras: [
          "For the waitlist and applications we use Brevo: Sendinblue SAS, 106 boulevard Haussmann, 75008 Paris, France. Brevo processes the data on our behalf in the EU under a data processing agreement pursuant to Art. 28 GDPR. See the [Brevo privacy policy](https://www.brevo.com/legal/privacypolicy/).",
          "Form data is only sent to Brevo once you click submit. Simply visiting the site creates no connection to Brevo.",
        ],
      },
      {
        id: "kontakt", title: "Contact by email",
        paras: ["If you email us, we process your details to handle the request. The legal basis is Art. 6 (1) (b) GDPR where it concerns a contract or a request about one, otherwise our legitimate interest in answering requests (Art. 6 (1) (f) GDPR). We delete the details once they are no longer needed and no statutory retention obligation applies."],
      },
      {
        id: "alter", title: "Minimum age",
        paras: ["The waitlist and applications are only open to people aged 16 or over (Art. 8 GDPR). By ticking the box in the form you confirm that you are at least 16."],
      },
      {
        id: "entscheidung", title: "No automated decisions, no obligation",
        paras: [
          "We make no automated decisions and do no profiling (Art. 22 GDPR). Backstage applications are decided by people.",
          "You are under no legal or contractual obligation to give us data. Without the required fields, however, we cannot add you to the list or review your application.",
        ],
      },
      {
        id: "rechte", title: "Your rights",
        paras: [
          "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18) and data portability (Art. 20). You can withdraw consent at any time with effect for the future (Art. 7 (3)). An email to {email} is enough.",
          "You can also lodge a complaint with a data protection supervisory authority (Art. 77 GDPR). The authority responsible for us is the [{authorityName}]({authorityUrl}).",
        ],
      },
      {
        id: "widerspruch", title: "Right to object", highlight: true,
        paras: ["**Where we process data on the basis of our legitimate interest (Art. 6 (1) (f) GDPR), you can object at any time on grounds relating to your particular situation (Art. 21 GDPR).** We will then stop processing the data unless we can demonstrate compelling legitimate grounds that override your interests, or the processing serves to establish, exercise or defend legal claims."],
      },
      {
        id: "app", title: "The future app",
        paras: ["This policy only covers this website. The {app} app will have its own privacy policy at launch."],
      },
    ],
  },
};
