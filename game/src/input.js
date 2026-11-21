// Keyboard and mouse, folded into one small intent object the player reads.
// Edges (a key pressed this frame) are kept separately from held state so a
// tap starts the run or pauses once, not every frame.
const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const CROUCH = ['ArrowDown', 'KeyS', 'ControlLeft', 'ControlRight'];
const SPRINT = ['ShiftLeft', 'ShiftRight'];

export function createInput(canvas) {
  const held = new Set();
  const input = {
    left: false,
    right: false,
    crouch: false,
    sprint: false,
    throwPebble: false,
    clickThrow: false,
    pointerX: 640,
    pointerY: 360,
    pressed: new Set(),
    restart: false,
    start: false,
    pause: false,
    mute: false,
    anyKey: false,
  };

  const sync = () => {
    input.left = LEFT.some((k) => held.has(k));
    input.right = RIGHT.some((k) => held.has(k));
    input.crouch = CROUCH.some((k) => held.has(k));
    input.sprint = SPRINT.some((k) => held.has(k));
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (LEFT.includes(event.code) || RIGHT.includes(event.code)) sync();
      return;
    }
    held.add(event.code);
    input.pressed.add(event.code);
    input.anyKey = true;
    if (event.code === 'KeyQ') input.throwPebble = true;
    if (event.code === 'Enter' || event.code === 'Space') input.start = true;
    if (event.code === 'KeyP' || event.code === 'Escape') input.pause = true;
    if (event.code === 'KeyM') input.mute = true;
    if (event.code === 'KeyR') input.restart = true;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
    sync();
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
    sync();
  });

  window.addEventListener('blur', () => {
    held.clear();
    sync();
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.clickThrow = true;
    input.start = true;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  input.endFrame = () => {
    input.pressed.clear();
    input.throwPebble = false;
    input.clickThrow = false;
    input.start = false;
    input.pause = false;
    input.mute = false;
    input.restart = false;
    input.anyKey = false;
  };

  return input;
}
