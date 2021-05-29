import { createStore } from 'redux'

import * as actions from './actions'

const initialState = {
  activeView: null,
  hoveredItem: null,

  cameraX: 0,
  cameraY: 0,
  cameraZ: 16,

  lightX: 0,
  lightY: 5,
  lightZ: 5,

  pointLightShininess: 20,
  pointLightColor: [0.9, 0.9, 0.9],
  pointLightSpecularColor: [0, 0, 1],
  pointLightSpecularFactor: 0.5,

  shadowTextureMatrix: null,

  hoverIdx: -1,
  hoverItemStartX: -1,
  hoverItemEndX: -1,
  hoverItemY: -1,
}

const appState = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_ACTIVE_VIEW: {
      return {
        ...state,
        activeView: action.activeView,
      }
    }

    case actions.SET_CAMERA_X: {
      return {
        ...state,
        cameraX: action.cameraX,
      }
    }

    case actions.SET_CAMERA_Y: {
      return {
        ...state,
        cameraY: action.cameraY,
      }
    }

    case actions.SET_CAMERA_Z: {
      return {
        ...state,
        cameraZ: action.cameraZ,
      }
    }

    case actions.SET_LIGHT_X: {
      return {
        ...state,
        lightX: action.lightX,
      }
    }

    case actions.SET_LIGHT_Y: {
      return {
        ...state,
        lightY: action.lightY,
      }
    }

    case actions.SET_LIGHT_Z: {
      return {
        ...state,
        lightZ: action.lightZ,
      }
    }

    case actions.SET_POINT_LIGHT_SHININESS: {
      return {
        ...state,
        pointLightShininess: action.pointLightShininess,
      }
    }

    case actions.SET_POINT_LIGHT_COLOR: {
      return {
        ...state,
        pointLightColor: action.pointLightColor,
      }
    }

    case actions.SET_POINT_LIGHT_SPECULAR_COLOR: {
      return {
        ...state,
        pointLightSpecularColor: action.pointLightSpecularColor,
      }
    }

    case actions.SET_POINT_LIGHT_SPECULAR_FACTOR: {
      return {
        ...state,
        pointLightSpecularFactor: action.pointLightSpecularFactor,
      }
    }

    case actions.SET_SHADOW_TEXTURE_MATRIX: {
      return {
        ...state,
        shadowTextureMatrix: action.shadowTextureMatrix,
      }
    }

    case actions.SET_HOVERED_ITEM: {
      if (action.hoveredItem !== state.hoveredItem) {
        if (action.hoveredItem) {
          document.body.classList.add('isHovering')
        } else {
          document.body.classList.remove('isHovering')
        }
      }
      return {
        ...state,
        hoveredItem: action.hoveredItem,
      }
    }

    case actions.SET_HOVERED_IDX: {
      return {
        ...state,
        hoverIdx: action.hoverIdx,
      }
    }

    case actions.SET_HOVER_ITEM_START_X: {
      return {
        ...state,
        hoverItemStartX: action.x,
      }
    }

    case actions.SET_HOVER_ITEM_END_X: {
      return {
        ...state,
        hoverItemEndX: action.x,
      }
    }

    case actions.SET_HOVER_ITEM_Y: {
      return {
        ...state,
        hoverItemY: action.y,
      }
    }

    default: {
      return state
    }
  }
}

export default createStore(appState)
