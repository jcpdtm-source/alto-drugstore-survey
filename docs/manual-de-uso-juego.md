# Manual de Uso — Sistema de Juego de Premios
## Alto Drugstore Survey v1

---

## ¿Cómo funciona el juego?

Cada vez que un cliente escanea el QR de la pantalla TV y abre `/juego` en su celular, el sistema incrementa un contador global. Los premios se configuran para entregarse en números específicos de ese contador (por ejemplo: cada 100 participaciones, a partir de la participación 500). No es un sorteo aleatorio — es determinístico y predecible.

**Flujo del cliente:**
1. Escanea QR de la pantalla TV
2. El celular abre la página y participa automáticamente (sin tocar nada)
3. Ve si ganó o no, con el mensaje correspondiente
4. Si ganó: muestra el premio con un contador regresivo para canjearlo en caja
5. Si no ganó: puede reintentar (hasta 3 veces seguidas antes de que el sistema sugiera esperar)

---

## Panel de Administración — `/admin/juego`

### Tab: Configuración

**Activar / Pausar el juego**
- Cuando está pausado, los clientes que abren `/juego` ven una pantalla de "juego pausado"
- La pantalla de juego desaparece del carrusel TV automáticamente si está pausado
- Activar antes de que empiece el evento; pausar al terminar

**Horas para canjear**
- Cuántas horas tiene el cliente para ir a caja a reclamar el premio desde que ganó
- Recomendación: 2 horas para eventos de un día, 24 horas si el juego corre varios días

**Días de cooldown**
- Cuántos días debe esperar un dispositivo antes de poder ganar de nuevo
- El sistema detecta el dispositivo por una ID guardada en el celular (no por cuenta ni teléfono)
- Importante: si el cliente borra el caché o usa otro navegador, el sistema lo trata como dispositivo nuevo
- Recomendación: 1 día para eventos cortos, 2-3 días para campañas largas

**Mensajes en pantalla de TV**
- Los mensajes que aparecen rotando arriba del QR en la pantalla de TV
- Un mensaje por línea
- Cada mensaje se muestra 5.25 segundos antes de rotar al siguiente
- Recomendación: máximo 4-6 mensajes, frases cortas (1-2 líneas en pantalla)
- Evitar: mensajes de más de 6 palabras que puedan ocupar 3 líneas y superponerse con el QR

