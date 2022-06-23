import {
  TreeItem,
  InstanceItem,
  VisibilityChangedEvent,
} from '@zeainc/zea-engine'
import {
  SelectionManager,
  UndoRedoManager,
  ParameterValueChange,
} from '@zeainc/zea-ux'

interface Column {
  title: string
  paramName: string
}

interface Row {
  treeItem: TreeItem
  element: HTMLTableRowElement
  listenerIds: Record<string, number>
  expandedSubtreeCount: number
  expandChildren?: () => void
  collapseChildren?: () => void
}

/**
 * Scene tree view.
 */
class ZeaTreeView extends HTMLElement {
  private columns: Column[] = []
  private rootTreeItem!: TreeItem
  private selectionManager: SelectionManager | null = null
  private isSearching = false
  // private isTheFirstRender = true
  private $styleTag = document.createElement('style')
  private $tableWrapper = document.createElement('div')
  private $thead = document.createElement('thead')
  private $tbody = document.createElement('tbody')

  private expandedItemsTracker: Map<TreeItem, boolean> = new Map()
  private rows: Map<TreeItem, Row> = new Map()

  // This property enables specifying a custom CSS file that will be loaded
  // into the context of the WebComponent, supporting rich styles.
  public customCSSFile = ''

  /**
   * Constructor.
   */
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    this.shadowRoot?.appendChild(this.$styleTag)

    // Main wrapper.
    const $mainWrapper = document.createElement('div')
    $mainWrapper.className = 'MainWrapper'
    this.shadowRoot?.appendChild($mainWrapper)

