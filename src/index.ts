import { Color, TreeItem, InstanceItem } from '@zeainc/zea-engine'

// interface TreeItemWeight {
//   [key: number]: number
// }

// ////////////////////////////////////////
// Provide a simple debug mode to enable debugging the tree view.
// const colorStart = new Color(0, 0, 0)
// const colorEnd = new Color(1, 0, 0)
// const treeItemWeights: TreeItemWeight = {}
// let rootTreeItemView: any
// let totalWeight = 0
// let recalcRequested = 0

// const updateTreeView = () => {
//   if (recalcRequested == 0) {
//     recalcRequested = window.setTimeout(() => {
//       rootTreeItemView.displayTreeWeight()
//       recalcRequested = 0
//     }, 100)
//   }
// }

// const propagateWeightUp = (treeItem: TreeItem | undefined, delta: number) => {
//   if (!treeItem) {
//     return
//   }

//   treeItemWeights[treeItem.getId()] += delta
//   if (treeItem.getOwner()) {
//     propagateWeightUp(treeItem.getOwner(), delta)
//   }
// }

// const calcTreeWeight = treeItem => {
//   let weight = 1 // self
//   const children = treeItem.getChildren()
//   children.forEach(childItem => {
//     weight += calcTreeWeight(childItem)
//   })
//   treeItemWeights[treeItem.getId()] = weight

//   treeItem.on('childAdded', event => {
//     const { childItem } = event
//     const childWeight = calcTreeWeight(childItem)
//     totalWeight += childWeight
//     propagateWeightUp(treeItem, childWeight)

//     updateTreeView()
//   })

//   treeItem.on('childRemoved', event => {
//     const { childItem } = event
//     const childWeight = -calcTreeWeight(childItem)
//     totalWeight += childWeight
//     propagateWeightUp(treeItem, childWeight)

//     updateTreeView()
//   })

//   return weight
// }

// ////////////////////////////////////////

const highlightColor = new Color('#F9CE03')
highlightColor.a = 0.1

// let selectedItem
// const setSelection = (item, state) => {
//   if (state) {
//     if (selectedItem) {
//       selectedItem.setSelected(false)
//       selectedItem.removeHighlight('selected', true)
//     }
//     selectedItem = item
//     selectedItem.setSelected(true)
//     selectedItem.addHighlight('selected', highlightColor, true)
//
//     return
//   }
//
//   if (selectedItem) {
//     selectedItem.setSelected(false)
//     selectedItem.removeHighlight('selected', true)
//     selectedItem = null
//   }
// }

/**
 * Tree item view.
 */
//class TreeItemView extends HTMLElement {
//  constructor() {
//    super()

//    this.isExpanded = false
//    this.childrenAlreadyCreated = false

//    this.attachShadow({ mode: 'open' })

//    // Add component CSS
//    const styleTag = document.createElement('style')
//    styleTag.appendChild(document.createTextNode(TreeItemView.css))
//    this.shadowRoot.appendChild(styleTag)

//    // Create container tags
//    this.$itemContainer = document.createElement('div')
//    this.$itemContainer.className = 'ItemContainer'

//    this.$itemHeader = document.createElement('div')
//    this.$itemHeader.className = 'TreeNodeHeader'
//    this.$itemContainer.appendChild(this.$itemHeader)

//    this.$itemChildren = document.createElement('div')
//    this.$itemChildren.className = 'TreeNodesList'
//    this.$itemContainer.appendChild(this.$itemChildren)

//    // Item expand button
//    this.$buttonToggle = document.createElement('button')
//    this.$buttonToggle.className = 'TreeNodesListItem__ToggleExpanded'
//    this.$itemHeader.appendChild(this.$buttonToggle)

//    this.$buttonToggle.addEventListener('click', () => {
//      const numChildren = this.countChildren()
//      if (numChildren > 0) {
//        this.isExpanded ? this.collapse() : this.expand()
//      }
//    })

//    // Title element
//    this.titleElement = document.createElement('div')
//    this.titleElement.className = 'TreeItemName'
//    this.titleElement.addEventListener('click', e => {
//      if (!this.appData || !this.appData.selectionManager) {
//        if (!this.treeItem.isSelected()) {
//          setSelection(this.treeItem, true, this.appData)
//        } else {
//          setSelection(this.treeItem, false, this.appData)
//        }
//        return
//      }
//      if (this.appData.selectionManager.pickingModeActive()) {
//        this.appData.selectionManager.pick(this.treeItem)
//        return
//      }
//      this.appData.selectionManager.toggleItemSelection(
//        this.treeItem,
//        !e.ctrlKey
//      )
//    })

