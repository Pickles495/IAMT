import type { TopicId } from "./domain";
export const definitions: Record<TopicId, string> = {
  conics:
    "A conic is the zero set of a quadratic polynomial in two variables. A rotation of coordinates can remove the mixed term and reveal its principal axes.",
  linear:
    "For a square matrix A, a nonzero vector v satisfying Av = λv is an eigenvector with eigenvalue λ. Real symmetric matrices admit orthogonal diagonalization.",
  galois:
    "The automorphisms of L fixing every element of K form a group under composition. A finite Galois extension gives a correspondence between intermediate fields and subgroups.",
  fields:
    "For a tower K ⊆ F ⊆ L of finite field extensions, the dimension of L over K is the product of the two extension degrees.",
  calculus:
    "Near a differentiability point, a function has a linear approximation whose error divided by the displacement tends to zero.",
  symmetry:
    "A group has an associative operation, an identity and inverses. Symmetries preserving an object can form a group under composition.",
};
export const categories: Record<string, string> = {
  "幾何・代数": "Geometry / algebra",
  代数: "Algebra",
  解析: "Analysis",
  "基礎・構造": "Foundations / structures",
};
export const relationLabels: Record<string, string> = {
  応用: "Application",
  基礎概念: "Foundation",
  関連: "Related",
};
export const relationExplanations: Record<string, string> = {
  linear:
    "Orthogonal diagonalization of a real symmetric matrix identifies the principal axes of its quadratic form.",
  fields:
    "A Galois group is a group of automorphisms associated with a field extension.",
  galois: "Galois theory studies symmetries among roots using groups.",
  conics:
    "Both topics study transformations and quantities that remain invariant under them.",
};
