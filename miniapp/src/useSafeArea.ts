import { SafeAreaInsets } from '@apps-in-toss/web-framework';
import { useEffect, useState } from 'react';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const FALLBACK_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

function validInsets(value: unknown): value is Insets {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Insets>;
  return [candidate.top, candidate.right, candidate.bottom, candidate.left].every(
    (item) => typeof item === 'number' && Number.isFinite(item),
  );
}

function readInitialInsets(): Insets {
  try {
    const insets = SafeAreaInsets.get();
    return validInsets(insets) ? insets : FALLBACK_INSETS;
  } catch {
    return FALLBACK_INSETS;
  }
}

export function useSafeAreaInsets(): Insets {
  const [insets, setInsets] = useState<Insets>(readInitialInsets);

  useEffect(() => {
    try {
      return SafeAreaInsets.subscribe({
        onEvent: (nextInsets) => {
          if (validInsets(nextInsets)) {
            setInsets(nextInsets);
          }
        },
      });
    } catch {
      setInsets(FALLBACK_INSETS);
      return undefined;
    }
  }, []);

  return insets;
}
