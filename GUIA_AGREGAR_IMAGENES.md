# Guía rápida para agregar imágenes

## 1. Preparar la imagen

Abre `convertir-imagen.html` con Live Server y selecciona la imagen.

- Usa recorte cuadrado `1:1`.
- Tamaño recomendado: `800 × 800 px` para mantener bajo el consumo de memoria del tótem.
- Calidad WebP: `80%–85%`.
- Descarga el original y la versión optimizada.

También puedes usar [Squoosh](https://squoosh.app/) como alternativa.

## 2. Copiar los archivos

Conserva el original en la carpeta de su categoría:

```text
img/niños/
img/adultos/
img/equipos/
img/paises/
```

Copia el WebP en la carpeta optimizada correspondiente:

```text
img/optimizadas/ninos/
img/optimizadas/adultos/
img/optimizadas/equipos/
img/optimizadas/paises/
```

Usa nombres simples, por ejemplo: `perrito-aventurero.webp`.

## 3. Registrar la imagen

En `app.js`, dentro de `PHOTO_LIBRARY`, agrega:

```js
{
  id: 'perrito-aventurero',
  category: 'ninos',
  title: 'Perrito aventurero',
  src: 'img/optimizadas/ninos/perrito-aventurero.webp'
},
```

El `id` debe ser único. Si creas una categoría nueva, también debes agregarla en `PHOTO_CATEGORIES`.

## 4. Comprobar

Abre el juego con Live Server, entra en `Escoger una foto` y revisa la categoría. Si no aparece, verifica la ruta, el nombre del archivo y la consola del navegador.

Las imágenes agregadas desde el convertidor no se guardan automáticamente en el banco: siempre hay que copiarlas y registrar su objeto en `PHOTO_LIBRARY`.
