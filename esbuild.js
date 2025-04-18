import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/*---------------------------- DEFAULT CODE START --------------------------------------------- */
const ROOT_PATH = import.meta.dirname;
/*---------------------------- DEFAULT CODE END -----------------------------------------------*/

/*---------------------------- WINDOWS CODE START --------------------------------------------- */
//const __filename = fileURLToPath(import.meta.url);
//const ROOT_PATH = dirname(__filename);
/*---------------------------- WINDOWS CODE END -----------------------------------------------*/

const FRONTEND_PATH = path.join(ROOT_PATH, "frontend");
const OUT_PATH = path.join(ROOT_PATH, "backend", "static", "dist");

const isDev = process.env.NODE_ENV === "development";

if (fs.existsSync(OUT_PATH)) {
  fs.rmSync(OUT_PATH, { recursive: true, force: true });
}

const CONFIG = {
  entryPoints: [
    path.join(FRONTEND_PATH, "index.ts"),
    path.join(FRONTEND_PATH, "games", "index.ts"),
  ],
  bundle: true,
  outdir: path.join(OUT_PATH),
  minify: !isDev,
  sourcemap: isDev,
  logLevel: "debug",
};

if (isDev) {
  async function watch() {
    let ctx = await esbuild.context(CONFIG);
    await ctx.watch();
    console.log("Watching...");
  }
  watch();
} else {
  await esbuild.build(CONFIG);
}
