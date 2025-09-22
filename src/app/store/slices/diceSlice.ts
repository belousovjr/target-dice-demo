import { FaceIndex } from "@/app/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TutorialState {
  targetValues: FaceIndex[];
}

const initialState: TutorialState = {
  targetValues: [6, 6, 6, 6, 6, 6],
};

const diceSlice = createSlice({
  name: "dice",
  initialState,
  reducers: {
    setTargetValues: (state, action: PayloadAction<FaceIndex[]>) => {
      state.targetValues = action.payload;
    },
  },
});

export const { setTargetValues } = diceSlice.actions;
export default diceSlice.reducer;
