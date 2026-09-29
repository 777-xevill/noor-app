// Partner charities. Empty on purpose: a charity is listed only after it has been checked. Check
// that it is registered (in Bangladesh, with the NGO Affairs Bureau or the Department of Social
// Services), that it has a public donation page, and, for zakat, that it says in writing how it
// passes zakat to the eligible recipients.
//
// Giving always happens on the charity's own page, outside the app, which is what Apple and
// Google require for donations to charities.

export type Partner = {
  id: string;
  name: string;
  nameBn?: string;
  about: string;
  aboutBn?: string;
  /** e.g. "NGO Affairs Bureau reg. no. 1234" */
  registration: string;
  website: string;
  /** The charity's own donation page (bKash, Nagad, card, bank...). */
  donateUrl: string;
  /** How the page takes money, e.g. ["bKash", "Nagad", "Card"]. */
  methods: string[];
  /** The charity confirms in writing that it distributes zakat to eligible recipients. */
  acceptsZakat: boolean;
};

export const PARTNERS: Partner[] = [];
