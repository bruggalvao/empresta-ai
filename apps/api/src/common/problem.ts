import { HttpException } from "@nestjs/common";

// An HttpException carrying a machine-readable `reason`, emitted as an
// RFC 9457 extension member by ProblemDetailsFilter. The interface picks
// its label from `reason`, never by matching the human text in `detail`.
export class Problem extends HttpException {
  constructor(status: number, reason: string, detail: string) {
    super({ message: detail, reason }, status);
  }
}
