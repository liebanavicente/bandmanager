import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ListMusic,
  Music2,
  Package,
  Shield,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";

export type PresentationSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
  accent: string;
};

export const presentationSlides: PresentationSlide[] = [
  {
    id: "intro",
    title: "BandManager",
    subtitle: "Tu banda, organizada",
    description:
      "Plataforma privada para que Los Voltios y cualquier grupo gestionen conciertos, repertorio, logística y merchandising desde un solo lugar.",
    icon: Sparkles,
    highlights: [
      "Diseñada para músicos, no para técnicos",
      "Funciona en móvil y escritorio",
      "Datos centralizados y seguros",
    ],
    accent: "from-violet-600/20 to-fuchsia-500/10",
  },
  {
    id: "dashboard",
    title: "Panel principal",
    subtitle: "Todo lo importante de un vistazo",
    description:
      "Al entrar ves el próximo concierto, ensayos pendientes, tareas urgentes, alertas de stock y pedidos recientes.",
    icon: LayoutDashboard,
    highlights: [
      "Próximo concierto y ensayo",
      "Confirmaciones de asistencia pendientes",
      "Repertorio activo y archivos recientes",
    ],
    accent: "from-blue-600/20 to-violet-500/10",
  },
  {
    id: "events",
    title: "Eventos",
    subtitle: "Conciertos, ensayos y más",
    description:
      "Calendario con conciertos, ensayos, grabaciones y reuniones. Cada evento incluye lugar, horarios, contacto y exportación a calendario (.ics).",
    icon: Calendar,
    highlights: [
      "Confirmación: asistiré / no asistiré / pendiente",
      "Vista lista con filtros por tipo",
      "Resumen de quién ha confirmado",
    ],
    accent: "from-emerald-600/20 to-teal-500/10",
  },
  {
    id: "songs",
    title: "Canciones y repertorio",
    subtitle: "El catálogo musical de la banda",
    description:
      "Registra temas con tonalidad, tempo, estado de ensayo, letras y acordes. Organiza varios repertorios y marca uno como activo.",
    icon: Music2,
    highlights: [
      "Estados: propuesta → lista para directo",
      "Búsqueda por nombre, tonalidad o etiqueta",
      "Reordenar y duplicar repertorios",
    ],
    accent: "from-amber-600/20 to-orange-500/10",
  },
  {
    id: "setlists",
    title: "Setlists",
    subtitle: "Prepara el show canción a canción",
    description:
      "Crea el orden del concierto desde un repertorio o desde cero. Añade pausas, bises y comentarios entre temas.",
    icon: ListMusic,
    highlights: [
      "Duración total calculada automáticamente",
      "Vista escenario: tipografía grande y alto contraste",
      "Acceso rápido a letras y acordes en directo",
    ],
    accent: "from-rose-600/20 to-pink-500/10",
  },
  {
    id: "tasks",
    title: "Tareas internas",
    subtitle: "Logística sin caos",
    description:
      "Asigna responsables, prioridades y fechas límite. Desde confirmar la sala hasta revisar el stock de camisetas.",
    icon: ClipboardList,
    highlights: [
      "Prioridades: baja, media, alta, urgente",
      "Vinculación opcional a un evento",
      "Comentarios y seguimiento de estado",
    ],
    accent: "from-cyan-600/20 to-sky-500/10",
  },
  {
    id: "members",
    title: "Miembros",
    subtitle: "La plantilla del grupo",
    description:
      "Perfiles con instrumento, contacto, biografía y disponibilidad. El administrador puede activar o desactivar usuarios.",
    icon: Users,
    highlights: [
      "Roles: administrador, miembro, colaborador",
      "Contacto de emergencia opcional",
      "Historial de incorporación",
    ],
    accent: "from-indigo-600/20 to-blue-500/10",
  },
  {
    id: "files",
    title: "Archivos privados",
    subtitle: "Riders, contratos y partituras",
    description:
      "Biblioteca documental con categorías, etiquetas y control de permisos. Contratos, riders técnicos, carteles y audios en un solo sitio.",
    icon: FolderOpen,
    highlights: [
      "Categorías: rider, factura, partitura, audio…",
      "Descarga segura por rol",
      "Preparado para almacenamiento en la nube",
    ],
    accent: "from-lime-600/20 to-green-500/10",
  },
  {
    id: "merch",
    title: "Merchandising",
    subtitle: "Productos, stock y ventas",
    description:
      "Gestiona camisetas, vinilos y accesorios con variantes, SKU y alertas de stock mínimo. Registra pedidos y ventas en concierto.",
    icon: Package,
    highlights: [
      "Alertas cuando el stock baja del mínimo",
      "Venta rápida adaptada a móvil",
      "Canales: web, concierto, venta directa",
    ],
    accent: "from-yellow-600/20 to-amber-500/10",
  },
  {
    id: "orders",
    title: "Pedidos",
    subtitle: "Del concierto a la cuenta",
    description:
      "Seguimiento de pedidos con estado de pago y envío. Ideal para registrar ventas en la merch table después del bolo.",
    icon: ShoppingCart,
    highlights: [
      "Formulario rápido en concierto",
      "Estados: pendiente → entregado",
      "Integración futura con WooCommerce",
    ],
    accent: "from-orange-600/20 to-red-500/10",
  },
  {
    id: "security",
    title: "Roles y seguridad",
    subtitle: "Cada uno ve lo que le toca",
    description:
      "Tres niveles de acceso con protección en servidor. Los colaboradores externos solo acceden a las áreas que les asignes.",
    icon: Shield,
    highlights: [
      "Administrador: control total",
      "Miembro: consulta y tareas propias",
      "Colaborador: acceso limitado por área",
    ],
    accent: "from-violet-600/20 to-purple-500/10",
  },
];