import { Controller, Get } from "@nestjs/common";

export type HealthResponse = {
  status: "ok";
  timestamp: string;
};

// Liveness only: confirms the process is up and answering requests.
// It deliberately does not touch the database (readiness is a separate concern).
@Controller("health")
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
