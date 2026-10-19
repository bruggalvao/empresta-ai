import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { configureApp } from "../app.setup.js";

describe("GET /v1/health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("responds 200 with status ok and an ISO timestamp", async () => {
    const res = await request(app.getHttpServer()).get("/v1/health").expect(200);

    expect(res.body.status).toBe("ok");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("is not exposed outside the versioned prefix", async () => {
    await request(app.getHttpServer()).get("/health").expect(404);
  });

  it("only answers GET", async () => {
    await request(app.getHttpServer()).post("/v1/health").expect(404);
  });
});
