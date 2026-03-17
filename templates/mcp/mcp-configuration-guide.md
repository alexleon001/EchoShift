# Guía de Configuración MCP para AI Coding Agents

Esta guía explica cómo configurar MCP (Model Context Protocol) servers para diferentes herramientas de AI coding: **Claude Code**, **OpenCode**, **Codex CLI**, y **Gemini CLI**.

---

## Tabla de Contenidos

1. [Resumen de Formatos](#resumen-de-formatos)
2. [Formato de Variables](#formato-de-variables)
3. [Claude Code](#claude-code)
4. [OpenCode](#opencode)
5. [Codex CLI](#codex-cli)
6. [Gemini CLI](#gemini-cli)
7. [Configuración de DBHub (SQL)](#configuración-de-dbhub-sql)
8. [Configuración de OpenAPI](#configuración-de-openapi)
9. [Configuración de Postman](#configuración-de-postman)
10. [Flujo de Autenticación API](#flujo-de-autenticación-api)
11. [La Trifuerza de Testing](#la-trifuerza-de-testing)

---

## Resumen de Formatos

| Herramienta     | Archivo Config  | Ubicación                    | Formato |
| --------------- | --------------- | ---------------------------- | ------- |
| **Claude Code** | `.mcp.json`     | Root del proyecto            | JSON    |
| **OpenCode**    | `opencode.json` | Root o `~/.config/opencode/` | JSON    |
| **Codex CLI**   | `config.toml`   | `~/.codex/` o `.codex/`      | TOML    |
| **Gemini CLI**  | `settings.json` | `~/.gemini/`                 | JSON    |

### Diferencias Clave

| Característica | Claude         | OpenCode         | Codex              | Gemini       |
| -------------- | -------------- | ---------------- | ------------------ | ------------ |
| Root key       | `mcpServers`   | `mcp`            | `mcp_servers`      | `mcpServers` |
| Command type   | string         | array            | string             | string       |
| Env vars key   | `env`          | `environment`    | `env` (tabla TOML) | `env`        |
| Remote type    | `type: "http"` | `type: "remote"` | `url`              | `httpUrl`    |
| Enable/disable | N/A            | `enabled`        | `enabled`          | N/A          |

---

## Formato de Variables

### Formato Universal en Templates: `{{VAR}}`

Los templates usan `{{VARIABLE}}` como formato universal para placeholders. **Debes reemplazar estos valores con datos reales** antes de usar el archivo.

### Formato Nativo por Herramienta

Si prefieres usar variables de entorno en tiempo de ejecución, cada herramienta tiene su propio formato:

| Herramienta | Formato Nativo     | Ejemplo                |
| ----------- | ------------------ | ---------------------- |
| Claude Code | Sin soporte nativo | Usar valores literales |
| OpenCode    | `{env:VAR}`        | `{env:API_TOKEN}`      |
| Codex CLI   | `${VAR}`           | `${API_TOKEN}`         |
| Gemini CLI  | `$VAR` o `${VAR}`  | `$API_TOKEN`           |

> **Recomendación:** Reemplaza `{{VAR}}` con valores reales en tus archivos de configuración locales (catalogs). No commitees archivos con credenciales reales.

---

## Claude Code

### Archivo: `.mcp.json`

**Ubicación:** Root del proyecto

### Estructura Básica

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "tu-api-key-aqui"
      }
    },
    "remote-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer tu-token-aqui"
      }
    }
  }
}
```

### Comandos Útiles

```bash
# Ver MCPs configurados
/mcp

# Agregar MCP desde CLI
claude mcp add server-name -- npx -y package-name

# Agregar MCP con JSON
claude mcp add-json --scope=user my-server '{"command":"npx","args":[...]}'
```

### Ejemplo con SoloQ (Valores Reales)

```json
{
  "mcpServers": {
    "openapi": {
      "command": "npx",
      "args": ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
      "env": {
        "API_BASE_URL": "https://staging-upexsoloq.vercel.app/api",
        "OPENAPI_SPEC_PATH": "https://staging-upexsoloq.vercel.app/api/openapi",
        "API_HEADERS": "Authorization:Bearer {{JWT_ACCESS_TOKEN}}"
      }
    },
    "sql": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]
    },
    "postman": {
      "type": "http",
      "url": "https://mcp.postman.com/mcp",
      "headers": {
        "Authorization": "Bearer {{POSTMAN_API_KEY}}"
      }
    }
  }
}
```

---

## OpenCode

### Archivo: `opencode.json`

**Ubicación:** Root del proyecto o `~/.config/opencode/opencode.json`

### Estructura Básica

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "server-name": {
      "type": "local",
      "command": ["npx", "-y", "package-name"],
      "environment": {
        "API_KEY": "tu-api-key-aqui"
      },
      "enabled": true
    },
    "remote-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer tu-token-aqui"
      },
      "oauth": false,
      "enabled": true
    }
  }
}
```

### Características Especiales

- **Command como array:** `["npx", "-y", "package"]` (no string)
- **Variables de entorno:** Usar `{env:VARIABLE_NAME}` para runtime
- **Archivos:** Usar `{file:path/to/file}` para contenido de archivos
- **Enable/disable:** Campo `enabled` para activar/desactivar sin eliminar

### Ejemplo con SoloQ (Valores Reales)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "openapi": {
      "type": "local",
      "command": ["npx", "-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
      "environment": {
        "API_BASE_URL": "https://staging-upexsoloq.vercel.app/api",
        "OPENAPI_SPEC_PATH": "https://staging-upexsoloq.vercel.app/api/openapi",
        "API_HEADERS": "Authorization:Bearer {{JWT_ACCESS_TOKEN}}"
      },
      "enabled": true
    },
    "sql": {
      "type": "local",
      "command": ["npx", "-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"],
      "enabled": true
    },
    "postman": {
      "type": "remote",
      "url": "https://mcp.postman.com/mcp",
      "headers": {
        "Authorization": "Bearer {{POSTMAN_API_KEY}}"
      },
      "enabled": true
    }
  }
}
```

---

## Codex CLI

### Archivo: `config.toml`

**Ubicación:** `~/.codex/config.toml` (global) o `.codex/config.toml` (proyecto)

### Estructura Básica

```toml
# STDIO Server (local)
[mcp_servers.server-name]
command = "npx"
args = ["-y", "package-name"]

[mcp_servers.server-name.env]
API_KEY = "tu-api-key-aqui"

# HTTP Server (remoto)
[mcp_servers.remote-server]
url = "https://mcp.example.com/mcp"
bearer_token_env_var = "TOKEN_ENV_VAR"
```

### Comandos Útiles

```bash
# Agregar MCP
codex mcp add server-name -- npx -y package-name

# Agregar con variables de entorno
codex mcp add server-name --env API_KEY=value -- npx -y package-name

# Ver MCPs
/mcp

# Ver ayuda
codex mcp --help
```

### Ejemplo con SoloQ (Valores Reales)

```toml
# ============================================
# CONFIGURACIÓN MCP PARA CODEX CLI
# ============================================

[mcp_servers.openapi]
command = "npx"
args = ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"]

[mcp_servers.openapi.env]
API_BASE_URL = "https://staging-upexsoloq.vercel.app/api"
OPENAPI_SPEC_PATH = "https://staging-upexsoloq.vercel.app/api/openapi"
API_HEADERS = "Authorization:Bearer {{JWT_ACCESS_TOKEN}}"

[mcp_servers.sql]
command = "npx"
args = ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]

