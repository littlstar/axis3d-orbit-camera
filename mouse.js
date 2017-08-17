const clamp = require('clamp')
const quat = require('gl-quat')

module.exports = ({
  mouseInput: mouse,
  zoomDamping = 1,
  position,
  damping,
  invert = false,
  offset,
  euler,
  zoom = true,
} = {}) => {
  // update orientation = require(coordinates
  mouse && mouse(({mouse}) => {
    // update if a singled button is pressed
    if (1 == mouse.buttons && (mouse.deltaY || mouse.deltaX)) {
      const xValue = (false == invert ? -1 : 1)*0.0038*mouse.deltaY*damping
      const yValue = (false == invert ? -1 : 1)*0.0042*mouse.deltaX*damping
      euler[0] += xValue
      euler[1] += yValue
    }
  })

  // update field of view = require(mouse wheel
  mouse && mouse(({wheel}) => {
    const dv = 0.01*zoomDamping*damping*wheel.deltaY
    if (zoom && 'number' == typeof zoom.fov) {
      zoom.fov = (zoom.fov || 0) + dv
    } else if (false !== zoom) {
      offset[2] = clamp(offset[2] + dv, 0, Infinity)
    }
  })
}