//    this.$itemHeader.appendChild(this.titleElement)

//    // Tooltip
//    this.$tooltip = document.createElement('SPAN')
//    this.$tooltip.className = 'tooltiptext'
//    this.$itemHeader.appendChild(this.$tooltip)

//    //
//    this.shadowRoot.appendChild(this.$itemContainer)
//  }

//  /**
//   * Set tree item.
//   * @param {object} treeItem Tree item.
//   * @param {object} appData App data.
//   */
//  setTreeItem(treeItem, appData) {
//    this.treeItem = treeItem
//    this.appData = appData

//    let name
//    const displayNameParam = this.treeItem.getParameter('DisplayName')
//    if (displayNameParam) {
//      name = displayNameParam.getValue()
//    } else {
//      name = this.treeItem.getName()
//    }

//    if (
//      this.treeItem instanceof InstanceItem &&
//      this.treeItem.getNumChildren() === 1
//    ) {
//      const referenceItem = this.treeItem.getChild(0)
//      if (name == '') {
//        const displayNameParam = referenceItem.getParameter('DisplayName')
//        if (displayNameParam) {
//          name = displayNameParam.getValue()
//        } else name = referenceItem.getName()
//      }

//      this.titleElement.textContent = name

//      this.$tooltip.textContent = `Instance of (${referenceItem.getClassName()})`
//    } else {
//      this.$tooltip.textContent = `(${this.treeItem.getClassName()})`
//      this.titleElement.textContent = name
//    }

//    // Name
//    const updateName = () => {
//      this.titleElement.textContent = this.treeItem.getName()
//    }
//    this.treeItem.on('nameChanged', updateName)

//    // Selection
//    this.updateSelectedId = this.treeItem.on(
//      'selectedChanged',
//      this.updateSelected.bind(this)
//    )
//    this.updateSelected()

//    if (this.treeItem instanceof TreeItem) {
//      // Visiblity

//      // Visibility Checkbox
//      this.toggleVisibilityBtn = document.createElement('input')
//      this.toggleVisibilityBtn.type = 'checkbox'
//      this.toggleVisibilityBtn.className = 'TreeNodesListItem__ToggleVisibility'

//      this.$itemHeader.insertBefore(this.toggleVisibilityBtn, this.titleElement)

//      this.toggleVisibilityBtn.addEventListener('click', () => {
//        const visibleParam = this.treeItem.getParameter('Visible')
//        if (this.appData && this.appData.undoRedoManager) {
//          const change = new ParameterValueChange(
//            visibleParam,
//            !visibleParam.getValue()
//          )
//          this.appData.undoRedoManager.addChange(change)
//        } else {
//          visibleParam.setValue(!visibleParam.getValue())
//        }
//      })

//      this.updateVisibilityId = this.treeItem.on(
//        'visibilityChanged',
//        this.updateVisibility.bind(this)
//      )
//      this.updateVisibility()

//      // Highlights
//      this.updateHighlightId = this.treeItem.on(
//        'highlightChanged',
//        this.updateHighlight.bind(this)
//      )
//      this.updateHighlight()

//      const numChildren = this.countChildren()
//      if (numChildren > 0) {
//        this.collapse()
//      }

//      this.childAddedId = this.treeItem.on(
//        'childAdded',
//        this.childAdded.bind(this)
//      )

//      this.childRemovedId = this.treeItem.on(
//        'childRemoved',
//        this.childRemoved.bind(this)
//      )
//    }

//    if (appData.displayTreeComplexity) {
//      this.displayTreeWeight()
//    }
//  }

//  /**
//   * Update visibility.
//   *
//   */
//  updateVisibility() {
//    const visible = this.treeItem.isVisible()

//    if (visible) {
//      this.toggleVisibilityBtn.checked = true
//      this.$itemContainer.classList.remove('TreeNodesListItem--isHidden')

//      return
//    }

//    this.toggleVisibilityBtn.checked = false
//    this.$itemContainer.classList.add('TreeNodesListItem--isHidden')
//  }

