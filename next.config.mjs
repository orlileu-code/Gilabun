import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyUndiciPath = path.resolve(__dirname, "src", "lib", "empty-undici.js");
// Browser ESM builds (no Node/undici)
const firebaseAuthBrowserPath = path.resolve(
  __dirname,
  "node_modules",
  "firebase",
  "auth",
  "dist",
  "esm",
  "index.esm.js"
);
const firebaseAuthPkgBrowserPath = path.resolve(
  __dirname,
  "node_modules",
  "firebase",
  "node_modules",
  "@firebase",
  "auth",
  "dist",
  "esm2017",
  "index.js"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["firebase", "firebase-admin", "@firebase/auth", "undici"],
  webpack: (config, { isServer, webpack: wp }) => {
    if (!isServer) {
      config.resolve.conditionNames = ["browser", "module", "import", "require", "default"];
      config.resolve.alias = {
        ...config.resolve.alias,
        // Override: use browser builds so Node/undici is never loaded
        "firebase/auth": firebaseAuthBrowserPath,
        "@firebase/auth": firebaseAuthPkgBrowserPath,
        undici: emptyUndiciPath,
        "undici/lib/web/fetch/util": emptyUndiciPath,
        "undici/lib/web/fetch/util.js": emptyUndiciPath,
        "undici/lib/web/fetch/index": emptyUndiciPath,
        "undici/lib/web/fetch/index.js": emptyUndiciPath,
        "undici/lib/web/fetch/response": emptyUndiciPath,
        "undici/lib/web/fetch/response.js": emptyUndiciPath,
        "undici/lib/web/fetch/request": emptyUndiciPath,
        "undici/lib/web/fetch/request.js": emptyUndiciPath,
      };
      if (wp) {
        // Replace firebase/auth with browser ESM build
        config.plugins.push(
          new wp.NormalModuleReplacementPlugin(
            /^firebase\/auth$/,
            firebaseAuthBrowserPath
          )
        );
        // Replace @firebase/auth with browser build (firebase/auth re-exports it; avoid node-esm → undici)
        config.plugins.push(
          new wp.NormalModuleReplacementPlugin(
            /^@firebase\/auth$/,
            firebaseAuthPkgBrowserPath
          )
        );
        // Stub undici if anything still requests it
        config.plugins.push(
          new wp.NormalModuleReplacementPlugin(/^undici(\/|$)/, emptyUndiciPath)
        );
      }
    }
    return config;
  },
};

export default nextConfig;

