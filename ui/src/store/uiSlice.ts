import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  /** target row height of the gallery, px (the screener can change it) */
  rowHeight: number
  layout: 'rows' | 'masonry'
}

const slice = createSlice({
  name: 'ui',
  initialState: { rowHeight: 220, layout: 'rows' } as UiState,
  reducers: {
    setRowHeight(state, action: PayloadAction<number>) {
      state.rowHeight = action.payload
    },
    setLayout(state, action: PayloadAction<UiState['layout']>) {
      state.layout = action.payload
    }
  }
})

export const { setRowHeight, setLayout } = slice.actions
export default slice.reducer
