export function isTouchEvent(e) {
  return e.type.startsWith('touch');
}

export function bounceFunctionFactory(x1, x2, b) {
  if (x1 >= x2) {
    throw new Error('`x1` should be smaller that `x2`');
  }

  return offset => {
    if (offset >= x1) {
      const v = (1 / (1 + Math.exp(offset / 100)) - 1 / 2) * b;
      return -v;
    } else if (offset < -x2) {
      const diff = -offset - x2;
      const v = (1 / (1 + Math.exp(diff / 100)) - 1 / 2) * b;
      return -x2 + v;
    } else {
      return offset;
    }
  };
}
