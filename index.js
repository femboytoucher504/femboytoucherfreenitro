{
  "name": "freenitroemojis",
  "type": "module",
  "scripts": {
    "build": "esbuild index.ts --bundle --minify --format=esm --external:@vendetta/* --outfile=dist/index.js && cp manifest.json dist/manifest.json"
  },
  "devDependencies": {
    "esbuild": "^0.20.0"
  }
}