**Color de textos en TV**
- Aplica a los mensajes rotantes y al texto "Escaneá con tu celular"
- El fondo de la pantalla es celeste (#1EABF1), el logo es blanco
- Colores que funcionan bien: blanco (#ffffff), amarillo (#FFE600), naranja claro (#FFCC44)
- Evitar: azules, verdes claros, o cualquier color similar al fondo celeste

**Imagen debajo del QR (TV)**
- Aparece en el tercio inferior de la pantalla, detrás y debajo del QR
- Acepta JPG, PNG y GIF animado
- La imagen se recorta automáticamente para llenar el espacio (objectFit: cover)

**Reiniciar contador**
- Solo usar al iniciar una nueva campaña desde cero
- Borra el historial de qué número le corresponde a cada premio
- No borra los registros de entregas anteriores (esos quedan en el historial)

---

### Tab: Premios

**Campos de cada premio:**
- **Nombre:** identificación interna del premio (ej: "Auriculares Bluetooth")
- **Mensaje:** lo que ve el cliente en su celular al ganar (ej: "¡Ganaste auriculares! Mostrá esta pantalla en caja")
- **Desde participación:** a partir de qué número del contador se activa este premio
- **Frecuencia:** cada cuántas participaciones se entrega (ej: 100 = 1 de cada 100)
- **Prioridad:** si dos premios coinciden en el mismo número, gana el de menor número de prioridad (1 gana sobre 2, 2 sobre 3)
- **Stock:** cuántas unidades hay disponibles (dejar vacío = ilimitado)

**Ejemplo de configuración:**
- Premio A: desde participación 100, frecuencia 500 → gana en 100, 600, 1100, 1600...
- Premio B: desde participación 50, frecuencia 200 → gana en 50, 250, 450, 650...

**Cosas a evitar:**
- No activar un premio con frecuencia muy baja (ej: 1 o 2) si no tenés stock suficiente
- No tener todos los premios con la misma prioridad si sus frecuencias pueden colisionar
- No eliminar un premio que tiene entregas registradas sin exportar primero el historial

---

### Tab: Consolación

Mensajes que ve el cliente cuando NO gana. Rotan aleatoriamente.

**Recomendaciones:**
- Mínimo 3 mensajes para que no se repita seguido
- Tono positivo: "¡Gracias por participar! Seguí intentando"
- Evitar: mensajes que suenen a rechazo o que generen frustración

---

### Tab: Entregas

Historial de todos los premios entregados. Solo lectura.
Muestra: nombre del premio, mensaje, device ID, número de contador, vencimiento, fecha.

---

## Panel de TV — `/admin/tv`

### Duración de pantallas

Cada pantalla del carrusel tiene un campo de segundos individual:
- **Vacío** = usa la duración global del slider de Rotación
- **Con número** = esa pantalla usa ese tiempo específico

**Recomendaciones de duración:**
- Encuesta: 15-20 segundos (tiempo suficiente para leer resultados)
- Imágenes publicitarias: 8-12 segundos
- Pantalla de juego: 20-30 segundos (para que el cliente tenga tiempo de sacar el celular)

---

## Especificaciones de imágenes

### Imágenes del carrusel TV (publicitarias)
- **Orientación horizontal (TV apaisado):** 1920 × 1080 px
- **Orientación vertical (TV en portrait):** 1080 × 1920 px
- **Formato:** JPG o PNG
- **Peso máximo aceptado:** 5 MB
- **Peso recomendado:** menos de 1.5 MB para carga rápida
- **Importante:** el sistema muestra la imagen a pantalla completa con objectFit cover — los bordes pueden recortarse si la proporción no coincide exactamente

### Imagen de fondo de pantalla de juego TV (tercio inferior)
- **Dimensiones ideales:** 1920 × 360 px (proporción 16:3)
- **Formato:** JPG, PNG o GIF animado
- **Peso máximo aceptado:** 5 MB
- **Peso recomendado GIF:** menos de 3 MB. Los GIF más pesados cargan lento y pueden verse entrecortados en pantalla
- **Orientación vertical:** si el TV está en portrait, la imagen se ve rotada junto con todo el contenido
- **Zona segura:** el QR ocupa el centro de la pantalla. La imagen va en el tercio inferior, por debajo del QR. Diseñar el contenido importante en la mitad inferior del arte

### Logo (logo.png)
- Archivo: `/public/logo.png`
- Fondo transparente, logo en blanco (monocromo)
- Se usa en pantalla TV encuesta, pantalla TV juego, y footer de pantallas del celular
- No modificar el nombre del archivo

---

## Orientación de pantalla TV

El sistema soporta dos modos configurables desde `/admin/tv`:

### Horizontal (landscape)
- TV en posición normal apaisada
- Resolución de referencia: 1920 × 1080 px
- Diseñar imágenes en 16:9

### Vertical (portrait) — Samsung Tizen girado 90°
- El TV está físico en posición vertical pero el sistema operativo lo ve como horizontal
- Se aplica `rotate(-90deg) scale(1.6)` por CSS para compensar
- Esto significa que las imágenes se diseñan igual en 16:9 pero el resultado visual es portrait
- **No usar imágenes en formato 9:16** — el sistema las rota automáticamente

---

## Qué hacer y qué evitar

### ✅ Hacer
- Activar el juego antes del evento y pausarlo al terminar
- Probar el flujo completo desde el celular antes de abrir al público
- Configurar al menos 3 mensajes de consolación antes de activar
- Tener al menos un premio activo antes de activar el juego (si no hay premios configurados, todos pierden)
- Usar mensajes TV cortos y directos
- Mantener el peso de imágenes bajo para que la TV cargue rápido
- Reiniciar el contador al iniciar una nueva campaña

### ❌ Evitar
- No dejar el juego activo después del evento (los clientes pueden seguir participando)
- No borrar la columna `game_device_fp` del localStorage si se está testeando (usar navegador en incógnito)
- No subir GIFs mayores a 4 MB — pueden trabar la pantalla TV
- No usar colores de texto similares al fondo celeste (#1EABF1)
- No configurar frecuencias de premio muy bajas (1-5) sin tener stock suficiente
- No reiniciar el contador durante un evento activo (desincroniza los premios)
- No eliminar premios con historial de entregas sin antes exportar el historial
- No cambiar el nombre de `logo.png` — está referenciado directamente en el código

---

## Flujo recomendado para un evento

1. En `/admin/juego`:
   - Configurar premios con sus frecuencias y stock
   - Agregar mensajes de consolación
   - Configurar mensajes TV, color de textos, imagen opcional
   - Establecer horas de canje y días de cooldown
   - **NO activar todavía**

2. En `/admin/tv`:
   - Verificar que la pantalla de juego esté habilitada
   - Configurar su duración en el carrusel

3. Probar desde el celular en incógnito que el flujo funciona

4. Al inicio del evento: activar el juego desde `/admin/juego`

5. Al finalizar el evento: pausar el juego

6. Para la próxima campaña: reiniciar contador, ajustar premios, reactivar
