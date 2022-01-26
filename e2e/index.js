// Zea Engine dependencies stored in new const variables.
// View the API to see what you can include and use.
const {
  Scene,
  GLRenderer,
  Vec3,
  Color,
  EnvMap,
  InstanceItem
} = window.zeaEngine
const { CADAsset, CADBody, PMIItem } = window.zeaCad
const { SelectionManager } = window.zeaUx

// Global variables.
const scene = new Scene()
const canvas = document.getElementById('canvas')
const renderer = new GLRenderer(canvas)

/**
 * Load model.
 */
const loadZCADAsset = async filepath => {
  const asset = new CADAsset()

  await asset.load(filepath)

  asset.getGeometryLibrary().on('loaded', () => {
    postMessage('done-loading')
  })

  scene.getRoot().addChild(asset)

  renderer.frameAll()
}

/**
 * Starting point.
 */
const main = async () => {
  renderer.setScene(scene)
  const camera = renderer.getViewport().getCamera()
  camera.setPositionAndTarget(new Vec3(6, 6, 5), new Vec3(0, 0, 1.5))
  scene.setupGrid(10, 10)

  // use environment map for lighting
  const envMap = new EnvMap()
  envMap.load('data/StudioG.zenv')
  scene.setEnvMap(envMap)

  const appData = {
    scene,
    renderer
  }

  const selectionManager = new SelectionManager(appData, {
    selectionOutlineColor: new Color(1, 1, 0, 0.1),
    branchSelectionOutlineColor: new Color(1, 1, 0, 0.1)
  })

  // Load model.
  loadZCADAsset('data/HC_SRO4.zcad').then(() => {
    // Setup tree view.
    const $tree = document.getElementById('tree')
    $tree.setSelectionManager(selectionManager)
    $tree.setTreeItem(scene.getRoot())

    const columns = [
      { title: 'Revision', paramName: 'rev' },
      { title: 'Description', paramName: 'description' }
    ]

    $tree.setColumns(columns)

    // Setup tree view2.
    const $tree2 = document.getElementById('tree2')
    $tree2.setSelectionManager(selectionManager)
    $tree2.setTreeItem(scene.getRoot())

    const columns2 = [
      { title: 'Cat', paramName: 'cat' },
      { title: 'Dog', paramName: 'dog' },
      { title: 'Mouse', paramName: 'mouse' }
    ]

    $tree2.setColumns(columns2)
  })

  const filterItem = item => {
    while (item && !(item instanceof CADBody) && !(item instanceof PMIItem)) {
      item = item.getOwner()
    }
    if (item.getOwner() instanceof InstanceItem) {
      item = item.getOwner()
    }
    return item
  }

  renderer.getViewport().on('pointerDown', event => {
    if (!event.intersectionData) {
      return
    }

    const geomItem = filterItem(event.intersectionData.geomItem)

    if (!geomItem) {
      return
    }

    // console.log('getPath:', geomItem.getPath())

    const geom = event.intersectionData.geomItem.geomParam.value
    // console.log(
    //   'getNumVertices:',
    //   geom.getNumVertices(),
    //   'geomIndex:',
    //   event.intersectionData.geomItem.geomIndex
    // )
    let item = event.intersectionData.geomItem
    while (item) {
      const globalXfo = item.localXfoParam.value
      // console.log(item.getName(), globalXfo.sc.toString())
      item = item.getOwner()
    }
  })

  renderer.getViewport().on('pointerUp', event => {
    const isLeftClick = event.button == 0 && event.intersectionData

    if (!isLeftClick) {
      return
    }

    // if the selection tool is active then do nothing, as it will
    // handle single click selection.s
    // const toolStack = toolManager.toolStack
    // if (toolStack[toolStack.length - 1] == selectionTool) return

    // To provide a simple selection when the SelectionTool is not activated,
    // we toggle selection on the item that is selected.
    const item = filterItem(event.intersectionData.geomItem)

    if (!item) {
      return
    }

    if (!event.shiftKey) {
      selectionManager.toggleItemSelection(item, !event.ctrlKey)

      return
    }

    const items = new Set()
    items.add(item)
    selectionManager.deselectItems(items)
  })
}

export { main }
