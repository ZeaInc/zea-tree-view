import {
  TreeItem,
  InstanceItem,
  VisibilityChangedEvent,
} from '@zeainc/zea-engine'
// import type { ChildAddedEvent } from '@zeainc/zea-engine'
import {
  SelectionManager,
  UndoRedoManager,
  ParameterValueChange,
} from '@zeainc/zea-ux'

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
  private selectionManager: SelectionManager | null = null
  private isSearching = false
  // private isTheFirstRender = true
  private $styleTag = document.createElement('style')
  private $tableWrapper = document.createElement('div')
  private $thead = document.createElement('thead')
  private $tbody = document.createElement('tbody')

  private listenerIds: Record<number, Record<string, number>> = {}
  private rows: Record<number, HTMLTableRowElement> = {}

  /**
   * Constructor.
   */
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    this.shadowRoot?.appendChild(this.$styleTag)
    this.setStyles()

    // Main wrapper.
    const $mainWrapper = document.createElement('div')
    $mainWrapper.className = 'MainWrapper'
    this.shadowRoot?.appendChild($mainWrapper)

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
    })
    $inputSearch.addEventListener('input', () => {
      const isEmpty = $inputSearch.value === ''

      if (isEmpty) {
        this.clearSearch()
      }
    })
    $searchWrapper.appendChild($inputSearch)

    // Table wrapper.
    this.$tableWrapper.className = 'table-wrapper'
    $mainWrapper.appendChild(this.$tableWrapper)
    this.renderTable()
  }

  /**
   * Set tree item.
   * @param {object} treeItem - Tree item.
   * @param {object} appData - App data.
   */
  setTreeItem(treeItem: TreeItem) {
    this.rootTreeItem = treeItem

    this.expandedItemsTracker = {}

    this.resetRows()

    this.addRow(this.rootTreeItem)
  }

  /**
   * Has a tree item been set?
   */
  hasTreeItem(): boolean {
    return this.rootTreeItem ? true : false
  }

  /**
   * Set selection manager.
   */
  setSelectionManager(selectionManager: SelectionManager) {
    this.selectionManager = selectionManager

    this.selectionManager.on('selectionChanged', (event) => {
      const { selection: items } = event

      if (this.isSearching) {
        return
      }

      items.forEach((treeItem: TreeItem) => {
        this.expandAncestorsOf(treeItem)
      })
    })
  }

  /**
   * Set the table's columns.
   */
  setColumns(columns: Column[]) {
    this.columns = columns
    this.renderTable()
  }

  /**
   * Set styles.
   */
  private setStyles(): void {
    this.$styleTag.textContent = `
      .MainWrapper {
        --search-wrapper-height: 35px;

        height: 100%;
      }

      .invisible {
        visibility: hidden;
      }

      .toggle-expanded {
        background: none;
        border: none;
        color: var(--zea-tree-button-text-color, black);
        width: 20px;
      }

      .toggle-expanded:hover {
        background-color: var(--zea-tree-button-bg-color, silver);
        border-radius: 2px;
      }

      .toggle-visible {
        margin: 0 5px;
      }
      .invisible-item {
        color: darkgrey;
      }

      .search-wrapper {
        box-sizing: border-box;
        display: flex;
        height: var(--search-wrapper-height);
        padding: 0.2rem;
      }

      .table-wrapper {
        height: calc(100% - var(--search-wrapper-height));
        overflow: auto;
      }

      .search {
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

      thead {
        position: sticky;
        top: -1px;
      }

      th {
        background-color: var(--zea-tree-header-color, gray)
      }

      th, td {
        border-right: 1px solid var(--zea-tree-border-color, darkgray);
      }

      tbody {
        white-space: nowrap;
      }

      tr {
        background-color: var(--zea-tree-even-row-bg-color, gray);
      }

      tr:nth-child(odd) {
        background-color: var(--zea-tree-odd-row-bg-color, dimgray);
      }
    `
  }

  /**
   * Check whether an item is expanded.
   */
  private isItemExpanded(item: TreeItem): boolean {
    const itemId = item.getId()

    if (itemId in this.expandedItemsTracker) {
      return this.expandedItemsTracker[itemId]
    }

    this.expandedItemsTracker[itemId] = false

    return false
  }

  /**
   * Toggle an item's expanded or collapsed state.
   */
  private toggleItemExpanded(item: TreeItem): boolean {
    const itemId = item.getId()
    const isExpanded = !this.isItemExpanded(item)
    this.expandedItemsTracker[itemId] = isExpanded
    return isExpanded
  }

  /**
   * Toggle an item's visibility.
   */
  private setVisibilityOf(item: TreeItem, isVisible: boolean): void {
    try {
      const undoRedoManager = UndoRedoManager.getInstance()

      const change = new ParameterValueChange(item.visibleParam, isVisible)
      undoRedoManager.addChange(change)
    } catch (error) {
      item.visibleParam.value = isVisible
    }
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
      .map((column) => `<th>${column.title}</th>`)
      .join('')

    // @ts-ignore
    this.$thead.replaceChildren()

    $table.appendChild(this.$thead)
    const $headerRow: HTMLTableRowElement = document.createElement('tr')
    this.$thead.appendChild($headerRow)
    $headerRow.innerHTML = `
      <th>Name</th>
      ${columnsHeaders}
    `

    this.$tbody = document.createElement('tbody')
    $table.appendChild(this.$tbody)
  }

  /**
   * Set the current selected item.
   */
  private setSelection(treeItem: TreeItem, shouldReplace = true): void {
    if (!this.selectionManager) {
      return
    }

    if (this.selectionManager.pickingModeActive()) {
      this.selectionManager.pick(treeItem)
      return
    }

    this.selectionManager.toggleItemSelection(treeItem, shouldReplace)
  }

  /**
   * Add row.
   */
  private addRow(
    treeItem: TreeItem,
    index: number = -1,
    $parentItemRow?: HTMLTableRowElement
  ): void {
    const $row = document.createElement('tr')
    // @ts-ignore
    $row.treeItem = treeItem
    $row.title = this.getTooltipFor(treeItem)
    $row.tabIndex = 0

    $row.addEventListener('click', (event) => {
      const shouldReplace = !event.ctrlKey && !event.metaKey
      this.setSelection(treeItem, shouldReplace)
    })

    $row.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          const previousSibling = <HTMLTableRowElement>$row.previousSibling

          if (!previousSibling) {
            return
          }

          previousSibling.focus()
          // @ts-ignore
          this.setSelection(previousSibling?.treeItem)
          break
        case 'ArrowDown':
          event.preventDefault()
          const nextSibling = <HTMLTableRowElement>$row.nextSibling

          if (!nextSibling) {
            return
          }

          nextSibling.focus()
          // @ts-ignore
          this.setSelection(nextSibling.treeItem)
          break
        case 'ArrowRight':
          event.preventDefault()
          expandChildren()
          break
        case 'ArrowLeft':
          event.preventDefault()
          collapseChildren()
          break
      }
    })

    if ($parentItemRow) {
      if (index >= 0) {
        // Insert this row at the index provided
        let step = 0
        let $sibling = $parentItemRow
        while (step < index) {
          $sibling = <HTMLTableRowElement>$sibling.nextSibling
          step += 1
        }
        this.insertAfter($sibling, $row)
      } else {
        this.insertAfter($parentItemRow, $row)
      }
    } else {
      this.$tbody.appendChild($row)
    }

    const children = this.childrenOf(treeItem)

    const isExpanded = !this.isSearching || this.isItemExpanded(treeItem)
    const hasChildren = children.length

    const $toggleExpanded = document.createElement('button')
    $toggleExpanded.classList.add('toggle-expanded')
    if (this.isSearching || !hasChildren) {
      $toggleExpanded.classList.add('invisible')
    }
    $toggleExpanded.textContent = isExpanded ? '-' : '+'
    const level = treeItem.getPath().length - 1
    $toggleExpanded.style.marginLeft = `${level * 10}px`
    $toggleExpanded.addEventListener('click', (event) => {
      event.stopPropagation()
      if (this.toggleItemExpanded(treeItem)) {
        expandChildren()
      } else {
        collapseChildren()
      }
    })

    const $toggleVisible = document.createElement('input')
    $toggleVisible.classList.add('toggle-visible')
    $toggleVisible.type = 'checkbox'

    $toggleVisible.checked = treeItem.visibleParam.value
    $toggleVisible.addEventListener('click', (event) => {
      event.stopPropagation()
      this.setVisibilityOf(treeItem, !treeItem.visibleParam.value)
    })
    if (!treeItem.isVisible()) $row.classList.add('invisible-item')

    const $cellForName = document.createElement('td')
    $cellForName.appendChild($toggleExpanded)
    $cellForName.appendChild($toggleVisible)
    const $name = document.createElement('span')
    $name.textContent = this.nameOf(treeItem)
    $cellForName.appendChild($name)
    $row.appendChild($cellForName)

    this.columns.forEach((column) => {
      const { paramName } = column

      const $cell = document.createElement('td')
      $row.appendChild($cell)

      if (treeItem.hasParameter(paramName)) {
        $cell.textContent = treeItem.getParameter(paramName)?.getValue()
      }
    })

    const listenerIds: Record<string, number> = {}
    this.listenerIds[treeItem.getId()] = listenerIds

    listenerIds['nameChanged'] = treeItem.on('nameChanged', (event: any) => {
      // @ts-ignore
      $name.textContent = event.newName
    })

    listenerIds['highlightChanged'] = treeItem.on('highlightChanged', () => {
      setHighlight()
    })


    listenerIds['visibilityChanged'] = treeItem.on(
      'visibilityChanged',
      (event: VisibilityChangedEvent) => {
        if (event.visible) $row.classList.remove('invisible-item')
        else $row.classList.add('invisible-item')
      }
    )

    listenerIds['childAdded'] = treeItem.on('childAdded', (event: object) => {
      const isExpanded = this.isItemExpanded(treeItem)
      if (isExpanded) {
        // @ts-ignore
        const index = event.index
        // @ts-ignore
        const childItem = event.childItem
        this.addRow(childItem, index, $row)
      } else {
        $toggleExpanded.classList.remove('invisible')
        $toggleExpanded.textContent = isExpanded ? '-' : '+'
      }
    })

    listenerIds['childRemoved'] = treeItem.on(
      'childRemoved',
      (event: object) => {
        const isExpanded = this.isItemExpanded(treeItem)
        if (isExpanded) {
          // @ts-ignore
          const index = event.index
          // @ts-ignore
          const childItem = event.childItem
          this.removeRow(childItem)
        }
      }
    )

    const setHighlight = () => {
      const backgroundColor = treeItem.getHighlight()

      if (backgroundColor) {
        $row.style.outline = `solid ${backgroundColor.toHex()}`
        return
      }

      $row.style.outline = 'none'
    }

    const isHighlighted = treeItem.isHighlighted()
    if (isHighlighted) {
      setHighlight()
    }

    const expandChildren = () => {
      const isExpanded = this.isItemExpanded(treeItem)

      if (!isExpanded) {
        return
      }

      for (let i = 0; i < children.length; i += 1) {
        const child = children[i]

        if (this.shouldRenderItem(child)) {
          this.addRow(child, i, $row)
        }
      }
    }

    const collapseChildren = () => {
      children.forEach((child) => {
        if (this.shouldRenderItem(child)) {
          this.removeRow(child)
        }
      })
    }

    // @ts-ignore
    $row.expandChildren = expandChildren

    this.rows[treeItem.getId()] = $row

    if (isExpanded) {
      expandChildren()
    }
  }

  removeRow(treeItem: TreeItem) {
    const $row = this.rows[treeItem.getId()]
    if (!$row) return

    delete this.rows[treeItem.getId()]
    $row.parentElement?.removeChild($row)

    const id = treeItem.getId()
    const listenerIds = this.listenerIds[id]
    delete this.listenerIds[id]

    treeItem.removeListenerById('nameChanged', listenerIds['nameChanged'])
    treeItem.removeListenerById(
      'highlightChanged',
      listenerIds['highlightChanged']
    )
    treeItem.removeListenerById(
      'visibilityChanged',
      listenerIds['visibilityChanged']
    )
    treeItem.removeListenerById('childAdded', listenerIds['childAdded'])
    treeItem.removeListenerById('childRemoved', listenerIds['childRemoved'])

    const children = this.childrenOf(treeItem)
    children.forEach((child) => {
      if (this.shouldRenderItem(child)) {
        this.removeRow(child)
      }
    })
  }

  /**
   * Determine whether an item should be rendered.
   */
  private shouldRenderItem(item: TreeItem): boolean {
    // const retval = item instanceof TreeItem && item.isSelectable()
    // FIXME
    const retval = item ? true : false

    return retval
  }

  /**
   * Get an item's children.
   */
  private childrenOf(treeItem: TreeItem): TreeItem[] {
    const retval =
      treeItem instanceof InstanceItem && treeItem.getNumChildren() === 1
        ? treeItem.getChild(0).getChildren()
        : treeItem.getChildren()

    return retval
  }

  /**
   * Get an item's name.
   */
  private nameOf(treeItem: TreeItem): string {
    let name

    const displayNameParam = treeItem.getParameter('DisplayName')

    if (displayNameParam) {
      name = displayNameParam.getValue()
    } else {
      name = treeItem.getName()
    }

    if (name == '') {
      if (treeItem instanceof InstanceItem && treeItem.getNumChildren() == 1) {
        const referenceItem = treeItem.getChild(0)
        const displayNameParam = referenceItem.getParameter('DisplayName')
        if (displayNameParam) {
          name = displayNameParam.getValue()
        } else {
          name = referenceItem.getName()
        }
      }
    }

    return name
  }

  private getTooltipFor(treeItem: TreeItem): string {
    if (treeItem instanceof InstanceItem && treeItem.getNumChildren() == 1) {
      const referenceItem = treeItem.getChild(0)

      return `Instance of (${referenceItem.getClassName()})`
    } else {
      return `(${treeItem.getClassName()})`
    }
  }

  /**
   * Expand and item's ancestors.
   */
  private expandAncestorsOf(treeItem: TreeItem): void {
    const parent = treeItem.getParentItem()

    if (!parent) {
      return
    }

    const parentIsExpanded = this.isItemExpanded(parent)

    if (parentIsExpanded) {
      return
    }

    const parentId = parent.getId()

    const $row = this.rows[parentId]

    if ($row) {
      // @ts-ignore
      $row.expandChildren()
    } else {
      this.expandedItemsTracker[parentId] = true
      this.expandAncestorsOf(parent)
    }
  }

  /**
   * Perform search.
   */
  private search(value: string): void {
    this.isSearching = true

    // Clear the rows, then add rows for each item
    this.resetRows()

    if (!this.rootTreeItem) return

    this.rootTreeItem.removeHighlight('selected', true)

    const searchResults: TreeItem[] = []

    const searchWithin = (treeItem: TreeItem) => {
      const treeItemName = this.nameOf(treeItem)

      const lowerCaseValue = value.toLowerCase()
      if (treeItemName.toLowerCase().includes(lowerCaseValue)) {
        searchResults.push(treeItem)
      }

      const children = this.childrenOf(treeItem)

      children.forEach((child) => {
        searchWithin(child)
      })
    }

    searchWithin(this.rootTreeItem)

    searchResults.forEach((treeItem, index) => {
      this.addRow(treeItem, index)
    })
  }

  /**
   * Perform search.
   */
  private clearSearch(): void {
    this.isSearching = false

    this.resetRows()

    this.addRow(this.rootTreeItem)
  }

  resetRows(): void {
    Object.values(this.rows).forEach((row) => {
      // @ts-ignore
      this.removeRow(row.treeItem)
    })
  }

  insertAfter(referenceNode: HTMLTableRowElement, newNode: HTMLElement) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling)
  }
}

customElements.define('zea-tree-view', ZeaTreeView)

export { ZeaTreeView }
