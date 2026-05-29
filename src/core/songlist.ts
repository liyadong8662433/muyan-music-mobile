import songlistState, { type TagInfo, type ListDetailInfo, type ListInfo } from '@/store/songlist/state'
import songlistActions from '@/store/songlist/action'
import { deduplicationList, toNewMusicInfo } from '@/utils'
import musicSdk from '@/utils/musicSdk'


interface DetailPageCache { data: ListDetailInfo, sourcePage: number }
type LimitDetailCache = Map<string, DetailPageCache | ListDetailInfo['list']>
type CacheValue = LimitDetailCache | ListInfo

const cache = new Map<string, CacheValue>()
const LIST_LOAD_LIMIT = 30


/**
 * 获取排序列表
 * @param source
 * @returns
 */
export const getSortList = (source: LX.OnlineSource) => {
  return songlistState.sortList[source]!
}

/**
 * 获取标签列表
 * @param source
 * @returns
 */
export const getTags = async<T extends LX.OnlineSource>(source: T) => {
  if (songlistState.tags[source]) return songlistState.tags[source] as TagInfo<T>
  const info = await (musicSdk[source]?.songList.getTags() as Promise<TagInfo<T>>)
  songlistActions.setTags(info, source)
  return info
}

/**
 * 设置列表加载加载前的基本信息（用于加载失败后的重新加载）
 * @param source
 * @param tagId
 * @param sortId
 */
export const setListInfo: typeof songlistActions.setListInfo = (source, tagId, sortId) => {
  clearList()
  songlistActions.setListInfo(source, tagId, sortId)
}
/**
 * 设置列表信息
 * @param result
 * @param tagId
 * @param sortId
 * @param page
 * @returns
 */
export const setList: typeof songlistActions.setList = (result, tagId, sortId, page) => {
  return songlistActions.setList(result, tagId, sortId, page)
}

export const clearList = () => {
  songlistActions.clearList()
}

/**
 * 获取歌单列表
 * @param source 歌单源
 * @param tabId 类型id
 * @param sortId 排序
 * @param page 页数
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getList = async(source: LX.OnlineSource, tabId: string, sortId: string, page: number, isRefresh = false): Promise<ListInfo> => {
  let pageKey = `slist__${source}__${sortId}__${tabId}__${page}`

  let listCache = cache.get(pageKey) as ListInfo
  if (listCache) {
    if (isRefresh) cache.delete(pageKey)
    else return listCache
  }

  return musicSdk[source]?.songList.getList(sortId, tabId, page).then((result: ListInfo) => {
    cache.set(pageKey, result)
    return result
    // if (pageKey != listInfo.key) return
    // setList(result, tabId, sortId, page)
  })
}


/**
 * 获取歌单详情内单页分页歌曲（用于在本地控制每页大小）
 * @param source 源
 * @param id 歌单id
 * @param page 页数
 * @returns
 */
const getListDetailLimit = async(source: LX.OnlineSource, id: string, page: number): Promise<ListDetailInfo> => {
  const listKey = `sdetail__${source}__${id}`
  const prevPageKey = `sdetail__${source}__${id}__${page - 1}`
  const tempListKey = `sdetail__${source}__${id}__temp`

  let listCache = cache.get(listKey) as LimitDetailCache
  if (!listCache) cache.set(listKey, listCache = new Map())
  let sourcePage = 0
  {
    const prevPageData = listCache.get(prevPageKey) as DetailPageCache
    if (prevPageData) sourcePage = prevPageData.sourcePage
  }

  return musicSdk[source]?.songList.getListDetail(id, sourcePage + 1).then((result: ListDetailInfo) => {
    if (listCache !== cache.get(listKey)) return
    result.list = deduplicationList(result.list.map(m => toNewMusicInfo(m)) as LX.Music.MusicInfoOnline[])
    let p = page
    const tempList = listCache.get(tempListKey) as ListDetailInfo['list']
    let offset = 0

    if (tempList) {
      listCache.delete(tempListKey)
      const needCount = LIST_LOAD_LIMIT - tempList.length
      listCache.set(`sdetail__${source}__${id}__${p}`, {
        data: {
          ...result,
          list: [...tempList, ...result.list.slice(offset, offset + needCount)],
          page: p,
          limit: LIST_LOAD_LIMIT,
        },
        sourcePage,
      })
      offset += needCount
      p++
    }
    sourcePage++
    const maxSourcePage = Math.ceil(result.total / result.limit)
    const remaining = () => result.list.length - offset

    while (remaining() > 0) {
      if (remaining() < LIST_LOAD_LIMIT && sourcePage < maxSourcePage) {
        listCache.set(tempListKey, result.list.slice(offset))
        break
      }
      const chunkSize = Math.min(LIST_LOAD_LIMIT, remaining())
      listCache.set(`sdetail__${source}__${id}__${p}`, {
        data: {
          ...result,
          list: result.list.slice(offset, offset + chunkSize),
          page: p,
          limit: LIST_LOAD_LIMIT,
        },
        sourcePage,
      })
      offset += chunkSize
      p++
    }
    return (listCache.get(`sdetail__${source}__${id}__${page}`) as DetailPageCache).data
  }) ?? Promise.reject(new Error('source not found'))
}

