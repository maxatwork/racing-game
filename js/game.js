class Actor {
    constructor(model) {
        this.model = model.clone(true)
        this.position = new THREE.Vector3(0, 0, 0)
    }

    update(delta, gameState) {
        // Calculate position in derived classes
        this.model.position.set(this.position.x, this.position.y, this.position.z)
    }
}

class GameState {
    constructor() {
        this.initialized = false
        this.actors = []
    }

    init() {
        return new Promise(resolve => {
            this.initialized = true
            resolve()
        })
    }

    update(delta) {
        this.actors.forEach(actor => actor.update(delta, this))
    }

    render(delta) {}

    destroy() {
        return new Promise(resolve => {
            resolve()
        })
    }
}

class Game {
    constructor(container) {
        this.states = []
        this.shouldExit = false

        this.prevFrameTime = null

        this.pushState = this.pushState.bind(this)
        this.stop = this.stop.bind(this)
        this.run = this.run.bind(this)

        this.setupRenderer(container)
    }

    setupRenderer(container) {
        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        container.appendChild(this.renderer.domElement)

        this.renderer.toneMappingExposure = 1.0;

        this.stats = new Stats()
        container.appendChild(this.stats.dom)

        window.addEventListener('resize', () => {
            const width = window.innerWidth
			const height = window.innerHeight

            this.renderer.setSize(width, height)
        }, false)
    }

    pushState(state) {
        console.log('pushState')
        return state.init(this.renderer).then(() => {
            this.states.unshift(state)
        })
    }

    popState() {
        const states = this.states
        return states[0].destroy().then(() => {
            states.shift()
        })
    }

    replaceState(state) {
        const states = this.states
        const currentState = states[0]
        return state.init(this.renderer)
            .then(() => {
                states.unshift(state)
            })
            .then(currentState.destroy())
    }

    stop() {
        this.shouldExit = true
    }

    run(timestamp = 0) {
        if (timestamp === 0) {
            this.startTime = Date.now()
            this.lastFrameTime = Date.now()
        }
        const currentTime = this.startTime + timestamp
        const delta = currentTime - this.lastFrameTime
        this.lastFrameTime = currentTime

        if (this.shouldExit) {
            return
        }

        requestAnimationFrame(this.run)

        this.states[0].update(delta)
        this.states[0].render(delta)

        this.stats.update()
    }
}
