import { NextResponse } from 'next/server';

/**
 * Códigos de error estandarizados para AddContent
 */
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

interface ErrorDetails {
  message: string;
  code: ErrorCode;
  status: number;
}

/**
 * Mapea errores comunes y excepciones a respuestas estandarizadas.
 */
export function handleApiError(error: any, context: string): NextResponse {
  console.error(`[AddContent Contingency] Error en ${context}:`, error);

  const errorResponse: ErrorDetails = {
    message: 'Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.',
    code: ErrorCode.INTERNAL_ERROR,
    status: 500,
  };

  // Mapeo de errores específicos (ej. Prisma, Auth, etc)
  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      errorResponse.message = 'Ya existe un registro con estos datos únicos.';
      errorResponse.code = ErrorCode.CONFLICT;
      errorResponse.status = 409;
    } else if (error.code === 'P2025') {
      errorResponse.message = 'El registro solicitado no existe.';
      errorResponse.code = ErrorCode.NOT_FOUND;
      errorResponse.status = 404;
    }
  }

  // Manejo de errores controlados (si pasamos un objeto con status)
  if (error.status && error.message) {
    errorResponse.message = error.message;
    errorResponse.status = error.status;
    errorResponse.code = error.code || ErrorCode.BAD_REQUEST;
  }

  return NextResponse.json(
    {
      error: errorResponse.message,
      code: errorResponse.code,
      context: process.env.NODE_ENV === 'development' ? context : undefined,
    },
    { status: errorResponse.status }
  );
}

/**
 * Helper para lanzar errores controlados
 */
export function throwApiError(message: string, status: number = 400, code: ErrorCode = ErrorCode.BAD_REQUEST) {
  const error: any = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
}
