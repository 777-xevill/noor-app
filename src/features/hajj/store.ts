import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

type ChecklistState = {
  done: Record<string, true>;
  toggle: (id: string) => void;
};

export const useHajjChecklist = create<ChecklistState>()(
  persist(
    (set) => ({
      done: {},
      toggle: (id) =>
        set((s) => {
          const done = { ...s.done };
          if (done[id]) delete done[id];
          else done[id] = true;
          return { done };
        }),
    }),
    { name: 'noor.hajj-checklist', storage: persistStorage, version: 1 },
  ),
);
