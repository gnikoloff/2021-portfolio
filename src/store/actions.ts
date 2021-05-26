export const SET_ACTIVE_VIEW = 'SET_ACTIVE_VIEW'
export const setActiveView = (activeView) => ({
  type: SET_ACTIVE_VIEW,
  activeView,
})

export const SET_HOVERED_ITEM = 'SET_HOVERED_ITEM'
export const setHoveredItem = (hoveredItem) => ({
  type: SET_HOVERED_ITEM,
  hoveredItem,
})

export const SET_HOVERED_IDX = 'SET_HOVERED_IDX'
export const setHoverIdx = (hoverIdx) => ({
  type: SET_HOVERED_IDX,
  hoverIdx,
})

export const SET_HOVER_ITEM_START_X = 'SET_HOVER_ITEM_START_X'
export const setHoverItemStartX = (x) => ({
  type: SET_HOVER_ITEM_START_X,
  x,
})

export const SET_HOVER_ITEM_END_X = 'SET_HOVER_ITEM_END_X'
export const setHoverItemEndX = (x) => ({
  type: SET_HOVER_ITEM_END_X,
  x,
})

export const SET_HOVER_ITEM_Y = 'SET_HOVER_ITEM_Y'
export const setHoverItemY = (y) => ({
  type: SET_HOVER_ITEM_Y,
  y,
})