[mcp_servers.postman]
url = "https://mcp.postman.com/mcp"
bearer_token_env_var = "POSTMAN_API_KEY"
```

---

## Gemini CLI

### Archivo: `settings.json`

**Ubicación:** `~/.gemini/settings.json`

### Estructura Básica

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "tu-api-key-aqui"
      }
    },
    "remote-server": {
      "httpUrl": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer tu-token-aqui"
      }
    }
  }
}
```

### Comandos Útiles

```bash
# Agregar MCP stdio
gemini mcp add server-name -- npx -y package-name

# Agregar MCP HTTP
gemini mcp add remote-server -t http https://mcp.example.com/mcp

# Ver MCPs
/mcp

# Listar configurados
gemini mcp list

# Eliminar
gemini mcp remove server-name
```

### Características Especiales

- **Variables de entorno:** Usar `$VAR_NAME` o `${VAR_NAME}` para runtime
- **HTTP streaming:** Usar `httpUrl` (no `url`)
- **SSE:** Usar `url` para Server-Sent Events
- **Tool filtering:** `includeTools` y `excludeTools`

### Ejemplo con SoloQ (Valores Reales)

```json
{
  "mcpServers": {
    "openapi": {
      "command": "npx",
      "args": ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
      "env": {
        "API_BASE_URL": "https://staging-upexsoloq.vercel.app/api",
        "OPENAPI_SPEC_PATH": "https://staging-upexsoloq.vercel.app/api/openapi",
        "API_HEADERS": "Authorization:Bearer {{JWT_ACCESS_TOKEN}}"
      }
    },
    "sql": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]
    },
    "postman": {
      "httpUrl": "https://mcp.postman.com/mcp",
      "headers": {
        "Authorization": "Bearer {{POSTMAN_API_KEY}}"
      }
    }
  }
}
```

