const DEFAULT_IMAGE = 'img/optimizadas/roma.webp';
const MAX_IMAGE_SIDE = 800;
const CAMERA_MAX_WIDTH = 960;
const CAMERA_MAX_HEIGHT = 540;
const CAMERA_MAX_FPS = 20;

const PHOTO_CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'roma', label: 'Roma' },
  { id: 'ninos', label: 'Niños' },
  { id: 'adultos', label: 'Adultos' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'paises', label: 'Países' }
];

const PHOTO_LIBRARY = [
  { id: 'roma', category: 'roma', title: 'Ecosistema Roma', src: DEFAULT_IMAGE },
  { id: 'lion', category: 'ninos', title: 'León aventurero', src: 'img/optimizadas/ninos/3d-animated-cartoon-lion.webp' },
  { id: 'dragon', category: 'ninos', title: 'Dragón curioso', src: 'img/optimizadas/ninos/3d-kid-dragon-hanging-out.webp' },
  { id: 'tiger', category: 'ninos', title: 'Tigre explorador', src: 'img/optimizadas/ninos/cute-tiger-wearing-clothes.webp' },
  { id: 'shark', category: 'ninos', title: 'Tiburón fantástico', src: 'img/optimizadas/ninos/fantasy-shark-illustration.webp' },
  { id: 'car', category: 'ninos', title: 'Auto 3D', src: 'img/optimizadas/ninos/view-3d-graphic-car.webp' },
  { id: 'penguin', category: 'ninos', title: 'Pingüino futbolista', src: 'img/optimizadas/ninos/view-cartoon-animated-3d-penguin-playing-soccer.webp' },
  { id: 'helicopter', category: 'ninos', title: 'Helicóptero', src: 'img/optimizadas/ninos/view-graphic-3d-helicopter.webp' },
  { id: 'tractor', category: 'ninos', title: 'Tractor', src: 'img/optimizadas/ninos/view-graphic-3d-tractor.webp' },
  { id: 'rainbow', category: 'adultos', title: 'Arcoíris en la naturaleza', src: 'img/optimizadas/adultos/beautiful-rainbow-nature.webp' },
  { id: 'temple', category: 'adultos', title: 'Bustos griegos', src: 'img/optimizadas/adultos/greek-busts-inside-temple.webp' },
  { id: 'arsenal', category: 'equipos', title: 'Arsenal', src: 'img/optimizadas/equipos/arsenal.football-logos.cc.webp' },
  { id: 'barcelona', category: 'equipos', title: 'Barcelona', src: 'img/optimizadas/equipos/barcelona.football-logos.cc.webp' },
  { id: 'bayern', category: 'equipos', title: 'Bayern Múnich', src: 'img/optimizadas/equipos/bayern-munchen.football-logos.cc.webp' },
  { id: 'boca', category: 'equipos', title: 'Boca Juniors', src: 'img/optimizadas/equipos/boca-juniors.football-logos.cc.webp' },
  { id: 'city', category: 'equipos', title: 'Manchester City', src: 'img/optimizadas/equipos/manchester-city.football-logos.cc.webp' },
  { id: 'united', category: 'equipos', title: 'Manchester United', src: 'img/optimizadas/equipos/manchester-united.football-logos.cc.webp' },
  { id: 'psg', category: 'equipos', title: 'Paris Saint-Germain', src: 'img/optimizadas/equipos/paris-saint-germain.football-logos.cc.webp' },
  { id: 'madrid', category: 'equipos', title: 'Real Madrid', src: 'img/optimizadas/equipos/real-madrid.football-logos.cc.webp' },
  { id: 'river', category: 'equipos', title: 'River Plate', src: 'img/optimizadas/equipos/river-plate.football-logos.cc.webp' },
  { id: 'argentina', category: 'paises', title: 'Argentina', src: 'img/optimizadas/paises/ar.webp' },
  { id: 'bolivia', category: 'paises', title: 'Bolivia', src: 'img/optimizadas/paises/bo.webp' },
  { id: 'brasil', category: 'paises', title: 'Brasil', src: 'img/optimizadas/paises/br.webp' },
  { id: 'chile', category: 'paises', title: 'Chile', src: 'img/optimizadas/paises/cl.webp' },
  { id: 'colombia', category: 'paises', title: 'Colombia', src: 'img/optimizadas/paises/co.webp' },
  { id: 'ecuador', category: 'paises', title: 'Ecuador', src: 'img/optimizadas/paises/ec.webp' },
  { id: 'peru', category: 'paises', title: 'Perú', src: 'img/optimizadas/paises/pe.webp' },
  { id: 'uruguay', category: 'paises', title: 'Uruguay', src: 'img/optimizadas/paises/uy.webp' }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  imageSrc: DEFAULT_IMAGE,
  puzzleImageSrc: DEFAULT_IMAGE,
  imageName: 'Ecosistema Roma',
  mode: 'normal',
  difficulty: 'normal',
  showGuide: false,
  galleryCategory: 'ninos',
  gallerySelectionId: 'roma',
  size: 3,
  seconds: 90,
  timeLeft: 90,
  timerId: null,
  status: 'setup',
  tiles: [],
  emptyIndex: 0,
  moves: 0,
  capturedData: null,
  cameraStream: null,
  cameraDevices: [],
  activeCameraId: '',
  cameraFacingMode: 'environment',
  cameraMirror: false,
  cameraSwitching: false,
  drag: null,
  suppressClick: false,
  imageRequestId: 0,
  imageObjectUrl: '',
  imageReadyPromise: Promise.resolve(DEFAULT_IMAGE),
  starting: false,
  bestTimes: loadBestTimes()
};

