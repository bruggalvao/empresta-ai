// Vercel serverless entry. The Nest app is compiled by `pnpm build` into dist/
// and bootstrapped once per container; later requests reuse the cached Express
// instance, avoiding the DI container bootstrap cost on every call (ADR 001 §2.3).
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../dist/app.module.js";
import { configureApp } from "../dist/app.setup.js";

let cachedApp;

function getApp() {
  cachedApp ??= (async () => {
    const app = await NestFactory.create(AppModule);
    configureApp(app);
    await app.init();
    return app.getHttpAdapter().getInstance();
  })();
  return cachedApp;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
