/*
  ReviewGraph's golden fixture, fixtures/pull-requests/auth-bypass, as published in the project's
  write-up. Positions are layout only; relations and roles are the fixture's.
*/
export type FixtureNode = {
  id: string;
  label: string;
  role: "seed" | "impacted" | "changed" | "decoy" | "removed";
  note: string;
  pos: [number, number, number];
};

export const fixtureNodes: FixtureNode[] = [
  { id: "seed", label: "AuthService.authorize", role: "seed", note: "changed · impact seed", pos: [0, 0, 0] },
  { id: "c1", label: "caller", role: "impacted", note: "distance 1 · touches users", pos: [-1.7, 1.0, 0.6] },
  { id: "c2", label: "caller", role: "impacted", note: "distance 2", pos: [-2.9, 2.0, -0.5] },
  { id: "ep", label: "PUT /users/:id", role: "impacted", note: "3 hops · no guards", pos: [-1.2, 3.0, -1.3] },
  { id: "if", label: "interface method", role: "impacted", note: "overridden", pos: [2.2, 0.5, 1.0] },
  { id: "test", label: "covering test", role: "impacted", note: "tests", pos: [1.3, -1.8, 0.8] },
  { id: "rm", label: "permissionService.check", role: "removed", note: "no longer called · base graph only", pos: [-0.6, -2.1, -1.4] },
  { id: "fmt", label: "formatName", role: "changed", note: "comment-only edit · not a seed", pos: [3.4, -1.2, -1.6] },
  { id: "d1", label: "ReportService", role: "decoy", note: "must not appear", pos: [3.2, 2.2, -2.0] },
  { id: "d2", label: "authorizeHeader", role: "decoy", note: "must not appear", pos: [-3.4, -1.4, 1.6] },
];

export const fixtureEdges: [string, string][] = [
  ["seed", "c1"],
  ["c1", "c2"],
  ["c2", "ep"],
  ["seed", "if"],
  ["seed", "test"],
  ["seed", "rm"],
];
