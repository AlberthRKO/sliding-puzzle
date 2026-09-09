const DEFAULT_IMAGE = 'logoRoma.png';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  imageSrc: DEFAULT_IMAGE,
  puzzleImageSrc: DEFAULT_IMAGE,
  imageName: 'Ecosistema Roma',
  mode: 'normal',
  difficulty: 'easy',
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

function createSquareImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      if (!side) {
        reject(new Error('La imagen no tiene un tamaño válido.'));
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('El navegador no puede preparar la imagen.'));
        return;
      }
      const sourceX = (image.naturalWidth - side) / 2;
      const sourceY = (image.naturalHeight - side) / 2;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, side, side);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, sourceX, sourceY, side, side, 0, 0, side, side);
      resolve(canvas.toDataURL('image/jpeg', .95));
    };
    image.onerror = () => reject(new Error('No se pudo preparar la imagen.'));
    image.src = source;
  });
}

function setImage(source, name = 'Imagen elegida') {
  const requestId = ++state.imageRequestId;
  state.imageSrc = source;
  state.puzzleImageSrc = source;
  state.imageName = name;
  $('#image-preview').src = source;
  $('#reference-image').src = source;
  $('#preview-caption').textContent = name.length > 24 ? `${name.slice(0, 23)}…` : name;
  state.imageReadyPromise = createSquareImage(source).then((squareImage) => {
    if (requestId !== state.imageRequestId) return squareImage;
    state.puzzleImageSrc = squareImage;
    $('#image-preview').src = squareImage;
    $('#reference-image').src = squareImage;
    if (state.status === 'playing') refreshTileImages();
    return squareImage;
  }).catch(() => source);
}

function getTimeForSettings() {
  const times = {
    normal: { easy: 90, normal: 120, hard: 150 },
    hard: { easy: 150, normal: 180, hard: 210 }
  };
  return times[state.mode][state.difficulty];
}

function getBestKey() {
  return `${state.mode}-${state.difficulty}`;
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
  $('#best-time').textContent = state.bestTimes[getBestKey()] ? formatTime(state.bestTimes[getBestKey()]) : '—';
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
      $('#best-time').textContent = formatTime(elapsed);
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
  const activeDevice = state.cameraDevices.find((device) => device.deviceId === state.activeCameraId);
  const label = (activeDevice?.label || '').toLowerCase();
  const isBackCamera = /back|rear|environment|trasera|posterior/.test(label);
  const isMirroredCamera = /front|user|frontal|selfie|usb|webcam|external|externa|pc camera|logitech|integrated|built[- ]?in|facetime|hd camera/.test(label);
  if (isBackCamera) return false;
  if (isMirroredCamera) return true;
  return state.cameraFacingMode === 'user' || state.cameraFacingMode === 'unknown';
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
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
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
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: false
      });
    }
    throw error;
  }
}

async function prepareCameraTrack(track) {
  try {
    const capabilities = track.getCapabilities?.() || {};
    const maxWidth = capabilities.width?.max || 1920;
    const maxHeight = capabilities.height?.max || 1080;
    await track.applyConstraints({
      width: { ideal: Math.min(maxWidth, 1920), max: maxWidth },
      height: { ideal: Math.min(maxHeight, 1080), max: maxHeight },
      frameRate: { ideal: 30 }
    });
  } catch {
    // Algunas cámaras USB o WebView solo aceptan su resolución predeterminada.
  }
}

async function startCameraStream(cameraId = '') {
  const stream = await requestCameraStream(cameraId);
  const oldStream = state.cameraStream;
  const track = stream.getVideoTracks()[0];
  await prepareCameraTrack(track);
  oldStream?.getTracks().forEach((oldTrack) => oldTrack.stop());
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

function pauseCameraPreview() {
  $('#camera-video').pause();
}

async function openCamera() {
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
  $('#camera-modal').classList.add('hidden');
}

function capturePhoto() {
  const video = $('#camera-video');
  if (!video.videoWidth) return;
  const canvas = $('#camera-canvas');
  const sourceSide = Math.min(video.videoWidth, video.videoHeight);
  const sourceX = (video.videoWidth - sourceSide) / 2;
  const sourceY = (video.videoHeight - sourceSide) / 2;
  const scale = Math.min(1, 1920 / sourceSide);
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
  state.capturedData = canvas.toDataURL('image/jpeg', .9);
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

$$('.mode-option').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$$('.mix-option').forEach((button) => button.addEventListener('click', () => setDifficulty(button.dataset.difficulty)));
$('#start-button').addEventListener('click', async (event) => {
  if (state.status !== 'setup' || state.starting) return;
  const startButton = event.currentTarget;
  state.starting = true;
  startButton.disabled = true;
  try {
    // La partida no queda bloqueada si el navegador tarda en resolver una imagen local.
    await Promise.race([
      state.imageReadyPromise,
      new Promise((resolve) => window.setTimeout(resolve, 400))
    ]);
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
  const reader = new FileReader();
  reader.addEventListener('load', () => setImage(reader.result, file.name));
  reader.readAsDataURL(file);
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
  if (state.capturedData) setImage(state.capturedData, 'Foto tomada');
  closeCamera();
});

window.addEventListener('pagehide', stopCamera);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!$('#camera-modal').classList.contains('hidden')) closeCamera();
    else if (!$('#result-modal').classList.contains('hidden')) $('#result-modal').classList.add('hidden');
  }
});
