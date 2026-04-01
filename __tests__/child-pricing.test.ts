import { describe, it, expect } from "vitest";

/**
 * Tests for child pricing and DOB flow.
 * Validates the data transformation logic used across the search → results → booking chain.
 */

describe("Child DOB and Age Calculation", () => {
  // Replicate the getChildAges logic from Home screen
  function getChildAges(childDobs: string[]): number[] {
    return childDobs.map((dob) => {
      if (!dob) return 5; // default age if not set
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return Math.max(2, Math.min(age, 11)); // clamp between 2-11
    });
  }

  it("should return default age 5 for empty DOB", () => {
    expect(getChildAges([""])).toEqual([5]);
  });

  it("should calculate correct age for a 5-year-old child", () => {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    fiveYearsAgo.setMonth(fiveYearsAgo.getMonth() - 1); // ensure birthday passed
    const dob = fiveYearsAgo.toISOString().split("T")[0];
    expect(getChildAges([dob])).toEqual([5]);
  });

  it("should clamp age to minimum 2", () => {
    // A 1-year-old should be clamped to 2
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dob = oneYearAgo.toISOString().split("T")[0];
    expect(getChildAges([dob])).toEqual([2]);
  });

  it("should clamp age to maximum 11", () => {
    // A 15-year-old should be clamped to 11
    const fifteenYearsAgo = new Date();
    fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
    const dob = fifteenYearsAgo.toISOString().split("T")[0];
    expect(getChildAges([dob])).toEqual([11]);
  });

  it("should handle multiple children correctly", () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    threeYearsAgo.setMonth(threeYearsAgo.getMonth() - 1);
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
    sevenYearsAgo.setMonth(sevenYearsAgo.getMonth() - 1);
    const dob1 = threeYearsAgo.toISOString().split("T")[0];
    const dob2 = sevenYearsAgo.toISOString().split("T")[0];
    const ages = getChildAges([dob1, dob2]);
    expect(ages).toEqual([3, 7]);
  });
});

describe("Child Details JSON Serialization", () => {
  it("should serialize and deserialize child details correctly", () => {
    const childDetails = [
      { firstName: "Ahmed", lastName: "Mohamed", dateOfBirth: "2020-03-15" },
      { firstName: "Sara", lastName: "Mohamed", dateOfBirth: "2018-07-22" },
    ];
    const json = JSON.stringify(childDetails);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(childDetails);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].firstName).toBe("Ahmed");
    expect(parsed[1].dateOfBirth).toBe("2018-07-22");
  });

  it("should handle empty child details", () => {
    const childDetails: Array<{ firstName: string; lastName: string; dateOfBirth: string }> = [];
    const json = JSON.stringify(childDetails);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([]);
    expect(parsed).toHaveLength(0);
  });
});

describe("Duffel Passenger Array Building", () => {
  // Replicate the passenger building logic from duffel.ts
  function buildPassengers(params: {
    adults: number;
    children?: number;
    infants?: number;
    childAges?: number[];
  }) {
    const passengers: any[] = [];
    for (let i = 0; i < params.adults; i++) {
      passengers.push({ type: "adult" });
    }
    if (params.children) {
      const ages = params.childAges || [];
      for (let i = 0; i < params.children; i++) {
        const age = ages[i] ?? 5;
        passengers.push({ age });
      }
    }
    if (params.infants) {
      for (let i = 0; i < params.infants; i++) {
        passengers.push({ type: "infant_without_seat" });
      }
    }
    return passengers;
  }

  it("should build correct passenger array with child ages", () => {
    const result = buildPassengers({
      adults: 1,
      children: 2,
      infants: 1,
      childAges: [3, 8],
    });
    expect(result).toEqual([
      { type: "adult" },
      { age: 3 },
      { age: 8 },
      { type: "infant_without_seat" },
    ]);
  });

  it("should use default age 5 when childAges not provided", () => {
    const result = buildPassengers({
      adults: 1,
      children: 2,
    });
    expect(result).toEqual([
      { type: "adult" },
      { age: 5 },
      { age: 5 },
    ]);
  });

  it("should use default age 5 for missing entries in childAges", () => {
    const result = buildPassengers({
      adults: 1,
      children: 3,
      childAges: [4], // only 1 age provided for 3 children
    });
    expect(result).toEqual([
      { type: "adult" },
      { age: 4 },
      { age: 5 },
      { age: 5 },
    ]);
  });

  it("should handle adults only", () => {
    const result = buildPassengers({ adults: 2 });
    expect(result).toEqual([
      { type: "adult" },
      { type: "adult" },
    ]);
  });
});

describe("Booking Traveler Building with Child Details", () => {
  function buildTravelers(input: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE";
    email: string;
    phone: string;
    passengers: number;
    children: number;
    childDetails?: Array<{ firstName: string; lastName: string; dateOfBirth: string }>;
  }) {
    const travelers: any[] = [];
    // Primary adult
    travelers.push({
      id: "1",
      dateOfBirth: input.dateOfBirth,
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender,
    });
    // Additional adults
    for (let i = 1; i < input.passengers; i++) {
      travelers.push({
        id: String(travelers.length + 1),
        dateOfBirth: input.dateOfBirth,
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender,
      });
    }
    // Children
    const childDetails = input.childDetails || [];
    for (let i = 0; i < input.children; i++) {
      const child = childDetails[i];
      const childDob = child?.dateOfBirth || "2021-01-01";
      travelers.push({
        id: String(travelers.length + 1),
        dateOfBirth: childDob,
        firstName: child?.firstName || input.firstName,
        lastName: child?.lastName || input.lastName,
        gender: input.gender,
      });
    }
    return travelers;
  }

  it("should use actual child details when provided", () => {
    const travelers = buildTravelers({
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      email: "john@test.com",
      phone: "123",
      passengers: 1,
      children: 1,
      childDetails: [{ firstName: "Ahmed", lastName: "Doe", dateOfBirth: "2020-05-15" }],
    });
    expect(travelers).toHaveLength(2);
    expect(travelers[0].firstName).toBe("John");
    expect(travelers[1].firstName).toBe("Ahmed");
    expect(travelers[1].dateOfBirth).toBe("2020-05-15");
  });

  it("should fallback to adult info when no child details", () => {
    const travelers = buildTravelers({
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      email: "john@test.com",
      phone: "123",
      passengers: 1,
      children: 1,
    });
    expect(travelers).toHaveLength(2);
    expect(travelers[1].firstName).toBe("John");
    expect(travelers[1].dateOfBirth).toBe("2021-01-01"); // fallback
  });
});
