# 🔗 Gluc Link

**links that stick**

Un'app PWA per salvare, taggare e condividere link con l'aiuto dell'AI.

## ✨ Funzionalità

- 🏷️ **Tag automatici** - L'AI analizza ogni link e genera tag rilevanti
- 📝 **Descrizioni AI** - Sommari automatici del contenuto
- 📤 **Condivisione social** - Genera post formattati per Twitter, LinkedIn, Facebook
- 💾 **Export** - Esporta in JSON, CSV o HTML
- 🔍 **Ricerca e filtri** - Trova rapidamente i tuoi link
- 📱 **PWA** - Installabile come app nativa

## 🚀 Quick Start

```bash
# Installa dipendenze
npm install

# Avvia in development
npm run dev

# Build per production
npm run build
```

## ⚙️ Configurazione

### API Key Claude

L'app richiede una API key di Anthropic per l'analisi AI dei link.

1. Vai su [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Crea una nuova API key
3. Inseriscila nelle impostazioni dell'app (icona ⚙️)

La key è salvata solo nel browser e non viene mai inviata a server terzi.

### Supabase (opzionale)

Per sincronizzare i link tra dispositivi:

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Copia URL e anon key
3. Crea un file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 🎨 Tech Stack

- **Next.js 16** - React framework
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animazioni
- **Claude API** - AI analysis
- **Supabase** - Database (opzionale)

## 📱 PWA

L'app è installabile come PWA:

- **iOS**: Safari → Condividi → Aggiungi alla schermata Home
- **Android**: Chrome → Menu → Installa app
- **Desktop**: Chrome → Barra URL → Icona installa

## 💜 Credits

Un regalo per Giulia, Giusy e Lucia.

---

Made with 💜 and ✨ AI
