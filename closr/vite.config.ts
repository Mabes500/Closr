import { existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Runs the Vercel functions in api/ inside `npm run dev`, so local development needs no
// Vercel CLI. A request to /api/<name> calls the matching export (POST, GET…) of
// api/<name>.ts with a standard Request, as Vercel does. In production Vercel serves them.
function vercelFunctions(): Plugin {
  return {
    name: 'closr-vercel-functions',
    apply: 'serve',
    configureServer(server) {
      // Functions read process.env; give them .env.local, as Vercel gives them project settings.
      for (const [k, v] of Object.entries(loadEnv(server.config.mode, process.cwd(), ''))) process.env[k] ??= v

      server.middlewares.use(async (req, res, next) => {
        const name = req.url?.match(/^\/api\/([\w-]+)(?:[?#].*)?$/)?.[1]
        if (!name || !existsSync(`api/${name}.ts`)) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
          const request = new Request(new URL(req.url!, `http://${req.headers.host}`), {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          server.ssrFixStacktrace(e as Error)
          next(e)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelFunctions()],
})
