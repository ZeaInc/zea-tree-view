import { Color, TreeItem } from '@zeainc/zea-engine'
import { BaseEvent } from '@zeainc/zea-engine/dist/Utilities/BaseEvent'
// import { CADBody, PMIItem } from '@zeainc/zea-cad'

class ZeaTreeEvent extends BaseEvent {
  childItem: TreeItem
  index: number
  constructor(index: number, childItem: TreeItem) {
    super()
    this.index = index
    this.childItem = childItem
  }
}

const highlightColor = new Color('#F9CE03')
highlightColor.a = 0.1

let selectedItem: TreeItem
const setSelection = (
  treeItem: TreeItem,
  state: boolean,
  appData: Record<string, any>
) => {
  if (state) {
    if (selectedItem) {
      selectedItem.setSelected(false)
      selectedItem.removeHighlight('selected', true)
    }
    selectedItem = treeItem
    selectedItem.setSelected(true)
    selectedItem.addHighlight('selected', highlightColor, true)
  } else {
    if (selectedItem) {
      selectedItem.setSelected(false)
      selectedItem.removeHighlight('selected', true)
      selectedItem = null
    }
  }
}

/**
 * Tree item view.
 *
 */
class TreeItemView extends HTMLElement {
  itemContainer: HTMLDivElement
  itemHeader: HTMLDivElement
  itemChildren: HTMLDivElement
  expandBtn: HTMLButtonElement
  expanded: boolean
  childrenAlreadyCreated: boolean
  titleElement: HTMLSpanElement
  appData: any
  treeItem: TreeItem
  updateSelectedId: any
  toggleVisibilityBtn: HTMLInputElement
  updateVisibilityId: any
  updateHighlightId: any
  childAddedId: any
  childRemovedId: any
  /**
   * Constructor.
   *
   */
  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })

    // Add component CSS
    const styleTag = document.createElement('style')
    // @ts-ignore
    styleTag.appendChild(document.createTextNode(TreeItemView.css))
    shadowRoot.appendChild(styleTag)

    // Create container tags
    this.itemContainer = document.createElement('div')
    this.itemContainer.className = 'ItemContainer'

    this.itemHeader = document.createElement('div')
    this.itemHeader.className = 'TreeNodeHeader'
    this.itemContainer.appendChild(this.itemHeader)

    this.itemChildren = document.createElement('div')
    this.itemChildren.className = 'TreeNodesList'
    this.itemContainer.appendChild(this.itemChildren)

    // Item expand button

    {
      this.expandBtn = document.createElement('button')
      this.expandBtn.className = 'TreeNodesListItem__ToggleExpanded'
      this.itemHeader.appendChild(this.expandBtn)

      this.expanded = false
      this.childrenAlreadyCreated = false

      this.expandBtn.addEventListener('click', () => {
        const numChildren = this.countChildren()
        if (numChildren > 0) {
          this.expanded ? this.collapse() : this.expand()
        }
      })
    }

    // Title element
    this.titleElement = document.createElement('span')
    this.titleElement.className = 'TreeNodesListItem__Title'
    this.titleElement.addEventListener('click', (e) => {
      if (!this.appData || !this.appData.selectionManager) {
        if (!this.treeItem.isSelected()) {
          setSelection(this.treeItem, true, this.appData)
        } else {
          setSelection(this.treeItem, false, this.appData)
        }
        return
      }
      if (this.appData.selectionManager.pickingModeActive()) {
        this.appData.selectionManager.pick(this.treeItem)
        return
      }
      this.appData.selectionManager.toggleItemSelection(
        this.treeItem,
        !e.ctrlKey
      )
    })

    this.itemHeader.appendChild(this.titleElement)

    //
    shadowRoot.appendChild(this.itemContainer)
  }
  static css(css: any): Text {
    throw new Error('Method not implemented.')
  }

  /**
   * Set tree item.
   * @param {object} treeItem Tree item.
   * @param {object} appData App data.
   */
  setTreeItem(treeItem: TreeItem, appData: Record<string, any>) {
    this.treeItem = treeItem

    this.appData = appData

    // Name
    this.titleElement.textContent = treeItem.getName()
    const updateName = () => {
      this.titleElement.textContent = treeItem.getName()
    }
    this.treeItem.on('nameChanged', updateName)

    // Selection
    this.updateSelectedId = this.treeItem.on(
      'selectedChanged',
      this.updateSelected.bind(this)
    )
    this.updateSelected()

    if (treeItem instanceof TreeItem) {
      // Visiblity

      // Visibility Checkbox
      this.toggleVisibilityBtn = document.createElement('input')
      this.toggleVisibilityBtn.type = 'checkbox'
      this.toggleVisibilityBtn.className = 'TreeNodesListItem__ToggleVisibility'

      this.itemHeader.insertBefore(this.toggleVisibilityBtn, this.titleElement)

      this.toggleVisibilityBtn.addEventListener('click', () => {
        const visibleParam = this.treeItem.getParameter('Visible')
        if (this.appData && this.appData.undoRedoManager) {
          // TODO: need UX
          //@ts-ignore
          const change = new ParameterValueChange(
            visibleParam,
            !visibleParam.getValue()
          )
          this.appData.undoRedoManager.addChange(change)
        } else {
          visibleParam.setValue(!visibleParam.getValue())
        }
      })
      this.updateVisibilityId = this.treeItem.on(
        'visibilityChanged',
        this.updateVisibility.bind(this)
      )
      this.updateVisibility()

      // Highlights
      this.updateHighlightId = this.treeItem.on(
        'highlightChanged',
        this.updateHighlight.bind(this)
      )
      this.updateHighlight()

      const numChildren = this.countChildren()
      if (numChildren > 0) {
        this.collapse()
      }

      this.childAddedId = this.treeItem.on(
        'childAdded',
        this.childAdded.bind(this)
      )
      this.childRemovedId = this.treeItem.on(
        'childRemoved',
        this.childRemoved.bind(this)
      )
    }
  }

  /**
   * Update visibility.
   *
   */
  updateVisibility() {
    const visible = this.treeItem.isVisible()
    visible
      ? this.itemContainer.classList.remove('TreeNodesListItem--isHidden')
      : this.itemContainer.classList.add('TreeNodesListItem--isHidden')

    if (visible) {
      this.toggleVisibilityBtn.checked = true
    } else {
      this.toggleVisibilityBtn.checked = false
    }
  }

  /**
   * Update selected.
   *
   */
  updateSelected() {
    const selected = this.treeItem.isSelected()
    if (selected)
      this.itemContainer.classList.add('TreeNodesListItem--isSelected')
    else this.itemContainer.classList.remove('TreeNodesListItem--isSelected')
  }

  /**
   * Update highlight.
   */
  updateHighlight() {
    const hilighted = this.treeItem.isHighlighted()
    if (hilighted)
      this.itemContainer.classList.add('TreeNodesListItem--isHighlighted')
    else this.itemContainer.classList.remove('TreeNodesListItem--isHighlighted')
    if (hilighted) {
      const highlightColor = this.treeItem.getHighlight()
      const bgColor = highlightColor.lerp(new Color(0.75, 0.75, 0.75, 0), 0.5)
      this.titleElement.style.setProperty(
        'border-color',
        highlightColor.toHex()
      )
      this.titleElement.style.setProperty('background-color', bgColor.toHex())
    } else {
      this.titleElement.style.removeProperty('border-color')
      this.titleElement.style.removeProperty('background-color')
    }
  }

  countChildren(): number {
    const children = this.treeItem.getChildren()
    let count = 0
    children.forEach((childItem) => {
      if (childItem instanceof TreeItem && childItem.isSelectable()) {
        count++
      }
    })
    return count
  }

  /**
   * The expand method.
   */
  expand() {
    this.expanded = true
    this.itemChildren.classList.remove('TreeNodesList--collapsed')
    this.expandBtn.innerHTML = '-'

    if (!this.childrenAlreadyCreated) {
      const children = this.treeItem.getChildren()
      children.forEach((childItem, index) => {
        if (childItem instanceof TreeItem && childItem.isSelectable()) {
          this.addChild(childItem, index)
        }
      })
      this.childrenAlreadyCreated = true
    }
  }

  /**
   * The collapse method.
   */
  collapse() {
    this.itemChildren.classList.add('TreeNodesList--collapsed')
    this.expandBtn.innerHTML = '+'
    this.expanded = false
  }

  /**
   * The addChild method.
   * @param {any} treeItem - The treeItem param.
   * @param {number} index - The expanded param.
   */
  addChild(treeItem: TreeItem, index: number) {
    if (this.expanded) {
      const childTreeItem = document.createElement(
        'tree-item-view'
      ) as TreeItemView
      childTreeItem.setTreeItem(treeItem, this.appData)
      if (index == this.itemChildren.childElementCount) {
        this.itemChildren.appendChild(childTreeItem)
      } else {
        this.itemChildren.insertBefore(
          childTreeItem,
          this.itemChildren.children[index]
        )
      }
    } else {
      this.collapse()
    }
  }

  childAdded(event: ZeaTreeEvent) {
    const { childItem, index } = event
    // if (!childItem.testFlag(ItemFlags.INVISIBLE))
    this.addChild(childItem, index)
  }

  childRemoved(event: ZeaTreeEvent) {
    const { index } = event
    if (this.expanded) {
      this.itemChildren.children[index].remove() // TODO: (check) used to be : .destroy() instead of .remove()
      this.itemChildren.removeChild(this.itemChildren.children[index])
    }
  }

  getChild(index: number) {
    return this.itemChildren.children[index]
  }

  /**
   * The destroy method.
   */
  destroy() {
    this.treeItem.removeListenerById('selectedChanged', this.updateSelectedId)
    if (this.treeItem instanceof TreeItem) {
      this.treeItem.removeListenerById(
        'highlightChanged',
        this.updateHighlightId
      )
      this.treeItem.removeListenerById(
        'visibilityChanged',
        this.updateVisibilityId
      )
      this.treeItem.removeListenerById('childAdded', this.childAddedId)
      this.treeItem.removeListenerById('childRemoved', this.childRemovedId)
    }
  }
}