//  /**
//   * Update selected.
//   *
//   */
//  updateSelected() {
//    const selected = this.treeItem.isSelected()
//    if (selected)
//      this.$itemContainer.classList.add('TreeNodesListItem--isSelected')
//    else this.$itemContainer.classList.remove('TreeNodesListItem--isSelected')
//  }

//  /**
//   * Update highlight.
//   */
//  updateHighlight() {
//    const hilighted = this.treeItem.isHighlighted()
//    if (hilighted)
//      this.$itemContainer.classList.add('TreeNodesListItem--isHighlighted')
//    else
//      this.$itemContainer.classList.remove('TreeNodesListItem--isHighlighted')
//    if (hilighted) {
//      const highlightColor = this.treeItem.getHighlight()
//      const bgColor = highlightColor.lerp(new Color(0.75, 0.75, 0.75, 0), 0.5)
//      this.titleElement.style.setProperty(
//        'border-color',
//        highlightColor.toHex()
//      )
//      this.titleElement.style.setProperty('background-color', bgColor.toHex())
//    } else {
//      this.titleElement.style.removeProperty('border-color')
//      this.titleElement.style.removeProperty('background-color')
//    }
//  }

//  /**
//   * Display the weight of this tree item against the weight of the entire tree.
//   */
//  displayTreeWeight() {
//    const weight = treeItemWeights[this.treeItem.getId()]

//    // Note: use a power curve so that the colors don't go black too fast.
//    const weightFract = Math.pow(weight / totalWeight, 0.25)
//    // console.log(weight, totalWeight, weightFract)
//    const bgColor = colorStart.lerp(colorEnd, weightFract)
//    this.titleElement.style.setProperty('background-color', bgColor.toHex())
//    this.$tooltip.textContent = `(${weight}/${totalWeight})`

//    const children = this.treeItem.getChildren()
//    children.forEach(childItem => {
//      const childTreeItemView = this.getChildByTreeItem(childItem)
//      if (childTreeItemView) childTreeItemView.displayTreeWeight()
//    })
//  }

//  /**
//   * Count the number of selectable children.
//   * @return {number} the number of selectable children.
//   */
//  countChildren() {
//    const children = this.treeItem.getChildren()
//    let count = 0
//    children.forEach(childItem => {
//      if (childItem instanceof TreeItem && childItem.isSelectable()) {
//        count++
//      }
//    })
//    return count
//  }

//  /**
//   * The expand method.
//   */
//  expand() {
//    this.isExpanded = true
//    this.$itemChildren.classList.remove('TreeNodesList--collapsed')
//    this.$buttonToggle.innerHTML = '-'

//    if (this.childrenAlreadyCreated) {
//      return
//    }

//    const children =
//      this.treeItem instanceof InstanceItem &&
//      this.treeItem.getNumChildren() === 1
//        ? this.treeItem.getChild(0).getChildren()
//        : this.treeItem.getChildren()

//    children.forEach((childItem, index) => {
//      if (childItem instanceof TreeItem && childItem.isSelectable()) {
//        this.addChild(childItem, index)
//      }
//    })

//    this.childrenAlreadyCreated = true
//  }

//  /**
//   * The collapse method.
//   */
//  collapse() {
//    this.isExpanded = false
//    this.$itemChildren.classList.add('TreeNodesList--collapsed')
//    this.$buttonToggle.innerHTML = '+'
//  }

//  /**
//   * The addChild method.
//   * @param {any} treeItem - The treeItem param.
//   * @param {number} index - The isExpanded param.
//   */
//  addChild(treeItem, index) {
//    if (this.isExpanded) {
//      const childTreeItem = document.createElement('tree-item-view')
//      childTreeItem.setTreeItem(treeItem, this.appData)

//      if (index == this.$itemChildren.childElementCount) {
//        this.$itemChildren.appendChild(childTreeItem)
//      } else {
//        this.$itemChildren.insertBefore(
//          childTreeItem,
//          this.$itemChildren.children[index]
//        )
//      }
//    } else {
//      this.collapse()
//    }
//  }

//  childAdded(event) {
//    const { childItem, index } = event
//    // if (!childItem.testFlag(ItemFlags.INVISIBLE))
//    this.addChild(childItem, index)
//  }

