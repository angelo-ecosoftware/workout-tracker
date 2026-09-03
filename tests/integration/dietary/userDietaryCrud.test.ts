import { describe, it, expect, beforeEach } from 'vitest';
import { FoodItemNutrition, LoggedDietaryEntry } from '../../../src/models.ts';

class UserDietaryManager {
  private customItems = new Map<string, FoodItemNutrition>();
  private userLogs = new Map<string, LoggedDietaryEntry[]>(); // userId -> entries

  public createCustomFood(userId: string, food: Omit<FoodItemNutrition, 'id' | 'userId' | 'isCustom'>): FoodItemNutrition {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFood: FoodItemNutrition = {
      ...food,
      id,
      userId,
      isCustom: true
    };
    this.customItems.set(id, newFood);
    return newFood;
  }

  public getCustomFoodsForUser(userId: string): FoodItemNutrition[] {
    return Array.from(this.customItems.values()).filter(f => f.userId === userId);
  }

  public updateCustomFood(id: string, updates: Partial<Omit<FoodItemNutrition, 'id' | 'userId' | 'isCustom'>>): FoodItemNutrition | null {
    const existing = this.customItems.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.customItems.set(id, updated);
    return updated;
  }

  public logUserEntry(userId: string, entry: Omit<LoggedDietaryEntry, 'id'>): LoggedDietaryEntry {
    const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const loggedEntry: LoggedDietaryEntry = {
      ...entry,
      id
    };
    const list = this.userLogs.get(userId) || [];
    list.push(loggedEntry);
    this.userLogs.set(userId, list);
    return loggedEntry;
  }

  public getUserEntries(userId: string): LoggedDietaryEntry[] {
    return this.userLogs.get(userId) || [];
  }
}

describe('User Dietary CRUD Workflows & Tenant Isolation', () => {
  let manager: UserDietaryManager;

  beforeEach(() => {
    manager = new UserDietaryManager();
  });

  it('creates, retrieves, and updates custom foods isolated by user', () => {
    const userA = 'user_alice_01';
    const userB = 'user_bob_02';

    const foodA = manager.createCustomFood(userA, {
      name: 'Alice Protein Shake',
      servingUnit: 'gram',
      kcalPer100g: 390,
      proteinPer100g: 80,
      carbsPer100g: 5,
      sugarPer100g: 2,
      fatPer100g: 4,
      fiberPer100g: 1
    });

    const foodB = manager.createCustomFood(userB, {
      name: 'Bob Mass Gainer',
      servingUnit: 'gram',
      kcalPer100g: 450,
      proteinPer100g: 30,
      carbsPer100g: 70,
      sugarPer100g: 15,
      fatPer100g: 6,
      fiberPer100g: 3
    });

    const aliceFoods = manager.getCustomFoodsForUser(userA);
    const bobFoods = manager.getCustomFoodsForUser(userB);

    expect(aliceFoods).toHaveLength(1);
    expect(aliceFoods[0].name).toBe('Alice Protein Shake');
    expect(bobFoods).toHaveLength(1);
    expect(bobFoods[0].name).toBe('Bob Mass Gainer');

    // Update Alice's food
    const updated = manager.updateCustomFood(foodA.id, { kcalPer100g: 400 });
    expect(updated?.kcalPer100g).toBe(400);
  });

  it('logs multiple food portion entries for a user', () => {
    const userId = 'user_claire_03';

    manager.logUserEntry(userId, {
      foodItemId: 'item_1',
      name: 'Griekse Yoghurt',
      amountGrams: 200,
      kcalPer100g: 60,
      proteinPer100g: 10,
      carbsPer100g: 4,
      sugarPer100g: 4,
      fatPer100g: 0,
      fiberPer100g: 0,
      calculatedKcal: 120,
      calculatedProtein: 20,
      calculatedCarbs: 8,
      calculatedSugar: 8,
      calculatedFat: 0,
      calculatedFiber: 0
    });

    const entries = manager.getUserEntries(userId);
    expect(entries).toHaveLength(1);
    expect(entries[0].calculatedProtein).toBe(20);
  });
});
