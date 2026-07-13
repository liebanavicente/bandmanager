import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed de BandManager...");

  await prisma.syncLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.setlistItem.deleteMany();
  await prisma.setlist.deleteMany();
  await prisma.repertoireSong.deleteMany();
  await prisma.repertoire.deleteMany();
  await prisma.song.deleteMany();
  await prisma.eventAttendance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.collaboratorAccess.deleteMany();
  await prisma.memberProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@losvoltios.es",
      passwordHash,
      role: UserRole.ADMIN,
      profile: {
        create: {
          name: "Marcos Liebana",
          instrument: "Guitarra y voz",
          phone: "+34 600 111 001",
          bio: "Fundador de Los Voltios. Gestiona la banda desde 2018.",
          joinedAt: new Date("2018-03-15"),
          availability: "Fines de semana y jueves",
        },
      },
    },
    include: { profile: true },
  });

  const memberUsers = await Promise.all(
    [
      { email: "lucia@losvoltios.es", name: "Lucía Fernández", instrument: "Bajo" },
      { email: "pablo@losvoltios.es", name: "Pablo Ruiz", instrument: "Batería" },
      { email: "sara@losvoltios.es", name: "Sara Molina", instrument: "Teclados" },
      { email: "diego@losvoltios.es", name: "Diego Castro", instrument: "Guitarra" },
    ].map((m) =>
      prisma.user.create({
        data: {
          email: m.email,
          passwordHash,
          role: UserRole.MEMBER,
          profile: {
            create: {
              name: m.name,
              instrument: m.instrument,
              joinedAt: new Date("2019-06-01"),
            },
          },
        },
      }),
    ),
  );

  const collaborator = await prisma.user.create({
    data: {
      email: "tecnicosala@losvoltios.es",
      passwordHash,
      role: UserRole.COLLABORATOR,
      profile: {
        create: {
          name: "Javier Ortega",
          instrument: "Técnico de sonido",
          bio: "Colaborador externo para conciertos.",
        },
      },
    },
  });

  await prisma.collaboratorAccess.create({
    data: {
      userId: collaborator.id,
      areas: ["events", "setlists", "files", "tasks"],
    },
  });

  const demoMember = await prisma.user.create({
    data: {
      email: "miembro@losvoltios.es",
      passwordHash,
      role: UserRole.MEMBER,
      profile: {
        create: {
          name: "Ana Jiménez",
          instrument: "Coros y percusión",
          joinedAt: new Date("2020-01-10"),
        },
      },
    },
  });

  const allMembers = [admin, ...memberUsers, demoMember];

  const songsData = [
    { title: "Luces de Neón", artist: "Los Voltios", durationSeconds: 245, keySignature: "Em", status: "READY" as const, leadVocal: "Marcos", tags: ["directo", "rock"] },
    { title: "Medianoche en Madrid", artist: "Los Voltios", durationSeconds: 198, keySignature: "Am", status: "READY" as const, leadVocal: "Lucía", tags: ["balada"] },
    { title: "Sin Frenos", artist: "Los Voltios", durationSeconds: 210, keySignature: "G", status: "REHEARSED" as const, leadVocal: "Marcos", tags: ["rock", "energética"] },
    { title: "Viento del Sur", artist: "Los Voltios", durationSeconds: 267, keySignature: "D", status: "READY" as const, leadVocal: "Sara", tags: ["directo"] },
    { title: "Carta al Ayer", artist: "Los Voltios", durationSeconds: 312, keySignature: "C", status: "IN_PREPARATION" as const, leadVocal: "Marcos", tags: ["nueva"] },
    { title: "Ritmo de Barrio", artist: "Los Voltios", durationSeconds: 185, keySignature: "F", status: "READY" as const, leadVocal: "Diego", tags: ["funk"] },
    { title: "Estrella Fugaz", artist: "Los Voltios", durationSeconds: 230, keySignature: "Bm", status: "REHEARSED" as const, leadVocal: "Lucía", tags: ["pop-rock"] },
    { title: "Puente Colgante", artist: "Los Voltios", durationSeconds: 275, keySignature: "A", status: "PROPOSED" as const, leadVocal: "Marcos", tags: ["propuesta"] },
    { title: "Lluvia de Verano", artist: "Los Voltios", durationSeconds: 203, keySignature: "E", status: "READY" as const, leadVocal: "Ana", tags: ["acústica"] },
    { title: "Último Tren", artist: "Los Voltios", durationSeconds: 256, keySignature: "Gm", status: "ARCHIVED" as const, leadVocal: "Marcos", tags: ["archivo"] },
  ];

  const songs = await Promise.all(
    songsData.map((s) => prisma.song.create({ data: s })),
  );

  const mainRepertoire = await prisma.repertoire.create({
    data: {
      name: "Repertorio principal",
      description: "Canciones para conciertos estándar de 90 minutos",
      isActive: true,
      notes: "Incluir siempre 'Luces de Neón' como cierre.",
      songs: {
        create: songs.slice(0, 7).map((song, i) => ({
          songId: song.id,
          position: i + 1,
        })),
      },
    },
  });

  const acousticRepertoire = await prisma.repertoire.create({
    data: {
      name: "Versiones acústicas",
      description: "Set reducido para sesiones íntimas",
      songs: {
        create: [songs[1], songs[6], songs[8]].map((song, i) => ({
          songId: song.id,
          position: i + 1,
        })),
      },
    },
  });

  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: "Concierto Sala Copérnico",
        type: "CONCERT",
        startAt: new Date("2026-07-25T21:00:00"),
        endAt: new Date("2026-07-25T23:30:00"),
        venue: "Sala Copérnico",
        address: "Calle de Manuel Silvela, 6, Madrid",
        mapsUrl: "https://maps.google.com/?q=Sala+Copernico+Madrid",
        description: "Presentación del nuevo single 'Luces de Neón'.",
        callTime: new Date("2026-07-25T18:00:00"),
        setupInfo: "Montaje escenario 18:00-19:30",
        soundcheckInfo: "Prueba de sonido 19:30-20:30",
        expectedFeeCents: 250000,
        expectedCostCents: 45000,
        contactName: "Elena Martín",
        contactPhone: "+34 911 222 333",
        status: "CONFIRMED",
      },
    }),
    prisma.event.create({
      data: {
        title: "Ensayo general",
        type: "REHEARSAL",
        startAt: new Date("2026-07-18T19:00:00"),
        endAt: new Date("2026-07-18T22:00:00"),
        venue: "Local de ensayo La Nave",
        address: "Polígono Industrial Norte, nave 12",
        description: "Repasar setlist completo antes del concierto.",
        status: "CONFIRMED",
      },
    }),
    prisma.event.create({
      data: {
        title: "Sesión de grabación EP",
        type: "RECORDING",
        startAt: new Date("2026-08-05T10:00:00"),
        endAt: new Date("2026-08-05T18:00:00"),
        venue: "Estudio Sonora",
        address: "Calle de la Música, 45, Madrid",
        status: "DRAFT",
      },
    }),
    prisma.event.create({
      data: {
        title: "Reunión de merchandising",
        type: "MEETING",
        startAt: new Date("2026-07-14T17:00:00"),
        endAt: new Date("2026-07-14T18:30:00"),
        venue: "Café Central",
        description: "Revisar stock y pedidos pendientes.",
        status: "CONFIRMED",
      },
    }),
  ]);

  for (const event of events) {
    for (const member of allMembers) {
      await prisma.eventAttendance.create({
        data: {
          eventId: event.id,
          userId: member.id,
          status: member.id === demoMember.id ? "PENDING" : "ATTENDING",
        },
      });
    }
  }

  const setlist1 = await prisma.setlist.create({
    data: {
      name: "Setlist Copérnico",
      eventId: events[0].id,
      repertoireId: mainRepertoire.id,
      notes: "Bis: Sin Frenos + Luces de Neón",
      items: {
        create: [
          { type: "SONG", songId: songs[0].id, position: 1 },
          { type: "SONG", songId: songs[2].id, position: 2 },
          { type: "BREAK", position: 3, comment: "Cambio de guitarra" },
          { type: "SONG", songId: songs[3].id, position: 4 },
          { type: "SONG", songId: songs[5].id, position: 5 },
          { type: "SONG", songId: songs[6].id, position: 6 },
          { type: "ENCORE", songId: songs[2].id, position: 7, comment: "Bis 1" },
          { type: "ENCORE", songId: songs[0].id, position: 8, comment: "Cierre" },
        ],
      },
    },
  });

  await prisma.setlist.create({
    data: {
      name: "Setlist acústico promo",
      repertoireId: acousticRepertoire.id,
      items: {
        create: [
          { type: "SONG", songId: songs[1].id, position: 1 },
          { type: "SONG", songId: songs[6].id, position: 2 },
          { type: "SONG", songId: songs[8].id, position: 3 },
        ],
      },
    },
  });

  const tasksData = [
    { title: "Confirmar horario con la sala", assigneeId: admin.id, priority: "HIGH" as const, category: "Logística", eventId: events[0].id },
    { title: "Preparar publicaciones en redes", assigneeId: memberUsers[0].id, priority: "MEDIUM" as const, category: "Marketing" },
    { title: "Revisar stock de camisetas", assigneeId: demoMember.id, priority: "URGENT" as const, category: "Merchandising" },
    { title: "Actualizar repertorio activo", assigneeId: admin.id, priority: "MEDIUM" as const, category: "Música" },
    { title: "Llevar cables de repuesto", assigneeId: memberUsers[1].id, priority: "LOW" as const, category: "Técnica", eventId: events[0].id },
    { title: "Enviar factura a la sala", assigneeId: admin.id, priority: "HIGH" as const, category: "Administración", status: "IN_PROGRESS" as const },
    { title: "Imprimir setlists", assigneeId: memberUsers[2].id, priority: "MEDIUM" as const, category: "Producción", eventId: events[0].id },
    { title: "Reservar furgoneta", assigneeId: memberUsers[3].id, priority: "HIGH" as const, category: "Logística", eventId: events[0].id },
    { title: "Revisar rider técnico", assigneeId: collaborator.id, priority: "MEDIUM" as const, category: "Técnica" },
    { title: "Pedir pegatinas nuevas", assigneeId: demoMember.id, priority: "LOW" as const, category: "Merchandising", status: "DONE" as const },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        title: t.title,
        assigneeId: t.assigneeId,
        creatorId: admin.id,
        priority: t.priority,
        category: t.category,
        eventId: t.eventId,
        status: t.status ?? "PENDING",
        dueAt: new Date("2026-07-20"),
      },
    });
  }

  const productsData = [
    { name: "Camiseta Logo Clásico", category: "Camisetas", priceCents: 2500, costCents: 900, sku: "LV-TSH-001", minStock: 10 },
    { name: "Sudadera Tour 2026", category: "Sudaderas", priceCents: 4500, costCents: 2200, sku: "LV-HOOD-001", minStock: 5 },
    { name: "Vinilo 'Luces de Neón'", category: "Discos", priceCents: 2800, costCents: 1200, sku: "LV-VIN-001", minStock: 8 },
    { name: "CD Autografiado", category: "Discos", priceCents: 1500, costCents: 600, sku: "LV-CD-001", minStock: 15 },
    { name: "Póster Concierto", category: "Pósteres", priceCents: 1200, costCents: 400, sku: "LV-POS-001", minStock: 20 },
    { name: "Pack Pegatinas", category: "Pegatinas", priceCents: 500, costCents: 150, sku: "LV-STK-001", minStock: 30 },
    { name: "Tote Bag Los Voltios", category: "Bolsas", priceCents: 1800, costCents: 700, sku: "LV-BAG-001", minStock: 8 },
    { name: "Pua con logo", category: "Accesorios", priceCents: 300, costCents: 80, sku: "LV-PICK-001", minStock: 50 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        ...p,
        description: `Merchandising oficial: ${p.name}`,
        supplier: "MerchPrint España",
        variants: {
          create: [
            { name: "Talla M / Negro", size: "M", color: "Negro", stock: p.category === "Camisetas" ? 3 : 20, sku: `${p.sku}-M` },
            { name: "Talla L / Negro", size: "L", color: "Negro", stock: 15, sku: `${p.sku}-L` },
          ],
        },
      },
      include: { variants: true },
    });
    products.push(product);
  }

  const ordersData = [
    { orderNumber: "LV-2026-001", customerName: "Carlos Méndez", customerEmail: "carlos@email.com", channel: "WEB" as const, status: "DELIVERED" as const, paymentStatus: "PAID" as const },
    { orderNumber: "LV-2026-002", customerName: "María López", customerEmail: "maria@email.com", channel: "CONCERT" as const, status: "PAID" as const, paymentStatus: "PAID" as const },
    { orderNumber: "LV-2026-003", customerName: "Pedro Sánchez", channel: "DIRECT" as const, status: "PREPARING" as const, paymentStatus: "PAID" as const },
    { orderNumber: "LV-2026-004", customerName: "Laura Vega", customerEmail: "laura@email.com", channel: "WEB" as const, status: "PENDING" as const, paymentStatus: "PENDING" as const },
    { orderNumber: "LV-2026-005", customerName: "Invitado sala", channel: "CONCERT" as const, status: "SHIPPED" as const, paymentStatus: "PAID" as const },
  ];

  for (const [i, o] of ordersData.entries()) {
    const product = products[i % products.length];
    const variant = product.variants[0];
    const qty = i + 1;
    const subtotal = variant ? product.priceCents * qty : product.priceCents;
    await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        channel: o.channel,
        status: o.status,
        paymentStatus: o.paymentStatus,
        subtotalCents: subtotal,
        shippingCents: o.channel === "WEB" ? 450 : 0,
        totalCents: subtotal + (o.channel === "WEB" ? 450 : 0),
        createdById: admin.id,
        notes: i === 1 ? "Venta en concierto Sala Copérnico" : undefined,
        items: {
          create: [{
            productId: product.id,
            variantId: variant?.id,
            quantity: qty,
            unitPriceCents: product.priceCents,
          }],
        },
      },
    });
  }

  const fileCategories = ["CONTRACT", "TECH_RIDER", "POSTER", "LYRICS", "SHEET_MUSIC", "AUDIO", "INTERNAL", "INVOICE"] as const;
  for (let i = 0; i < fileCategories.length; i++) {
    await prisma.fileAsset.create({
      data: {
        name: `Archivo demo ${i + 1}.pdf`,
        description: `Documento de demostración ${fileCategories[i]}`,
        category: fileCategories[i],
        tags: ["demo", "2026"],
        mimeType: "application/pdf",
        sizeBytes: 1024 * (50 + i * 10),
        storagePath: `demo/archivo-${i + 1}.pdf`,
        uploadedById: admin.id,
        eventId: i < 3 ? events[0].id : undefined,
      },
    });
  }

  await prisma.syncLog.create({
    data: {
      provider: "WOOCOMMERCE",
      action: "SYNC_PRODUCTS",
      status: "SUCCESS",
      payload: { synced: products.length },
    },
  });

  console.log("✅ Seed completado.");
  console.log("\nCredenciales de demostración (solo local):");
  console.log("  Admin:         admin@losvoltios.es / demo1234");
  console.log("  Miembro:       miembro@losvoltios.es / demo1234");
  console.log("  Colaborador:   tecnicosala@losvoltios.es / demo1234");
  console.log(`\nSetlist creado: ${setlist1.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());