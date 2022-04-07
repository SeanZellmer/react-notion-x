import React from 'react'

import { useHotkeys } from 'react-hotkeys-hook'
import { getPageBreadcrumbs } from 'notion-utils'
import * as types from 'notion-types'

import { useNotionContext } from '../context'
import { PageIcon } from './page-icon'
import { SearchIcon } from '../icons/search-icon'
import { cs } from '../utils'
import { SearchDialog } from './search-dialog'
import { SearchNotionFn } from '../types'

export const Header: React.FC<{
  block: types.CollectionViewPageBlock | types.PageBlock
}> = ({ block }) => {
  return (
    <header className='notion-header'>
      <div className='notion-nav-header'>
        <Breadcrumbs block={block} />
        <Search block={block} />
      </div>
    </header>
  )
}

export const Breadcrumbs: React.FC<{
  block: types.Block
  rootOnly?: boolean
}> = ({ block, rootOnly = false }) => {
  const { recordMap, mapPageUrl, components } = useNotionContext()

  const breadcrumbs = React.useMemo(() => {
    const breadcrumbs = getPageBreadcrumbs(recordMap, block.id)
    if (rootOnly) {
      return [breadcrumbs[0]]
    }

    return breadcrumbs
  }, [recordMap, block.id, rootOnly])

  return (
    <div className='breadcrumbs' key='breadcrumbs'>
      {breadcrumbs.map((breadcrumb, index: number) => {
        const pageLinkProps: any = {}
        const componentMap = {
          pageLink: components.PageLink
        }

        if (breadcrumb.active) {
          componentMap.pageLink = (props) => <div {...props} />
        } else {
          pageLinkProps.href = mapPageUrl(breadcrumb.pageId)
        }

        return (
          <React.Fragment key={breadcrumb.pageId}>
            <componentMap.pageLink
              className={cs('breadcrumb', breadcrumb.active && 'active')}
              {...pageLinkProps}
            >
              {breadcrumb.icon && (
                <PageIcon className='icon' block={breadcrumb.block} />
              )}

              {breadcrumb.title && (
                <span className='title'>{breadcrumb.title}</span>
              )}
            </componentMap.pageLink>

            {index < breadcrumbs.length - 1 && (
              <span className='spacer'>/</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export const Search: React.FC<{
  block: types.Block
  search?: SearchNotionFn
}> = ({ block, search }) => {
  const { searchNotion, rootPageId } = useNotionContext()
  const onSearchNotion = search || searchNotion

  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const onOpenSearch = React.useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const onCloseSearch = React.useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  useHotkeys('cmd+p', (event) => {
    onOpenSearch()
    event.preventDefault()
    event.stopPropagation()
  })

  useHotkeys('cmd+k', (event) => {
    onOpenSearch()
    event.preventDefault()
    event.stopPropagation()
  })

  const hasSearch = !!onSearchNotion

  return (
    <>
      <div className='rhs'>
        {hasSearch && (
          <div
            role='button'
            className={cs('breadcrumb', 'button', 'notion-search-button')}
            onClick={onOpenSearch}
          >
            <SearchIcon className='searchIcon' />

            <span className='title'>Search</span>
          </div>
        )}
      </div>

      {isSearchOpen && hasSearch && (
        <SearchDialog
          isOpen={isSearchOpen}
          rootBlockId={rootPageId || block?.id}
          onClose={onCloseSearch}
          searchNotion={onSearchNotion}
        />
      )}
    </>
  )
}