//  childRemoved(event) {
//    const { index } = event
//    if (this.isExpanded) {
//      this.$itemChildren.children[index].destroy()
//      this.$itemChildren.removeChild(this.$itemChildren.children[index])
//    }
//  }

//  getChild(index) {
//    return this.$itemChildren.children[index]
//  }

//  getChildByTreeItem(treeItem) {
//    for (let i = 0; i < this.$itemChildren.children.length; i++) {
//      if (this.$itemChildren.children[i].treeItem == treeItem)
//        return this.$itemChildren.children[i]
//    }
//    return null
//  }

//  /**
//   * The destroy method.
//   */
//  destroy() {
//    this.treeItem.removeListenerById('selectedChanged', this.updateSelectedId)

//    if (this.treeItem instanceof TreeItem) {
//      this.treeItem.removeListenerById(
//        'highlightChanged',
//        this.updateHighlightId
//      )
//      this.treeItem.removeListenerById(
//        'visibilityChanged',
//        this.updateVisibilityId
//      )
//      this.treeItem.removeListenerById('childAdded', this.childAddedId)
//      this.treeItem.removeListenerById('childRemoved', this.childRemovedId)
//    }
//  }
//}

// TreeItemView.css = `
//     /* tree-view.css */

//     .TreeNodesList {
//       border-left: 1px dotted;
//       list-style-type: none;
//       padding: 0 4px 0 4px;
//       margin: 0 0 0 12px;
//     }

//     .TreeNodesList--collapsed {
//       display: none;
//     }

//     .TreeNodesList--root {
//       border: none;
//       margin: 0;
//       padding: 0;
//       width: max-content;
//     }

//     .TreeNodesListItem {
//       display: flex;
//     }

//     .TreeNodesListItem__ToggleExpanded {
//       border: none;
//       height: 24px;
//       width: 20px;
//       padding: 0;
//       background-color: #0000;
//       color: azure;
//       outline: none;
//       margin: 2px 0 0 0;
//     }
//     .TreeNodesListItem__ToggleVisibility {
//       margin: 8px 0 0 0;
//     }

//     .TreeNodesListItem::before {
//       border-bottom: 1px dotted;
//       content: '';
//       display: inline-block;
//       left: -15px;
//       position: relative;
//       top: -5px;
//       width: 10px;
//     }

//     .TreeNodesListItem__Toggle:focus {
//       outline: none;
//     }

//     .ItemContainer {
//       display: none;
//       min-width: max-content;
//     }

//     .TreeNodeHeader {
//       display: flex;
//       margin: 0 auto;
//       color: azure;

//       position: relative;
//     }
//     .TreeItemName {
//       cursor: default;
//       padding: 2px 4px;
//       border-radius: 5px;

//     }
//     .TreeNodesListItem:hover {
//       background-color: #e1f5fe;
//     }
//     .TreeNodesListItem__Dragging {
//       background-color: #e1f5fe;
//     }
//     .TreeNodesListItem--isSelected > .TreeNodeHeader > .TreeItemName {
//       // background-color: #76d2bb;
//       color: #3B3B3B;
//     }
//     .TreeNodesListItem--isHidden > .TreeNodeHeader >  .TreeItemName {
//       color: #9e9e9e;
//     }
//     .TreeNodesListItem--isHighlighted > .TreeNodeHeader >  .TreeItemName {
//       // border-style: solid;
//       // border-width: thin;
//     }

//     /* Tooltip text */
//     .TreeNodeHeader .tooltiptext {
//       display: flex;
//       visibility: hidden;
//       background-color: #aaa;
//       color: #fff;
//       text-align: center;
//       padding: 2px 4px;
//       border-radius: 6px;
//       width: 200px;
//       height: 22px;
//       /* Position the tooltip text */
//       position: absolute;
//       z-index: 1000;
//       bottom: -125%;
//       left: 50%;
//       margin-top: -50px;
//       margin-left: -50px;
//       /* Fade in tooltip */
//       opacity: 0;
//       transition: opacity 0.3s;
//     }
//     /* Tooltip arrow */
//     .TreeNodeHeader .tooltiptext::after {
//       content: "";
//       position: absolute;
//       top: 100%;
//       left: 90%;
//       margin-left: -5px;
//       border-width: 5px;
//       border-style: solid;
//       border-color: #555 transparent transparent transparent;
//     }
//     /* Show the tooltip text when you mouse over the tooltip container */
//     .TreeNodeHeader:hover .tooltiptext {
//       visibility: visible;
//       opacity: 1;
//     }
//   `