---

## Configuración de DBHub (SQL)

### Paso 1: Crear archivo `dbhub.toml`

Crea un archivo llamado `dbhub.toml` en el root de tu proyecto:

```toml
[[sources]]
id = "soloq"
type = "postgres"
host = "aws-1-us-east-2.pooler.supabase.com"
port = 5432
database = "postgres"
user = "{{DB_USER}}"
password = "{{DB_PASSWORD}}"
sslmode = "require"
```

> **Importante:** Agrega `dbhub.toml` a `.gitignore` si contiene credenciales reales.

### Paso 2: Configurar el MCP

#### Claude Code (`.mcp.json`)

```json
"sql": {
  "command": "npx",
  "args": ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]
}
```

#### OpenCode (`opencode.json`)

```json
"sql": {
  "type": "local",
  "command": ["npx", "-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"],
  "enabled": true
}
```

#### Codex CLI (`config.toml`)

```toml
[mcp_servers.sql]
command = "npx"
args = ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]
```

#### Gemini CLI (`settings.json`)

```json
"sql": {
  "command": "npx",
  "args": ["-y", "@bytebase/dbhub@latest", "--config", "dbhub.toml"]
}
```

### Paso 3: Verificar conexión

Ejecuta tu agente y usa `/mcp` para verificar que el MCP está conectado.

### Conexión Alternativa (VSCode/Cursor)

Para conectarte via extensión de editor:

