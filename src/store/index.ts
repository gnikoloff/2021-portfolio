import { createStore } from 'redux'

import * as actions from './actions'

const initialState = {
  activeView: null,
  hoveredItem: null,

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
