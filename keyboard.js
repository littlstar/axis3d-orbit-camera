const { radians } = require('axis3d/utils')
const clamp = require('clamp')
const vec3 = require('gl-vec3')

/**
 * Applies orientation changes to orbit orbitCamera from
 * keyboard input
 */

module.exports = exports = ({
  keyboardInput: keyboard,
  interpolationFactor, initialFov, damping,
  translation, position, offset, euler,
  invert = false, zoom = true,
} = {}) => {
  keyboard && keyboard(({keys}) => {
    const mappings = new KeyboardCommandMappings(keys)

    // @TODO(werle) - should we reset keyboard state ?
    if (mappings.value('control')) {
      return
    }

    // reset orientation
    if (keys['shift']) {
      if (keys['0']) {
        if (zoom && 'number' == typeof zoom.fov) {
          zoom.fov = initialFov
        } else if (false !== zoom) {
          position[2] = 0
        }
      } else if (/*+*/keys['='] || keys['+'] || keys['-']) {
        let dv = 0
        if (keys['='] || keys['+']) {
          dv = -0.1*damping
        } else if (keys['-']) {
          dv = 0.1*damping
        }
        if (zoom && 'number' == typeof zoom.fov) {
          zoom.fov = (zoom.fov || 0) + dv
        } else if (false !== zoom) {
          translation[2] = clamp(translation[2] + dv, 0, Infinity)
        }
      }

      if (keys['space']) {
        euler[0] = 0
        euler[1] = 0
        vec3.set(position, 0, 0, 0)
        vec3.set(offset, 0, 0, 0)
      }

      if (mappings.value('up')) {
        vec3.add(translation, translation, [0, 0, -0.05])
      } else if (mappings.value('down')) {
        vec3.add(translation, translation, [0, 0, 0.05])
      }

      if (mappings.value('left')) {
        vec3.add(translation, translation, [-0.05, 0, 0])
      } else if (mappings.value('right')) {
        vec3.add(translation, translation, [0.05, 0, 0])
      }

      return
    }

    if (mappings.value('up')) {
      if (invert) {
        euler[0] -= 0.068*damping
      } else {
        euler[0] += 0.068*damping
      }
    } else if (mappings.value('down')) {
      if (invert) {
        euler[0] += 0.068*damping
      } else {
        euler[0] -= 0.068*damping
      }
    }

    if (mappings.value('left')) {
      if (invert) {
        euler[1] -= 0.062*damping
      } else {
        euler[1] += 0.062*damping
      }
    } else if (mappings.value('right')) {
      if (invert) {
        euler[1] += 0.062*damping
      } else {
        euler[1] -= 0.062*damping
      }
    }
  })
}

class KeyboardCommandMappings {
  constructor(keys = {}, extension = {mapping: {}}) {
    this.keys = keys
    this.map = Object.assign({}, extension.mapping, {
      up: ['up', 'w', 'k', ].concat(extension.mapping.up || []),
      down: ['down', 's', 'j'].concat(extension.mapping.down || []),
      left: ['left', 'a', 'h'].concat(extension.mapping.left || []),
      right: ['right', 'd', 'l'].concat(extension.mapping.right || []),
      control: [
        'right command', 'right control',
        'left command', 'left control',
        'control', 'super', 'ctrl', 'alt', 'fn',
      ].concat(extension.mapping.control || [])
    })
  }

  value(which) {
    return this.map[which].some((key) => Boolean(this.keys[key]))
  }
}
