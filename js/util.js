function append(a, b) {
    return a.push.apply(a, b)
}

function getColladaSceneNodeByName(name = null, scene) {
    if (!name) {
        return scene
    }

    const queue = [].concat(scene.children)
    while(queue.length) {
        const current = queue.shift()
        if (current.name === name) {
            return current
        }

        if (current.children) {
            append(queue, current.children)
        }
    }

    return null
}

/**
* @returns Promise
*/
function loadColladaModel(id, url, nodeName = null) {
    return new Promise(function (resolve, reject) {
        const loader = new THREE.ColladaLoader()
        loader.options.convertUpAxis = true
        loader.load(url, (collada) => {
            var object = getColladaSceneNodeByName(nodeName, collada.scene)
            if (!object) {
                reject(new Error(`Model id: ${id}, url: ${url}: Node with name ${nodeName} not found!`))
            }

            object.scale.set(0.01, 0.01, 0.01) // units conversion
            resolve([id, object])
        })
    })
}

function loadModels(modelsList) {
    return Promise.all(modelsList.map(([id, url, nodeName]) => {
        return loadColladaModel(id, url, nodeName)
    })).then(loadedData => {
        return loadedData.reduce((result, [id, obj]) => {
            result[id] = obj
            return result
        }, {})
    })
}

function loadTexture(id, url) {
    const loader = new THREE.TextureLoader()
    return new Promise((resolve, reject) => {
        loader.load(url, (texture) => {
            resolve([id, texture])
        })
    })
}

function loadTextures(texturesList) {
    return Promise.all(texturesList.map(([id, url]) => {
        return loadTexture(id, url)
    })).then(loadedData => {
        return loadedData.reduce((result, [id, texture]) => {
            result[id] = texture
            return result
        }, {})
    })
}
