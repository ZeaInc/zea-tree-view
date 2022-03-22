const { Scene, Color, CADAsset, TreeItem, InstanceItem } = window.zeaEngine
const { SelectionManager } = window.zeaUx

const scene = new Scene()

const appData = {
  scene,
}

const selectionManager = new SelectionManager(appData, {
  selectionOutlineColor: new Color(1, 1, 0, 0.1),
  branchSelectionOutlineColor: new Color(1, 1, 0, 0.1),
})

const columns = [
  { title: 'Revision', paramName: 'rev' },
  { title: 'Description', paramName: 'description' },
]

const $tree = document.querySelector('#tree')
$tree.setColumns(columns)
$tree.setSelectionManager(selectionManager)
$tree.setTreeItem(scene.getRoot())

document.querySelector('#selectItem').addEventListener('click', () => {
  const treeItem = scene.getRoot().getChild(0)
  const set = new Set()
  set.add(treeItem)
  selectionManager.setSelection(set)
})

document.querySelector('#insertItem').addEventListener('click', () => {
  const treeItem = new TreeItem('foo')
  scene.getRoot().insertChild(treeItem, 0)
})

document.querySelector('#insertMultipleItems').addEventListener('click', () => {
  const newItemsCount = parseInt(
    document.querySelector('#newItemsCount').value,
    10
  )

  for (i = 0; i < newItemsCount; i += 1) {
    const treeItem = new TreeItem('Item')
    scene.getRoot().insertChild(treeItem, i)
  }
})

document.querySelector('#removeItem').addEventListener('click', () => {
  scene.getRoot().removeChild(0)
})

document
  .querySelector('#createUnnamedInstanceItem')
  .addEventListener('click', () => {
    const instanceItem = new InstanceItem('')
    const referenceItem = new TreeItem('Some ref item')

    referenceItem.addChild(new TreeItem('child 1'))
    referenceItem.addChild(new TreeItem('child 2'))

    instanceItem.addChild(referenceItem)

    scene.getRoot().insertChild(instanceItem, 0)
  })

document
  .querySelector('#createNamedInstanceItem')
  .addEventListener('click', () => {
    const instanceItem = new InstanceItem('Some instance item')
    const referenceItem = new TreeItem('Some ref item')

    referenceItem.addChild(new TreeItem('child 1'))
    referenceItem.addChild(new TreeItem('child 2'))

    instanceItem.addChild(referenceItem)

    scene.getRoot().insertChild(instanceItem, 0)
  })

document.querySelector('#renameItem').addEventListener('click', () => {
  const treeItem = scene.getRoot().getChild(0)
  treeItem.setName('new name')
})
