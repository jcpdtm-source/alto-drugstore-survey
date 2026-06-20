# Sistema de Juego de Premios — Documentación Técnica v1

## Resumen

Sistema de juego tipo "participá y ganá" integrado a la app Alto Drugstore Survey. Los clientes escanean un QR desde la pantalla de TV, participan desde su celular, y reciben en pantalla si ganaron un premio o no. Los premios se distribuyen mediante un contador global determinístico (no sorteo aleatorio).

---

## Base de datos (Supabase/PostgreSQL)

### Tabla `game_config` (una sola fila)
| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | PK |
| `is_active` | boolean | false | Activa/pausa el juego |
| `global_counter` | integer | 0 | Contador acumulado de participaciones |
| `redemption_hours` | integer | 2 | Horas para canjear premio |
| `win_cooldown_days` | integer | 2 | Días antes de poder ganar de nuevo |
| `game_messages` | text[] | '{}' | Mensajes rotantes en pantalla TV |
| `game_screen_image_url` | text | null | URL imagen tercio inferior pantalla TV |
| `game_text_color` | text | '#ffffff' | Color hexadecimal de textos en TV |
| `updated_at` | timestamptz | now() | Última modificación |

### Tabla `prizes`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Nombre del premio |
| `message` | text | Mensaje que ve el ganador en el celular |
| `activation_vote` | integer | Desde qué número de participación empieza a repartirse |
| `frequency` | integer | Cada cuántas participaciones se gana (ej: 100 = 1 de cada 100) |
| `priority` | integer | Prioridad al colisionar (número menor = mayor prioridad) |
| `stock` | integer | null | null = ilimitado; si tiene valor se descuenta con cada entrega |
| `stock_remaining` | integer | null | Stock actual restante |
| `is_active` | boolean | true | Activo/inactivo |
| `created_at` | timestamptz | — | — |

### Tabla `prize_deliveries`
Registra cada entrega de premio.
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `prize_id` | uuid | FK → prizes |
| `prize_name` | text | Snapshot del nombre al momento de entrega |
| `prize_message` | text | Snapshot del mensaje |
| `device_fingerprint` | text | ID del dispositivo ganador |
| `counter_value` | integer | Valor del contador al momento de ganar |
| `expires_at` | timestamptz | Timestamp de vencimiento del canje |
| `created_at` | timestamptz | — |

### Tabla `consolation_messages`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `message` | text | Mensaje de consolación para mostrar al perder |
| `is_active` | boolean | true |
| `display_order` | integer | Orden de rotación |

### Tabla `tv_screens` (modificada para el juego)
Se agregó la columna `duration_seconds integer` (null = usa duración global).
Se agregó la fila con `screen_type = 'game'` para representar la pantalla de juego en el carrusel.
El check constraint incluye: `('survey', 'promo_image', 'game')`.

---

## Funciones RPC en Supabase

### `play_game(p_device text)`
Función principal. Ejecuta toda la lógica de juego atómicamente:
1. Verifica que el juego esté activo
2. Incrementa `global_counter` en 1
3. Verifica cooldown: si el dispositivo ganó en los últimos `win_cooldown_days` días → retorna `already_won_cooldown: true`
4. Evalúa qué premios corresponden al nuevo contador (counter >= activation_vote Y counter % frequency == 0)
5. Si hay colisión entre varios premios → gana el de menor `priority` (mayor prioridad)
6. Si hay stock = 0 en el premio ganador → no se entrega, sigue como pérdida
7. Si gana → inserta en `prize_deliveries` con `expires_at = now() + redemption_hours`
8. Si pierde → retorna mensaje de consolación aleatorio de `consolation_messages`

**Retorna:**
```json
{
  "won": boolean,
  "counter": integer,
  "prize_id": uuid,
  "prize_name": text,
  "prize_message": text,
  "delivery_id": uuid,
  "expires_at": timestamptz,
  "consolation_message": text,
  "already_won_cooldown": boolean,
  "error": text
}
```

### `get_game_config()`
`RETURNS TABLE` — devuelve siempre un array de un elemento. Todos los consumers hacen `data[0]` para obtener el objeto.

### `get_prizes_with_stats()`
Retorna premios con `deliveries_count` calculado.

### `get_prize_deliveries()`
Retorna historial de entregas con join a prizes.

---

