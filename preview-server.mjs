import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("./", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const types = { ".html": "text/html", ".js": "text/javascript", ".yaml": "text/yaml" };
http.createServer(async (request, response) => {
  try {
    const path = join(root, request.url === "/" ? "preview.html" : request.url);
    const body = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404); response.end("Not found");
  }
}).listen(8765, "0.0.0.0");
