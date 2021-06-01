export const BODY_TEXT_COLOR = [90, 90, 90]
export const BODY_TEXT_COLOR_MOBILE = [60, 60, 60]
export const LINK_TEXT_COLOR = [32, 128, 223]
export const BACK_BUTTON_TEXT_COLOR = [120, 120, 120]
export const LIST_ORDER_COLOR = [150, 150, 150]
export const HEADING_COLOR = [23, 70, 154]
export const SKILL_TEXT_COLOR = [100, 100, 100]
export const SKILL_TEXT_COLOR_MOBILE = [80, 80, 80]

export const SIDE_COLOR_0 = [34, 135, 235]
export const SIDE_COLOR_1 = [222, 38, 35]
export const SIDE_COLOR_2 = [237, 145, 122]

export const POSSIBLE_SIDE_COLORS = [SIDE_COLOR_0, SIDE_COLOR_1, SIDE_COLOR_2]

export const DESIRED_FPS = 60

export const GRID_COUNT_X = 19
export const GRID_COUNT_Y = 19
export const GRID_TOTAL_COUNT = GRID_COUNT_X * GRID_COUNT_Y
export const GRID_WIDTH_X = 10
export const GRID_WIDTH_Y = 10
export const GRID_STEP_X = GRID_WIDTH_X / GRID_COUNT_X
export const GRID_STEP_Y = GRID_WIDTH_Y / GRID_COUNT_Y
export const GRID_STEP_Z = 4

export const DEPTH_TEXTURE_WIDTH = 1024
export const DEPTH_TEXTURE_HEIGHT = 1024

export const CONTENT_TYPE_TEXT = 'TEXT'
export const CONTENT_TYPE_SPLIT_TEXT = 'TEXT_SPLIT'
export const CONTENT_TYPE_IMAGE = 'IMAGE'

export const VIEW_HOME = 'home'

// Skybox side order:
// negx
// posx
// negy
// posy
// negz
// posz
export const SKYBOX_ASSETS_0 = [
  '/assets/skybox/stormydays_lf.png',
  '/assets/skybox/stormydays_rt.png',
  '/assets/skybox/stormydays_dn.png',
  '/assets/skybox/stormydays_up.png',
  '/assets/skybox/stormydays_ft.png',
  '/assets/skybox/stormydays_bk.png',
]

export const SKYBOX_ASSETS_1 = [
  '/assets/skybox/vz_dusk_ocean_left.png',
  '/assets/skybox/vz_dusk_ocean_right.png',
  '/assets/skybox/vz_dusk_ocean_down.png',
  '/assets/skybox/vz_dusk_ocean_up.png',
  '/assets/skybox/vz_dusk_ocean_front.png',
  '/assets/skybox/vz_dusk_ocean_back.png',
]

export const SKYBOX_ASSETS_2 = [
  '/assets/skybox/vz_clear_ocean_left.png',
  '/assets/skybox/vz_clear_ocean_right.png',
  '/assets/skybox/vz_clear_ocean_down.png',
  '/assets/skybox/vz_clear_ocean_up.png',
  '/assets/skybox/vz_clear_ocean_front.png',
  '/assets/skybox/vz_clear_ocean_back.png',
]

export const POSSIBLE_SKYBOXES = [
  SKYBOX_ASSETS_0,
  SKYBOX_ASSETS_1,
  SKYBOX_ASSETS_2,
]