```
postgresql://{{DB_USER}}:{{DB_PASSWORD}}@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

---

## Configuración de OpenAPI

### Requisitos Previos

1. URL base de la API
2. URL del spec OpenAPI (JSON/YAML)
3. Bearer Token de autenticación (ver [Flujo de Autenticación](#flujo-de-autenticación-api))

### Paso 1: Configurar el MCP

> **IMPORTANTE:** El flag `--tools dynamic` es **OBLIGATORIO**. Sin él, da error 400.

#### Claude Code (`.mcp.json`)

```json
"openapi": {
  "command": "npx",
  "args": ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
  "env": {
    "API_BASE_URL": "https://staging-upexsoloq.vercel.app/api",
    "OPENAPI_SPEC_PATH": "https://staging-upexsoloq.vercel.app/api/openapi",
    "API_HEADERS": "Authorization:TU_JWT_AQUI"
  }
}
```

#### OpenCode (`opencode.json`)

```json
"openapi": {
  "type": "local",
  "command": ["npx", "-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
  "environment": {
    "API_BASE_URL": "https://staging-upexsoloq.vercel.app/api",
    "OPENAPI_SPEC_PATH": "https://staging-upexsoloq.vercel.app/api/openapi",
    "API_HEADERS": "Authorization:TU_JWT_AQUI"
  },
  "enabled": true
}
```

#### Codex CLI (`config.toml`)

```toml
[mcp_servers.openapi]
command = "npx"
args = ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"]

[mcp_servers.openapi.env]
API_BASE_URL = "https://staging-upexsoloq.vercel.app/api"
OPENAPI_SPEC_PATH = "https://staging-upexsoloq.vercel.app/api/openapi"
API_HEADERS = "Authorization:Bearer {{JWT_ACCESS_TOKEN}}"
```

#### Gemini CLI (`settings.json`)

```json
"openapi": {
  "command": "npx",
  "args": ["-y", "@ivotoby/openapi-mcp-server", "--tools", "dynamic"],
  "env": {
    "API_BASE_URL": "https://staging-upexsoloq.vercel.app/api",
    "OPENAPI_SPEC_PATH": "https://staging-upexsoloq.vercel.app/api/openapi",
    "API_HEADERS": "Authorization:TU_JWT_AQUI"
  }
}
```

### Capacidades del MCP OpenAPI

| Tool                      | Descripción                           |
| ------------------------- | ------------------------------------- |
| `list-api-endpoints`      | Lista todos los endpoints disponibles |
| `get-api-endpoint-schema` | Obtiene el schema JSON de un endpoint |
| `invoke-api-endpoint`     | Ejecuta un endpoint con parámetros    |

---

## Configuración de Postman

### Paso 1: Generar API Key

1. Ve a https://www.postman.com y logueate
2. Click en tu avatar (arriba derecha) → **Settings**
3. Baja hasta **"API Keys"**
4. Click **"Generate API Key"**
5. Nombre: "Postman MCP", Expiración: 60-90 días
6. Copia el token (solo se muestra una vez)

### Paso 2: Configurar el MCP

#### Claude Code (`.mcp.json`)

```json
"postman": {
  "type": "http",
  "url": "https://mcp.postman.com/mcp",
  "headers": {
    "Authorization": "Bearer {{POSTMAN_API_KEY}}"
  }
}
```

#### OpenCode (`opencode.json`)

```json
"postman": {
  "type": "remote",
  "url": "https://mcp.postman.com/mcp",
  "headers": {
    "Authorization": "Bearer {{POSTMAN_API_KEY}}"
  },
  "enabled": true
}
```

#### Codex CLI (`config.toml`)

```toml
[mcp_servers.postman]
url = "https://mcp.postman.com/mcp"
bearer_token_env_var = "POSTMAN_API_KEY"
```

> **Nota:** Para Codex, exporta la variable de entorno: `export POSTMAN_API_KEY=PMAK-...`

#### Gemini CLI (`settings.json`)

```json
"postman": {
  "httpUrl": "https://mcp.postman.com/mcp",
  "headers": {
    "Authorization": "Bearer {{POSTMAN_API_KEY}}"
  }
}
```

### Capacidades del MCP Postman (41 tools)

| Categoría        | Tools                                                            |
| ---------------- | ---------------------------------------------------------------- |
| **Collections**  | crear, obtener, duplicar, actualizar, ejecutar (`runCollection`) |
| **Requests**     | crear/actualizar requests dentro de colecciones                  |
| **Environments** | crear, obtener, actualizar variables                             |
| **Specs**        | crear, sincronizar OpenAPI specs con colecciones                 |
| **Mocks**        | crear, publicar mock servers                                     |
| **Workspaces**   | crear, obtener, actualizar                                       |

---

## Flujo de Autenticación API

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    TU CLIENTE                    SUPABASE AUTH                    NEXT.JS API
         │                              │                               │
         │  1. POST /auth/v1/token      │                               │
         │     { email, password }      │                               │
         │ ────────────────────────────>│                               │
         │                              │                               │
         │  2. { access_token: "eyJ.." }│                               │
         │ <────────────────────────────│                               │
         │                              │                               │
         │  3. GET /api/clients                                         │
         │     Authorization: Bearer eyJ...                             │
         │ ────────────────────────────────────────────────────────────>│
         │                              │                               │
         │  4. 200 OK { clients: [...] }                                │
         │ <────────────────────────────────────────────────────────────│
```

### Paso 1: Obtener el Access Token

**Endpoint:**

```
POST https://czuusjchqpgvanvbdrnz.supabase.co/auth/v1/token?grant_type=password
```

**Headers:**

```
apikey: {{SUPABASE_ANON_KEY}}
Content-Type: application/json
```

**Body:**

```json
{
  "email": "{{DEMO_EMAIL}}",
  "password": "{{DEMO_PASSWORD}}"
}
```

**Response:**

```json
{
  "access_token": "TU_JWT_AQUI",
  "token_type": "bearer",
  "expires_in": 3600,
  ...
}
```

### Paso 2: Usar el token

Header para todas las requests:

```
Authorization: Bearer TU_JWT_AQUI
```

> **Nota:** El token expira en 7 días. Si recibes 401, vuelve a hacer Login.

### Ejemplo cURL

```bash
# Paso 1: Obtener token
curl -X POST 'https://czuusjchqpgvanvbdrnz.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: {{SUPABASE_ANON_KEY}}' \
  -H 'Content-Type: application/json' \
  -d '{"email":"{{DEMO_EMAIL}}","password":"{{DEMO_PASSWORD}}"}'

# Paso 2: Usar token en API call
curl 'https://staging-upexsoloq.vercel.app/api/clients' \
  -H 'Authorization: Bearer <ACCESS_TOKEN_DEL_PASO_1>'
```

---

## La Trifuerza de Testing

| MCP         | Para qué sirve                        | Requiere           |
| ----------- | ------------------------------------- | ------------------ |
| **OpenAPI** | Invocar endpoints directamente        | Bearer Token SoloQ |
| **Postman** | Gestionar colecciones, ejecutar tests | API Key Postman    |
| **DBHub**   | Verificar datos en la base de datos   | Connection string  |

```
UI (Playwright) + API (OpenAPI/Postman) + DB (DBHub) = Testing Completo 🎯
```

---

## Verificación

Después de configurar, ejecuta tu agente y verifica con:

```
/mcp
```

Deberías ver todos los MCPs configurados y sus tools disponibles.

---

## Troubleshooting

### Error 400 en OpenAPI

- Asegúrate de incluir `--tools dynamic` en los argumentos

### MCP no aparece en /mcp

- Verifica la sintaxis del archivo de configuración
- Revisa que el archivo esté en la ubicación correcta
- Reinicia el agente después de cambiar la configuración

### Error de conexión en DBHub

- Verifica que el archivo `dbhub.toml` exista en el root
- Confirma las credenciales de la base de datos
- Asegúrate de que la base de datos sea accesible desde tu red

### Token expirado en OpenAPI

- Vuelve a ejecutar el flujo de autenticación
- Actualiza el token en la configuración
- Reinicia el agente

### Error "command not found" en OpenCode

- Recuerda que `command` debe ser un array: `["npx", "-y", "package"]`
- No uses string como en Claude: `"command": "npx"` ❌

---

## Referencias

- [Claude Code MCP Docs](https://docs.anthropic.com/en/docs/claude-code)
- [OpenCode Config Docs](https://opencode.ai/docs/config/)
- [Codex CLI MCP Docs](https://developers.openai.com/codex/mcp/)
- [Gemini CLI MCP Docs](https://geminicli.com/docs/tools/mcp-server/)
- [DBHub Configuration](https://dbhub.ai/config/toml)
- [OpenAPI MCP Server](https://github.com/ivo-toby/mcp-openapi-server)
