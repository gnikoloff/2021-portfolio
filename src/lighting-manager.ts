import { mat4, ReadonlyMat4, ReadonlyVec3, vec3 } from 'gl-matrix'

export default class LightingManager {
  static UP_VECTOR: ReadonlyVec3 = [0, 1, 0]

  lightWorldMatrix = mat4.create()
  lightProjectionMatrix = mat4.create()
  shadowTextureMatrix = mat4.create()
  shadowTextureWorldMatrixInv = mat4.create()

  position = vec3.create()
  lookAtTarget = vec3.create()

  shadowFoV: number
  shadowNear: number
  shadowFar: number

  constructor({
    position,
    lookAt,
    shadowFoV = 150,
    shadowNear = 0.5,
    shadowFar = 30,
  }) {
    this.shadowFoV = shadowFoV
    this.shadowNear = shadowNear
    this.shadowFar = shadowFar

    vec3.set(this.position, position[0], position[1], position[2])
    vec3.set(this.lookAtTarget, lookAt[0], lookAt[1], lookAt[2])
  }

  getShadowTextureMatrix(): ReadonlyMat4 {
    mat4.identity(this.shadowTextureMatrix)

    mat4.lookAt(
      this.lightWorldMatrix,
      this.position,
      this.lookAtTarget,
      LightingManager.UP_VECTOR,
    )
    mat4.invert(this.lightWorldMatrix, this.lightWorldMatrix)

    mat4.perspective(
      this.lightProjectionMatrix,
      (this.shadowFoV * Math.PI) / 180,
      1,
      this.shadowNear,
      this.shadowFar,
    )

    mat4.identity(this.shadowTextureWorldMatrixInv)

    mat4.invert(this.shadowTextureWorldMatrixInv, this.lightWorldMatrix)

    const transformVec = vec3.create()
    vec3.set(transformVec, 0.5, 0.5, 0.5)
    mat4.translate(
      this.shadowTextureMatrix,
      this.shadowTextureMatrix,
      transformVec,
    )
    mat4.scale(this.shadowTextureMatrix, this.shadowTextureMatrix, transformVec)
    mat4.mul(
      this.shadowTextureMatrix,
      this.shadowTextureMatrix,
      this.lightProjectionMatrix,
    )
    mat4.mul(
      this.shadowTextureMatrix,
      this.shadowTextureMatrix,
      this.shadowTextureWorldMatrixInv,
    )
    return this.shadowTextureMatrix
  }
}
