const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".apk": "application/vnd.android.package-archive",
};

const server = http.createServer((req, res) => {
  let file = req.url.split("?")[0];
  if (file === "/" || file === "") file = "/index.html";
  const filePath = path.join(__dirname, file);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end("Not Found");
    }
    const ext = path.extname(filePath);
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": stat.size,
    };
    if (ext === ".apk") {
      headers["Content-Disposition"] = 'attachment; filename="brainlytics.apk"';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
