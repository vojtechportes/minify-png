export const dilateMask = (
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array => {
  if (radius <= 0) {
    return new Uint8Array(mask);
  }

  let current = new Uint8Array(mask);

  for (let step = 0; step < radius; step += 1) {
    const next = new Uint8Array(current);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;

        if (current[index] === 0) {
          continue;
        }

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const nextX = x + offsetX;
            const nextY = y + offsetY;

            if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
              continue;
            }

            next[nextY * width + nextX] = 1;
          }
        }
      }
    }

    current = next;
  }

  return current;
};
