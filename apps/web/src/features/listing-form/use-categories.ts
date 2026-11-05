'use client';

import type { CategoryKind } from '@clickauto/shared';
import { useMemo } from 'react';
import { useListCategories } from '@/shared/api/generated/catalog/catalog';
import type { CategoryDto } from '@/shared/api/generated/model';

export interface CategoryOption {
  category: CategoryDto;
  /** "Шины → Летние" */
  label: string;
}

/**
 * Categories a listing can be placed in: leaves of the tree, labelled with their parent.
 * The API returns a flat list with inherited attributes already merged.
 */
export function useCategoryOptions(kind: CategoryKind): {
  options: CategoryOption[];
  byId: Map<string, CategoryDto>;
} {
  const query = useListCategories({ kind });
  const list = useMemo(() => (query.data?.status === 200 ? query.data.data : []), [query.data]);
  return useMemo(() => {
    const byId = new Map(list.map((category) => [category.id, category]));
    // The API sorts by `sort`, which is the position among siblings: rebuild the tree order
    // (each root followed by its children) so "Шины → Летние" stays next to "Шины → Зимние".
    const options: CategoryOption[] = [];
    for (const root of list.filter((category) => !category.parentId)) {
      const children = list.filter((category) => category.parentId === root.id);
      if (children.length === 0) options.push({ category: root, label: root.name });
      for (const child of children)
        options.push({ category: child, label: `${root.name} → ${child.name}` });
    }
    return { options, byId };
  }, [list]);
}
