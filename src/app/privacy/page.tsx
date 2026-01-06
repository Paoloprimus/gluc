"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

type Lang = 'it' | 'de' | 'en';

const content = {
  en: {
    title: "Privacy Policy",
    lastUpdate: "Last updated: January 2026",
    sections: [
      {
        title: "1. What we collect",
        content: `We only collect data strictly necessary for the service:
        
• **Nickname**: the name you choose to identify yourself
• **Content**: links, images and texts you save in the app
• **Preferences**: theme (light/dark), language, sorting

We don't collect: email, password, payment data, location, contacts.`
      },
      {
        title: "2. How we use data",
        content: `Your data is used exclusively to:

• Allow you to save and organize your content
• Sync data between your devices
• Improve the service based on aggregate usage (anonymous statistics)`
      },
      {
        title: "3. Where we store data",
        content: `Data is stored on secure Supabase servers (cloud provider) based in the European Union. Servers use encryption and are GDPR compliant.`
      },
      {
        title: "4. Who we share data with",
        content: `We don't sell or share your data with third parties, except:

• **Supabase**: our database provider (necessary for operation)

We don't use: advertising tracking, third-party analytics, social login.`
      },
      {
        title: "5. Your rights",
        content: `You have the right to:

• **Access**: know what data we have about you
• **Rectification**: correct your data
• **Deletion**: delete your account and all associated data
• **Portability**: export your data in HTML format

To exercise these rights, contact us.`
      },
      {
        title: "6. Cookies",
        content: `We only use essential technical cookies for:

• Keeping your session active
• Saving your preferences (theme, language)

We don't use profiling or third-party cookies.`
      },
      {
        title: "7. Contact",
        content: `For privacy questions or to exercise your rights:

📧 privacy@fliqk.to`
      }
    ],
    back: "Back to home"
  },
  it: {
    title: "Privacy Policy",
    lastUpdate: "Ultimo aggiornamento: Gennaio 2026",
    sections: [
      {
        title: "1. Cosa raccogliamo",
        content: `Raccogliamo solo i dati strettamente necessari al funzionamento del servizio:
        
• **Nickname**: il nome che scegli per identificarti
• **Contenuti**: i link, le immagini e i testi che salvi nell'app
• **Preferenze**: tema (chiaro/scuro), lingua, ordinamento

Non raccogliamo: email, password, dati di pagamento, posizione, contatti.`
      },
      {
        title: "2. Come usiamo i dati",
        content: `I tuoi dati servono esclusivamente a:

• Permetterti di salvare e organizzare i tuoi contenuti
• Sincronizzare i dati tra i tuoi dispositivi
• Migliorare il servizio in base all'utilizzo aggregato (statistiche anonime)`
      },
      {
        title: "3. Dove conserviamo i dati",
        content: `I dati sono conservati su server sicuri di Supabase (provider cloud) con sede nell'Unione Europea. I server utilizzano crittografia e sono conformi al GDPR.`
      },
      {
        title: "4. Con chi condividiamo i dati",
        content: `Non vendiamo né condividiamo i tuoi dati con terze parti, ad eccezione di:

• **Supabase**: il nostro provider di database (necessario per il funzionamento)

Non usiamo: tracking pubblicitario, analytics di terze parti, social login.`
      },
      {
        title: "5. I tuoi diritti",
        content: `Hai diritto a:

• **Accesso**: sapere quali dati abbiamo su di te
• **Rettifica**: correggere i tuoi dati
• **Cancellazione**: eliminare il tuo account e tutti i dati associati
• **Portabilità**: esportare i tuoi dati in formato HTML

Per esercitare questi diritti, contattaci.`
      },
      {
        title: "6. Cookie",
        content: `Utilizziamo solo cookie tecnici essenziali per:

• Mantenere la tua sessione attiva
• Salvare le tue preferenze (tema, lingua)

Non usiamo cookie di profilazione o di terze parti.`
      },
      {
        title: "7. Contatti",
        content: `Per domande sulla privacy o per esercitare i tuoi diritti:

📧 privacy@fliqk.to`
      }
    ],
    back: "Torna alla home"
  },
  de: {
    title: "Datenschutzerklärung",
    lastUpdate: "Letzte Aktualisierung: Januar 2026",
    sections: [
      {
        title: "1. Was wir sammeln",
        content: `Wir sammeln nur die für den Dienst notwendigen Daten:
        
• **Nickname**: der Name, den du zur Identifizierung wählst
• **Inhalte**: Links, Bilder und Texte, die du in der App speicherst
• **Einstellungen**: Theme (hell/dunkel), Sprache, Sortierung

Wir sammeln nicht: E-Mail, Passwort, Zahlungsdaten, Standort, Kontakte.`
      },
      {
        title: "2. Wie wir die Daten nutzen",
        content: `Deine Daten dienen ausschließlich dazu:

• Dir das Speichern und Organisieren deiner Inhalte zu ermöglichen
• Daten zwischen deinen Geräten zu synchronisieren
• Den Dienst basierend auf aggregierter Nutzung zu verbessern (anonyme Statistiken)`
      },
      {
        title: "3. Wo wir die Daten speichern",
        content: `Die Daten werden auf sicheren Servern von Supabase (Cloud-Anbieter) mit Sitz in der Europäischen Union gespeichert. Die Server verwenden Verschlüsselung und sind DSGVO-konform.`
      },
      {
        title: "4. Mit wem wir Daten teilen",
        content: `Wir verkaufen oder teilen deine Daten nicht mit Dritten, außer:

• **Supabase**: unser Datenbank-Anbieter (für den Betrieb notwendig)

Wir nutzen nicht: Werbe-Tracking, Drittanbieter-Analytics, Social Login.`
      },
      {
        title: "5. Deine Rechte",
        content: `Du hast das Recht auf:

• **Auskunft**: zu wissen, welche Daten wir über dich haben
• **Berichtigung**: deine Daten zu korrigieren
• **Löschung**: dein Konto und alle zugehörigen Daten zu löschen
• **Datenübertragbarkeit**: deine Daten im HTML-Format zu exportieren

Um diese Rechte auszuüben, kontaktiere uns.`
      },
      {
        title: "6. Cookies",
        content: `Wir verwenden nur technisch notwendige Cookies für:

• Das Aufrechterhalten deiner Sitzung
• Das Speichern deiner Einstellungen (Theme, Sprache)

Wir verwenden keine Profiling- oder Drittanbieter-Cookies.`
      },
      {
        title: "7. Kontakt",
        content: `Bei Fragen zum Datenschutz oder zur Ausübung deiner Rechte:

📧 privacy@fliqk.to`
      }
    ],
    back: "Zurück zur Startseite"
  }
};

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    // Detect language
    const detectLang = (): Lang => {
      const localeCookie = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1];
      if (localeCookie === 'de') return 'de';
      if (localeCookie === 'it') return 'it';
      if (localeCookie === 'en') return 'en';
      
      // If no cookie, check browser language
      const browserLangs = navigator.languages || [navigator.language];
      for (const browserLang of browserLangs) {
        const l = browserLang.toLowerCase();
        if (l.startsWith('de')) return 'de';
        if (l.startsWith('it')) return 'it';
        if (l.startsWith('en')) return 'en';
      }
      return 'en'; // Default to English
    };
    
    setLang(detectLang());
  }, []);

  const t = content[lang];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[var(--card-border)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a 
            href="/"
            className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">{t.back}</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">{t.title}</h1>
          <p className="text-sm text-[var(--foreground-muted)]">{t.lastUpdate}</p>
        </div>

        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-bold text-[var(--accent-primary)] mb-3">{section.title}</h2>
              <div className="text-[var(--foreground-muted)] whitespace-pre-line leading-relaxed text-sm">
                {section.content.split('**').map((part, j) => 
                  j % 2 === 1 ? <strong key={j} className="text-[var(--foreground)]">{part}</strong> : part
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--accent-primary)] flex items-center justify-center">
              <span className="text-black font-black text-xs">fl</span>
            </div>
            <span className="font-bold text-[var(--accent-primary)]">fliqk</span>
          </div>
        </div>
      </main>
    </div>
  );
}
