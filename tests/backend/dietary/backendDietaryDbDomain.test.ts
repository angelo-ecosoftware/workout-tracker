import { describe, it, expect, beforeEach } from 'vitest';
import { FoodItemNutrition, DailyDietaryLog, LoggedDietaryEntry } from '../../../src/models.ts';

interface StoredDietaryRecord {
  userId: string;
  date: string;
  log: DailyDietaryLog;
  updatedAt: string;
}

class MockBackendDietaryDbDomain {
  private customFoodsTable: FoodItemNutrition[] = [];
  private dailyLogsTable: StoredDietaryRecord[] = [];

  public insertFood(food: FoodItemNutrition): void {
    this.customFoodsTable.push(food);
  }

  public findFoodById(id: string): FoodItemNutrition | undefined {
    return this.customFoodsTable.find(f => f.id === id);
  }

  public upsertDailyLog(userId: string, date: string, log: DailyDietaryLog): void {
    const existingIndex = this.dailyLogsTable.findIndex(r => r.userId === userId && r.date === date);
    const record: StoredDietaryRecord = {
      userId,
      date,
      log,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.dailyLogsTable[existingIndex] = record;
    } else {
      this.dailyLogsTable.push(record);
    }
  }

  public findDailyLog(userId: string, date: string): DailyDietaryLog | null {
    const record = this.dailyLogsTable.find(r => r.userId === userId && r.date === date);
    return record ? record.log : null;
  }

  public getLogsDateRange(userId: string, startDate: string, endDate: string): DailyDietaryLog[] {
    return this.dailyLogsTable
      .filter(r => r.userId === userId && r.date >= startDate && r.date <= endDate)
      .map(r => r.log);
  }
}

describe('Backend Dietary Database Domain & Relational Queries', () => {
  let db: MockBackendDietaryDbDomain;

  beforeEach(() => {
    db = new MockBackendDietaryDbDomain();
  });

  it('persists custom foods and queries food items by ID', () => {
    const food: FoodItemNutrition = {
      id: 'db_food_01',
      name: 'Organic Peanut Butter',
      brand: 'Calvé',
      servingUnit: 'gram',
      kcalPer100g: 620,
      proteinPer100g: 25,
      carbsPer100g: 13,
      sugarPer100g: 6,
      fatPer100g: 52,
      fiberPer100g: 6.5,
      userId: 'usr_peanut_fan'
    };

    db.insertFood(food);
    const retrieved = db.findFoodById('db_food_01');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Organic Peanut Butter');
    expect(retrieved?.proteinPer100g).toBe(25);
  });

  it('upserts and retrieves date-range daily logs for dietary analytics', () => {
    const userId = 'usr_diet_analyst';

    const day1Log: DailyDietaryLog = {
      date: '2026-09-01',
      entries: [],
      totalKcal: 2100,
      totalProtein: 160,
      totalCarbs: 220,
      totalSugar: 30,
      totalFat: 65,
      totalFiber: 35
    };

    const day2Log: DailyDietaryLog = {
      date: '2026-09-02',
      entries: [],
      totalKcal: 2300,
      totalProtein: 175,
      totalCarbs: 240,
      totalSugar: 40,
      totalFat: 70,
      totalFiber: 40
    };

    db.upsertDailyLog(userId, '2026-09-01', day1Log);
    db.upsertDailyLog(userId, '2026-09-02', day2Log);

    const range = db.getLogsDateRange(userId, '2026-09-01', '2026-09-02');
    expect(range).toHaveLength(2);

    const avgKcal = range.reduce((sum, l) => sum + l.totalKcal, 0) / range.length;
    expect(avgKcal).toBe(2200);
  });
});