function loadBestTimes() {
  try { return JSON.parse(localStorage.getItem('desliza-best-times') || '{}'); } catch { return {}; }
}

function saveBestTimes() {
  try { localStorage.setItem('desliza-best-times', JSON.stringify(state.bestTimes)); } catch { /* storage can be blocked in private mode */ }
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function createSquareCanvas(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      if (!side) {
        reject(new Error('La imagen no tiene un tamaño válido.'));
        return;
      }
      const outputSide = Math.min(side, MAX_IMAGE_SIDE);
      const canvas = document.createElement('canvas');
      canvas.width = outputSide;
      canvas.height = outputSide;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('El navegador no puede preparar la imagen.'));
        return;
      }
      const sourceX = (image.naturalWidth - side) / 2;
      const sourceY = (image.naturalHeight - side) / 2;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, outputSide, outputSide);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, sourceX, sourceY, side, side, 0, 0, outputSide, outputSide);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error('No se pudo preparar la imagen.'));
    image.src = source;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('El navegador no pudo comprimir la imagen.'));
    }, type, quality);
  });
}

async function createOptimizedImageBlob(source) {
  const sourceUrl = source instanceof Blob ? URL.createObjectURL(source) : source;
  let canvas = null;
  try {
    canvas = await createSquareCanvas(sourceUrl);
    let optimizedBlob;
    try {
      optimizedBlob = await canvasToBlob(canvas, 'image/webp', .78);
      if (optimizedBlob.type === 'image/webp') return optimizedBlob;
    } catch {
      // Algunos Chromium antiguos no permiten exportar WebP desde canvas.
    }
    return await canvasToBlob(canvas, 'image/jpeg', .78);
  } finally {
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
    if (source instanceof Blob) URL.revokeObjectURL(sourceUrl);
  }
}

function updateSelectedImagePreview(source) {
  $('#image-preview').src = source;
  ['#reference-image-mobile', '#reference-image-desktop'].forEach((selector) => {
    const referenceImage = $(selector);
    if (referenceImage) referenceImage.src = source;
  });
}

function setImage(source, name = 'Imagen elegida') {
  if (state.imageObjectUrl && state.imageObjectUrl !== source) {
    URL.revokeObjectURL(state.imageObjectUrl);
    state.imageObjectUrl = '';
  }
  if (source.startsWith('blob:')) state.imageObjectUrl = source;
  const requestId = ++state.imageRequestId;
  state.imageSrc = source;
  state.imageName = name;
  state.puzzleImageSrc = source;
  $('#preview-caption').textContent = name.length > 24 ? `${name.slice(0, 23)}…` : name;

  // Las imágenes precargadas ya son WebP cuadradas: reprocesarlas duplicaba memoria
  // y podía dejar la preview en blanco en el Chromium del tótem.
  updateSelectedImagePreview(source);
  const needsOptimization = source.startsWith('blob:') || source.startsWith('data:');
  if (!needsOptimization) {
    state.imageReadyPromise = Promise.resolve(source);
    return;
  }

  state.imageReadyPromise = createOptimizedImageBlob(source).then((optimizedBlob) => {
    const optimizedImage = URL.createObjectURL(optimizedBlob);
    if (requestId !== state.imageRequestId) {
      URL.revokeObjectURL(optimizedImage);
      return source;
    }
    if (state.imageObjectUrl === source) {
      URL.revokeObjectURL(state.imageObjectUrl);
    }
    state.imageObjectUrl = optimizedImage;
    state.puzzleImageSrc = optimizedImage;
    updateSelectedImagePreview(optimizedImage);
    if (state.status === 'playing') refreshTileImages();
    return optimizedImage;
  }).catch(() => {
    if (requestId !== state.imageRequestId) return source;
    if (state.imageObjectUrl === source) {
      URL.revokeObjectURL(state.imageObjectUrl);
      state.imageObjectUrl = '';
    }
    state.puzzleImageSrc = source;
    updateSelectedImagePreview(source);
    return source;
  });
}

function getTimeForSettings() {
  const times = {
    normal: { easy: 60, normal: 90, hard: 120 },
    hard: { easy: 120, normal: 150, hard: 180 }
  };
  return times[state.mode][state.difficulty];
}

function getBestKey() {
  return `${state.mode}-${state.difficulty}`;
}

function updateBestTimeUI(value) {
  const formatted = value ? formatTime(value) : '—';
  ['#best-time', '#best-time-top'].forEach((selector) => {
    const element = $(selector);
    if (element) element.textContent = formatted;
  });
}

function setMode(mode) {
  state.mode = mode;
  state.size = mode === 'normal' ? 3 : 4;
  state.seconds = getTimeForSettings();
  state.timeLeft = state.seconds;
  $('#mode-time').textContent = `${formatTime(state.seconds)} min`;
  $$('.mode-option').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
}

