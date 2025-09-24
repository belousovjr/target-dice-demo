import { tutorialStatuses } from "@/app/lib/constants";
import { TutorialStatusOption, TutorialStatusState } from "@/app/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TutorialState {
  statuses: TutorialStatusState;
}

const initialState: TutorialState = {
  statuses: {
    CONFIG: false,
    ROLL: false,
    RESET: false,
    FINAL: false,
  },
};

const tutorialSlice = createSlice({
  name: "tutorial",
  initialState,
  reducers: {
    markStatus: (state, action: PayloadAction<TutorialStatusOption>) => {
      if (!state.statuses[action.payload]) {
        for (const status of tutorialStatuses) {
          state.statuses[status] = true;
          if (action.payload === status) {
            break;
          }
        }
      }
    },
  },
});

export const { markStatus } = tutorialSlice.actions;
export default tutorialSlice.reducer;
