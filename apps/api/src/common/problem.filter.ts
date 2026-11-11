import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

// ADR 001 §2.4: every error leaves the API as RFC 9457 Problem Details.
export type ProblemDetails = { type: string; title: string; status: number; detail?: string };

const TITLES: Record<number, string> = {
  400: "Requisição inválida",
  401: "Não autenticado",
  403: "Sem acesso",
  404: "Não encontrado",
  500: "Erro interno",
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) this.logger.error(exception);

    const body: ProblemDetails = { type: "about:blank", title: TITLES[status] ?? "Erro", status };
    if (exception instanceof HttpException && status < 500) {
      const response = exception.getResponse();
      const detail = typeof response === "string" ? response : (response as { message?: unknown }).message;
      if (typeof detail === "string") body.detail = detail;
    }
    res.status(status).type("application/problem+json").send(JSON.stringify(body));
  }
}