function setDifficulty(difficulty) {
  state.difficulty = difficulty;
  state.seconds = getTimeForSettings();
  state.timeLeft = state.seconds;
  $('#mode-time').textContent = `${formatTime(state.seconds)} min`;
  $$('.mix-option').forEach((button) => {
    const active = button.dataset.difficulty === difficulty;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
}

function setGuide(showGuide) {
  state.showGuide = Boolean(showGuide);
  const toggle = $('#guide-toggle');
  const status = $('#guide-status');
  if (toggle) toggle.checked = state.showGuide;
  if (status) status.textContent = state.showGuide ? 'números visibles' : 'sin números';
}

function getSelectedGalleryPhoto() {
  return PHOTO_LIBRARY.find((photo) => photo.id === state.gallerySelectionId) || null;
}

function renderGalleryCategories() {
  const categories = $('#gallery-categories');
  if (!categories) return;
  categories.innerHTML = '';
  PHOTO_CATEGORIES.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-category';
    button.dataset.category = category.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(state.galleryCategory === category.id));
    button.textContent = category.label;
    button.addEventListener('click', () => {
      state.galleryCategory = category.id;
      renderGalleryCategories();
      renderGalleryGrid();
    });
    categories.appendChild(button);
  });
}

function renderGalleryGrid() {
  const grid = $('#gallery-grid');
  const count = $('#gallery-count');
  const useButton = $('#use-gallery-photo');
  if (!grid || !count || !useButton) return;
  const photos = state.galleryCategory === 'all'
    ? PHOTO_LIBRARY
    : PHOTO_LIBRARY.filter((photo) => photo.category === state.galleryCategory);
  count.textContent = `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}`;
  grid.innerHTML = '';
  photos.forEach((photo) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gallery-card';
    card.dataset.photoId = photo.id;
    card.setAttribute('aria-pressed', String(state.gallerySelectionId === photo.id));
    card.classList.toggle('selected', state.gallerySelectionId === photo.id);
    const imageWrap = document.createElement('span');
    imageWrap.className = 'gallery-card-image';
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    const check = document.createElement('span');
    check.className = 'gallery-card-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '✓';
    imageWrap.append(image, check);
    const label = document.createElement('span');
    label.className = 'gallery-card-label';
    label.textContent = photo.title;
    card.append(imageWrap, label);
    card.addEventListener('click', () => {
      state.gallerySelectionId = photo.id;
      renderGalleryGrid();
    });
    grid.appendChild(card);
  });
  useButton.disabled = !photos.some((photo) => photo.id === state.gallerySelectionId);
}

function openGallery() {
  state.galleryCategory = 'ninos';
  const currentPhoto = PHOTO_LIBRARY.find((photo) => photo.src === state.imageSrc);
  const firstChildPhoto = PHOTO_LIBRARY.find((photo) => photo.category === 'ninos');
  state.gallerySelectionId = currentPhoto?.category === 'ninos' ? currentPhoto.id : firstChildPhoto?.id || '';
  renderGalleryCategories();
  renderGalleryGrid();
  $('#gallery-modal').classList.remove('hidden');
}

function closeGallery() {
  $('#gallery-modal').classList.add('hidden');
}

function useGalleryPhoto() {
  const photo = getSelectedGalleryPhoto();
  if (!photo) return;
  setImage(photo.src, photo.title);
  closeGallery();
}

function getNeighbors(index) {
  const row = Math.floor(index / state.size);
  const col = index % state.size;
  const neighbors = [];
  if (row > 0) neighbors.push(index - state.size);
  if (row < state.size - 1) neighbors.push(index + state.size);
  if (col > 0) neighbors.push(index - 1);
  if (col < state.size - 1) neighbors.push(index + 1);
  return neighbors;
}

function createScrambledBoard() {
  const total = state.size * state.size;
  state.tiles = Array.from({ length: total - 1 }, (_, index) => index + 1).concat(0);
  state.emptyIndex = total - 1;
  let previous = -1;
  const stepRanges = {
    easy: [5, 8],
    normal: [10, 15],
    hard: [16, 24]
  };
  const [minSteps, maxSteps] = stepRanges[state.difficulty];
  const steps = minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
  for (let count = 0; count < steps; count += 1) {
    const choices = getNeighbors(state.emptyIndex).filter((index) => index !== previous);
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    [state.tiles[state.emptyIndex], state.tiles[chosen]] = [state.tiles[chosen], state.tiles[state.emptyIndex]];
    previous = state.emptyIndex;
    state.emptyIndex = chosen;
  }
  if (state.tiles.every((tile, index) => tile === (index === total - 1 ? 0 : index + 1))) {
    createScrambledBoard();
  }
}

function tileBackground(tile) {
  const tileIndex = tile - 1;
  const row = Math.floor(tileIndex / state.size);
  const col = tileIndex % state.size;
  const percentage = state.size === 1 ? 0 : 100 / (state.size - 1);
  return `background-image:url("${state.puzzleImageSrc}");background-size:${state.size * 100}% ${state.size * 100}%;background-position:${col * percentage}% ${row * percentage}%;`;
}

