import React, { createContext, useContext, useState, useCallback } from 'react';
import * as catalogApi from '../services/catalog';
import type { CatalogItem } from '../types';

interface CatalogContextType {
  states: CatalogItem[];
  loadStates: () => Promise<CatalogItem[]>;
  loadMunicipalities: (stateId: string) => Promise<CatalogItem[]>;
  loadParishes: (municipalityId: string) => Promise<CatalogItem[]>;
  brands: CatalogItem[];
  loadBrands: () => Promise<CatalogItem[]>;
  loadModels: (brandId: string) => Promise<CatalogItem[]>;
  categories: CatalogItem[];
  loadCategories: (force?: boolean) => Promise<CatalogItem[]>;
  loadSubcategories: (categoryId: string, force?: boolean) => Promise<CatalogItem[]>;
}

const CatalogContext = createContext<CatalogContextType>({
  states: [],
  loadStates: async () => [],
  loadMunicipalities: async () => [],
  loadParishes: async () => [],
  brands: [],
  loadBrands: async () => [],
  loadModels: async () => [],
  categories: [],
  loadCategories: async () => [],
  loadSubcategories: async () => [],
});

export function useCatalog() {
  return useContext(CatalogContext);
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [states, setStates] = useState<CatalogItem[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [municipalityCache, setMunicipalityCache] = useState<Record<string, CatalogItem[]>>({});
  const [parishCache, setParishCache] = useState<Record<string, CatalogItem[]>>({});
  const [modelCache, setModelCache] = useState<Record<string, CatalogItem[]>>({});
  const [subcategoryCache, setSubcategoryCache] = useState<Record<string, CatalogItem[]>>({});

  const loadStates = useCallback(async () => {
    if ((states?.length ?? 0) > 0) return states;
    try {
      const items = await catalogApi.getStates();
      setStates(items ?? []);
      return items ?? [];
    } catch { return []; }
  }, [states]);

  const loadMunicipalities = useCallback(async (stateId: string) => {
    if (municipalityCache?.[stateId]) return municipalityCache[stateId] ?? [];
    try {
      const items = await catalogApi.getMunicipalities(stateId);
      setMunicipalityCache((prev) => ({ ...(prev ?? {}), [stateId]: items ?? [] }));
      return items ?? [];
    } catch { return []; }
  }, [municipalityCache]);

  const loadParishes = useCallback(async (municipalityId: string) => {
    if (parishCache?.[municipalityId]) return parishCache[municipalityId] ?? [];
    try {
      const items = await catalogApi.getParishes(municipalityId);
      setParishCache((prev) => ({ ...(prev ?? {}), [municipalityId]: items ?? [] }));
      return items ?? [];
    } catch { return []; }
  }, [parishCache]);

  const loadBrands = useCallback(async () => {
    if ((brands?.length ?? 0) > 0) return brands;
    try {
      const items = await catalogApi.getVehicleBrands();
      setBrands(items ?? []);
      return items ?? [];
    } catch { return []; }
  }, [brands]);

  const loadModels = useCallback(async (brandId: string) => {
    if (modelCache?.[brandId]) return modelCache[brandId] ?? [];
    try {
      const items = await catalogApi.getVehicleModels(brandId);
      setModelCache((prev) => ({ ...(prev ?? {}), [brandId]: items ?? [] }));
      return items ?? [];
    } catch { return []; }
  }, [modelCache]);

  const loadCategories = useCallback(async (force?: boolean) => {
    if (!force && (categories?.length ?? 0) > 0) return categories;
    try {
      const items = await catalogApi.getPartCategories();
      setCategories(items ?? []);
      return items ?? [];
    } catch { return force ? (categories ?? []) : []; }
  }, [categories]);

  const loadSubcategories = useCallback(async (categoryId: string, force?: boolean) => {
    if (!force && subcategoryCache?.[categoryId]) return subcategoryCache[categoryId] ?? [];
    try {
      const items = await catalogApi.getPartSubcategories(categoryId);
      setSubcategoryCache((prev) => ({ ...(prev ?? {}), [categoryId]: items ?? [] }));
      return items ?? [];
    } catch { return force ? (subcategoryCache?.[categoryId] ?? []) : []; }
  }, [subcategoryCache]);

  return (
    <CatalogContext.Provider value={{
      states, loadStates, loadMunicipalities, loadParishes,
      brands, loadBrands, loadModels,
      categories, loadCategories, loadSubcategories,
    }}>
      {children}
    </CatalogContext.Provider>
  );
}
