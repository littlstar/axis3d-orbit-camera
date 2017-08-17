const { Keyboard, Mouse, Touch } = require('axis3d-inputs')
const { fov: kDefaultFov } = require('axis3d/camera/perspective/defaults')
const applyKeyboardInput = require('./keyboard')
const applyMouseInput = require('./mouse')
const applyTouchInput = require('./touch')

const { Component } = require('axis3d')
const { radians } = require('axis3d/utils')
const coalesce = require('defined')
const clamp = require('clamp')

const mat4 = require('gl-mat4')
const vec3 = require('gl-vec3')
const vec2 = require('gl-vec2')
const quat = require('gl-quat')

// damping value applied to various inputs
// to get an intuitive value that is useful for
// computing a axis rotation expressed in radians
const DEFAULT_DAMPING = 0.8

exports.OrbitCameraController = class OrbitCameraController extends Component {
  constructor(ctx, initialState = {}) {
    let {
      minEuler = [-Infinity, -Infinity],
      maxEuler = [Infinity, Infinity],
      euler: initialEuler = [0, 0, 0],
      camera: initialCamera,
      inputs: initialInputs = {},
      clampX: initialClampX = true,
      position: initialPosition = null,
      interpolationFactor: initialInterpolationFactor = 1,
    } = initialState

    const direction = [0, 0, 0]
    const worldUp = [0, 1, 0]
    const right = [0, 0, 0]
    const up = [0, 0, 0]

    const orientation = quat.identity([])
    const position = [0, 0, 0]
    const rotation = quat.identity([])
    const target = [0, 0, 0]
    const x = quat.identity([])
    const y = quat.identity([])

    let translation = [0, 0, 0]
    let offset = [0, 0, 0]
    let fov = kDefaultFov
    let initialFov = fov

    vec3.set(position, ...(initialPosition || [0, 0, 0]))

    // install default inputs
    if (null == initialInputs.keyboard) {
      initialInputs.keyboard = new Keyboard(ctx)
    }

    if (null == initialInputs.mouse) {
      initialInputs.mouse = new Mouse(ctx)
    }

    if (null == initialInputs.touch) {
      initialInputs.touch = new Touch(ctx)
    }

    super(ctx, initialState,
      (args, block) => {
        let {
          interpolationFactor = initialInterpolationFactor,
          damping = initialState.damping || DEFAULT_DAMPING,
          camera = initialCamera,
          inputs = initialInputs,
          invert = false,
          euler = initialEuler,
          zoom = initialState.zoom || true,
          pitchOnly = false,
          yawOnly = false
        } = args

        damping = clamp(damping, 0, 1)

        if ('rotation' in args && args.rotation) {
          quat.copy(rotation, args.rotation)
        }

        if ('orientation' in args && args.orientation) {
          quat.copy(orientation, args.orientation)
        }

        if ('minEuler' in args && args.minEuler) {
          vec2.copy(minEuler, args.minEuler)
        }

        if ('maxEuler' in args && args.maxEuler) {
          vec2.copy(maxEuler, args.maxEuler)
        }

        if ('position' in args) { vec3.copy(position, args.position) }
        if ('target' in args) { vec3.copy(target, args.target) }
        if ('fov' in args) { fov = args.fov }

        // coerce zoom into something useable
        if (zoom && true === zoom.fov) {
          zoom.fov = fov
        } else if (zoom && 'number' != typeof zoom.fov) {
          delete zoom.fov
        }

        const {
          keyboard: keyboardInput,
          mouse: mouseInput,
          touch: touchInput,
        } = inputs

        invert = coalesce(initialState.invert, false)

        // input state given to controller inputs
        const state = Object.assign({}, initialState, args, {
          interpolationFactor, initialFov, damping, zoom,
          keyboardInput, mouseInput, touchInput,
          translation, position, offset, euler,
          camera, target,
          invert
        })

        // inputs that require focus to have change
        if (ctx.hasFocus) {
          if (keyboardInput) { applyKeyboardInput(state) }
          if (mouseInput) { applyMouseInput(state) }
          if (touchInput) { applyTouchInput(state) }
        }

        vec3.cross(up, args.direction || direction, args.worldUp || worldUp)
        vec3.cross(up, up, direction)
        vec3.cross(right, direction, up)

        const conjugate = (a) => quat.conjugate([], a)
        const multiply = (a, b) => quat.multiply([], a, b)
        const angle = (a, x) => quat.setAxisAngle([], a, x)
        const lerp = (a, b, t) => vec3.lerp([], a, b, t)
        const add = (a, b) => vec3.add([], a, b)

        euler[0] = clamp(euler[0], minEuler[0], maxEuler[0])
        euler[1] = clamp(euler[1], minEuler[1], maxEuler[1])

        ensureQuat(rotation)
        ensureQuat(orientation)

        if (true == pitchOnly) {
          const t = clamp(0.5+interpolationFactor, 0, 1)
          quat.slerp(x, x, angle(right, euler[0]), t);
        } else if (true == yawOnly) {
          quat.slerp(y, y, angle(worldUp, euler[1]), interpolationFactor)
        } else {
          const t = clamp(0.5+interpolationFactor, 0, 1)
          quat.slerp(x, x, angle(right, euler[0]), t);
          quat.slerp(y, y, angle(worldUp, euler[1]), interpolationFactor)
        }

        quat.normalize(x, x)
        quat.normalize(y, y)
        quat.multiply(orientation, x, orientation)
        quat.multiply(orientation, orientation, y)

        // clamp fov if fov zoom requested
        if (zoom && zoom.fov) {
          fov = clamp(zoom.fov, radians(1.1) , radians(120))
        }


        function ensureQuat(q) {
          for (let i = 0; i < 3; ++i) {
            if (null == q[i] || q[i] != q[i]) {
              q[i] = 0
            }
          }
          if (null == q[3] || q[3] != q[3]) {
            q[3] = 1
          }
        }

        quat.slerp(rotation, rotation, orientation, interpolationFactor)
        vec3.copy(position,
          lerp(
            position,
            add(translation, add(position, offset)),
            interpolationFactor))

        // reset on each frame
        vec3.set(translation, 0, 0, 0)
        camera(Object.assign({}, args, {position, rotation, target, fov }), function({
          direction: currentDirection,
          position: currentPosition,
          target: currentTarget,
          fov: currentFov,
          up: currentUp
        }) {
          vec3.copy(direction, currentDirection)
          vec3.copy(position, currentPosition)
          vec3.copy(target, currentTarget)
          vec3.copy(up, currentUp)
          fov = currentFov
          block(...arguments)
        })
      }
    )
  }
}