function refreshTileImages() {
  $$('.puzzle-tile').forEach((button) => {
    button.style.cssText = tileBackground(Number(button.dataset.number));
  });
}

function renderResultBoardPreview(tiles, size, imageSrc) {
  const board = $('#result-board-preview');
  board.innerHTML = '';
  board.style.setProperty('--result-grid-size', size);
  board.setAttribute('aria-label', `Estado final del tablero de ${size} por ${size}`);
  tiles.forEach((tile, index) => {
    const cell = document.createElement('span');
    cell.className = tile === 0 ? 'result-board-empty' : 'result-board-tile';
    addCornerClass(cell, index);
    if (tile === 0) {
      cell.setAttribute('aria-label', 'Espacio vacío final');
    } else {
      cell.dataset.number = String(tile);
      cell.setAttribute('aria-label', `Pieza ${tile} en la posición final`);
      const tileIndex = tile - 1;
      const row = Math.floor(tileIndex / size);
      const col = tileIndex % size;
      const percentage = size === 1 ? 0 : 100 / (size - 1);
      cell.style.cssText = `background-image:url("${imageSrc}");background-size:${size * 100}% ${size * 100}%;background-position:${col * percentage}% ${row * percentage}%;`;
    }
    board.appendChild(cell);
  });
}

function isSolved() {
  const total = state.size * state.size;
  return state.tiles.every((tile, index) => tile === (index === total - 1 ? 0 : index + 1));
}

function correctTileCount() {
  return state.tiles.reduce((count, tile, index) => {
    const expected = index === state.tiles.length - 1 ? 0 : index + 1;
    return count + (tile === expected ? 1 : 0);
  }, 0);
}

function renderBoard() {
  const board = $('#puzzle-board');
  board.style.setProperty('--grid-size', state.size);
  board.classList.toggle('no-guide', !state.showGuide);
  board.setAttribute('aria-label', `Puzzle de ${state.size} por ${state.size}. ${state.moves} movimientos.`);
  board.innerHTML = '';
  state.tiles.forEach((tile, index) => {
    if (tile === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-tile';
      empty.dataset.index = String(index);
      addCornerClass(empty, index);
      empty.setAttribute('aria-label', 'Espacio vacío');
      empty.setAttribute('role', 'gridcell');
      board.appendChild(empty);
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'puzzle-tile';
    addCornerClass(button, index);
    button.dataset.index = String(index);
    button.dataset.number = String(tile);
    button.style.cssText = tileBackground(tile);
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `Pieza ${tile}. Toca o arrastra para mover`);
    button.addEventListener('pointerdown', handlePointerDown);
    button.addEventListener('pointermove', handlePointerMove);
    button.addEventListener('pointerup', handlePointerUp);
    button.addEventListener('pointercancel', handlePointerCancel);
    button.addEventListener('lostpointercapture', handlePointerCancel);
    button.addEventListener('click', () => {
      if (state.suppressClick) {
        state.suppressClick = false;
        return;
      }
      moveTile(index);
    });
    board.appendChild(button);
  });
  updateProgress();
}

function addCornerClass(element, index) {
  const last = state.size - 1;
  const row = Math.floor(index / state.size);
  const col = index % state.size;
  if (row === 0 && col === 0) element.classList.add('tile-corner-tl');
  if (row === 0 && col === last) element.classList.add('tile-corner-tr');
  if (row === last && col === 0) element.classList.add('tile-corner-bl');
  if (row === last && col === last) element.classList.add('tile-corner-br');
}

function updateProgress() {
  const totalPieces = state.size * state.size - 1;
  const correct = correctTileCount();
  const percentage = Math.round((correct / totalPieces) * 100);
  $('#progress-bar').style.width = `${percentage}%`;
  $('#progress-text').textContent = `${percentage}%`;
  $('#correct-count').textContent = `${correct} / ${totalPieces}`;
  $('#move-count').textContent = String(state.moves);
}

function getMovePath(index) {
  const emptyRow = Math.floor(state.emptyIndex / state.size);
  const emptyCol = state.emptyIndex % state.size;
  const tileRow = Math.floor(index / state.size);
  const tileCol = index % state.size;
  const path = [];

  if (emptyRow === tileRow && emptyCol !== tileCol) {
    const step = tileCol > emptyCol ? 1 : -1;
    for (let cursor = state.emptyIndex; cursor !== index; cursor += step) path.push(cursor + step);
  } else if (emptyCol === tileCol && emptyRow !== tileRow) {
    const step = tileRow > emptyRow ? state.size : -state.size;
    for (let cursor = state.emptyIndex; cursor !== index; cursor += step) path.push(cursor + step);
  }
  return path;
}

function isDragTowardEmpty(index, dx, dy) {
  const emptyRow = Math.floor(state.emptyIndex / state.size);
  const emptyCol = state.emptyIndex % state.size;
  const tileRow = Math.floor(index / state.size);
  const tileCol = index % state.size;
  if (emptyRow === tileRow && emptyCol !== tileCol) return Math.sign(dx) === Math.sign(emptyCol - tileCol);
  if (emptyCol === tileCol && emptyRow !== tileRow) return Math.sign(dy) === Math.sign(emptyRow - tileRow);
  return false;
}

