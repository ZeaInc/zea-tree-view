// Zea Engine dependencies stored in new const variables. View the API to see what you can include and use.
const {
  Scene,
  GLRenderer,
  Vec3,
  Color,
  Xfo,
  Quat,
  GeomItem,
  Sphere,
  Material,
  Ray,
  MathFunctions,
} = window.zeaEngine
const { CADAsset, CADBody, PMIItem } = zeaCad
const { SelectionManager } = zeaUx

function loadZCADAsset(filepath) {
  const asset = new CADAsset()
  asset.load(filepath).then(() => {
    renderer.frameAll()
  })
  asset.getGeometryLibrary().on('loaded', () => {
    postMessage('done-loading')
  })
  scene.getRoot().addChild(asset)
}

// global variables
const scene = new Scene()
const renderer = new GLRenderer(document.getElementById('canvas'))

export function main() {
  renderer.setScene(scene)
  const camera = renderer.getViewport().getCamera()
  camera.setPositionAndTarget(new Vec3(6, 6, 5), new Vec3(0, 0, 1.5))
  scene.setupGrid(10, 10)

  const appData = {
    scene,
    renderer,
  }

  // Setup FPS Display
  const selectionManager = new SelectionManager(appData, {
    selectionOutlineColor: new Color(1, 1, 0.2, 0.1),
    branchSelectionOutlineColor: new Color(1, 1, 0.2, 0.1),
  })
  appData.selectionManager = selectionManager

  // Setup TreeView Display
  const treeElement = document.getElementById('tree')
  treeElement.setTreeItem(scene.getRoot(), {
    scene,
    renderer,
    selectionManager,
  })

  // load mode
  loadZCADAsset('data/HC_SRO4.zcad')
}
