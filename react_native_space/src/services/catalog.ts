import api from './api';
import type { CatalogItem } from '../types';

export async function getStates(): Promise<CatalogItem[]> {
  const res = await api.get('/catalog/states');
  return res?.data?.items ?? [];
}

export async function getMunicipalities(stateId: string): Promise<CatalogItem[]> {
  const res = await api.get(`/catalog/municipalities?stateId=${encodeURIComponent(stateId)}`);
  return res?.data?.items ?? [];
}

export async function getParishes(municipalityId: string): Promise<CatalogItem[]> {
  const res = await api.get(`/catalog/parishes?municipalityId=${encodeURIComponent(municipalityId)}`);
  return res?.data?.items ?? [];
}

export async function getVehicleBrands(): Promise<CatalogItem[]> {
  const res = await api.get('/catalog/vehicle-brands');
  return res?.data?.items ?? [];
}

export async function getVehicleModels(brandId: string): Promise<CatalogItem[]> {
  const res = await api.get(`/catalog/vehicle-models?brandId=${encodeURIComponent(brandId)}`);
  return res?.data?.items ?? [];
}

export async function getPartCategories(): Promise<CatalogItem[]> {
  const res = await api.get('/catalog/part-categories');
  return res?.data?.items ?? [];
}

export async function getPartSubcategories(categoryId: string): Promise<CatalogItem[]> {
  const res = await api.get(`/catalog/part-subcategories?categoryId=${encodeURIComponent(categoryId)}`);
  return res?.data?.items ?? [];
}
