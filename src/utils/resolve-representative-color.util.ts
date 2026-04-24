export const resolveRepresentativeColor = (
  pixels: number[][]
): [number, number, number, number] => {
  const channels: number[][] = [[], [], [], []];

  for (const pixel of pixels) {
    channels[0].push(pixel[0]);
    channels[1].push(pixel[1]);
    channels[2].push(pixel[2]);
    channels[3].push(pixel[3]);
  }

  return channels.map((channel) => {
    const sorted = [...channel].sort((left, right) => left - right);
    const midpoint = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2)
      : sorted[midpoint];
  }) as [number, number, number, number];
};