function slideTile(index, dragVector = null) {
  if (state.status !== 'playing') return false;
  const path = getMovePath(index);
  if (!path.length || (dragVector && !isDragTowardEmpty(index, dragVector.dx, dragVector.dy))) return false;

  for (const targetIndex of path) {
    [state.tiles[state.emptyIndex], state.tiles[targetIndex]] = [state.tiles[targetIndex], state.tiles[state.emptyIndex]];
    state.emptyIndex = targetIndex;
    state.moves += 1;
  }
  renderBoard();
  if (isSolved()) finishGame(true);
  return true;
}

function moveTile(index) {
  slideTile(index);
}

function getDragAxis(index) {
  const emptyRow = Math.floor(state.emptyIndex / state.size);
  const emptyCol = state.emptyIndex % state.size;
  const tileRow = Math.floor(index / state.size);
  const tileCol = index % state.size;
  if (emptyRow === tileRow && emptyCol !== tileCol) return { axis: 'x', sign: Math.sign(emptyCol - tileCol) };
  if (emptyCol === tileCol && emptyRow !== tileRow) return { axis: 'y', sign: Math.sign(emptyRow - tileRow) };
  return null;
}

function clearDragVisual(drag) {
  if (!drag) return;
  if (drag.rafId) window.cancelAnimationFrame(drag.rafId);
  drag.element?.classList.remove('is-dragging');
  drag.element?.style.removeProperty('--drag-x');
  drag.element?.style.removeProperty('--drag-y');
  try { drag.element?.releasePointerCapture?.(drag.pointerId); } catch { /* el puntero ya pudo liberarse */ }
}

function cancelActiveDrag() {
  if (!state.drag) return;
  const drag = state.drag;
  state.drag = null;
  clearDragVisual(drag);
}

function handlePointerDown(event) {
  if (state.status !== 'playing' || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const index = Number(event.currentTarget.dataset.index);
  const axis = getDragAxis(index);
  if (!axis) return;
  cancelActiveDrag();
  const element = event.currentTarget;
  state.drag = {
    index,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    axis: axis.axis,
    sign: axis.sign,
    moved: false,
    element,
    rafId: null
  };
  try { element.setPointerCapture?.(event.pointerId); } catch { /* algunos navegadores no capturan el puntero del mouse */ }
}

function handlePointerMove(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  const drag = state.drag;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  const distanceX = event.clientX - drag.startX;
  const distanceY = event.clientY - drag.startY;
  const distance = drag.axis === 'x' ? Math.abs(distanceX) : Math.abs(distanceY);
  if (distance < 12) return;
  drag.moved = true;
  drag.element.classList.add('is-dragging');
  const maxOffset = Math.min(drag.element.clientWidth, drag.element.clientHeight) * .82;
  const rawOffset = drag.axis === 'x' ? distanceX : distanceY;
  const offset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
  const offsetX = drag.axis === 'x' ? offset : 0;
  const offsetY = drag.axis === 'y' ? offset : 0;
  if (drag.rafId) window.cancelAnimationFrame(drag.rafId);
  drag.rafId = window.requestAnimationFrame(() => {
    if (state.drag !== drag) return;
    drag.element.style.setProperty('--drag-x', `${offsetX}px`);
    drag.element.style.setProperty('--drag-y', `${offsetY}px`);
    drag.rafId = null;
  });
  event.preventDefault();
}

function handlePointerUp(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  finishPointerGesture(event);
}

function handlePointerCancel(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  finishPointerGesture(event, true);
}

function finishPointerGesture(event, cancelled = false) {
  const drag = state.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const dx = Number.isFinite(event.clientX) ? event.clientX - drag.startX : drag.lastX - drag.startX;
  const dy = Number.isFinite(event.clientY) ? event.clientY - drag.startY : drag.lastY - drag.startY;
  state.drag = null;
  clearDragVisual(drag);
  if (!cancelled && drag.moved) {
    event.preventDefault();
    slideTile(drag.index, { dx, dy });
    state.suppressClick = true;
    window.setTimeout(() => { state.suppressClick = false; }, 0);
  }
}

window.addEventListener('pointerup', handlePointerUp, true);
window.addEventListener('pointercancel', handlePointerCancel, true);
window.addEventListener('blur', cancelActiveDrag);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelActiveDrag();
});

function updateTimerUI() {
  $('#timer').textContent = formatTime(state.timeLeft);
  $('#timer-bar').style.width = `${(state.timeLeft / state.seconds) * 100}%`;
  const stat = $('.timer-stat');
  stat.classList.toggle('warning', state.timeLeft <= 20 && state.timeLeft > 10);
  stat.classList.toggle('danger', state.timeLeft <= 10);
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    if (state.status !== 'playing') return;
    state.timeLeft -= 1;
    updateTimerUI();
    if (state.timeLeft <= 0) finishGame(false);
  }, 1000);
}

