import { createSlice } from '@reduxjs/toolkit';

const reelSlice = createSlice({
    name: 'reels',
    initialState: {
        reels: [],
        loading: false
    },
    reducers: {
        setReels: (state, action) => {
            state.reels = action.payload;
        },
        updateReel: (state: any, action) => {
            state.reels = state.reels.map((reel: any) => 
                reel._id === action.payload._id ? action.payload : reel
            );
        }
    }
});

export const { setReels, updateReel } = reelSlice.actions;
export default reelSlice.reducer;