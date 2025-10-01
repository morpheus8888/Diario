# Diario

Modulo journaling basato su Next.js pensato per essere montato all'interno di un progetto esistente. L'app è stata snellita per
l'utilizzo come route `/journal`: niente landing, subscription o provider esterni, solo editor a blocchi, calendario e CRUD delle
entry.

## Requisiti principali

- **Next.js 14** con App Router
- **Prisma** con database Postgres compatibile (es. Vercel Postgres)
- **Tailwind CSS** + componenti shadcn/ui
- Editor a blocchi con **Editor.js** (salvataggio in JSON)
- Autenticazione di sviluppo tramite adattatore pluggable

## Setup

1. Installare le dipendenze (pnpm):

   ```sh
   pnpm install
   ```

2. Copiare l'esempio di configurazione:

   ```sh
   cp .env.example .env.local
   ```

3. Configurare le variabili principali:

   ```env
   DATABASE_URL=postgres://...
   DEV_AUTH_ENABLED=true
   ```

   > In produzione `DEV_AUTH_ENABLED` **deve** essere disattivato. Domani sarà sufficiente fornire un nuovo adapter che legga gli
   > utenti dal progetto principale.

4. Eseguire le migrazioni Prisma:

   ```sh
   pnpm prisma migrate dev
   ```

5. Popolare il database con un utente e 3 entry di esempio:

   ```sh
   pnpm prisma db seed
   ```

6. Avviare l'applicazione:

   ```sh
   pnpm dev
   ```

   L'interfaccia è disponibile all'URL `/journal`. Le pagine `/auth/dev/signin` e `/auth/dev/signup` sono attive solo quando
   `DEV_AUTH_ENABLED=true` e permettono di creare utenti di sviluppo.

## Struttura principale

- `prisma/schema.prisma` – definizione dei modelli `DevUser`, `DevSession` e `Entry`
- `src/lib/auth` – interfaccia `AuthAdapter`, adapter di sviluppo e helper per gestire hash/sessions
- `src/server/actions/entries.ts` – server actions per CRUD, rate-limit e filtri per `userId`
- `src/app/journal` – layout protetto, calendario, editor, export JSON/Markdown
- `src/components/journal` – editor a blocchi e calendario basato su shadcn + React DayPicker

## Dev Auth

L'autenticazione di sviluppo è stata pensata per essere facilmente sostituibile:

- `AuthAdapter` espone `getCurrentUserId`, `signIn`, `signOut`, `createUser`
- `DevAuthAdapter` memorizza utenti e sessioni nel database e usa cookie `HttpOnly`
- le funzioni applicative leggono l'utente solo tramite `getCurrentUserIdFromAdapter`

Per passare all'auth del sito principale è sufficiente implementare un nuovo adapter e disattivare quello di sviluppo.

## Calendario & editor

- `<JournalCalendar />` mostra le entry con vista giorno/settimana/mese/intervallo, filtri per tag e shortcut “Oggi / Questa
  settimana / Questo mese”
- `<JournalEditor />` utilizza Editor.js per i blocchi, consente di impostare titolo, mood, tag (separati da virgola) e data
  dell'entry
- tutte le operazioni sono filtrate per `userId` e aggiornano la UI tramite `revalidatePath`

## Export

Sono disponibili due route protette:

- `/journal/export.json` – esporta tutte le entry dell'utente in formato JSON
- `/journal/export.md` – esporta in Markdown convertendo i blocchi di Editor.js (heading, paragrafi, liste, checklist, quote,
  immagini)

## Note

- Le password degli utenti di sviluppo sono gestite tramite un hash sicuro basato su `crypto.scrypt`, pensato per essere
  sostituito da un'implementazione bcrypt production-ready quando verrà integrato l'adapter del sito principale.
- Tutto il codice superfluo legato a Clerk, Stripe, Resend e marketing è stato rimosso.
