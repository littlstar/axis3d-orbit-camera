const { PerspectiveCamera } = require('axis3d/camera')
const { Geometry, Context } = require('axis3d')
const { Material } = require('axis3d/material')
const { Frame } = require('axis3d/frame')
const { Mesh } = require('axis3d/mesh')

const PrimitiveCube = require('primitive-cube')
const ready = require('domready')
const Bunny = require('bunny')
const Stats = require('stats.js')
const quat = require('gl-quat')

const { OrbitCameraController } = require('../')

for (const p of Bunny.positions) {
  p[1] = p[1] - 4
}

const ctx = new Context()
const material = new Material(ctx)
const camera = new PerspectiveCamera(ctx)
const frame = new Frame(ctx)

const box = new Mesh(ctx, {geometry: new Geometry({complex: PrimitiveCube(20, 20, 20)})})
const bunny = new Mesh(ctx, {geometry: new Geometry({complex: Bunny})})

const rotation = quat.identity([])
const position = [25, 25, 25]
const angle = quat.identity([])
const color = [0, 0, 1]
const stats = new Stats()

const orbitCamera = new OrbitCameraController(ctx, {
  camera
})

ctx.on('error', (err) => console.error(err.stack || err))

ready(() => document.body.appendChild(stats.dom))
frame(() => stats.begin())
frame(scene)
frame(() => stats.end())

function scene({time, cancel, cancelAll}) {
  quat.setAxisAngle(angle, [0, 1, 0], 0.5*time)
  quat.slerp(rotation, rotation, angle, 0.5)
  orbitCamera({orientation: rotation, position}, () => {
    material({color}, () => {
      box({scale: 1, wireframe: true}, ({size}) => {
        bunny({})
      })
    })
  })
}
