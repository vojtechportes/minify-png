export const downloadBuffer = async (url: string): Promise<Buffer> => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'minify-png benchmark/0.1.0 (https://github.com/)',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
};