    $mainWrapper.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'f') {
        // scroll into view so we can see it.
        this.scrollSelectionIntoView()
      }
    })

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
    this.setStyles()

    this.rootTreeItem = treeItem

    this.expandedItemsTracker = new Map()

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
      const selection: Set<TreeItem> = event.selection

      if (!this.isSearching) {
        selection.forEach((treeItem: TreeItem) => {
          this.expandAncestorsOf(treeItem)
        })
      }
      this.scrollSelectionIntoView()
    })
  }

  private scrollSelectionIntoView() {
    if (this.selectionManager) {
      const selection = this.selectionManager.getSelection()
      if (selection.size > 0) {
        const treeItem = Array.from(selection)[0]
        const $tr = this.rows.get(treeItem)?.element
        if ($tr) {
          $tr.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
        }
      }
    }
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
      ${this.customCSSFile != '' ? `@import "${this.customCSSFile}";` : ''}
      .MainWrapper {
        --search-wrapper-height: 35px;

        height: 100%;
      }

      .invisible {
        visibility: hidden;
      }

      .toggle-expanded,
      .toggle-collapsed {
        background: none;
        border: none;
        color: var(--zea-tree-button-text-color, black);
        height: 20px;
        width: 20px;
        padding: 0px;
      }

      .toggle-expanded:hover,
      .toggle-collapsed:hover {
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

      th:not(:last-child), td:not(:last-child) {
        border-right: 1px solid var(--zea-tree-border-color, darkgray);
      }

      tbody {
        white-space: nowrap;
      }

      .CellForName {
        display: flex;
        align-items: center;
      }

      tr {
        background-color: var(--zea-tree-even-row-bg-color, gray);
        outline-offset: -1px;
      }

      tr:nth-child(odd) {
        background-color: var(--zea-tree-odd-row-bg-color, dimgray);
      }

      .arrowDown {
        transform: rotate(90deg);
      }
    `
  }

  /**
   * Toggle an item's visibility.
   */
  private static setVisibilityOf(item: TreeItem, isVisible: boolean): void {
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
  private selectItem(treeItem: TreeItem, shouldReplace = true): void {
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
  private addRow(treeItem: TreeItem, parentItemRow?: Row): void {
    const $tr = document.createElement('tr')
    const row: Row = {
      element: $tr,
      treeItem,
      listenerIds: {},
      expandedSubtreeCount: 0,
    }
    this.rows.set(treeItem, row)

    $tr.title = this.getTooltipFor(treeItem)
    $tr.tabIndex = 0
    if (!this.expandedItemsTracker.has(treeItem))
      this.expandedItemsTracker.set(treeItem, false)

    $tr.addEventListener('click', (event) => {
      const shouldReplace = !event.ctrlKey && !event.metaKey
      this.selectItem(treeItem, shouldReplace)
    })

    $tr.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          const previousSibling = <HTMLTableRowElement>$tr.previousSibling

          if (!previousSibling) {
            return
          }

          previousSibling.focus()
          // @ts-ignore
          this.selectItem(previousSibling?.treeItem)
          break
        case 'ArrowDown':
          event.preventDefault()
          const nextSibling = <HTMLTableRowElement>$tr.nextSibling

          if (!nextSibling) {
            return
          }

          nextSibling.focus()
          // @ts-ignore
          this.selectItem(nextSibling.treeItem)
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

    if (parentItemRow) {
      // const parentItem = parentItemRow.treeItem!
      // const parentRow = this.rows.get(parentItem)!
      // Insert this row at the index provided
      let step = 0
      let $sibling = parentItemRow.element
      while (step < parentItemRow.expandedSubtreeCount) {
        $sibling = <HTMLTableRowElement>$sibling.nextSibling
        step += 1
      }
      this.insertAfter($sibling, $tr)

      parentItemRow.expandedSubtreeCount++
    } else {
      this.$tbody.appendChild($tr)
    }

    const children = this.childrenOf(treeItem)

    const isExpanded = this.isSearching
      ? false
      : this.expandedItemsTracker.get(treeItem)
    const hasChildren = children.length

    const $toggleExpanded = document.createElement('button')
    // https://heroicons.com
    $toggleExpanded.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
      </svg>
    `
    $toggleExpanded.classList.add('toggle-expanded')

    if (isExpanded) $toggleExpanded.classList.add('arrowDown')
    if (this.isSearching || !hasChildren) {
      $toggleExpanded.classList.add('invisible')
    }

    const level = treeItem.getPath().length - 1
    $toggleExpanded.style.marginLeft = `${level * 10}px`
    $toggleExpanded.addEventListener('click', (event) => {
      event.stopPropagation()
      if (!this.expandedItemsTracker.get(treeItem)) {
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
      ZeaTreeView.setVisibilityOf(treeItem, !treeItem.visibleParam.value)
    })
    if (!treeItem.isVisible()) $tr.classList.add('invisible-item')

    const $cellForName = document.createElement('td')
    $cellForName.classList.add('CellForName')
    $cellForName.appendChild($toggleExpanded)
    $cellForName.appendChild($toggleVisible)
    const $name = document.createElement('span')
    $name.textContent = this.nameOf(treeItem)
    $cellForName.appendChild($name)
    $tr.appendChild($cellForName)

    this.columns.forEach((column) => {
      const { paramName } = column

      const $cell = document.createElement('td')
      $tr.appendChild($cell)

      if (treeItem.hasParameter(paramName)) {
        $cell.textContent = treeItem.getParameter(paramName)?.getValue()
      }
    })

    row.listenerIds['nameChanged'] = treeItem.on(
      'nameChanged',
      (event: any) => {
        // @ts-ignore
        $name.textContent = event.newName
      }
    )

    row.listenerIds['highlightChanged'] = treeItem.on(
      'highlightChanged',
      () => {
        setHighlight()
      }
    )

    row.listenerIds['visibilityChanged'] = treeItem.on(
      'visibilityChanged',
      (event: VisibilityChangedEvent) => {
        if (event.visible) $tr.classList.remove('invisible-item')
        else $tr.classList.add('invisible-item')
      }
    )

    row.listenerIds['childAdded'] = treeItem.on(
      'childAdded',
      (event: object) => {
        const isExpanded = this.expandedItemsTracker.get(treeItem)
        if (isExpanded) {
          // @ts-ignore
          const index = event.index
          // @ts-ignore
          const childItem = event.childItem
          this.addRow(childItem, row)
        } else {
          $toggleExpanded.classList.remove('invisible')
        }
      }
    )

    row.listenerIds['childRemoved'] = treeItem.on(
      'childRemoved',
      (event: object) => {
        const isExpanded = this.expandedItemsTracker.get(treeItem)
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
        $tr.style.setProperty('outline', `1px solid ${backgroundColor.toHex()}`)
        return
      }

      $tr.style.removeProperty('outline')
    }

    const isHighlighted = treeItem.isHighlighted()
    if (isHighlighted) {
      setHighlight()
    }

    const expandChildren = () => {
      this.expandedItemsTracker.set(treeItem, true)
      $toggleExpanded.classList.add('arrowDown')

      const children = this.childrenOf(treeItem)
      for (let i = 0; i < children.length; i += 1) {
        const child = children[i]

        if (this.shouldRenderItem(child)) {
          this.addRow(child, row)

          const childRow = this.rows.get(child)!
          row.expandedSubtreeCount += childRow.expandedSubtreeCount
        }
      }
    }

    const collapseChildren = () => {
      this.expandedItemsTracker.set(treeItem, false)
      $toggleExpanded.classList.remove('arrowDown')
      const children = this.childrenOf(treeItem)
      children.forEach((child) => {
        if (this.shouldRenderItem(child)) {
          this.removeRow(child)
        }
      })
      row.expandedSubtreeCount = 0
    }

    row.expandChildren = expandChildren

    if (isExpanded) {
      expandChildren()
    }
  }

  removeRow(treeItem: TreeItem) {
    const row = this.rows.get(treeItem)
    if (!row) return

    const $tr = row.element
    $tr.parentElement?.removeChild($tr)

    treeItem.removeListenerById('nameChanged', row.listenerIds['nameChanged'])
    treeItem.removeListenerById(
      'highlightChanged',
      row.listenerIds['highlightChanged']
    )
    treeItem.removeListenerById(
      'visibilityChanged',
      row.listenerIds['visibilityChanged']
    )
    treeItem.removeListenerById('childAdded', row.listenerIds['childAdded'])
    treeItem.removeListenerById('childRemoved', row.listenerIds['childRemoved'])

    const children = this.childrenOf(treeItem)
    children.forEach((child) => {
      if (this.shouldRenderItem(child)) {
        this.removeRow(child)
      }
    })
    this.rows.delete(treeItem)
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
   * Get an item's parent.
   */
  private parentOf(treeItem: TreeItem): TreeItem | undefined {
    // An item is skipped in the tree view if it is an the child of an instanceItem
    // An instance and its first child are represented as a single node in the tree.
    const parentItem = treeItem.getParentItem()
    if (parentItem) {
      const parentParentItem = parentItem.getParentItem()
      if (
        parentParentItem instanceof InstanceItem &&
        parentParentItem.getNumChildren() === 1
      )
        return parentParentItem ? parentParentItem : parentItem
    }
    return parentItem
  }

  /**
   * Get an item's children.
   */
  private childrenOf(treeItem: TreeItem): TreeItem[] {
    // An item is skipped in the tree view if it is an the child of an instanceItem
    // An instance and its first child are represented as a single node in the tree.
    return treeItem instanceof InstanceItem && treeItem.getNumChildren() === 1
      ? treeItem.getChild(0).getChildren()
      : treeItem.getChildren()
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
    const parent = this.parentOf(treeItem)

    if (!parent) {
      return
    }

    // Keep looking up till we find a treeItem that has a row.
    if (!this.rows.get(parent)) {
      this.expandAncestorsOf(parent)
    }

    const parentRow = this.rows.get(parent)
    if (!parentRow) {
      return
    }

    const parentIsExpanded = this.expandedItemsTracker.get(parent)
    if (parentIsExpanded) {
      return
    }

    parentRow.expandChildren!()
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

    searchResults.forEach((treeItem) => {
      this.addRow(treeItem)
    })
  }

  /**
   * Perform search.
   */
  private clearSearch(): void {
    this.isSearching = false

    this.resetRows()

    this.addRow(this.rootTreeItem)

    // At the end of the search, scroll to see what we may have
    // selected during the search.
    if (this.selectionManager) {
      this.scrollSelectionIntoView()
    }
  }

  resetRows(): void {
    this.rows.forEach((row) => {
      this.removeRow(row.treeItem)
    })
  }

  insertAfter(referenceNode: HTMLTableRowElement, newNode: HTMLElement) {
    referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling)
  }
}

customElements.define('zea-tree-view', ZeaTreeView)

export { ZeaTreeView }
