import { TreeItem, InstanceItem } from '@zeainc/zea-engine'
import { SelectionManager } from '@zeainc/zea-ux'

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
  private rootTreeItem: TreeItem | null = null
  private selectionManager: SelectionManager | null = null
  private $styleTag = document.createElement('style')
  private $tableWrapper = document.createElement('div')
  private $tbody = document.createElement('tbody')

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
    $mainWrapper.className = 'ZeaTreeView'
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

      if (event.key === 'Escape') {
        this.rootTreeItem?.removeHighlight('selected', true)
      }
    })
    $searchWrapper.appendChild($inputSearch)

    // Table wrapper.
    this.$tableWrapper.className = 'table-wrapper'
    $mainWrapper.appendChild(this.$tableWrapper)
  }

  /**
   * Set tree item.
   * @param {object} treeItem - Tree item.
   * @param {object} appData - App data.
   */
  setTreeItem(treeItem: TreeItem) {
    this.rootTreeItem = treeItem

    this.renderTable()
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

      items.forEach((item: TreeItem) => {
        this.expandAncestorsOf(item)
      })

      this.renderTable()
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

      .search-wrapper {
        padding: 0.2rem;
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

      th {
        background-color: var(--zea-tree-header-color, gray)
      }

      th, td {
        border-right: 1px solid var(--zea-tree-border-color, darkgray);
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
  private isItemExpanded(item: TreeItem | null): boolean {
    if (!item) {
      return false
    }

    const itemId = item.getId()

    if (this.expandedItemsTracker[itemId]) {
      return this.expandedItemsTracker[itemId]
    }

    this.expandedItemsTracker[itemId] = false

    return false
  }

  /**
   * Toggle an item's expanded or collapsed state.
   */
  private toggleItemExpanded(item: TreeItem | null): void {
    if (!item) {
      return
    }

    const itemId = item.getId()
    const isExpanded = this.isItemExpanded(item)
    this.expandedItemsTracker[itemId] = !isExpanded

    this.renderTable()
  }

  /**
   * Toggle an item's visibility.
   */
  private setVisibilityOf(item: TreeItem | null, isVisible: boolean): void {
    if (!item) {
      return
    }

    item.getParameter('Visible')?.setValue(isVisible)

    const children = this.childrenOfItem(item)

    children.forEach((child) => {
      this.setVisibilityOf(child, isVisible)
    })
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
   * Set the current selected item.
   */
  private setSelection = (treeItem: TreeItem | null, replace = true): void => {
    if (!treeItem) {
      return
    }

    if (!this.selectionManager) {
      return
    }

    if (this.selectionManager.pickingModeActive()) {
      this.selectionManager.pick(treeItem)

      return
    }

    this.selectionManager.toggleItemSelection(treeItem, replace)

    this.renderTable()
  }

  /**
   * Render visible items.
   *
   * A visible item is an item whose parent is expanded.
   * The root item is visible by default.
   */
  private renderVisibleItems(treeItem = this.rootTreeItem, level = 0) {
    const $row = document.createElement('tr')
    $row.addEventListener('click', (event) => {
      const shouldNotReplace = event.ctrlKey || event.metaKey
      this.setSelection(treeItem, !shouldNotReplace)
    })
    const isHilighted = treeItem?.isHighlighted()
    if (isHilighted) {
      const backgroundColor = treeItem?.getHighlight()
      $row.style.backgroundColor = backgroundColor?.toHex() || '#ffff00'
      $row.style.color = 'black'
    }

    this.$tbody.appendChild($row)

    const children = this.childrenOfItem(treeItem)

    const isExpanded = this.isItemExpanded(treeItem)
    const hasChildren = children.length

    const $toggleExpanded = document.createElement('button')
    $toggleExpanded.classList.add('toggle-expanded')
    if (!hasChildren) {
      $toggleExpanded.classList.add('invisible')
    }
    $toggleExpanded.textContent = isExpanded ? '-' : '+'
    $toggleExpanded.style.marginLeft = `${level * 10}px`
    $toggleExpanded.addEventListener('click', (event) => {
      event.stopPropagation()
      this.toggleItemExpanded(treeItem)
    })

    const $toggleVisible = document.createElement('input')
    $toggleVisible.classList.add('toggle-visible')
    $toggleVisible.type = 'checkbox'
    const isVisible = treeItem?.isVisible() || false
    $toggleVisible.checked = isVisible
    $toggleVisible.addEventListener('click', (event) => {
      event.stopPropagation()
      this.setVisibilityOf(treeItem, !isVisible)
      this.renderTable()
    })

    const $cellForName = document.createElement('td')
    $cellForName.appendChild($toggleExpanded)
    $cellForName.appendChild($toggleVisible)
    const $name = document.createTextNode(this.nameOfItem(treeItem))
    $cellForName.appendChild($name)
    $row.appendChild($cellForName)

    this.columns.forEach((column) => {
      const { paramName } = column

      const $cell = document.createElement('td')
      $row.appendChild($cell)

      if (treeItem?.hasParameter(paramName)) {
        $cell.textContent = treeItem.getParameter(paramName)?.getValue()
      }
    })

    treeItem?.on('childAdded', () => {
      this.renderTable()
    })

    treeItem?.on('childRemoved', () => {
      this.renderTable()
    })

    if (!isExpanded) {
      return
    }

    const nextLevel = level + 1

    children.forEach((child) => {
      if (this.shouldRenderItem(child)) {
        this.renderVisibleItems(child, nextLevel)
      }
    })
  }

  /**
   * Determine whether an item should be rendered.
   */
  private shouldRenderItem(item: TreeItem): boolean {
    const retval = item instanceof TreeItem && item.isSelectable()

    return retval
  }

  /**
   * Get an item's children.
   */
  private childrenOfItem(parent: TreeItem | null): TreeItem[] {
    if (!parent) {
      throw new Error('Missing parent.')
    }

    const retval =
      parent instanceof InstanceItem && parent.getNumChildren() === 1
        ? parent.getChild(0).getChildren()
        : parent.getChildren()

    return retval
  }

  /**
   * Get an item's name.
   */
  private nameOfItem(item: TreeItem | null): string {
    if (!item) {
      throw new Error('Missing item.')
    }

    const displayNameParam = item.getParameter('DisplayName')

    if (displayNameParam) {
      return displayNameParam.getValue()
    }

    return item.getName()
  }

  /**
   * Expand and item's ancestors.
   */
  private expandAncestorsOf(item: TreeItem): void {
    const parent = item.getParentItem()

    if (!parent) {
      return
    }

    const parentId = parent.getId()
    this.expandedItemsTracker[parentId] = true
    this.expandAncestorsOf(parent)
  }

  /**
   * Perform search.
   */
  private search(value: string): void {
    const lowerCaseValue = value.toLowerCase()

    this.rootTreeItem?.removeHighlight('selected', true)

    this.expandedItemsTracker = {}

    const searchWithin = (parent: TreeItem | null) => {
      if (!parent) {
        return
      }

      const parentName = this.nameOfItem(parent)

      if (parentName.toLowerCase().includes(lowerCaseValue)) {
        this.setSelection(parent, false)
        this.expandAncestorsOf(parent)
      }

      const children = this.childrenOfItem(parent)

      children.forEach((child) => {
        searchWithin(child)
      })
    }

    searchWithin(this.rootTreeItem)

    this.renderTable()
  }
}

customElements.define('zea-tree-view', ZeaTreeView)

export { ZeaTreeView }
