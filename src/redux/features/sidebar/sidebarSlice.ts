import { createSlice } from '@reduxjs/toolkit'

type SidebarState = {
  isActive: boolean
  collapsed: boolean
}

const initialState: SidebarState = {
  isActive: false,
  collapsed: false,
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isActive = !state.isActive
    },
    closeSidebar: (state) => {
      state.isActive = false
    },
    openSidebar: (state) => {
      state.isActive = true
    },
    setCollapsed: (state, action: { payload: boolean }) => {
      state.collapsed = action.payload
    },
    toggleCollapsed: (state) => {
      state.collapsed = !state.collapsed
    },
  },
})

export const { toggleSidebar, closeSidebar, openSidebar, setCollapsed, toggleCollapsed } =
  sidebarSlice.actions
export default sidebarSlice.reducer