## API Routes

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/game/play` | Llama a `play_game` RPC. Requiere `device_fingerprint` en body. Retorna 403 si juego inactivo. |
| GET | `/api/admin/game/config` | Retorna config del juego (unwrap array → objeto) |
| PATCH | `/api/admin/game/config` | Actualiza: `is_active`, `redemption_hours`, `global_counter`, `win_cooldown_days`, `game_messages`, `game_text_color` |
| POST | `/api/admin/game/image` | Sube imagen para pantalla TV al bucket `tv-images`. Actualiza `game_screen_image_url`. |
| DELETE | `/api/admin/game/image` | Pone `game_screen_image_url` a null. |
| GET | `/api/admin/game/prizes` | Lista premios con stats |
| POST | `/api/admin/game/prizes` | Crea premio |
| PATCH | `/api/admin/game/prizes/[id]` | Edita premio |
| DELETE | `/api/admin/game/prizes/[id]` | Elimina prize_deliveries del premio primero (FK), luego el premio |
| GET | `/api/admin/game/consolation` | Lista mensajes de consolación |
| POST | `/api/admin/game/consolation` | Crea mensaje |
| PATCH | `/api/admin/game/consolation/[id]` | Edita mensaje |
| DELETE | `/api/admin/game/consolation/[id]` | Elimina mensaje |
| GET | `/api/admin/game/deliveries` | Historial de entregas |

---

## Componentes y páginas

### `app/(public)/juego/page.tsx`
Página pública del celular. Client component.

**Estados posibles:**
- `idle` → inicial (dispara play automáticamente al montar)
- `loading` → esperando respuesta del servidor
- `won` → ganó premio (muestra `WonScreen` con countdown)
- `lost` → no ganó (muestra consolación + botón reintentar)
- `cooldown` → ganó recientemente, debe esperar
- `enough` → perdió `MAX_CONSECUTIVE_TRIES` (=3) veces seguidas
- `inactive` → juego pausado
- `error` → error de red/servidor

**Anti-cheat cliente:** fingerprint en `localStorage['game_device_fp']`. El servidor valida el cooldown por dispositivo independientemente.

**`WonScreen`:** componente separado con hook `useCountdown` para mostrar HH:MM:SS decreciente hasta `expires_at`.

### `components/tv/TvGameScreen.tsx`
Pantalla TV del juego. Solo CSS inline (compatible Samsung Tizen).

**Props:**
- `gameMessages: string[]` — mensajes rotantes (fallback a MESSAGES_DEFAULT si vacío)
- `orientation: 'horizontal' | 'vertical'`
- `imageUrl?: string | null` — imagen tercio inferior
- `textColor?: string` — color de textos rotantes (default `#ffffff`)

**Layout (posición absoluta):**
- Fondo: `#1EABF1` (celeste Alto Drugstore)
- Zona superior (top 0 → bottom 65%): logo + badge + mensajes rotantes
- Centro exacto (top 50% translate -50%): QR code + texto "Escaneá"
- Zona inferior (bottom 0, height 33%): imagen opcional con objectFit cover

**Mensajes rotan** cada 5250ms (setInterval).

### `app/admin/juego/page.tsx`
Panel admin con 4 tabs:
1. **Configuración:** activar/pausar, horas canje, días cooldown, mensajes TV, color textos, imagen TV, reiniciar contador
2. **Premios:** lista con stock en rojo si 0, edición inline con modal, crear/eliminar
3. **Consolación:** lista de mensajes, crear/editar/eliminar
4. **Entregas:** historial read-only

---

## Lógica del carrusel TV (`app/tv/page.tsx`)

- `rotationRef` (useRef) guarda slides y config para que el timer no se cancele en cada poll
- `rotationReady` (useState boolean) se activa cuando llega tvData por primera vez, disparando el timer
- El timer usa `setTimeout` (no `setInterval`) porque cada slide puede tener duración distinta
- Cada slide tiene `durationSeconds?: number | null`; si es null usa `rotation_interval_seconds` global
- El poll de `/api/tv` corre cada 10 segundos sin afectar el timer

---

## Archivos SQL (ejecutar en Supabase en orden)

1. `supabase/premios_schema.sql` — tablas base + función play_game
2. `supabase/fix_play_game.sql` — fix WHERE clause en UPDATE game_config
3. `supabase/update_cooldown.sql` — agrega win_cooldown_days
4. `supabase/add_screen_duration.sql` — agrega duration_seconds a tv_screens
5. `supabase/add_game_messages.sql` — agrega game_messages a game_config + recrea RPC
6. `supabase/add_game_screen_extras.sql` — agrega game_screen_image_url y game_text_color + recrea RPC

**Nota importante:** cada vez que se recrea `get_game_config()` hay que hacer `DROP FUNCTION` primero porque cambia el tipo de retorno.

---

## Consideraciones técnicas

- **PostgREST schema cache:** siempre terminar migraciones con `NOTIFY pgrst, 'reload schema';`
- **Next.js 15 params:** `{ params: Promise<{ id: string }> }` en dynamic routes, usar `await params`
- **Samsung Tizen:** solo CSS inline en componentes TV, sin Tailwind, sin variables CSS
- **Turbopack crash:** si el servidor muere con `GenericFailure`, borrar `.next/` y reiniciar
- **get_game_config retorna array:** siempre hacer `Array.isArray(data) ? data[0] : data` al consumir
