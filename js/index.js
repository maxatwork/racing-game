(function () {
    class CarActor extends Actor {
        constructor(model) {
            super(new THREE.Object3D())
            model.position.set(0.1, 0, 0)
            this.model.add(model)
        }

        update(delta, gameState) {}
    }

    class RaceGameState extends GameState {
        constructor() {
            super()
        }

        init(renderer) {
            this.renderer = renderer
            this.scene = new THREE.Scene()

            this.camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                1,
                2000
            )

            const rotation = new THREE.Quaternion()
            rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
            this.camera.setRotationFromQuaternion(rotation)
            this.camera.position.set(0, 1, -6)

            window.addEventListener('resize', () => {
                const height = window.innerHeight
                const width = window.innerWidth
                this.camera.aspect = width / height
                this.camera.updateProjectionMatrix()
            })

            const models = [
                ['car', './assets/models/car.dae', 'Car']
            ]

            return Promise.all([loadModels(models)]).then(([models]) => {
                this.models = models

                // Actors
                this.carActor = new CarActor(this.models.car)
                this.actors = [
                    this.carActor
                ]

                this.scene.add(this.carActor.model)

                // Lights
                const ambientLight = new THREE.AmbientLight(0x333333)
                this.scene.add(ambientLight)
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
                directionalLight.position.set(1,1,1).normalize()
                this.scene.add(directionalLight)

                console.log('init finished', this.scene)
            })
        }

        render(delta) {
            this.renderer.render(this.scene, this.camera)
        }
    }

    const raceGameState = new RaceGameState()
    const game = new Game(document.getElementById('container'))
    game.pushState(raceGameState).then(() => {
        game.run()
    })
})()
