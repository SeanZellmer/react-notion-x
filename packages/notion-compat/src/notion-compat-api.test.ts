import test from 'ava'
import { Client } from '@notionhq/client'
import { NotionAPI } from 'notion-client'
import { promises as fs } from 'fs'

import { NotionCompatAPI } from './notion-compat-api'

test('TODO', async (t) => {
  // const pageId = '067dd719a912471ea9a3ac10710e7fdf'
  const pageId = 'de14421f13914ac7b528fa2e31eb1455'

  const auth = 'secret_KZ8vNH8UmOGIEQTlcPOp19yAiy0JZbyEqN5mLSqz2HF'

  const client = new Client({ auth })
  const compatAPI = new NotionCompatAPI(client)
  const api = new NotionAPI()

  const page = await api.getPage(pageId)
  const compatPage = await compatAPI.getPage(pageId)

  t.truthy(page)
  t.truthy(compatPage)

  await fs.writeFile(`${pageId}.json`, JSON.stringify(page, null, 2))
  await fs.writeFile(
    `${pageId}.compat.json`,
    JSON.stringify(compatPage, null, 2)
  )
})
