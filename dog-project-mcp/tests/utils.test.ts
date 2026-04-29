import { describe, it, expect } from "vitest";
import { calcDaysPending, getPeriodRange } from "../src/lib/supabase.js";

describe("utils", () => {
  describe("calcDaysPending", () => {
    it("should calculate days from date string", () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const result = calcDaysPending(threeDaysAgo.toISOString());
      expect(result).toBe(3);
    });

    it("should return 0 for today", () => {
      const today = new Date().toISOString();
      const result = calcDaysPending(today);
      expect(result).toBe(0);
    });
  });

  describe("getPeriodRange", () => {
    it("should return valid range for today", () => {
      const range = getPeriodRange("today");
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(range.start <= range.end).toBe(true);
    });

    it("should return valid range for week", () => {
      const range = getPeriodRange("week");
      const start = new Date(range.start);
      const end = new Date(range.end);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(7);
      expect(diffDays).toBeLessThan(8);
    });

    it("should return valid range for month", () => {
      const range = getPeriodRange("month");
      const start = new Date(range.start);
      const end = new Date(range.end);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(30);
    });

    it("should return valid range for quarter", () => {
      const range = getPeriodRange("quarter");
      const start = new Date(range.start);
      const end = new Date(range.end);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(90);
    });
  });
});
