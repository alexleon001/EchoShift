# Pre-Launch Checklist — EchoShift v1.0

## Servidor (Railway)
- [ ] Crear proyecto en Railway
- [ ] Conectar repo Git (subdirectorio `server/`)
- [ ] Configurar variables de entorno:
  - `ANTHROPIC_API_KEY` — API key de Claude
  - `SUPABASE_URL` — URL del proyecto Supabase
  - `SUPABASE_SERVICE_KEY` — Service role key (NO anon key)
  - `REDIS_URL` — URL de Redis (Railway addon o externo)
  - `PORT=3000`
- [ ] Verificar deploy: `https://<tu-app>.railway.app/health`
- [ ] Verificar landing: `https://<tu-app>.railway.app/`
- [ ] Verificar privacy/terms: `/privacy.html`, `/terms.html`
- [ ] Configurar dominio custom: `api.echoshift.app`

## Supabase
- [ ] Habilitar Google OAuth en Authentication > Providers
- [ ] Ejecutar `supabase/schema.sql` en SQL Editor (si no está hecho)
- [ ] Verificar RLS policies están activas en todas las tablas
- [ ] Configurar URL de redirect OAuth: `echoshift://auth-callback`

## App — Configuración
- [ ] Actualizar `EXPO_PUBLIC_API_BASE_URL` a la URL de Railway
- [ ] Actualizar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Revertir echoes iniciales de 999 a 100 en `playerStore.ts`
- [ ] Configurar RevenueCat:
  - [ ] Crear app en RevenueCat dashboard
  - [ ] Agregar API keys en `.env`: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
  - [ ] Crear productos: Echoes packs (100, 500, 1500) + EchoPass mensual
- [ ] Configurar AdMob:
  - [ ] Crear cuenta AdMob
  - [ ] Crear ad unit (rewarded)
  - [ ] Agregar ad unit ID en el código
- [ ] Configurar Sentry:
  - [ ] Crear proyecto en Sentry
  - [ ] Descomentar código en `src/services/errorReporting.ts`
  - [ ] Agregar DSN en `.env`

## Builds
- [ ] `npm install` en `server/` (instalar @fastify/websocket, @fastify/static)
- [ ] `expo install expo-notifications` (para builds nativos)
- [ ] `eas build --platform ios --profile production`
- [ ] `eas build --platform android --profile production`
- [ ] Probar builds en dispositivos físicos

## App Store (iOS)
- [ ] Crear app en App Store Connect
- [ ] Subir screenshots (5 pantallas, iPhone 6.7" + 5.5")
- [ ] Agregar descripción (ver docs/ASO_METADATA.md)
- [ ] Configurar categoría: Games > Puzzle
- [ ] Agregar Privacy Policy URL: `https://echoshift.app/privacy.html`
- [ ] Agregar keywords (ver ASO_METADATA.md)
- [ ] Configurar age rating: 4+
- [ ] Configurar In-App Purchases en App Store Connect
- [ ] Submit para review con `eas submit --platform ios`

## Google Play
- [ ] Crear app en Google Play Console
- [ ] Subir screenshots y feature graphic
- [ ] Agregar descripción corta + larga (ver ASO_METADATA.md)
- [ ] Configurar categoría: Game > Puzzle
- [ ] Configurar content rating questionnaire
- [ ] Agregar Privacy Policy URL
- [ ] Configurar In-App Products
- [ ] Submit con `eas submit --platform android`

## Post-Submit
- [ ] Verificar deep links funcionan en iOS (Universal Links)
- [ ] Verificar deep links funcionan en Android (App Links)
- [ ] Monitorear Sentry para crashes en primeras 24h
- [ ] Preparar posts para redes sociales (screenshots + video corto)
