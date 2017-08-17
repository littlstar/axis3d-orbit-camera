const { radians } = require('axis3d/utils')
const clamp = require('clamp')
const quat = require('gl-quat')

module.exports = ({
  touchInput: touch,
  damping,
  invert = false,
  euler,
} = {}) => {
  touch(({touches}) => {
    if (touches && 1 == touches.length) {
      const {deltaX: dx, deltaY: dy} = touches[0]
      const xValue = (false == invert ? -1 : 1)*0.004*dy*damping
      const yValue = (false == invert ? -1 : 1)*0.0055*dx*damping
      euler[0] += xValue
      euler[1] += yValue
    }
  })
}
