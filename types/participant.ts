/** A member of the trip squad. */
export interface Participant {
  /** Stable identifier — names can be edited, the id never changes. */
  id: string;
  /** Display name (already sanitized + trimmed). */
  name: string;
  /** Index used to derive a unique avatar colour. */
  colorIndex: number;
}
