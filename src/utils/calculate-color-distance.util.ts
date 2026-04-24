export const calculateColorDistance = (
  left: [number, number, number, number],
  right: [number, number, number, number],
  premultiplied = true
): number => {
  const leftAlpha = premultiplied ? left[3] / 255 : 1;
  const rightAlpha = premultiplied ? right[3] / 255 : 1;
  const dr = left[0] * leftAlpha - right[0] * rightAlpha;
  const dg = left[1] * leftAlpha - right[1] * rightAlpha;
  const db = left[2] * leftAlpha - right[2] * rightAlpha;

  return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
};
