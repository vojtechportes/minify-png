export const requestJson = async <Value>(url: URL): Promise<Value> => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'minify-png benchmark/0.1.0 (https://github.com/)',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<Value>;
};
