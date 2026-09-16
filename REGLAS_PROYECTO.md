# Reglas y contexto de RomaReto

## Propósito

RomaReto es un puzzle deslizante para niños y adultos, pensado para ejecutarse en un tótem Android, celulares y computadoras.

## Archivos principales

- `index.html`: juego principal y modal estático del banco de fotos.
- `app.js`: estado, catálogo de imágenes, puzzle, cámara, tiempos, mezcla, arrastre y resultados.
- `styles.css`: UI responsive y colores institucionales.
- `convertir-imagen.html`: herramienta independiente para preparar imágenes; no guarda datos ni modifica el proyecto automáticamente.
- `img/optimizadas/`: imágenes que utiliza el banco del juego.

## Identidad visual

- Fondo: blanco.
- Color primario: `#558736`.
- Color secundario: `#4F3B87`.
- La imagen inicial es `img/optimizadas/roma.webp` y su nombre visible es `Ecosistema Roma`.
- Mantener una interfaz clara, educativa, táctil y legible en pantallas pequeñas.

## Catálogo de imágenes

El banco es estático: las imágenes se registran en `PHOTO_LIBRARY` dentro de `app.js`.

Cada objeto debe tener:

```js
{
  id: 'identificador-unico',
  category: 'ninos',
  title: 'Nombre visible',
  src: 'img/optimizadas/ninos/nombre.webp'
}
```

Categorías actuales: `ninos`, `adultos`, `equipos` y `paises`. La categoría `roma` se reserva para la imagen institucional por defecto.

La carpeta optimizada usa `ninos` sin tilde para evitar problemas de rutas y normalización de caracteres. Las imágenes originales existentes están en sus carpetas de categoría dentro de `img/`.

## Reglas de imágenes

- Preferir imágenes cuadradas `1:1`.
- Preparar la versión del juego con máximo `1200 × 1200 px`.
- Usar WebP con calidad aproximada de `82%`.
- Conservar una copia original fuera de `img/optimizadas/`.
- No agregar imágenes pesadas directamente al catálogo.
- No usar nombres con espacios, tildes o caracteres especiales en los archivos optimizados.
- No eliminar los originales sin conservar una copia de respaldo.

## Herramienta de conversión

`convertir-imagen.html` permite seleccionar JPG, PNG o WebP, recortar al centro en formato cuadrado, elegir tamaño máximo y calidad WebP, y descargar el original y la versión optimizada.

La herramienta trabaja solo durante la sesión actual. No usa IndexedDB, localStorage ni servidor y no agrega imágenes automáticamente al banco.

## Juego implementado

- Modo normal: tablero de `3 × 3`.
- Modo difícil: tablero de `4 × 4`.
- Niveles de mezcla: Fácil, Normal y Difícil.
- El número de movimientos de mezcla depende del nivel.
- Temporizadores adaptados a modo y dificultad.
- Guía opcional con números sobre las piezas.
- Movimiento con click/tap, arrastre y desplazamiento de filas o columnas alineadas con el hueco.
- Las piezas encajan rectas; solo las esquinas exteriores tienen radio.
- Preview, referencia y puzzle utilizan el mismo recorte cuadrado.
- Modal de resultado con referencia y tablero final.
- Reintentar con la misma imagen y cambiar de imagen.

## Cámara y memoria

- La cámara solicita como máximo `1280 × 720` y `24 FPS`.
- La captura se limita a `1200 × 1200` y se comprime a WebP.
- No se mantienen dos streams de cámara al cambiar de dispositivo.
- La cámara frontal y la webcam se muestran sin espejo.
- Las imágenes subidas se manejan con `Object URL` y se convierten a un canvas máximo de `1200 × 1200`.
- El juego espera el procesamiento de la imagen antes de iniciar para no usar el archivo original pesado.

## Compatibilidad y pruebas

- Probar cámara mediante Live Server, HTTPS o un origen seguro. Abrir el archivo directamente puede limitar permisos de cámara.
- Para probar desde un celular en la misma red, iniciar Live Server escuchando en la IP local y abrir esa dirección desde el celular.
- Validaciones mínimas antes de entregar:

```bash
node --check app.js
git diff --check
```

## Decisiones importantes

- No reintroducir carga administrativa de imágenes dentro del modal del banco.
- No usar IndexedDB para agregar imágenes al catálogo.
- Para que una nueva imagen esté disponible en todos los dispositivos, debe quedar dentro del proyecto y registrarse en `PHOTO_LIBRARY`.
- Una contraseña escrita en JavaScript no ofrece seguridad real; cualquier control de administración futuro debe resolverse en un backend.