function startGame() {
  cancelActiveDrag();
  resetResultScroll();
  stopTimer();
  state.status = 'playing';
  state.timeLeft = state.seconds;
  state.moves = 0;
  createScrambledBoard();
  const modeLabel = state.mode === 'normal' ? '3 × 3' : '4 × 4';
  const difficultyLabel = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' }[state.difficulty];
  $('#game-mode-title').textContent = `${modeLabel} · ${difficultyLabel}`;
  $('#goal-text').textContent = `Ordena las ${state.size * state.size} casillas para revelar la foto completa.`;
  updateBestTimeUI(state.bestTimes[getBestKey()]);
  $('#setup-screen').classList.add('hidden');
  document.querySelector('.app-shell').classList.add('game-active');
  $('#game-screen').classList.remove('hidden');
  $('#result-modal').classList.add('hidden');
  updateTimerUI();
  renderBoard();
  startTimer();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function finishGame(won) {
  if (state.status !== 'playing') return;
  cancelActiveDrag();
  state.status = won ? 'won' : 'lost';
  stopTimer();
  const finalTiles = state.tiles.slice();
  const finalSize = state.size;
  const finalImage = state.puzzleImageSrc;
  const elapsed = state.seconds - state.timeLeft;
  const resultTitle = $('#result-title');
  const resultMessage = $('#result-message');
  const resultIcon = $('#result-icon');
  const resultKicker = $('#result-kicker');
  if (won) {
    resultKicker.textContent = 'misión cumplida';
    resultTitle.textContent = '¡Ganaste!';
    resultMessage.textContent = `La imagen volvió a aparecer en ${state.moves} movimientos. ¡Qué buena jugada!`;
    resultIcon.textContent = '✦';
    const best = state.bestTimes[getBestKey()];
    if (!best || elapsed < best) {
      state.bestTimes[getBestKey()] = elapsed;
      saveBestTimes();
      updateBestTimeUI(elapsed);
    }
  } else {
    resultKicker.textContent = 'se acabó el tiempo';
    resultTitle.textContent = '¡Casi!';
    resultMessage.textContent = 'El reloj llegó a cero, pero ya sabes cómo va. Inténtalo una vez más.';
    resultIcon.textContent = '◷';
  }
  $('#result-time').textContent = formatTime(elapsed);
  $('#result-reference-image').src = finalImage;
  renderResultBoardPreview(finalTiles, finalSize, finalImage);
  resetResultScroll();
  $('#result-modal').classList.remove('hidden');
}

function returnToSetup() {
  cancelActiveDrag();
  resetResultScroll();
  stopTimer();
  state.status = 'setup';
  $('#result-modal').classList.add('hidden');
  $('#game-screen').classList.add('hidden');
  document.querySelector('.app-shell').classList.remove('game-active');
  $('#setup-screen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function resetResultScroll() {
  const modal = $('#result-modal');
  const dialog = $('.result-dialog');
  modal.scrollTop = 0;
  dialog.scrollTop = 0;
  window.requestAnimationFrame(() => {
    modal.scrollTop = 0;
    dialog.scrollTop = 0;
  });
}

function stopCamera() {
  state.cameraStream?.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  state.activeCameraId = '';
  $('#camera-video').srcObject = null;
}

async function getCameraPermissionState() {
  if (!navigator.permissions?.query) return 'unknown';
  try {
    const permission = await navigator.permissions.query({ name: 'camera' });
    return permission.state;
  } catch {
    // Safari y algunos WebView no exponen el permiso de cámara.
    return 'unknown';
  }
}

function describeCamera(device, index) {
  const label = (device.label || '').toLowerCase();
  if (/back|rear|environment|trasera|posterior/.test(label)) return 'Cámara trasera';
  if (/front|user|frontal|selfie/.test(label)) return 'Cámara delantera';
  if (/usb|webcam|external|externa|pc camera|logitech|integrated|built[- ]?in|facetime|hd camera/.test(label)) return 'Webcam USB';
  return `Cámara ${index + 1}`;
}

function shouldMirrorCamera() {
  // La foto del puzzle debe conservar la orientación natural en todos los
  // dispositivos. En especial, no espejamos webcams USB: el navegador ya
  // entrega su señal en la orientación que debe conservarse en la captura.
  return false;
}

function updateCameraPresentation() {
  state.cameraMirror = shouldMirrorCamera();
  $('#camera-video').style.setProperty('transform', state.cameraMirror ? 'scaleX(-1)' : 'none', 'important');
}

function renderCameraDevices() {
  const picker = $('#camera-picker');
  const select = $('#camera-select');
  const switchButton = $('#switch-camera');
  if (!picker || !select || !switchButton) return;
  const activeId = state.activeCameraId || state.cameraStream?.getVideoTracks()[0]?.getSettings?.().deviceId || '';
  select.innerHTML = '';
  state.cameraDevices.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.textContent = describeCamera(device, index);
    option.selected = device.deviceId === activeId;
    select.appendChild(option);
  });
  const hasMultiple = state.cameraDevices.length > 1;
  picker.classList.toggle('hidden', !hasMultiple);
  switchButton.disabled = !hasMultiple || state.cameraSwitching;
  select.disabled = !hasMultiple || state.cameraSwitching;
}

async function refreshCameraDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    state.cameraDevices = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === 'videoinput');
    if (!state.activeCameraId && state.cameraDevices.length === 1) {
      state.activeCameraId = state.cameraDevices[0].deviceId || '';
    }
    renderCameraDevices();
  } catch {
    state.cameraDevices = [];
    renderCameraDevices();
  }
}

