import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getStates() {
    const items = await this.prisma.state.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, capital: true, isoCode: true },
    });
    return { items };
  }

  async getMunicipalities(stateId?: string) {
    const where = stateId ? { stateId } : {};
    const items = await this.prisma.municipality.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, stateId: true },
    });
    return { items };
  }

  async getParishes(municipalityId?: string) {
    const where = municipalityId ? { municipalityId } : {};
    const items = await this.prisma.parish.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, municipalityId: true },
    });
    return { items };
  }

  async getVehicleBrands() {
    const items = await this.prisma.vehicleBrand.findMany({ orderBy: { name: 'asc' } });
    return { items };
  }

  async getVehicleModels(brandId?: string) {
    const where = brandId ? { brandId } : {};
    const items = await this.prisma.vehicleModel.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, brandId: true },
    });
    return { items };
  }

  async getPartCategories() {
    const items = await this.prisma.partCategory.findMany({ orderBy: { name: 'asc' } });
    return { items };
  }

  async getPartSubcategories(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    const items = await this.prisma.partSubcategory.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, categoryId: true },
    });
    return { items };
  }

  async searchParts(query: string) {
    const q = (query ?? '').trim().toLowerCase();
    if (!q || q.length < 2) return { items: [] };

    // Split query into individual words for multi-word search
    const words = q.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length === 0) return { items: [] };

    // Use pg_trgm for fuzzy matching + exact ILIKE for precision
    // Strategy: search keywords and subcategory names with trigram similarity
    // Score: exact match > contains > fuzzy similarity
    const searchQuery = words.join(' ');
    const likePattern = `%${q}%`;

    const results: Array<{
      sub_id: string;
      sub_name: string;
      cat_id: string;
      cat_name: string;
      score: number;
    }> = await this.prisma.$queryRawUnsafe(
      `
      WITH keyword_matches AS (
        -- Exact keyword contains (highest precision)
        SELECT DISTINCT ps.id as sub_id, ps.name as sub_name,
               pc.id as cat_id, pc.name as cat_name,
               CASE
                 WHEN LOWER(pk.keyword) = $1 THEN 1.0
                 WHEN LOWER(pk.keyword) LIKE $2 THEN 0.9
                 ELSE similarity(LOWER(pk.keyword), $1)
               END as score
        FROM part_keywords pk
        JOIN part_subcategories ps ON ps.id = pk.subcategory_id
        JOIN part_categories pc ON pc.id = ps.category_id
        WHERE LOWER(pk.keyword) LIKE $2
           OR similarity(LOWER(pk.keyword), $1) > 0.25
      ),
      name_matches AS (
        -- Subcategory name matches
        SELECT DISTINCT ps.id as sub_id, ps.name as sub_name,
               pc.id as cat_id, pc.name as cat_name,
               CASE
                 WHEN LOWER(ps.name) = $1 THEN 1.0
                 WHEN LOWER(ps.name) LIKE $2 THEN 0.85
                 ELSE similarity(LOWER(ps.name), $1) * 0.8
               END as score
        FROM part_subcategories ps
        JOIN part_categories pc ON pc.id = ps.category_id
        WHERE LOWER(ps.name) LIKE $2
           OR similarity(LOWER(ps.name), $1) > 0.2
      ),
      combined AS (
        SELECT * FROM keyword_matches
        UNION ALL
        SELECT * FROM name_matches
      )
      SELECT sub_id, sub_name, cat_id, cat_name, MAX(score) as score
      FROM combined
      GROUP BY sub_id, sub_name, cat_id, cat_name
      HAVING MAX(score) > 0.2
      ORDER BY MAX(score) DESC
      LIMIT 15
      `,
      q,
      likePattern,
    );

    return {
      items: (results ?? []).map((r) => ({
        subcategoryId: r.sub_id,
        subcategoryName: r.sub_name,
        categoryId: r.cat_id,
        categoryName: r.cat_name,
        score: Number(r.score ?? 0),
      })),
    };
  }
}