/**
 * 设置列表加载加载前的基本信息（用于加载失败后的重新加载）
 * @param source
 * @param tagId
 * @param sortId
 */
export const setListDetailInfo: typeof songlistActions.setListDetailInfo = (source, id) => {
  clearListDetail()
  songlistActions.setListDetailInfo(source, id)
}
export const setListDetail: typeof songlistActions.setListDetail = (result, id, page) => {
  return songlistActions.setListDetail(result, id, page)
}

export const clearListDetail = () => {
  songlistActions.clearListDetail()
}

/**
 * 获取歌单内单页歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetail = async(id: string, source: LX.OnlineSource, page: number, isRefresh = false): Promise<ListDetailInfo> => {
  const listKey = `sdetail__${source}__${id}`
  const pageKey = `sdetail__${source}__${id}__${page}`

  let listCache = cache.get(listKey) as LimitDetailCache
  if (!listCache || isRefresh) {
    cache.set(listKey, listCache = new Map())
  }

  let pageCache = listCache.get(pageKey) as DetailPageCache
  if (pageCache) return pageCache.data

  return getListDetailLimit(source, id, page)
}

/**
 * 获取歌单内单页歌曲（分页加载）
 * @param source 歌单源
 * @param id 歌单id
 * @param page 页码
 * @param isRefresh 是否跳过缓存
 * @returns 单页歌曲列表及总数信息
 */
export const getListDetailPage = async(source: LX.OnlineSource, id: string, page: number, isRefresh = false): Promise<ListDetailInfo> => {
  const listKey = `sdetail__${source}__${id}`
  let listCache = cache.get(listKey) as LimitDetailCache
  if (!listCache || isRefresh) {
    cache.set(listKey, listCache = new Map())
  }
  const pageKey = `sdetail__${source}__${id}__${page}`
  let pageCache = listCache.get(pageKey) as DetailPageCache
  if (pageCache && !isRefresh) return pageCache.data
  const result = await getListDetailLimit(source, id, page)
  listCache.set(pageKey, { data: result, sourcePage: page })
  return result
}

/**
 * 获取歌单内全部歌曲
 * @param id 歌单id
 * @param source 歌单源
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetailAll = async(source: LX.OnlineSource, id: string, isRefresh = false): Promise<LX.Music.MusicInfoOnline[]> => {
  console.log(`[getListDetailAll] start source=${source} id=${id}`)
  const listKey = `sdetail__${source}__${id}`
  let listCache = cache.get(listKey) as LimitDetailCache
  if (!listCache || isRefresh) {
    cache.set(listKey, listCache = new Map())
  }

  const loadData = async(page: number): Promise<ListDetailInfo> => {
    const pageKey = `sdetail__${source}__${id}__${page}`
    let pageCache = listCache.get(pageKey) as DetailPageCache
    if (pageCache) return pageCache.data
    return getListDetailLimit(source, id, page)
  }
  return loadData(1).then(async result => {
    console.log(`[getListDetailAll] page1 ok total=${result.total} songs=${result.list?.length}`)
    if (result.total <= result.limit) return result.list

    let maxPage = Math.ceil(result.total / result.limit)
    console.log(`[getListDetailAll] loading pages 2..${maxPage}`)
    const pages = Array.from({ length: maxPage - 1 }, (_, i) => loadData(i + 2))
    const pageResults = await Promise.all(pages)
    console.log(`[getListDetailAll] all pages loaded, merging`)
    return [...result.list, ...pageResults.flatMap(r => r.list)]
  }).then(list => {
    const deduped = deduplicationList(list)
    console.log(`[getListDetailAll] done id=${id} total=${list.length} after-dedup=${deduped.length}`)
    return deduped
  }).catch(err => {
    console.error(`[getListDetailAll] FAILED id=${id}:`, err?.message || err)
    throw err
  })
}
