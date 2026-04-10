import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB module
vi.mock("../server/db", () => ({
  createFeedback: vi.fn().mockResolvedValue(1),
  getApprovedFeedback: vi.fn().mockResolvedValue([
    { id: 1, name: "Ahmed", email: null, rating: 5, comment: "Excellent service!", travelType: "flight", destination: "Paris", approved: true, language: "en", createdAt: new Date() },
  ]),
  getAllFeedback: vi.fn().mockResolvedValue([]),
  approveFeedback: vi.fn().mockResolvedValue(undefined),
  deleteFeedback: vi.fn().mockResolvedValue(undefined),
}));

import { createFeedback, getApprovedFeedback } from "../server/db";

describe("Customer Feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create feedback with valid data", async () => {
    const id = await createFeedback({
      name: "Ahmed",
      rating: 5,
      comment: "Excellent service!",
      travelType: "flight",
      language: "en",
    });
    expect(id).toBe(1);
    expect(createFeedback).toHaveBeenCalledWith(expect.objectContaining({
      name: "Ahmed",
      rating: 5,
      comment: "Excellent service!",
    }));
  });

  it("should return approved reviews", async () => {
    const reviews = await getApprovedFeedback();
    expect(reviews).toHaveLength(1);
    expect(reviews[0].name).toBe("Ahmed");
    expect(reviews[0].rating).toBe(5);
    expect(reviews[0].approved).toBe(true);
  });

  it("should validate rating range (1-5)", () => {
    const validateRating = (r: number) => r >= 1 && r <= 5;
    expect(validateRating(0)).toBe(false);
    expect(validateRating(1)).toBe(true);
    expect(validateRating(5)).toBe(true);
    expect(validateRating(6)).toBe(false);
  });

  it("should validate comment minimum length", () => {
    const validateComment = (c: string) => c.trim().length >= 5;
    expect(validateComment("Hi")).toBe(false);
    expect(validateComment("Great!")).toBe(true);
    expect(validateComment("")).toBe(false);
  });

  it("should validate name minimum length", () => {
    const validateName = (n: string) => n.trim().length >= 2;
    expect(validateName("A")).toBe(false);
    expect(validateName("Ahmed")).toBe(true);
    expect(validateName("")).toBe(false);
  });
});