function getCameraConstraints(cameraId = '') {
  const video = {
    width: { ideal: CAMERA_MAX_WIDTH, max: CAMERA_MAX_WIDTH },
    height: { ideal: CAMERA_MAX_HEIGHT, max: CAMERA_MAX_HEIGHT },
    frameRate: { ideal: CAMERA_MAX_FPS, max: CAMERA_MAX_FPS }
  };
  if (cameraId) video.deviceId = { exact: cameraId };
  else if (state.cameraFacingMode === 'user' || state.cameraFacingMode === 'environment') {
    video.facingMode = { ideal: state.cameraFacingMode };
  }
  return { video, audio: false };
}

async function requestCameraStream(cameraId = '') {
  try {
    return await navigator.mediaDevices.getUserMedia(getCameraConstraints(cameraId));
  } catch (error) {
    // Si el celular no expone el modo preferido, probamos cualquier cámara disponible.
    if (!cameraId && error.name === 'OverconstrainedError') {
      return navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960, max: CAMERA_MAX_WIDTH },
          height: { ideal: 540, max: CAMERA_MAX_HEIGHT },
          frameRate: { ideal: 20, max: CAMERA_MAX_FPS }
        },
        audio: false
      });
    }
    throw error;
  }
}

async function prepareCameraTrack(track) {
  try {
    const capabilities = track.getCapabilities?.() || {};
    const maxWidth = Math.min(capabilities.width?.max || CAMERA_MAX_WIDTH, CAMERA_MAX_WIDTH);
    const maxHeight = Math.min(capabilities.height?.max || CAMERA_MAX_HEIGHT, CAMERA_MAX_HEIGHT);
    await track.applyConstraints({
      width: { ideal: maxWidth, max: maxWidth },
      height: { ideal: maxHeight, max: maxHeight },
      frameRate: { ideal: CAMERA_MAX_FPS, max: CAMERA_MAX_FPS }
    });
  } catch {
    // Algunas cámaras USB o WebView solo aceptan su resolución predeterminada.
  }
}

async function startCameraStream(cameraId = '') {
  // Al cambiar de cámara no mantenemos dos streams vivos al mismo tiempo.
  stopCamera();
  const stream = await requestCameraStream(cameraId);
  const track = stream.getVideoTracks()[0];
  await prepareCameraTrack(track);
  state.cameraStream = stream;
  state.activeCameraId = track.getSettings?.().deviceId || cameraId || '';
  const detectedFacingMode = track.getSettings?.().facingMode;
  if (detectedFacingMode === 'user' || detectedFacingMode === 'environment') state.cameraFacingMode = detectedFacingMode;
  else if (cameraId) state.cameraFacingMode = 'unknown';
  const video = $('#camera-video');
  video.srcObject = stream;
  await video.play();
  await refreshCameraDevices();
  updateCameraPresentation();
}

async function changeCamera(cameraId) {
  if (state.cameraSwitching || !cameraId || cameraId === state.activeCameraId) return;
  state.cameraSwitching = true;
  const selectedDevice = state.cameraDevices.find((device) => device.deviceId === cameraId);
  const selectedLabel = (selectedDevice?.label || '').toLowerCase();
  if (/front|user|frontal|selfie/.test(selectedLabel)) state.cameraFacingMode = 'user';
  else if (/back|rear|environment|trasera|posterior/.test(selectedLabel)) state.cameraFacingMode = 'environment';
  else state.cameraFacingMode = 'unknown';
  renderCameraDevices();
  $('#camera-status').textContent = 'Cambiando de cámara…';
  try {
    await startCameraStream(cameraId);
    $('#camera-status').textContent = 'Ajusta el encuadre y toca tomar foto';
  } catch (error) {
    $('#camera-status').textContent = 'No se pudo cambiar de cámara. Continúa con la cámara actual.';
    console.warn('Camera switch unavailable:', error.message);
  } finally {
    state.cameraSwitching = false;
    renderCameraDevices();
  }
}

async function cycleCamera() {
  if (state.cameraDevices.length < 2) return;
  const activeIndex = Math.max(0, state.cameraDevices.findIndex((device) => device.deviceId === state.activeCameraId));
  const nextDevice = state.cameraDevices[(activeIndex + 1) % state.cameraDevices.length];
  if (nextDevice) await changeCamera(nextDevice.deviceId);
}

function hasActiveCamera() {
  return Boolean(state.cameraStream?.getTracks().some((track) => track.readyState === 'live'));
}

function discardCapturedPhoto() {
  if (state.capturedData?.startsWith('blob:') && state.capturedData !== state.imageObjectUrl) {
    URL.revokeObjectURL(state.capturedData);
  }
  state.capturedData = null;
}

function pauseCameraPreview() {
  $('#camera-video').pause();
}

