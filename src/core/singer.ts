export interface SingerInfo {
  name: string
  id: string
  pic: string
  /** 300x300 大图 */
  picLarge: string
}

let cache: { date: string; list: SingerInfo[] } | null = null

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 从 QQ 音乐拉取热门歌手列表，每日缓存
 */
export const getSingerList = async (): Promise<SingerInfo[]> => {
  const today = getTodayStr()

  if (cache && cache.date === today) {
    return cache.list
  }

  try {
    const params = {
      comm: { ct: 24, cv: 0 },
      singerList: {
        module: 'Music.SingerListServer',
        method: 'get_singer_list',
        param: {
          area: -100,
          sex: -100,
          genre: -100,
          index: -100,
          sin: 0,
          cur_page: 1,
        },
      },
    }

    const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&inCharset=utf8&outCharset=utf-8&data=${encodeURIComponent(JSON.stringify(params))}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 0 || !data.singerList?.data?.singerlist) {
      if (cache) return cache.list
      throw new Error('Failed to fetch singer list')
    }

    const singerList: SingerInfo[] = data.singerList.data.singerlist.map((s: any) => ({
      name: s.singer_name || s.singerName || '',
      id: s.singer_mid || s.singerMid || '',
      pic: `http://y.gtimg.cn/music/photo_new/T001R150x150M000${s.singer_mid || s.singerMid}.webp`,
      picLarge: `http://y.gtimg.cn/music/photo_new/T001R300x300M000${s.singer_mid || s.singerMid}.webp`,
    }))

    cache = { date: today, list: singerList }
    return singerList
  } catch (err) {
    console.warn('[singer] fetch failed:', err)
    if (cache) return cache.list
    throw err
  }
}

/**
 * 清除缓存
 */
export const clearSingerCache = () => {
  cache = null
}