interface ExpandedItemsTracker {
  [index: string]: boolean
}

interface Column {
  title: string
  paramName: string
}

/**
 * Scene tree view.
 */
class ZeaTreeView extends HTMLElement {
  private columns: Column[] = []
  private expandedItemsTracker: ExpandedItemsTracker = {}
  private rootTreeItem!: TreeItem
  private $tableWrapper = document.createElement('div')
  private $tbody = document.createElement('tbody')

  /**
   * Constructor.
   */
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    if (!this.shadowRoot) {
      return
    }

    // Add component CSS
    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
        button {
          background: none;
          border: none;
          color: var(--zea-tree-button-text-color, black);
          margin-right: 5px;
          width: 20px;
        }

        button:hover {
          background-color: var(--zea-tree-button-bg-color, silver);
          border-radius: 2px;
        }

        div.search-wrapper {
          padding: 0.2rem;
        }

        input.search {
          border-radius: 0.2rem;
          width: 100%;
          padding: 0.2rem;
          border: 1px solid gray;
        }

        table {
          border: 1px solid var(--zea-tree-border-color, darkgray);
          border-collapse: collapse;
          color: var(--zea-text-color-primary, white);
          width: 100%;
        }

        tr {
          background-color: var(--zea-tree-even-row-bg-color, gray);
        }

        tr.isHighlighted {
          border: 1px solid gold;
        }

        tr:hover {
          background-color: var(--zea-tree-hover-row-bg-color, slategray);
        }

        tr:nth-child(odd) {
          background-color: var(--zea-tree-odd-row-bg-color, dimgray);
        }

        tr:nth-child(odd):hover {
          background-color: var(, slategray);
        }

        th {
          background-color: var(--zea-tree-header-color, gray)
        }

        th, td {
          border-right: 1px solid var(--zea-tree-border-color, darkgray);
        }
      `)
    )

    this.shadowRoot.appendChild(styleTag)

    // Main wrapper.
    const $mainWrapper = document.createElement('div')
    $mainWrapper.className = 'ZeaTreeView'
    this.shadowRoot.appendChild($mainWrapper)

    // Search wrapper.
    const $searchWrapper = document.createElement('div')
    $searchWrapper.className = 'search-wrapper'
    $mainWrapper.appendChild($searchWrapper)

    const $inputSearch = document.createElement('input')
    $inputSearch.type = 'search'
    $inputSearch.classList.add('search')
    $inputSearch.placeholder = 'Search'
    $inputSearch.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.search($inputSearch.value)
      }

      if (event.key === 'Escape') {
        this.rootTreeItem.removeHighlight('selected', true)
      }
    })
    $searchWrapper.appendChild($inputSearch)

    // Table wrapper.
    this.$tableWrapper.className = 'table-wrapper'
    $mainWrapper.appendChild(this.$tableWrapper)

    // this.addEventListener('mouseenter', this.__onMouseEnter)
    // this.addEventListener('mouseleave', this.__onMouseLeave)
  }

  setColumns(columns: Column[]) {
    this.columns = columns
    this.renderTable()
  }

  isItemExpanded(item: TreeItem) {
    const itemId = item.getId()

    if (this.expandedItemsTracker[itemId]) {
      return this.expandedItemsTracker[itemId]
    }

    this.expandedItemsTracker[itemId] = false

    return false
  }

  toggleItem(item: TreeItem) {
    const itemId = item.getId()
    const isExpanded = this.isItemExpanded(item)
    this.expandedItemsTracker[itemId] = !isExpanded
    this.renderTable()
  }

  /**
   * Render table.
   */
  private renderTable() {
    const $table = document.createElement('table')
    // @ts-ignore
    // See:
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceChildren
    this.$tableWrapper.replaceChildren($table)

    const columnsHeaders = this.columns
      .map(column => `<th>${column.title}</th>`)
      .join('')

    $table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          ${columnsHeaders}
        </tr>
      </thead>
    `

    this.$tbody = document.createElement('tbody')
    $table.appendChild(this.$tbody)