//@ts-ignore
TreeItemView.css = `
  /* tree-view.css */

  .TreeNodesList {
    border-left: 1px dotted;
    list-style-type: none;
    padding: 0 4px 0 4px;
    margin: 0 0 0 12px;
  }

  .TreeNodesList--collapsed {
    display: none;
  }

  .TreeNodesList--root {
    border: none;
    margin: 0;
    padding: 0;
    width: max-content;
  }

  .TreeNodesListItem {
    display: flex;
  }

  .TreeNodesListItem__ToggleExpanded {
    border: none;
    height: 24px;
    width: 20px;
    padding: 0;
    outline: none;
    margin: 2px 0 0 0;
  }
  .TreeNodesListItem__ToggleVisibility {
    margin: 8px 0 0 0;
  }

  .TreeNodesListItem::before {
    border-bottom: 1px dotted;
    content: '';
    display: inline-block;
    left: -15px;
    position: relative;
    top: -5px;
    width: 10px;
  }

  .TreeNodesListItem__Toggle:focus {
    outline: none;
  }

  .ItemContainer {
    min-width: max-content;
  }

  .TreeNodeHeader {
    display: flex;
    margin: 0 auto;
  }

  .TreeNodesListItem__Title {
    cursor: default;
    padding: 2px 4px;
    border-radius: 5px;
  }

  .TreeNodesListItem__Hover {
  }

  .TreeNodesListItem__Dragging {
  }

  .TreeNodesListItem--isSelected > .TreeNodeHeader > .TreeNodesListItem__Title {
  }

  .TreeNodesListItem--isHidden > .TreeNodeHeader >  .TreeNodesListItem__Title {
  }

  .TreeNodesListItem--isHighlighted > .TreeNodeHeader >  .TreeNodesListItem__Title {
    // border-style: solid;
    // border-width: thin;
  }

  `

