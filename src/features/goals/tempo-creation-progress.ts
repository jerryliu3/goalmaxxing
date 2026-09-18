export interface TempoChoicesMade {
  category: boolean;
  kind: boolean;
  interval: boolean;
  basis: boolean;
  count: boolean;
  difficulty: boolean;
}

export interface TempoCardVisibility {
  review?: boolean;
  category: boolean;
  rhythm: boolean;
  interval?: boolean;
  count?: boolean;
  schedule: boolean;
  difficulty: boolean;
  /** Presentation plaque / reassembly target shown on the review step. */
  plaqueTarget?: number;
}