    this.renderVisibleItems()
  }

  /**
   * Render visible items.
   */
  private renderVisibleItems(parent = this.rootTreeItem, level = 0) {
    const isExpanded = this.isItemExpanded(parent)

    const $row = document.createElement('tr')
    if (parent.isHighlighted()) {
      $row.classList.add('isHighlighted')
    }

    this.$tbody.appendChild($row)

    const $cellForName = document.createElement('td')
    const $toggle = document.createElement('button')
    $toggle.innerHTML = isExpanded ? '-' : '+'
    $toggle.style.marginLeft = `${level * 10}px`
    $toggle.addEventListener('click', () => {
      this.toggleItem(parent)
    })
    $cellForName.appendChild($toggle)
    const $name = document.createTextNode(this.nameOfItem(parent))
    $cellForName.appendChild($name)
    $row.appendChild($cellForName)

    this.columns.forEach(column => {
      const { paramName } = column

      const $cell = document.createElement('td')
      $row.appendChild($cell)

      if (parent.hasParameter(paramName)) {
        $cell.innerText = parent.getParameter(paramName)?.getValue()
      }
    })

    if (!isExpanded) {
      return
    }

    const nextLevel = level + 1

    const children = this.childrenOfItem(parent)

    children.forEach(child => {
      if (child instanceof TreeItem && child.isSelectable()) {
        this.renderVisibleItems(child, nextLevel)
      }
    })
  }

  /**
   * Get an item's children.
   */
  private childrenOfItem(parent: TreeItem): TreeItem[] {
    return parent instanceof InstanceItem && parent.getNumChildren() === 1
      ? parent.getChild(0).getChildren()
      : parent.getChildren()
  }

  /**
   * Get an item's name.
   */
  private nameOfItem(item: TreeItem): string {
    const displayNameParam = item.getParameter('DisplayName')

    if (displayNameParam) {
      return displayNameParam.getValue()
    }

    return item.getName()
  }

  /**
   * Expand and item's ancestors.
   */
  private expandAncestorsOf(child: TreeItem) {
    const parent = child.getParentItem()

    if (parent) {
      const parentId = parent.getId()
      this.expandedItemsTracker[parentId] = true
      this.expandAncestorsOf(parent)
    }
  }

  /**
   * Perform search.
   */
  private search(value: string): void {
    const lowerCaseValue = value.toLowerCase()

    this.rootTreeItem.removeHighlight('selected', true)

    this.expandedItemsTracker = {}

    const searchWithin = (parent: TreeItem) => {
      const parentName = this.nameOfItem(parent)

      if (parentName.toLowerCase().includes(lowerCaseValue)) {
        parent.addHighlight('selected', highlightColor)
        this.expandAncestorsOf(parent)
      }

      const children = this.childrenOfItem(parent)

      children.forEach(child => {
        searchWithin(child)
      })
    }

    searchWithin(this.rootTreeItem)

    this.renderTable()
  }

  /**
   * Set tree item.
   * @param {object} treeItem Tree item.
   * @param {object} appData App data.
   */
  setTreeItem(treeItem: TreeItem) {
    this.rootTreeItem = treeItem
    // this.appData = appData

    this.renderTable()

    // calculate the weight of the entire tree before displaying.
    // if (appData.displayTreeComplexity) {
    //   rootTreeItemView = this.$treeItemView
    //   totalWeight = calcTreeWeight(this.rootTreeItem)
    // }

    // this.$treeItemView.setTreeItem(this.rootTreeItem, appData)

    // if (this.appData && this.appData.selectionManager) {
    //   this.appData.selectionManager.on('selectionChanged', event => {
    //     const { selection } = event
    //     this.expandSelection(selection, true)
    //   })
    // }
  }

  // setDebugTreeComplexityMode() {
  //   if (!appData.displayTreeComplexity) {
  //     appData.displayTreeComplexity = true
  //   } else {
  //     appData.displayTreeComplexity = !appData.displayTreeComplexity
  //   }
  // }

  // __onMouseEnter() {
  //   this.mouseOver = true
  // }

  // __onMouseLeave() {
  //   this.mouseOver = false
  // }

  // __onKeyDown(event) {
  //   if (!this.mouseOver || !this.appData) return

  //   const { selectionManager } = this.appData
  //   // if (!selectionManager) return
  //   const selectedItems = selectionManager
  //     ? selectionManager.getSelection()
  //     : selectedItem
  //     ? new Set([selectedItem])
  //     : new Set()

  //   if (event.key == 'f') {
  //     // const selectedItems = selectionManager.getSelection()
  //     this.expandSelection(selectedItems, true)
  //     event.preventDefault()
  //     event.stopPropagation()
  //     return
  //   }

  //   if (event.key == 'ArrowLeft') {
  //     const newSelection = new Set()
  //     Array.from(selectedItems).forEach(item => {
  //       newSelection.add(item.getOwner())
  //     })
  //     if (newSelection.size > 0) {
  //       selectionManager.setSelection(newSelection)
  //     }
  //     event.preventDefault()
  //     event.stopPropagation()
  //     return
  //   }

  //   if (event.key == 'ArrowRight') {
  //     // const selectedItems = selectionManager.getSelection()
  //     const newSelection = new Set()
  //     Array.from(selectedItems).forEach(item => {
  //       if (item instanceof TreeItem && item.getNumChildren() > 0)
  //         newSelection.add(item.getChild(0))
  //     })
  //     if (newSelection.size > 0) {
  //       selectionManager.setSelection(newSelection)
  //       this.expandSelection(newSelection, true)
  //     }
  //     event.preventDefault()
  //     event.stopPropagation()
  //     return
  //   }

  //   if (event.key == 'ArrowUp') {
  //     // const selectedItems = selectionManager.getSelection()
  //     const newSelection = new Set()
  //     Array.from(selectedItems).forEach(item => {
  //       const owner = item.getOwner()
  //       if (!owner) return
  //       const index = owner.getChildIndex(item)
  //       if (index == 0) newSelection.add(owner)
  //       else {
  //         newSelection.add(owner.getChild(index - 1))
  //       }
  //     })
  //     if (newSelection.size > 0) {
  //       selectionManager.setSelection(newSelection)
  //       this.expandSelection(newSelection)
  //     }
  //     event.preventDefault()
  //     event.stopPropagation()
  //     return
  //   }

  //   if (event.key == 'ArrowDown') {
  //     // const selectedItems = selectionManager.getSelection()
  //     const newSelection = new Set()
  //     Array.from(selectedItems).forEach(item => {
  //       if (!item.getOwner()) return

  //       const index = item.getOwner().getChildIndex(item)
  //       if (index < item.getOwner().getNumChildren() - 1)
  //         newSelection.add(item.getOwner().getChild(index + 1))
  //       else {
  //         const indexinOwner = item.getOwner().getChildIndex(item)
  //         if (item.getOwner().getNumChildren() > indexinOwner + 1)
  //           newSelection.add(item.getOwner().getChild(indexinOwner + 1))
  //       }
  //     })
  //     if (newSelection.size > 0) {
  //       selectionManager.setSelection(newSelection)
  //       this.expandSelection(newSelection, true)
  //     }
  //     event.preventDefault()
  //     event.stopPropagation()
  //     return
  //   }
  // }

  /**
   * The expandSelection method.
   * @param {Map} items - The items we wish to expand to show.
   */
  // expandSelection(items, scrollToView = true) {
  //   Array.from(items).forEach(item => {
  //     const path = []

  //     while (true) {
  //       path.splice(0, 0, item)
  //       if (item == this.rootTreeItem) break
  //       item = item.getOwner()
  //     }

  //     let treeViewItem = this.$treeItemView

  //     path.forEach((item, index) => {
  //       if (index < path.length - 1 && treeViewItem) {
  //         if (treeViewItem.treeItem != item) {
  //           console.log(
  //             'Invalid tree view structure:',
  //             treeViewItem.treeItem.getName(),
  //             item.getName()
  //           )
  //         }
  //         if (!treeViewItem.isExpanded) {
  //           treeViewItem.expand()
  //         }
  //         treeViewItem = treeViewItem.getChildByTreeItem(path[index + 1])
  //       }
  //     })

  //     // causes the element to be always at the top of the view.
  //     if (scrollToView && treeViewItem)
  //       treeViewItem.titleElement.scrollIntoView({
  //         behavior: 'auto',
  //         block: 'nearest',
  //         inline: 'nearest'
  //       })
  //   })
  // }
}

// customElements.define('tree-item-view', TreeItemView)
customElements.define('zea-tree-view', ZeaTreeView)
