import { Block, BlockMap } from 'notion-types'
import isUrl from 'is-url-superb'

// https://s3-us-west-2.amazonaws.com/secure.notion-static.com/2531b0be-14aa-4667-9e49-1e3b66564e52/notion-ts.png
// https://s3.us-west-2.amazonaws.com/secure.notion-static.com/2531b0be-14aa-4667-9e49-1e3b66564e52/notion-ts.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220403%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220403T152006Z&X-Amz-Expires=3600&X-Amz-Signature=b9be057385554b5b371f1b472b1943eec8a58b55545b7c2a183609f964250c36&X-Amz-SignedHeaders=host&x-id=GetObject

export const defaultMapImageUrl = (url: string, block: Block) => {
  if (!url) {
    return null
  }

  if (url.startsWith('data:')) {
    return url
  }

  // more recent versions of notion don't proxy unsplash images
  if (url.startsWith('https://images.unsplash.com')) {
    return url
  }

  try {
    const u = new URL(url)

    if (
      u.pathname.startsWith('/secure.notion-static.com') &&
      u.hostname.endsWith('.amazonaws.com')
    ) {
      if (
        u.searchParams.has('X-Amz-Credential') &&
        u.searchParams.has('X-Amz-Signature') &&
        u.searchParams.has('X-Amz-Algorithm')
      ) {
        // if the URL is already signed, then use it as-is
        return url
      }
    }
  } catch {
    // ignore invalid urls
  }

  if (url.startsWith('/images')) {
    url = `https://www.notion.so${url}`
  }

  url = `https://www.notion.so${
    url.startsWith('/image') ? url : `/image/${encodeURIComponent(url)}`
  }`

  const notionImageUrlV2 = new URL(url)
  let table = block.parent_table === 'space' ? 'block' : block.parent_table
  if (table === 'collection') {
    table = 'block'
  }
  notionImageUrlV2.searchParams.set('table', table)
  notionImageUrlV2.searchParams.set('id', block.id)
  notionImageUrlV2.searchParams.set('cache', 'v2')

  url = notionImageUrlV2.toString()

  return url
}

export const defaultMapPageUrl = (rootPageId?: string) => (pageId: string) => {
  pageId = (pageId || '').replace(/-/g, '')

  if (rootPageId && pageId === rootPageId) {
    return '/'
  } else {
    return `/${pageId}`
  }
}

export const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')

const groupBlockContent = (blockMap: BlockMap): string[][] => {
  const output: string[][] = []

  let lastType: string | undefined = undefined
  let index = -1

  Object.keys(blockMap).forEach((id) => {
    const blockValue = blockMap[id]?.value

    if (blockValue) {
      blockValue.content?.forEach((blockId) => {
        const blockType = blockMap[blockId]?.value?.type

        if (blockType && blockType !== lastType) {
          index++
          lastType = blockType
          output[index] = []
        }

        if (index > -1) {
          output[index].push(blockId)
        }
      })
    }

    lastType = undefined
  })

  return output
}

export const getListNumber = (blockId: string, blockMap: BlockMap) => {
  const groups = groupBlockContent(blockMap)
  const group = groups.find((g) => g.includes(blockId))

  if (!group) {
    return
  }

  return group.indexOf(blockId) + 1
}

export const getHashFragmentValue = (url: string) => {
  return url.includes('#') ? url.replace(/^.+(#.+)$/, '$1') : ''
}

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export const formatDate = (input: string) => {
  const date = new Date(input)
  const month = date.getMonth()
  return `${months[month]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

export const isBrowser = typeof window !== 'undefined'

export { isUrl }

const youtubeDomains = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
])

export const getYoutubeId = (url: string): string | null => {
  try {
    const { hostname } = new URL(url)
    if (!youtubeDomains.has(hostname)) {
      return null
    }
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/i

    const match = url.match(regExp)
    if (match && match[2].length == 11) {
      return match[2]
    }
  } catch {
    // ignore invalid urls
  }

  return null
}
