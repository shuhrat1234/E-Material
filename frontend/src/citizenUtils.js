/**
 * Utilities for tracking repeat citizens / multiple appeals from the same person.
 */

export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.slice(-9); // e.g. 901234567
  }
  return digits.length >= 7 ? digits : '';
}

export function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isSameCitizen(m1, m2) {
  if (!m1 || !m2) return false;

  const p1 = normalizePhone(m1.citizen_phone || m1.phone);
  const p2 = normalizePhone(m2.citizen_phone || m2.phone);

  if (p1 && p2 && p1 === p2) {
    return true;
  }

  const n1 = normalizeName(m1.citizen_name || m1.name);
  const n2 = normalizeName(m2.citizen_name || m2.name);

  if (n1 && n2 && n1.length >= 3 && n1 === n2) {
    return true;
  }

  return false;
}

export function findCitizenMaterials(materials, { name, phone, excludeId = null }) {
  if (!Array.isArray(materials)) return [];
  const target = { citizen_name: name, citizen_phone: phone };
  
  // Need at least 3 chars of name or 7 digits of phone to match
  const n = normalizeName(name);
  const p = normalizePhone(phone);
  if ((!n || n.length < 3) && (!p || p.length < 7)) {
    return [];
  }

  return materials.filter(m => {
    if (excludeId && m.id === excludeId) return false;
    return isSameCitizen(m, target);
  });
}

/**
 * Pre-computes a lookup map from material id to its citizen's other materials and total count.
 * Returns { getCount(material), getOtherMaterials(material), isRepeat(material), repeatCount }
 */
export function buildCitizenRepeatIndex(materials) {
  if (!Array.isArray(materials)) {
    return {
      getCount: () => 1,
      getOtherMaterials: () => [],
      isRepeat: () => false,
      repeatTotalMaterialsCount: 0,
    };
  }

  // Pre-index by normalized phone and normalized name
  const byPhone = new Map();
  const byName = new Map();

  for (const m of materials) {
    const p = normalizePhone(m.citizen_phone);
    if (p) {
      if (!byPhone.has(p)) byPhone.set(p, []);
      byPhone.get(p).push(m);
    }

    const n = normalizeName(m.citizen_name);
    if (n && n.length >= 3) {
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n).push(m);
    }
  }

  const cache = new Map();

  const getOtherMaterials = (m) => {
    if (!m) return [];
    if (cache.has(m.id)) return cache.get(m.id);

    const matches = new Map();
    const p = normalizePhone(m.citizen_phone);
    if (p && byPhone.has(p)) {
      for (const item of byPhone.get(p)) {
        if (item.id !== m.id) matches.set(item.id, item);
      }
    }

    const n = normalizeName(m.citizen_name);
    if (n && byName.has(n)) {
      for (const item of byName.get(n)) {
        if (item.id !== m.id) matches.set(item.id, item);
      }
    }

    const result = Array.from(matches.values());
    cache.set(m.id, result);
    return result;
  };

  const getCount = (m) => {
    if (!m) return 1;
    return getOtherMaterials(m).length + 1;
  };

  const isRepeat = (m) => {
    return getCount(m) > 1;
  };

  let repeatTotalMaterialsCount = 0;
  for (const m of materials) {
    if (isRepeat(m)) {
      repeatTotalMaterialsCount += 1;
    }
  }

  return {
    getCount,
    getOtherMaterials,
    isRepeat,
    repeatTotalMaterialsCount,
  };
}
