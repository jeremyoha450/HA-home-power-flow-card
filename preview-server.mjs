import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".yaml": "text/yaml" };
http.createServer(async (request, response) => {
  try {
    const requestedPath = request.url === "/" ? "preview.html" : request.url.replace(/^\/+/, "");
    const path = join(root, requestedPath);
    const body = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
}).listen(4173, "0.0.0.0");