customElements.define('tree-item-view', TreeItemView)

/**
 * Scene tree view.
 *
 */
class ZeaTreeView extends HTMLElement {
  treeContainer: HTMLDivElement
  treeItemView: TreeItemView
  rootTreeItem: TreeItem
  appData: Record<string, any>
  mouseOver: boolean
  /**
   * Constructor.
   *
   */
  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })

    // Add component CSS
    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
      .ZeaTreeView {
        height: 200px;
      }
      `)
    )
    shadowRoot.appendChild(styleTag)

    // Create container tags
    this.treeContainer = document.createElement('div')
    this.treeContainer.className = 'ZeaTreeView'
    shadowRoot.appendChild(this.treeContainer)

    // Init root tree item
    this.treeItemView = document.createElement('tree-item-view') as TreeItemView
    this.treeContainer.appendChild(this.treeItemView)

    this.__onKeyDown = this.__onKeyDown.bind(this)
    this.__onMouseEnter = this.__onMouseEnter.bind(this)
    this.__onMouseLeave = this.__onMouseLeave.bind(this)
    document.addEventListener('keydown', this.__onKeyDown)
    this.addEventListener('mouseenter', this.__onMouseEnter)
    this.addEventListener('mouseleave', this.__onMouseLeave)
  }

  /**
   * Set tree item.
   * @param {object} treeItem Tree item.
   * @param {object} appData App data.
   */
  setTreeItem(treeItem: TreeItem, appData: Record<string, any>) {
    this.rootTreeItem = treeItem
    this.appData = appData
    this.treeItemView.setTreeItem(treeItem, appData)
  }

  __onMouseEnter() {
    this.mouseOver = true
  }

  __onMouseLeave() {
    this.mouseOver = false
  }
  // TODO: replace with zea version
  __onKeyDown(event: KeyboardEvent) {
    if (!this.mouseOver || !this.appData) return
    const { selectionManager } = this.appData
    // if (!selectionManager) return
    const selectedItems: Set<TreeItem> = selectionManager
      ? selectionManager.getSelection()
      : selectedItem
      ? new Set([selectedItem])
      : new Set()

    if (event.key == 'f') {
      // const selectedItems = selectionManager.getSelection()
      this.expandSelection(selectedItems, true)
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (event.key == 'ArrowLeft') {
      const newSelection: Set<TreeItem> = new Set()
      Array.from(selectedItems).forEach((item: TreeItem) => {
        newSelection.add(item.getOwner() as TreeItem)
      })
      if (newSelection.size > 0) {
        selectionManager.setSelection(newSelection)
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (event.key == 'ArrowRight') {
      // const selectedItems = selectionManager.getSelection()
      const newSelection: Set<TreeItem> = new Set()
      Array.from(selectedItems).forEach((item) => {
        if (item instanceof TreeItem && item.getNumChildren() > 0)
          newSelection.add(item.getChild(0))
      })
      if (newSelection.size > 0) {
        selectionManager.setSelection(newSelection)
        this.expandSelection(newSelection, true)
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (event.key == 'ArrowUp') {
      // const selectedItems = selectionManager.getSelection()
      const newSelection: Set<TreeItem> = new Set()
      Array.from(selectedItems).forEach((item: TreeItem) => {
        const treeItemOwner = item.getOwner() as TreeItem
        const index = treeItemOwner.getChildIndex(item)
        if (index == 0) newSelection.add(item.getOwner() as TreeItem)
        else {
          newSelection.add(treeItemOwner.getChild(index - 1))
        }
      })
      if (newSelection.size > 0) {
        selectionManager.setSelection(newSelection)
        this.expandSelection(newSelection)
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (event.key == 'ArrowDown') {
      // const selectedItems = selectionManager.getSelection()
      const newSelection: Set<TreeItem> = new Set()
      Array.from(selectedItems).forEach((item: TreeItem) => {
        const treeItemOwner = item.getOwner() as TreeItem
        const index = treeItemOwner.getChildIndex(item)
        if (index < treeItemOwner.getNumChildren() - 1)
          newSelection.add(treeItemOwner.getChild(index + 1))
        else {
          const indexinOwner = treeItemOwner.getChildIndex(item)
          if (treeItemOwner.getNumChildren() > indexinOwner + 1)
            newSelection.add(treeItemOwner.getChild(indexinOwner + 1))
        }
      })
      if (newSelection.size > 0) {
        selectionManager.setSelection(newSelection)
        this.expandSelection(newSelection, true)
      }
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }
  /**
   * The expandSelection method.
   * @param {Map} items - The items we wish to expand to show.
   */
  expandSelection(items: Set<TreeItem>, scrollToView = true) {
    Array.from(items).forEach((item: TreeItem) => {
      const path: TreeItem[] = []
      while (true) {
        path.splice(0, 0, item)
        if (item == this.rootTreeItem) break
        item = item.getOwner() as TreeItem
      }
      let treeViewItem = this.treeItemView
      path.forEach((item: TreeItem, index: number) => {
        if (index < path.length - 1) {
          if (!treeViewItem.expanded) treeViewItem.expand()
          const childIndex = item.getChildIndex(path[index + 1])
          treeViewItem = treeViewItem.getChild(childIndex) as TreeItemView
        }
      })
      // causes the element to be always at the top of the view.
      if (scrollToView && treeViewItem)
        treeViewItem.titleElement.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        })
    })
  }
}

customElements.define('zea-tree-view', ZeaTreeView)
