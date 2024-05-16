export {};

export type Roles = "admin" | "user";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean;
      role?: Roles;
    };
  }
}