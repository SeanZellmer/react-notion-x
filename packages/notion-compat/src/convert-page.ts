import * as notion from 'notion-types'
import * as types from './types'

import { convertBlock } from './convert-block'

export function convertPage({
  pageId,
  blockMap,
  blockChildrenMap,
  pageMap,
  parentMap
}: {
  pageId: string
  blockMap: types.BlockMap
  blockChildrenMap: types.BlockChildrenMap
  pageMap: types.PageMap
  parentMap: types.ParentMap
}): notion.ExtendedRecordMap {
  const compatBlocks = Object.values(blockMap).map((block) =>
    convertBlock({
      block,
      children: blockChildrenMap[block.id],
      pageMap,
      blockMap,
      parentMap
    })
  )

  const partialPage = pageMap[pageId]
  const page = partialPage as types.Page

  const compatPageBlock = convertBlock({
    block: { ...page, type: 'child_page' } as unknown as types.Block,
    children: blockChildrenMap[page.id],
    pageMap,
    blockMap,
    parentMap
  })

  const compatBlockMap = [compatPageBlock, ...compatBlocks].reduce(
    (blockMap, block) => ({
      ...blockMap,
      [block.id]: {
        type: 'reader',
        value: block
      }
    }),
    {}
  )

  return {
    block: compatBlockMap,
    collection: {},
    collection_view: {},
    collection_query: {},
    signed_urls: {},
    notion_user: {}
  }
}
