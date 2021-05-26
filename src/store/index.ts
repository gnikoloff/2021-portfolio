import { createStore } from 'redux'

import * as actions from './actions'

const initialState = {
  hoverItemStartX: -1,
  hoverItemEndX: -1,
  hoverItemY: -1,
}

const appState = (state = initialState, action) => {
  switch (action.type) {
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
