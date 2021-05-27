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

export const SET_CAMERA_X = 'SET_CAMERA_X'
export const setCameraX = (cameraX) => ({
  type: SET_CAMERA_X,
  cameraX,
})

export const SET_CAMERA_Y = 'SET_CAMERA_Y'
export const setCameraY = (cameraY) => ({
  type: SET_CAMERA_Y,
  cameraY,
})

export const SET_CAMERA_Z = 'SET_CAMERA_Z'
export const setCameraZ = (cameraZ) => ({
  type: SET_CAMERA_Z,
  cameraZ,
})

export const SET_LIGHT_X = 'SET_LIGHT_X'
export const setLightX = (lightX) => ({
  type: SET_LIGHT_X,
  lightX,
})

export const SET_LIGHT_Y = 'SET_LIGHT_Y'
export const setLightY = (lightY) => ({
  type: SET_LIGHT_Y,
  lightY,
})

export const SET_LIGHT_Z = 'SET_LIGHT_Z'
export const setLightZ = (lightZ) => ({
  type: SET_LIGHT_Z,
  lightZ,
})

export const SET_POINT_LIGHT_SHININESS = 'SET_POINT_LIGHT_SHININESS'
export const setPointLightShininess = (pointLightShininess) => ({
  type: SET_POINT_LIGHT_SHININESS,
  pointLightShininess,
})

export const SET_POINT_LIGHT_COLOR = 'SET_POINT_LIGHT_COLOR'
export const setPointLightColor = (pointLightColor) => ({
  type: SET_POINT_LIGHT_COLOR,
  pointLightColor,
})

export const SET_POINT_LIGHT_SPECULAR_COLOR = 'SET_POINT_LIGHT_SPECULAR_COLOR'
export const setPointLightSpecularColor = (pointLightSpecularColor) => ({
  type: SET_POINT_LIGHT_SPECULAR_COLOR,
  pointLightSpecularColor,
})

export const SET_POINT_LIGHT_SPECULAR_FACTOR = 'SET_POINT_LIGHT_SPECULAR_FACTOR'
export const setPointLightSpecularFactor = (pointLightSpecularFactor) => ({
  type: SET_POINT_LIGHT_SPECULAR_FACTOR,
  pointLightSpecularFactor,
})
