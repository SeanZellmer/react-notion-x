import PQueue from 'p-queue'

import { ExtendedRecordMap, PageMap } from 'notion-types'
import { parsePageId } from './parse-page-id'

/**
 * Performs a traversal over a given Notion workspace starting from a seed page.
 *
 * Returns a map containing all of the pages that are reachable from the seed
 * page in the space.
 *
 * @param rootPageId - Page ID to start from.
 * @param rootSpaceId - Space ID to scope traversal.
 * @param getPage - Function used to fetch a single page.
 * @param opts - Optional config
 */
export async function getAllPagesInSpace(
  rootPageId: string,
  rootSpaceId: string,
  getPage: (pageId: string) => Promise<ExtendedRecordMap>,
  {
    concurrency = 4,
    traverseCollections = true
  }: {
    concurrency?: number
    traverseCollections?: boolean
  } = {}
): Promise<PageMap> {
  const pages: PageMap = {}
  const pendingPageIds = new Set<string>()
  const queue = new PQueue({ concurrency })

  async function processPage(pageId: string) {
    pageId = parsePageId(pageId) as string

    if (pageId && !pages[pageId] && !pendingPageIds.has(pageId)) {
      pendingPageIds.add(pageId)

      queue.add(async () => {
        try {
          const page = await getPage(pageId)

          Object.keys(page.block)
            .filter((key) => {
              const block = page.block[key]?.value
              if (!block) return

              const isPage =
                block.type === 'page' || block.type === 'collection_view_page'

              // the space id check is important to limit traversal because pages
              // can reference pages in other spaces
              return isPage && block.space_id === rootSpaceId
            })
            .forEach((subPageId) => processPage(subPageId))

          // traverse collection item pages as they may contain subpages as well
          if (traverseCollections) {
            for (const collectionViews of Object.values(
              page.collection_query
            )) {
              for (const collectionData of Object.values(collectionViews)) {
                const { blockIds } = collectionData

                if (blockIds) {
                  for (const collectionItemId of blockIds) {
                    processPage(collectionItemId)
                  }
                }
              }
            }
          }

          pages[pageId] = page
        } catch (err) {
          console.warn('page load error', { pageId, spaceId: rootSpaceId }, err)
          pages[pageId] = null
        }

        pendingPageIds.delete(pageId)
      })
    }
  }

  await processPage(rootPageId)
  await queue.onIdle()

  return pages
}
