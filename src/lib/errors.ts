export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toActionError(error: unknown): { error: string } {
  if (error instanceof AppError) {
    return { error: error.message };
  }
  if (error instanceof Error) {
    if (error.message === "FORBIDDEN") {
      return { error: "No tienes permisos para realizar esta acción." };
    }
    if (error.message === "UNAUTHORIZED") {
      return { error: "Debes iniciar sesión." };
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return { error: "Stock insuficiente." };
    }
  }
  console.error(error);
  return { error: "Ha ocurrido un error inesperado." };
}