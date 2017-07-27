(function () {
    class RoadActor extends Actor {
        constructor(textures, cubeCamera) {
            super(new THREE.Object3D())

            this.segmentLength = 100
            this.segments = []
            this.segmentsCount = 0

            this.segmentGeometry = new THREE.PlaneBufferGeometry(
                4, this.segmentLength,
                1, 1
            )
            this.segmentMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x000044,
                metalness: .95,
                roughness: 0.01,
                reflectivity: 0.75,
                emissive: 0xffffff,
                emissiveMap: textures.roadEmissive,
                emissiveIntensity: 10,
                envMap: cubeCamera.renderTarget.texture,
            })

            this.position = new THREE.Vector3(
                0, 0, this.segmentLength / 2
            )

            this.addSegment()
        }

        addSegment() {
            const segment = new THREE.Mesh(
                this.segmentGeometry,
                this.segmentMaterial
            )
            const rotation = new THREE.Quaternion()
            rotation.setFromAxisAngle(
                new THREE.Vector3(1, 0, 0),
                -Math.PI/2
            )
            segment.setRotationFromQuaternion(rotation)
            segment.position.set(
                0,
                0,
                this.segmentsCount*this.segmentLength
            )
            this.model.add(segment)
            this.segmentsCount++
            this.segments.push(segment)
        }

        update(delta, gameState) {
            const newPosition = new THREE.Vector3()
            newPosition.addVectors(
                this.position,
                new THREE.Vector3(0, 0, -gameState.speed*delta/1000)
            )
            this.position = newPosition

            const roadLeft = this.position.z + this.segmentsCount*this.segmentLength
            const VISIBLE_SEGMENTS = 2
            if (roadLeft < VISIBLE_SEGMENTS*this.segmentLength) {
                this.addSegment()
            }

            if (this.segments.length > VISIBLE_SEGMENTS + 1) {
                const firstSegment = this.segments.shift()
                this.model.remove(firstSegment)
            }

            super.update(delta, gameState)
        }
    }

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

            this.speed = 10
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

            let rotation = new THREE.Quaternion()
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

            const textures = [
                ['cityscape', './assets/maps/cityscape-p2-blue.jpg'],
                ['roadEmissive', './assets/maps/road-emissive.png'],
            ]

            return Promise.all([loadModels(models), loadTextures(textures)]).then(([models, textures]) => {
                this.models = models
                this.textures = textures

                // Mirror Camera
                this.mirrorCubeCamera = new THREE.CubeCamera(
                    0.1,
                    2000,
                    256
                )
                this.scene.add(this.mirrorCubeCamera)

                // Actors
                this.carActor = new CarActor(this.models.car)
                this.roadActor = new RoadActor(
                    this.textures,
                    this.mirrorCubeCamera
                )

                this.actors = [
                    this.carActor,
                    this.roadActor
                ]

                this.scene.add(this.carActor.model)
                this.scene.add(this.roadActor.model)

                const skyboxGeometry = new THREE.PlaneBufferGeometry(1100, 350, 1, 1)
                const skyboxMaterial = new THREE.MeshBasicMaterial({
                    wireframe: false,
                    map: this.textures.cityscape
                })
                const skybox = new THREE.Mesh(
                    skyboxGeometry,
                    skyboxMaterial
                )
                this.scene.add(skybox)
                skybox.position.set(0, 64, 400)
                rotation = new THREE.Quaternion()
                rotation.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    Math.PI
                )
                skybox.setRotationFromQuaternion(rotation)

                // Lights
                const ambientLight = new THREE.AmbientLight(0x333333)
                this.scene.add(ambientLight)
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
                directionalLight.position.set(1,1,1).normalize()
                this.scene.add(directionalLight)

                console.log('init finished', this.scene)
            })
        }

        update(delta) {
            super.update(delta)

            this.mirrorCubeCamera.position.set(
                this.camera.position.x,
                -this.camera.position.y,
                this.camera.position.z
            )
        }

        render(delta) {
            this.roadActor.model.visible = false
            this.mirrorCubeCamera.updateCubeMap(
                this.renderer,
                this.scene
            )
            this.roadActor.model.visible = true
            this.renderer.render(this.scene, this.camera)
        }
    }

    const raceGameState = new RaceGameState()
    const game = new Game(document.getElementById('container'))
    game.pushState(raceGameState).then(() => {
        game.run()
    })
})()
