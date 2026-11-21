import { until } from './chromium.mjs';

export async function verifyCanvas(evaluate) {
  await evaluate('new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => done(true))))');
  await until(() => evaluate(`(() => {
    const canvas = document.querySelector('#world');
    const gl = canvas.getContext('webgl2');
    if (!canvas.checkVisibility() || !gl || gl.isContextLost()) return false;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const colors = new Set();
    let opaque = 0;
    // Read a sparse grid directly from the preserved WebGL framebuffer.
    for (let row = 1; row < 20; row++) {
      for (let col = 1; col < 32; col++) {
        const offset = (Math.floor(height * row / 20) * width + Math.floor(width * col / 32)) * 4;
        if (pixels[offset + 3] >= 240) {
          opaque++;
          colors.add(pixels.slice(offset, offset + 3).join(','));
        }
      }
    }
    return opaque > 35 && colors.size > 8;
  })()`));
}
