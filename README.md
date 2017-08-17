axis3d-orbit-camera
===================

Orbit camera controller for [Axis3D](https://github.com/littlstar/axis3d).

## Installation

```sh
$ npm install axis3d axis3d-orbit-camera
```

## Usage

```js
const { PerspectiveCamera } = require('axis3d/camera')
const { Context } = require('axis3d')

const ctx = new Context()
const orbitCamera = new OrbitCameraController(ctx, {
  camera: new PerspectiveCamera(ctx)
})

orbitCamera(() => {
  // scene
})
```

## License

MIT