async function openCamera() {
  discardCapturedPhoto();
  const video = $('#camera-video');
  updateCameraPresentation();
  $('#camera-modal').classList.remove('hidden');
  $('#camera-live').classList.remove('hidden');
  $('#camera-review').classList.add('hidden');
  $('#camera-live-actions').classList.remove('hidden');
  $('#camera-review-actions').classList.add('hidden');
  $('#camera-status').textContent = hasActiveCamera() ? 'Cámara lista. Ajusta el encuadre.' : 'Solicitando acceso a la cámara…';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
    const permissionState = await getCameraPermissionState();
    if (permissionState === 'denied') {
      $('#camera-status').textContent = 'El acceso está bloqueado. Activa la cámara en los permisos del navegador.';
      $('#camera-live-actions').classList.add('hidden');
      return;
    }
    if (!hasActiveCamera()) {
      await startCameraStream();
    } else {
      video.srcObject = state.cameraStream;
      await video.play();
      await refreshCameraDevices();
      updateCameraPresentation();
    }
    $('#camera-status').textContent = 'Ajusta el encuadre y toca tomar foto';
  } catch (error) {
    $('#camera-status').textContent = 'No se pudo abrir la cámara. Puedes subir una imagen.';
    $('#camera-live-actions').classList.add('hidden');
    console.warn('Camera unavailable:', error.message);
  }
}

function closeCamera() {
  pauseCameraPreview();
  discardCapturedPhoto();
  $('#camera-modal').classList.add('hidden');
}

async function capturePhoto() {
  const video = $('#camera-video');
  if (!video.videoWidth) return;
  const canvas = $('#camera-canvas');
  const sourceSide = Math.min(video.videoWidth, video.videoHeight);
  const sourceX = (video.videoWidth - sourceSide) / 2;
  const sourceY = (video.videoHeight - sourceSide) / 2;
  const scale = Math.min(1, MAX_IMAGE_SIDE / sourceSide);
  canvas.width = Math.round(sourceSide * scale);
  canvas.height = Math.round(sourceSide * scale);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  if (state.cameraMirror) {
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, sourceX, sourceY, sourceSide, sourceSide, 0, 0, canvas.width, canvas.height);
    context.restore();
  } else {
    context.drawImage(video, sourceX, sourceY, sourceSide, sourceSide, 0, 0, canvas.width, canvas.height);
  }
  discardCapturedPhoto();
  let photoBlob;
  try {
    photoBlob = await canvasToBlob(canvas, 'image/webp', .78);
  } catch {
    photoBlob = await canvasToBlob(canvas, 'image/jpeg', .78);
  }
  state.capturedData = URL.createObjectURL(photoBlob);
  $('#captured-image').src = state.capturedData;
  pauseCameraPreview();
  $('#camera-live').classList.add('hidden');
  $('#camera-review').classList.remove('hidden');
  $('#camera-live-actions').classList.add('hidden');
  $('#camera-review-actions').classList.remove('hidden');
  $('#camera-status').textContent = '¿Te gusta? Puedes repetirla o usarla para jugar.';
}

setImage(DEFAULT_IMAGE, 'Ecosistema Roma');
setMode('normal');
setDifficulty('normal');
setGuide(false);

$$('.mode-option').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$$('.mix-option').forEach((button) => button.addEventListener('click', () => setDifficulty(button.dataset.difficulty)));
$('#guide-toggle').addEventListener('change', (event) => setGuide(event.currentTarget.checked));
$('#gallery-button').addEventListener('click', openGallery);
$('#close-gallery').addEventListener('click', closeGallery);
$('#cancel-gallery').addEventListener('click', closeGallery);
$('#use-gallery-photo').addEventListener('click', useGalleryPhoto);
$('#start-button').addEventListener('click', async (event) => {
  if (state.status !== 'setup' || state.starting) return;
  const startButton = event.currentTarget;
  state.starting = true;
  startButton.disabled = true;
  try {
    // El source ya está disponible; no bloqueamos el tótem esperando una conversión.
    startGame();
  } finally {
    state.starting = false;
    startButton.disabled = false;
  }
});
$('#restart-game').addEventListener('click', startGame);
$('#back-to-setup').addEventListener('click', returnToSetup);
$('#side-new-image').addEventListener('click', returnToSetup);
$('#result-new-image').addEventListener('click', returnToSetup);
$('#play-again').addEventListener('click', startGame);

$('#file-input').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  // El object URL evita duplicar una foto grande en memoria como Data URL.
  setImage(URL.createObjectURL(file), file.name);
  event.target.value = '';
});

$('#camera-button').addEventListener('click', openCamera);
$('#close-camera').addEventListener('click', closeCamera);
$('#cancel-camera-live').addEventListener('click', closeCamera);
$('#capture-photo').addEventListener('click', capturePhoto);
$('#camera-select').addEventListener('change', (event) => changeCamera(event.target.value));
$('#switch-camera').addEventListener('click', cycleCamera);
$('#retake-photo').addEventListener('click', openCamera);
$('#use-photo').addEventListener('click', () => {
  if (state.capturedData) {
    const capturedPhoto = state.capturedData;
    state.capturedData = null;
    setImage(capturedPhoto, 'Foto tomada');
  }
  closeCamera();
});

window.addEventListener('pagehide', () => {
  stopCamera();
  discardCapturedPhoto();
  if (state.imageObjectUrl) URL.revokeObjectURL(state.imageObjectUrl);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!$('#gallery-modal').classList.contains('hidden')) closeGallery();
    else if (!$('#camera-modal').classList.contains('hidden')) closeCamera();
    else if (!$('#result-modal').classList.contains('hidden')) $('#result-modal').classList.add('hidden');
  }
});
