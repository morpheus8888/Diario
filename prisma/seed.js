const { PrismaClient } = require("@prisma/client")
const { randomBytes, scryptSync } = require("crypto")

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16)
  const derivedKey = scryptSync(password, salt, 64, { N: 1 << 14, r: 8, p: 1 })
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`
}

async function main() {
  const email = "demo@example.com"
  const password = "password123"

  const passwordHash = hashPassword(password)

  const user = await prisma.devUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
    },
  })

  const existingEntries = await prisma.entry.count({
    where: { userId: user.id },
  })

  if (existingEntries === 0) {
    await prisma.entry.createMany({
      data: [
        {
          userId: user.id,
          title: "Benvenuto nel tuo diario",
          mood: "sereno",
          tags: ["benvenuto", "setup"],
          content: {
            time: Date.now(),
            version: "2.29.1",
            blocks: [
              {
                id: "intro",
                type: "paragraph",
                data: {
                  text: "Questa è una entry di esempio. Modificala liberamente per prendere confidenza con l'editor.",
                },
              },
            ],
          },
          createdAt: new Date(),
        },
        {
          userId: user.id,
          title: "Idee per la settimana",
          mood: "ispirato",
          tags: ["idee", "pianificazione"],
          content: {
            time: Date.now(),
            version: "2.29.1",
            blocks: [
              {
                id: "tasks",
                type: "list",
                data: {
                  style: "unordered",
                  items: [
                    "Raccogli spunti per nuovi articoli",
                    "Sperimenta la vista calendario",
                    "Definisci i tag più usati",
                  ],
                },
              },
            ],
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
          userId: user.id,
          title: "Retrospettiva",
          mood: "riflessivo",
          tags: ["retro", "settimanale"],
          content: {
            time: Date.now(),
            version: "2.29.1",
            blocks: [
              {
                id: "summary",
                type: "paragraph",
                data: {
                  text: "Questa settimana ho sperimentato il nuovo journaling calendar e organizzato le idee per il progetto.",
                },
              },
              {
                id: "quote",
                type: "quote",
                data: {
                  text: "Scrivere ogni giorno aiuta a mettere ordine nei pensieri.",
                  caption: "",
                },
              },
            ],
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        },
      ],
    })
  }

  console.log("Seed completato. Credenziali demo:")
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
