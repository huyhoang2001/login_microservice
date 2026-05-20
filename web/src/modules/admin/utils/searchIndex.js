const normalizeTerm = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]+/g, " ")
    .trim();

const tokenize = (value) =>
  normalizeTerm(value)
    .split(/\s+/)
    .filter(Boolean);

export const createHashMapIndex = (items, getSearchText) => {
  const tokenMap = new Map();
  const allIds = new Set();

  items.forEach((item, index) => {
    allIds.add(index);
    const tokens = new Set(tokenize(getSearchText(item)));
    tokens.forEach((token) => {
      if (!tokenMap.has(token)) tokenMap.set(token, new Set());
      tokenMap.get(token).add(index);
    });
  });

  return { allIds, tokenMap };
};

export const createFieldHashMapIndex = (items, fieldGetters) => {
  const tokenMap = new Map();
  const allIds = new Set();

  items.forEach((item, index) => {
    allIds.add(index);
    fieldGetters.forEach((getFieldText, fieldIndex) => {
      const tokens = new Set(tokenize(getFieldText(item)));
      tokens.forEach((token) => {
        const key = `${fieldIndex}:${token}`;
        if (!tokenMap.has(key)) tokenMap.set(key, new Set());
        tokenMap.get(key).add(index);
      });
    });
  });

  return { allIds, tokenMap };
};

export const searchHashMapIndex = (index, query) => {
  const tokens = tokenize(query);
  if (tokens.length === 0) return index.allIds;

  let result = null;
  tokens.forEach((token) => {
    const tokenMatches = new Set();
    index.tokenMap.forEach((ids, indexedToken) => {
      const tokenOnly = indexedToken.includes(":")
        ? indexedToken.slice(indexedToken.indexOf(":") + 1)
        : indexedToken;
      if (tokenOnly.includes(token)) {
        ids.forEach((id) => tokenMatches.add(id));
      }
    });

    if (result === null) {
      result = tokenMatches;
      return;
    }

    result = new Set([...result].filter((id) => tokenMatches.has(id)));
  });

  return result || new Set();
};
